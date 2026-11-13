export type OfflineProgress = { status: 'idle'|'working'|'ready'|'error'; done: number; total: number; message: string };
let registration: ServiceWorkerRegistration | null = null;
export async function registerOffline(onUpdate: () => void) {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return null;
  registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
  if (registration.waiting) onUpdate();
  registration.addEventListener('updatefound', () => registration?.installing?.addEventListener('statechange', () => {
    if (registration?.waiting && navigator.serviceWorker.controller) onUpdate();
  }));
  return registration;
}
export async function makeOffline(update: (p: OfflineProgress) => void) {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) { update({status:'error',done:0,total:0,message:'Offline installation requires the production build on HTTPS or localhost.'}); return; }
  try {
    registration ??= await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
    await navigator.serviceWorker.ready;
    const target = registration.active;
    if (!target) throw new Error('Offline worker is not yet active. Try again in a moment.');
    const channel = new MessageChannel();
    channel.port1.onmessage = (e: MessageEvent<OfflineProgress>) => { update(e.data); if (e.data.status !== 'working') channel.port1.close(); };
    target.postMessage({ type: 'MAKE_OFFLINE' }, [channel.port2]);
  } catch (error) { update({status:'error',done:0,total:0,message: error instanceof Error ? error.message : 'Storage unavailable. The online lab remains usable.'}); }
}
export async function checkOffline() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return false;
  try {
    const manifest = await fetch(`${import.meta.env.BASE_URL}offline-manifest.json`).then(r=>r.json());
    const cache = await caches.open(manifest.cache);
    const marker = await cache.match(`${import.meta.env.BASE_URL}offline-ready`);
    if (!marker) return false;
    const results = await Promise.all(manifest.files.map((f:{url:string}) => cache.match(f.url)));
    return results.every(Boolean);
  } catch { return false; }
}
export function applyUpdate() { registration?.waiting?.postMessage({type:'ACTIVATE_UPDATE'}); }
