# Precision Lab — release validation

Review date: **13 November 2026**. Target repository: **SREERAJGUPTA/vernier-caliper**. Runtime base: **`/vernier-caliper/`**. Isolated development branch: **`rebuild/precision-lab-v2`**.

## Release decision

This is a newly implemented application and production package, prepared for review. The earlier Precision Lab implementation was not recovered, copied, or repackaged. The existing GitHub repository and live website were not modified. Publication remains a separate action requiring the owner's explicit approval.

Implementation, mathematical/geometry regressions, local production packaging and the browser workflows listed below have been exercised. **This report does not certify all release gates.** Real WebGL visual inspection, reference-device performance, actual assistive-technology task completion and human classroom/pilot results remain pending. The master specification explicitly requires unavailable measurements to be reported as Not Measured or Not Validated; they are not converted into passes.

## Build and executed automated checks

| Item | Final result |
| --- | --- |
| Asset build identifier | `5a982f774c63a0e0` |
| Build/typecheck | **Passed** — `npm run build ` |
| Automated tests | **113 passed, 0 failed, 0 skipped, across 10 files** |
| Browser runner syntax | **Passed** — `node --check tests/e2e/run.mjs` |
| Build runtime | Node `v24.22.1`, npm `11.9.0`, Linux build container |
| Manifest-listed runtime assets | 11 files, **1,259,414 bytes** (1.201 MiB) |
| Summed per-file gzip proxy | **356,569 bytes**; compression estimate, not a measured network transfer |
| Worker/manifest metadata | Additional 7,039 bytes; full runtime plus metadata is 1,266,453 bytes |
| Source maps | Included in distribution for review; excluded from offline installation |
| Offline budget | Below the specification's 20 MiB baseline budget |
| Existing repository/live site | **Unchanged**; no remote push, merge, Pages settings change or deployment |


The JSON test report is `evidence/unit-results.json`. Individual test cases often contain independent sweeps; those sweep counts are not added to the Vitest test count.

| Coverage | Executed evidence |
| --- | --- |
| Exact scale equations | **102,019** configurations checked against an independent integer-micrometre oracle, including all three plates, supported signed offsets, endpoints and negative indications. Production reading helpers are not the reference oracle. |
| Continuous readings | **3,000** deterministic off-lattice cases, rounding/tie behavior and exact-coincidence boundaries; no mechanical snapping to the selected LC. |
| Specimen generator | **3,360** seeded configurations across all 14 families and three plates; supported placement, constrained contact, independent dimension and reproducibility checks. |
| Contact mechanics | External support, finite inside tips and centered/chord behavior, depth rim seating and rod access, rear step pads, bounds and large movement requests. Rigid-body canonical fixture assumptions are documented. |
| Actual rendered geometry | Mesh-buffer measuring-face positions, engraved tick geometry and real step-fixture ray/penetration checks, separately from the analytic solver. |
| State and interaction | One authoritative displacement; lock/reset/configuration contracts; immutable assessed snapshots; pointer ownership, cancellation, singular views and time-based transition checks. |
| Reading feedback | Fixed examples, earlier-error-first feedback, technique versus reading correctness, positive/negative zero error and unit conversions. |
| Records and persistence | Separate entered/reference values, CSV round trips including escaping, malformed storage and storage failure handling, saved-session validation and opt-out precedence. |
| Learning | Seeded objectives, transfer between plates, conceptual answer integrity, completion/misconception tracking and restored learning-mode contracts. |
| Offline worker | **13** tests execute the generated worker in a controlled service-worker environment: full progress and hash verification, corrupt-cache repair, missing asset, wrong hash, injected HTML rejection, quota/storage failure, failed final manifest, eviction, scope, offline fetch and update/old-asset behavior. This is a worker harness, not a real-browser offline restart. |
| Input latency instrumentation | **8** tests cover event-clock normalization, coalescing, cancellation, future/invalid timestamps and bounded summaries. The runtime proxy ends after render-command submission; no GPU/display latency is inferred. |

`tests/e2e/run.mjs` is supplied and syntax-checked. **The full Playwright browser acceptance suite was not executed successfully in this environment.** The initial direct browser attempt was blocked by the execution environment's socket restriction; automatic approval review rejected an escalation. Review continued through the supported managed preview and cloud browser. No browser-launch failure is reported as a pass.

The acceptance runner and GitHub Actions validation include production-subpath navigation, all measurement modes, signed corrections, independent locks, microscope projection/freeze, active-session reload, conditional update checks, keyboard alternatives, responsive viewports, genuine carriage drag, context/storage failure, 50 object replacements, 20 navigation/explosion cycles, and a persistent-browser offline restart. Those are executable future checks, not claimed results here. The manual deployment workflow requires this runner to pass before uploading Pages artifacts.

## Direct browser observations

The supported cloud Chromium preview served the production build at `http://127.0.0.1:4173/vernier-caliper/`. The browser's WebGL renderer was disabled. The application automatically preserved the state and used its functional 2D instrument, while explicitly identifying 3D inspection as unavailable. The following observations establish the shared mechanics, reading and learning paths; they do not establish 3D dragging, metal appearance, lens quality or GPU performance.

Browser hardware/GPU/RAM, browser version and display refresh rate were not provided by the review surface. Desktop viewport was approximately 1363 × 936 CSS pixels (see individual evidence). No cold-network timing profile or reference hardware was claimed.

| Workflow | Directly observed outcome |
| --- | --- |
| First guided outside measurement | Seed 1631, 10-division plate, prediction entered, Place → Align & seat → Home contact at 14.7 mm. Incorrect index6/result14.6 received targeted tick feedback; index7/result14.7 passed. |
| Inside diameter | Seed 1632, copper sleeve, insert/seat/expand to 21.6 mm; MSR21/index6 passed. |
| Depth technique | Seed 1633 stepped cavity at 17.9 mm. Correct arithmetic with an unseated reference produced **Contact ○ / Reading ✓**. Seating the reference and resubmitting passed. |
| Rear step measurement | Seed 1634 two-level block at 22.8 mm; MSR22/index8 on N10 passed. |
| Positive zero error | Same step contact, N50 and e=+0.04mm: observed22.84, MSR22/index42, corrected22.8 passed. |
| Negative zero error | Same contact, e=−0.02mm: observed22.78, MSR22/index39, corrected22.8 passed. |
| Fine plate microscope | N50, seed 1631 external contact 14.72 mm. MSR14/index36/result14.72 passed. At320 CSS px/mm, LC maps to6.4 CSS px. Selected Vernier36 and main50 had the same observed x coordinate. |
| Freeze/resume | Freezing retained the earlier SVG tick positions while the live mechanical opening changed. Verification was disabled until Resume Live. |
| Lock/reset view | The physical lock disabled slider and all nudge controls. Reset View preserved lock, physical opening and the current answer draft. |
| Hidden answers and teacher controls | Pre-attempt calculation strip absent. Teacher Reveal answers displayed it; Hide answers removed it. The candidate tick was not automatically selected for the learner. |
| Records | Incorrect reading, invalid technique and correct outcomes remained distinct; notebook showed separate user/reference values. |

### Final frozen-build regression and server-unavailable check

The final asset build `5a982f774c63a0e0` was loaded as `index-CHYMV6mm.js`. An unfinished Outside dimensions challenge, seed 2201, N50, e0, opening 15.66 mm, locked slider and draft 15/33/15.66 survived Challenge → Measure → Challenges and reload. Measure correctly selected Practice. The microscope reading presentation and optional elapsed timer were restored; teacher reveal and prior feedback were not automatically exposed.

A temporary, comment-only waiting-worker probe in the preview exercised the explicit update flow. With Remember progress off, activation was blocked with a clear notice and the current task/draft/lock stayed intact. After enabling saving, activation/reload retained the task and draft. The exact release worker was restored and applied afterward. The probe did not alter the application or runtime asset manifest and is absent from this distribution.

After the final **Offline ready** confirmation, the managed origin server was stopped and its stopped status verified. Reload still opened the final app and preserved the active challenge. Explore, Measure, Anatomy, Discover and Challenges all loaded. Newly generated Outside/Inside/Depth/Step fixtures established contact at 52.90/12.82/35.36/20.20 mm respectively. The step measurement20+10×0.02=20.20mm was entered and verified. Sound was explicitly enabled by a gesture and movement triggered without an audio-console error; audible quality was not reviewed. A real CSV download succeeded while the server remained stopped.

Python's independent `csv.DictReader` with UTF-8-BOM handling parsed the exported **10 rows and 23 columns**. All four modes were present; entered/reference values, wrong-index feedback and invalid-technique outcomes remained separate. See `evidence/precision-observations-offline.csv`, `offline-csv-review.json` and `precision-final-browser-review.json`.

This was a **new-document reload with the origin server unavailable**, followed by offline course use. The browser process itself was not shut down, and the browser's entire network stack was not disabled. The stronger prescribed cold-process restart remains unexecuted in the supplied acceptance suite.

Actual final browser captures are `evidence/precision-final-microscope.jpg` and `evidence/precision-final-measurement.jpg`. They show the functional 2D/SVG review path, not a fabricated WebGL render. The preview server was restarted after these checks so the review page remains usable.


The independent microscope DOM sample is in `evidence/precision-scale-projection.json`. For its N50/d14.72/e0/zoom320 configuration, the viewed scale width was1164.59375CSSpx. Main marks49,50,51 appeared at262.296875,582.296875,902.296875; Vernier35,36,37 appeared at268.696875,582.296875,895.896875. These agree with `width/2 + (mm−50)×320` to floating-point precision and demonstrate6.4px adjacent mismatch at the finest LC. This is one measured desktop case, not a complete viewport/phase certification.

`LEARNING_REVIEW.md` documents the separate direct discovery/anatomy review: least-count prediction, one-LC movement, honest0.021mm off-lattice feedback, closed-jaw negative error, parallax, calibration, rear-face selection and exact vector reassembly. Its screenshots were captured during development; later application integration changes are separately checked above.

## Defects caught and corrected during the rebuild

- A main-scale/slider overlap hid engraving in the procedural geometry. A raised scale insert and consistent0.30mm engraving-plane separation resolved it; CPU triangle projections and actual buffer tests were reviewed.
- Finite inside-tip insertion, depth rim/stepped-cavity clearance and rear step-pad engagement were checked against real geometry rather than an answer-only clamp.
- WebGL creation failure initially left a blank canvas. Initialization and context-loss handling now preserve the shared physical state and expose the useful 2D route.
- The discovery one-LC action initially discarded a continuous position's fractional phase. It now adds one LC exactly and retains off-lattice feedback.
- A hosting-only `.nojekyll` file was initially included in the offline manifest. It remains in the distribution but is excluded from runtime caching.
- The managed static preview injected a live-reload script into HTML. Strict SHA-256 verification correctly rejected the altered file. The final preview used the supplied production static server without injection; integrity checks were not weakened. A regression test now covers this failure and identifies the offending URL/cache version.
- Active challenge identity and drafts initially failed to survive reload/update. Validated session restoration now preserves the task/configuration, physical state, draft, reading presentation and timer. Saving opt-out takes precedence, and applying an update is guarded if saving is disabled or unavailable.
- Measure navigation from Challenges initially left neither Guided nor Practice selected. Route-aware mode selection now restores an explicit mode while retaining the existing task.
- Event-to-render latency was not previously instrumented. A bounded local submission-timing collector and deterministic tests now exist; no real-device latency pass is claimed.

## Quality-contract disposition

| Gate | Status in this delivery | Remaining validation |
| --- | --- | --- |
| Q1 Mathematics | **Passed** executed independent numeric suite | Does not establish real-instrument accuracy. |
| Q2 Mechanical/contact geometry | **Passed** supported analytic/buffer/penetration regressions; CPU geometry study reviewed | WebGL contact close-ups for all canonical fixtures remain pending. |
| Q3 Scale projection/readability | **Passed** descriptor tests and the measured N50 browser sample; finest zoom provides6.4 CSS px/LC | Full browser viewport/phase sweep and actual display readability remain pending. |
| Q4 Desktop frame intervals | **Not Measured** | Declared IrisXe-class60Hz desktop,60s sequence and10-minute sustained run. |
| Q5 Mobile/thermal motion | **Not Measured** | Real iPad-class tablet and Snapdragon695-class phone, stable tier and thermal run. |
| Q6 Pointer submission latency | Instrumented and unit-tested; **Not Measured** on reference devices | Timestamp traces with actual 3D dragging, p95 thresholds and profiler limitations. |
| Q7 Interface INP | **Not Measured** | Declared lab menu/tap/keyboard interactions; no field/population claim. |
| Q8 Startup | Runtime asset sizes measured; **cold-network timings Not Measured** |10 Mbit/s,100 ms RTT cold cache; instrument-ready actual drag, LCP and CLS. |
| Q9 Offline | Hash/scope/update tests and direct browser installation/reload observations below | Full closed-browser-process restart with networking disabled remains a separate unexecuted acceptance check. |
| Q10 Rendering cost | Pixel caps and local renderer counters implemented | **Actual WebGL draw/triangle/texture-memory/timing measurements Not Measured**. CPU OBJ triangle count is not the total rendered cost. |
| Q11 Stability | Unit lifecycle/input/state/storage regressions pass | Full live 3D 50-replacement/20-cycle profiler counters, context-loss/visibility/audio behavior remain pending browser-suite/device execution. |
| Q12 Accessibility | Labeled controls, equivalent non-drag paths, targeted contrast/keyboard/DOM observations | Real screen-reader tasks, complete target/contrast audit,200% reflow and real touch-device completion **Not Validated**. |
| Q13 Learning usability | Moderated10–12-pupil protocol delivered | Student results and90-second unassisted target **Not Validated**. |
| Q14 Classroom legibility | Adjustable type, presentation and microscope zoom implemented | Actual room/display/distance observation **Not Validated**. |

## Milestones and evidence boundary

| Milestone | Implemented deliverables and observed evidence | Pending gate |
| --- | --- | --- |
|0 — Contract/harness | Coordinate/metrology contracts, independent oracle, scenarios, pinned build, CI and subpath/offline tests | Hardware plan is specified, not measured. |
|1 — Instrument-to-reading slice | Original parametric instrument, continuous mechanics, locks/input controller,0.1mm microscope, external contact and full guided reading loop | Hero metal/lens/camera appearance and3D responsiveness need WebGL-capable visual review. |
|2 — Four-way measurement | All four modes,14 families, placement/reference/contact feedback and independent geometry tests | Canonical WebGL contact close-up review. |
|3 — Precision learning | All plates, continuous readings, lens implementation, microscope, signed correction, feedback, notebook andCSV | Surface lens visual quality; full browser-suite sweep. |
|4 — Learning world | Anatomy/explosion, six sourced history chapters, discovery, guided/practice/challenges, teacher tools, progress and non-drag routes | Actual screen reader, touch devices and classroom legibility. |
|5 — Release evidence | Local audio, petals/render tiers, complete offline package, guarded updates, regression evidence, Pages configuration and deliverable verification | Reference-device profiling and full 3D browser suite; participant-dependent checks. No live deployment without approval. |

## Artifact integrity and reproduction

The ZIP includes source, pinned dependencies/lockfile, production `dist`, original asset-generation sources and outputs, tests, documentation, license notices, evidence, a review Git bundle and a per-file SHA-256 inventory. It excludes `node_modules`, credentials and `.git` internals. `scripts/verify_archive.py` checks ZIP CRCs, safe paths, mandatory files, complete inventory, every file hash, the runtime integrity manifest and the real Pages base.

A verified release-candidate ZIP was extracted into a new directory. A clean `npm ci --ignore-scripts --no-audit --no-fund` installed 85 packages from the lockfile. The extracted project then passed its typecheck/build and **all 113 tests**. Every resulting production file was byte-identical to the supplied build, and all 51 application/test/script/asset-source hashes matched `BUILD_PROVENANCE.json`. See `evidence/clean-extraction-review.json`.

After that check, only documentation, evidence and isolated Git packaging metadata were finalized. The final ZIP is verified again by the archive verifier immediately before delivery. Its checksum and complete inventory are supplied with the handover; `DELIVERY_MANIFEST.json` is also inside the ZIP. The Git bundle is independently checked and cloned locally before handover. These checks do not upload to GitHub or deploy anything.

To reproduce the mathematical/build checks use `npm ci`, `npm run build `, then `npm test`. To run the remaining browser acceptance suite on a supported machine use `npx playwright install chromium` and `npm run test:e2e`. Neither step publishes the application. See README for review-branch handling and the separate manually approved deployment workflow.

All claims above are scoped to their stated evidence. Test quantities, source inspection, CPU geometry projections and software-browser captures are not substitutes for real GPU, assistive-technology, classroom or student validation.
