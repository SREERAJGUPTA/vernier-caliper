import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { webcrypto, createHash } from 'node:crypto';

const root = path.resolve('dist');
const available = fs.existsSync(path.join(root, 'sw.js')) && fs.existsSync(path.join(root, 'offline-manifest.json'));
const base = '/vernier-caliper/';
const origin = 'https://precision-lab.test';
interface Manifest { version: string; cache: string; files: { url: string; bytes: number; sha256: string }[]; }
interface Message { status: string; done: number; total: number; message: string; }
type Handler = (event: any) => void;

function workerHarness(options: { failURL?: string; corruptURL?: string; failPutURL?: string; networkOffline?: boolean } = {}) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'offline-manifest.json'), 'utf8')) as Manifest;
  const handlers = new Map<string, Handler[]>();
  const cacheMaps = new Map<string, Map<string, Response>>();
  const requests: string[] = [], messages: Message[] = [];
  let activations = 0, claims = 0;
  const keyOf = (value: any) => new URL(typeof value === 'string' ? value : value.url, origin).pathname;
  const fetcher = async (request: any): Promise<Response> => {
    const url = keyOf(request); requests.push(url);
    if (options.networkOffline) throw new Error('Network disconnected');
    if (url === options.failURL) return new Response('missing asset', { status: 503 });
    if (url === options.corruptURL) return new Response('not the manifest bytes');
    const relative = url.slice(base.length);
    const file = path.join(root, relative);
    if (!url.startsWith(base) || !fs.existsSync(file)) return new Response('Not found', { status: 404 });
    return new Response(new Uint8Array(fs.readFileSync(file)));
  };
  const open = async (name: string) => {
    let map = cacheMaps.get(name); if (!map) { map = new Map(); cacheMaps.set(name, map); }
    return {
      match: async (request: any) => map!.get(keyOf(request))?.clone(),
      put: async (request: any, response: Response) => { const key = keyOf(request); if (key === options.failPutURL) throw new Error('Quota exceeded'); map!.set(key, response.clone()); },
      delete: async (request: any) => map!.delete(keyOf(request)),
      addAll: async (urls: string[]) => { for (const url of urls) { const response = await fetcher(url); if (!response.ok) throw new Error('Install asset failed'); map!.set(keyOf(url), response); } },
      keys: async () => [...map!.keys()].map(url => new Request(origin + url)),
    };
  };
  const caches = {
    open,
    match: async (request: any) => { const key = keyOf(request); for (const map of cacheMaps.values()) { const found = map.get(key); if (found) return found.clone(); } return undefined; },
    keys: async () => [...cacheMaps.keys()],
    delete: async (name: string) => cacheMaps.delete(name),
  };
  const self = {
    location: { origin },
    addEventListener: (type: string, callback: Handler) => handlers.set(type, [...(handlers.get(type) ?? []), callback]),
    clients: { claim: async () => { claims++; } },
    skipWaiting: async () => { activations++; },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), { self, caches, fetch: fetcher, crypto: webcrypto, URL, Response, Request, Uint8Array, console }, { filename: 'production-service-worker.js' });
  async function dispatch(type: string, extra: Record<string, unknown> = {}) {
    const waits: Promise<unknown>[] = []; let response: Promise<Response> | undefined;
    const event = { ...extra, waitUntil: (p: Promise<unknown>) => waits.push(Promise.resolve(p)), respondWith: (p: Promise<Response>) => { response = Promise.resolve(p); } };
    for (const handler of handlers.get(type) ?? []) handler(event);
    await Promise.all(waits); return response ? await response : undefined;
  }
  const make = () => dispatch('message', { data: { type: 'MAKE_OFFLINE' }, ports: [{ postMessage: (message: Message) => messages.push(structuredClone(message)) }] });
  return { manifest, requests, messages, cacheMaps, open, dispatch, make, options, activations: () => activations, claims: () => claims };
}

// This suite is explicitly skipped before a production build exists. CI must build
// first and run it again; a source-only unit run is not evidence of offline parity.
describe.skipIf(!available)('generated production service worker (VM + real asset hashes)', () => {
  it('installs only a shell and never declares the complete course ready prematurely', async () => {
    const h = workerHarness(); await h.dispatch('install');
    const cache = await h.open(h.manifest.cache);
    expect(await cache.match(base + 'index.html')).toBeDefined();
    expect(await cache.match(base + 'offline-ready')).toBeUndefined();
    expect(h.messages).toHaveLength(0); expect(h.activations()).toBe(0);
    await h.dispatch('activate'); expect(h.claims()).toBe(1);
  });
  it('verifies every emitted asset byte hash before the ready marker and terminal progress', async () => {
    const h = workerHarness(); await h.dispatch('install'); await h.make();
    const cache = await h.open(h.manifest.cache);
    expect(h.messages.at(-1)?.status).toBe('ready');
    expect(h.messages.at(-1)?.done).toBe(h.manifest.files.length);
    expect(h.messages.filter(m => m.status === 'working').map(m => m.done)).toEqual(h.manifest.files.map((_, i) => i));
    expect(h.messages.filter(m => m.status === 'ready')).toHaveLength(1);
    for (const file of h.manifest.files) {
      const response = await cache.match(file.url); expect(response, file.url).toBeDefined();
      const bytes = Buffer.from(await response!.arrayBuffer());
      expect(bytes.byteLength).toBe(file.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
    }
    expect(await cache.match(base + 'offline-ready')).toBeDefined();
    expect(h.requests.every(url => url.startsWith(base))).toBe(true);
  });
  it('repairs an already cached corrupt asset using a verified fresh copy', async () => {
    const h = workerHarness(); const file = h.manifest.files.find(f => f.url.endsWith('.js'))!;
    const cache = await h.open(h.manifest.cache); await cache.put(file.url, new Response('stale bytes'));
    await h.make(); expect(h.messages.at(-1)?.status).toBe('ready');
    expect(h.requests).toContain(file.url);
    expect(createHash('sha256').update(Buffer.from(await (await cache.match(file.url))!.arrayBuffer())).digest('hex')).toBe(file.sha256);
  });
  it('does not produce a ready marker if a required network asset is missing', async () => {
    const initial = workerHarness(), file = initial.manifest.files.find(f => f.url.endsWith('.js'))!;
    const h = workerHarness({ failURL: file.url }); await h.make();
    expect(h.messages.at(-1)?.status).toBe('error');
    expect(h.messages.some(m => m.status === 'ready')).toBe(false);
    expect(await (await h.open(h.manifest.cache)).match(base + 'offline-ready')).toBeUndefined();
  });
  it('does not produce a ready marker when network bytes do not match the manifest', async () => {
    const initial = workerHarness(), file = initial.manifest.files.find(f => f.url.endsWith('.js'))!;
    const h = workerHarness({ corruptURL: file.url }); await h.make();
    expect(h.messages.at(-1)?.status).toBe('error');
    expect(h.messages.at(-1)?.message).toContain('version changed');
    expect(h.messages.at(-1)?.message).toContain(file.url);
    expect(h.messages.at(-1)?.message).toContain(h.manifest.cache);
    expect(await (await h.open(h.manifest.cache)).match(base + 'offline-ready')).toBeUndefined();
  });
  it('rejects preview HTML injection and identifies index.html without weakening its hash', async () => {
    const h = workerHarness({ corruptURL: base + 'index.html' }); await h.make();
    const terminal = h.messages.at(-1);
    expect(terminal?.status).toBe('error');
    expect(terminal?.message).toContain(base + 'index.html');
    expect(terminal?.message).toContain(h.manifest.cache);
    expect(terminal?.done).toBe(h.manifest.files.findIndex(file => file.url === base + 'index.html'));
    expect(await (await h.open(h.manifest.cache)).match(base + 'offline-ready')).toBeUndefined();
  });
  it('does not declare readiness if the final offline manifest request fails', async () => {
    const h = workerHarness({ failURL: base + 'offline-manifest.json' });
    await h.make(); expect(h.messages.at(-1)?.status).toBe('error');
    expect(await (await h.open(h.manifest.cache)).match(base + 'offline-ready')).toBeUndefined();
  });
  it('withdraws readiness if a required cache entry was evicted and cannot be restored', async () => {
    const h = workerHarness(); await h.make();
    const cache = await h.open(h.manifest.cache);
    await cache.delete(h.manifest.files.find(file => file.url.endsWith('.js'))!.url);
    h.options.networkOffline = true; await h.make();
    expect(h.messages.at(-1)?.status).toBe('error');
    expect(await cache.match(base + 'offline-ready')).toBeUndefined();
  });
  it('removes stale readiness before a quota failure during verification', async () => {
    const initial = workerHarness(), file = initial.manifest.files.find(f => f.url.endsWith('.js'))!;
    const h = workerHarness({ failPutURL: file.url }); const cache = await h.open(h.manifest.cache);
    await cache.put(base + 'offline-ready', new Response('old readiness'));
    await h.make(); expect(h.messages.at(-1)?.status).toBe('error');
    expect(await cache.match(base + 'offline-ready')).toBeUndefined();
  });
  it('serves complete cached navigation and lazy assets without network at the actual deployment subpath', async () => {
    const h = workerHarness(); await h.make(); h.options.networkOffline = true;
    const before = h.requests.length;
    const navigation = await h.dispatch('fetch', { request: { url: origin + base + '#/discover', method: 'GET', mode: 'navigate' } });
    expect(await navigation!.text()).toContain('<div id="root">');
    for (const file of h.manifest.files) {
      const response = await h.dispatch('fetch', { request: { url: origin + file.url, method: 'GET', mode: 'cors' } });
      expect(response?.ok, file.url).toBe(true);
    }
    expect(h.requests).toHaveLength(before);
  });
  it('does not intercept unrelated origins, out-of-scope paths, or writes', async () => {
    const h = workerHarness();
    expect(await h.dispatch('fetch', { request: { url: 'https://elsewhere.test/asset.js', method: 'GET' } })).toBeUndefined();
    expect(await h.dispatch('fetch', { request: { url: origin + '/another-project/', method: 'GET' } })).toBeUndefined();
    expect(await h.dispatch('fetch', { request: { url: origin + base, method: 'POST' } })).toBeUndefined();
    expect(h.requests).toHaveLength(0);
  });
  it('activates an update only after the explicit apply-update message', async () => {
    const h = workerHarness(); await h.dispatch('install'); await h.dispatch('message', { data: { type: 'IGNORED' } });
    expect(h.activations()).toBe(0);
    await h.dispatch('message', { data: { type: 'ACTIVATE_UPDATE' } }); expect(h.activations()).toBe(1);
  });
  it('keeps cached old hashed assets available during a safe version transition', async () => {
    const h = workerHarness(); const old = await h.open('precision-lab-older-version');
    await old.put(base + 'assets/older-hash.js', new Response('previous assessed module'));
    h.options.networkOffline = true;
    const response = await h.dispatch('fetch', { request: { url: origin + base + 'assets/older-hash.js', method: 'GET', mode: 'cors' } });
    expect(await response!.text()).toBe('previous assessed module');
  });
});
