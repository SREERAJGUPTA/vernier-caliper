# Precision Lab — ground-up rebuild

An original, offline-capable Vernier caliper learning application for Grade 8–10, with optional deeper explanations. This project was implemented afresh from `docs/PRODUCT_SPECIFICATION.txt`. It does not contain the previous Precision Lab implementation.

**Deployment target:** `SREERAJGUPTA/vernier-caliper` with the exact Vite base `/vernier-caliper/`. **Preparation branch:** `rebuild/precision-lab-v2` in an isolated development repository. Nothing in this delivery has been pushed to, merged into, or published over the existing GitHub repository or website.

## Start here

The ready-to-serve application is in **`dist/`**. It does not require npm, a backend, an API key, or an account at runtime. Open it through an HTTP server; double-clicking `dist/index.html` is not supported by the module/service-worker pipeline.

### Quick local preview

With Node.js installed, open a terminal in this extracted folder and run:

```sh
node scripts/serve.mjs
```

Open **http://127.0.0.1:4173/vernier-caliper/**. The server only serves local static files.

With Python instead of Node, run:

```sh
python scripts/preview.py
```

Windows users can double-click **`START_PREVIEW.bat`**, which uses Node if available and otherwise Python. Keep its terminal window open while using the lab. This launcher does not install software or change your system.

## What is included

- Five destinations: Explore, Measure, Anatomy, Discover, and Challenges.
- A new parametric four-way caliper with a continuous 0–150 mm slider, independent mechanical/camera locks, camera presets, fit/reset, an exploded explanation, and a genuine secondary-camera surface lens.
- Four contact modes and 14 geometric specimen families, including finite inside tips, reference seating, a depth cutaway, and actual rear step faces.
- 10-, 20-, and 50-division Verniers; signed additive zero error; exact and off-lattice readings; a deterministic vector microscope with overview, pan, selected-tick focus, freeze, and up to 320 CSS px/mm.
- Guided prediction/measurement, independent practice, seeded challenges and conceptual questions, targeted verification, teacher settings, optional timing and assistance, local progress, and CSV observation export.
- Interactive anatomy, least-count discovery, parallax, calibration, and six sourced history chapters.
- Local audio synthesis, reduced-motion support, responsive layouts, keyboard/non-drag controls, and an automatic functional 2D route if WebGL is unavailable.
- A fully local, versioned, SHA-256-verified offline package and an explicit save-work/apply-update flow.

## Evidence and release status

Read **`docs/VALIDATION.md`** before approving replacement. It distinguishes executed unit/integration tests, observed browser workflows, geometry review, unexecuted browser automation, real-device measurements, and human learning tests.

The application and production build are implemented. The available review browser disabled WebGL, so material quality, 3D pointer interaction, real GPU frame targets, and the specified real-device tests cannot be certified from this environment. The 2D fallback and learning workflows were directly reviewed. Classroom legibility, real screen-reader task completion, and the student pilot remain pending and have protocols/checklists. These are not reported as passes.

## Development

Use Node **22.12+** (Node 24 is recommended for the optional model exporter). Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run dev
```

Vite prints the local URL; include `/vernier-caliper/`. To avoid network-interface discovery on restricted hosts, use `npm run dev -- --host 127.0.0.1`.

### Build and tests

```sh
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Build before tests so the service-worker tests exercise the actual generated production worker. `npm run build` typechecks the project, emits `dist`, and creates the offline integrity manifest. Unit tests use an independent integer-micrometre reference, actual rendered mesh buffers, and supported fixture geometry. The browser suite starts the production static server if needed, covers the complete subpath, and writes evidence to `docs/evidence/`. It exits unsuccessfully when the browser cannot launch; an unavailable browser is not a pass.

Set `TEST_BASE_URL` to an already-running production URL when required. Set `CHROMIUM_PATH` to a Chromium executable only when using a system browser. See the test script for supported environment options. Software-rendered browser screenshots do not establish real-device performance.

### Reproduce original asset sources

```sh
node assets/generation/generate-model.mjs
```

This optional Node 24 exporter regenerates the structural reference OBJ and inventory. The runtime generates its geometry, brushing, studio reflections, engravings, and petals locally. Its exact contact datums are documented in `docs/COORDINATES.md`. The OBJ is a reference asset; it is not an externally downloaded model and is not needed for runtime startup.

## GitHub Pages — review first, publish only after approval

The delivery uses GitHub Actions rather than a `/docs` publication folder. `docs/` contains technical documentation and review evidence; **`dist/` contains the website**.

1. Keep the existing live branch and Pages settings unchanged while reviewing.
2. In a local clone of `SREERAJGUPTA/vernier-caliper`, create a new branch from its existing default branch, for example `git switch -c rebuild/precision-lab-v2`.
3. Copy this rebuilt project's files into that review checkout. Do not copy its bundle into `.git`, and do not delete or replace the existing checkout's `.git` directory. Preserve unrelated repository content as appropriate. The archive has no `node_modules` or credentials.
4. Commit and push **only the new development branch**. The validation workflow tests it but does not publish it. The isolated bundle supplied with this delivery can also be cloned separately to inspect the rebuild's own source history; it is not a substitute for preserving the existing GitHub history.
5. Review the replacement and complete the outstanding visual/device acceptance checks. Obtain explicit approval before modifying the live branch or Pages configuration.
6. After approval, merge the reviewed source into the intended default branch. In repository **Settings → Pages**, choose **GitHub Actions** as the build source, if not already configured.
7. In **Actions → Publish approved replacement → Run workflow**, select the approved branch and type **`APPROVE REPLACEMENT`**. The workflow rebuilds and tests before publishing `dist`.

There is **no automatic deployment on push**. The manual deployment workflow requires the approval text and only runs after validation. Existing repository or organization environment approval rules still apply. The expected GitHub Pages address after an approved successful deployment is `https://sreerajgupta.github.io/vernier-caliper/`; this archive does not claim that it has been published there.

The included `Precision-Lab-Rebuild.gitbundle` carries the isolated development branch and its source, production build, tests and evidence. To review it as a separate repository without contacting GitHub:

```sh
git clone -b rebuild/precision-lab-v2 Precision-Lab-Rebuild.gitbundle precision-lab-review
```

`REBUILD_REVISION.txt` identifies the exact commit. The ZIP's `DELIVERY_MANIFEST.json` hashes all delivered files, including the bundle. The delivery manifest and revision note are packaging metadata outside the committed source tree.

## Offline use

1. Open the production build on HTTPS, or the localhost preview.
2. Select **Make available offline**. Keep the page open while it downloads and verifies every required asset.
3. Wait for **Offline ready**. A cached home page alone does not count.
4. The installed course includes all five destinations, all specimen families, the learning content, audio synthesis, and CSV export. No runtime CDN or API is involved.
5. Browser storage can be cleared or evicted. Repeat installation if necessary. On an update, use **Save work & apply update** between attempts; active work is saved before reloading. If Remember progress is off or saving fails, the app keeps the current session and asks you to finish it or enable working storage before applying the update.

## Project map

| Location | Purpose |
|---|---|
| `src/domain` | Units, signed scale equations, coincidence, rounding, verification |
| `src/contact` | Seeded geometric specimens and analytic contact constraints |
| `src/mechanics` | Named datums and rigid transforms |
| `src/state` | Single authoritative continuous mechanical state |
| `src/rendering`, `src/interaction` | New 3D model, cameras, lens, ownership, adaptive rendering |
| `src/scale` | Exact SVG overview/local microscope and structured observation route |
| `src/learning` | Discovery, history, anatomy, challenge objectives |
| `src/platform` | Audio, local persistence, records, CSV, offline installation |
| `tests/unit`, `tests/e2e` | Executable independent and browser tests |
| `assets` | Reproducible original model sources and generated reference assets |
| `docs` | Specification, architecture, metrology, sources, evidence, teacher/pilot guides |
| `dist` | Fully built local runtime assets, service worker, manifest |

Third-party dependency licenses and source notes are bundled in `docs/LICENSE_INVENTORY.md` and `docs/licenses/`. No manufacturer logo or certified-replica claim is made.
