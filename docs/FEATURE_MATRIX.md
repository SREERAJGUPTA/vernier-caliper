# Product specification → implementation → evidence

This matrix maps the attached master specification to the fresh implementation. **Implemented** means the executable behavior is present; it does not imply that every device or human validation gate has passed. **Unit** means a test exists and was observed passing in the development test run. **Browser review** identifies directly exercised behavior. **Pending** is explicit where the specified hardware, assistive technology or participants were unavailable.

The final `VALIDATION.md` (or release validation report supplied with the build) is the authority for final command outputs and build identifiers. `LEARNING_REVIEW.md` documents the focused discovery/anatomy browser review. Do not infer performance or educational effectiveness from test counts.

## Experience, resets and product structure

| Required behavior | Implementation | Evidence / remaining scope |
| --- | --- | --- |
| Five destinations: Explore, Measure, Anatomy, Discover, Challenges | `src/App.tsx` hash navigation | Implemented; Discover/Anatomy navigation directly reviewed. Production deep-link/offline evidence is separately recorded. |
| Gallery, Bench and Reading presentations share the physical state | `src/App.tsx`, `src/state/store.ts`, `src/rendering/Scene.tsx` | One external store; no alternate calculator opening. Unit state tests. Camera transitions still need device review. |
| Short opening, two starting actions, immediate interaction | `src/App.tsx`, `src/components/FlatInstrument.tsx` | Implemented; 2D loading/failure route observed. No cinematic loading gate. |
| Guided predict → contact → read → feedback | `src/App.tsx` guided banner and staged reading panel | Implemented. Full production student flow covered in the separate browser report when executed; human speed/effectiveness pending. |
| State maintained across ordinary navigation | `src/state/store.ts`, shared App state | Unit immutable-state checks; route-specific browser checks in release report. |
| Reset View affects the camera only | `src/App.tsx` preset/resetVersion, renderer camera | Implemented separately from store methods; browser state-preservation evidence required. |
| Reset Measurement preserves plate, zero offset and earlier records | `src/state/store.ts::resetMeasurement`, App handler | Unit state-platform test passes. |
| New object, next challenge, session reset and clear saved progress are distinct | `src/App.tsx`, store generator, persistence | Implemented distinct handlers. Saved clearing is explicit; no silent automatic clearing. |
| Responsive stage/drawers and full-width microscope | `src/styles.css`, `src/learning/learning.css`, microscope ResizeObserver | Desktop overflow check passes in focused review. Real phone/tablet and 200% reflow validation pending unless separately reported. |

## Instrument, mechanics and interaction

| Required behavior | Implementation | Evidence / remaining scope |
| --- | --- | --- |
| Parametric beveled hero, named component hierarchy, reproducible source | `src/rendering/geometry.ts`, `src/rendering/Scene.tsx`, `docs/ASSET_MODEL.md` | Original procedural source. Buffer tests cover contact features; 3D visual review is a separate gate. |
| Beam, external/internal jaws, carriage, plates, lock, thumb roller, depth bar, rear step faces | Shared geometry and rendering; `src/learning/Anatomy.tsx` | All 13 teaching component labels implemented; vector selection directly reviewed. |
| One continuous authoritative d, bounded 0–150 mm | `src/state/store.ts`, `src/contact/solver.ts`, `src/mechanics/kinematics.ts` | Unit continuous-displacement, bounds, repeat-contact and lock tests pass. |
| Enough support for a 49 mm Vernier at maximum opening | Long beam and carriage geometry, scale main ticks through 205 mm | Unit span/boundary tests pass; actual 3D maximum-travel silhouette inspection remains distinct. |
| Physical lock applies to pointer, keyboard and roller/fine inputs | Common `store.move` → `constrainMovement` path | Lock tested against both directions and large/small requested travel. UI route tests separately reported. |
| Camera lock independent of physical lock | App rotation lock and renderer controller | Separate state and paths; unit pointer-ownership checks. |
| 360° orbit, useful polar bounds, front/rear/side/top, scale focus and fit/reset | `src/rendering/Scene.tsx`, OrbitControls, App view controls | Implemented. Local cloud browser lacked WebGL in focused review; actual-camera experience not certified by that review. |
| Pointer owner, capture/cancel, multi-pointer and blur handling | `src/interaction/controller.ts`, renderer handlers | Unit exclusive ownership, cancellation and projected-axis degeneracy tests. |
| Projected-axis drag, preserved grab offset, side-view safety | `projectedAxisDelta`, renderer carriage drag | Unit diagonal mapping/singularity tests. No spring or easing on d. |
| Keyboard and non-drag movement alternatives | App slider and fine/large movement buttons; FlatInstrument | Implemented; discovery keyboard controls observed. Full physical workflow evidence recorded separately. |
| Specimen tray drag plus Place/Align/Remove alternatives | Renderer specimen pointer handlers; App placement controls | Implemented; analytic placement guards test validity independently of the gesture. |
| Explosion pauses measurement and restores assembled state | App exploded guard, renderer transforms, Anatomy | Browser vector coordinates restore exactly after reassembly. Full 3D transform screenshots pending separate review. |
| Fine control does not imply mechanical detents | App continuous 0.001 mm input option and explanatory copy | Unit off-lattice displacement tests; discovery off-lattice example observed. |

## All four measurement types

| Required behavior | Implementation | Evidence / remaining scope |
| --- | --- | --- |
| Shape-defined specimens, independent reference dimension | `src/contact/specimens.ts`, `src/contact/solver.ts`, domain verification | Solver uses geometry support/wall definitions; independent test dimensions. No answer-key field sets d. |
| Outside: cylinder, sphere, disk, bolt shaft, block | Specimen generator and renderer | Seeded family tests plus finite reach and support contact tests. |
| Inside: ring, washer, pipe, bearing-like cavity | Specimen generator, inside contact solver, finite knife pads | Unit centered/chord, clearance, insertion and too-small-bore tests. |
| Depth: blind hole, stepped cavity, vessel | Generator, depth reference/tip solver and cutaway meshes | Unit reference seating, walls, access and bottom contact tests. |
| Step: two-level block and stepped flange | Generator, rear datum solver, real stepped fixture meshes | Unit rear-pads transformed vertices and shoulder penetration checks. |
| At least two functioning families per mode | Fourteen total supported families | Generator validity tests iterate families and all plates. |
| Continuous swept constraints prevent large-jump tunneling | `constrainMovement` | Large external/inside/depth/step jumps tested against independent surface positions. |
| Placement phases and valid/invalid technique | ContactResult phase, reference/probe/alignment statuses | Unit unplaced/positioned/seated/probing/contact transitions; assessment keeps technique separate. |
| Contact Inspector tied to current geometry and seating | `src/components/ContactInspector.tsx` | Implemented analytic explanatory section; numeric clearance hidden until reveal. Visual physical contact evidence separately reported. |
| Random reproducible tasks without size leakage in names | Seeded generator, task metadata, UI names | Unit generator replay and learning prompt no-size tests. Code inspection found no pre-attempt true dimension in learner-facing labels. Local software is not an exam-security boundary. |

## Exact scales, magnification and verification

| Required behavior | Implementation | Evidence / remaining scope |
| --- | --- | --- |
| N=10/20/50, N+1 lines, spans9/19/49 mm | `src/domain/scales.ts` common descriptor | Exhaustive integer oracle, endpoint/count/span tests; discovery N50 browser review. |
| Main and Vernier share exact positions in 3D and SVG | Common descriptors, `tickGeometry`, microscope | 3D tick-quad center tests; SVG data attributes support projection checks. Browser pixel tolerance is a separate gate. |
| Signed zero offset moves engraving, not contact geometry | Scale raw=d+e; renderer pattern offset; contact independent of e | Unit zero-contact invariance, ±correction examples and negative floor tests. |
| Negative indications use floor and nonnegative remainder | `scaleReading` Euclidean decomposition | Closed jaws e−.02,N50 gives MSR−1/index49; independently tested and directly explained in Discover. |
| Canonical n=0 at integer values, even with endpoint alignment | Scale reading and verification | Unit canonical-index tests pass. |
| Honest continuous/off-lattice indication, declared tie rule | `onLattice`, `roundToResolution`, microscope messages | Random/boundary tests; browser .021 mm case shows no exact coincidence. |
| Physical d/e preserved on plate change; stale drafts cleared | Store configure and App challenge/response handlers | Unit physical preservation; challenge creates a new task and retains skipped count. |
| Movable surface lens, magnification and same WebGL context | Renderer camera crop/scissor pass and App lens controls | Implemented; actual lens visual/render-cost validation pending suitable graphics environment. |
| SVG overview, local pan, candidate-tick selector, zoom | `src/scale/Microscope.tsx` | Implemented all tiers. Max320 px/mm gives6.4 CSS px/LC at N50 in the normal 1:1 close-up mapping; numeric layout checks still separate from real display legibility. |
| Freeze immutable state, Resume Live required for submission | Microscope structuredClone snapshot and App submission guard | Immutable snapshot unit tests; UI freeze/live workflow recorded separately. |
| Manual MSR/index/result plus optional full working | App ReadingForm; `ResponseDraft` and verifier | Unit equivalent formatting, conversions, optional fields, division confusion and blank fields. |
| Separate technique and reading/calculation assessment | `src/domain/verification.ts` | Unit numerically correct/physically invalid case and earliest-error diagnosis. |
| Useful targeted feedback and arithmetic carry-through | Verifier codes and explanation list | Unit interval/index/LC/sign/units checks, consistency recognition. |
| Reference values withheld until attempt/reveal | App readAllowed, microscope reveal, inspector reveal | Code review; focused learning conceptual/measurement text review. Security of local code is not claimed. |

## Lessons, classroom and records

| Required behavior | Implementation | Evidence / remaining scope |
| --- | --- | --- |
| Explore, Guided, Practice, Challenge | App learning modes, `src/learning/tasks.ts` | Implemented; seeded objective tests. |
| Discovery with prediction and true10/9,20/19,50/49 spacings | `src/learning/Discover.tsx` shared scale descriptors | Browser prediction, stepping, off-lattice and N50 count checks passed. |
| Modeled parallax, not unrelated label motion | Shared scale-plane z anchors, Δx=−h tanθ projection | Browser60° gives−.520mm for .3mm gap; source notes clarify parallel-ray model. |
| Zero check, correction, calibration and adjustment distinct | Discover lesson/table, zero-check bench action | Browser signed example and table toggle; source-grounded terminology. |
| Resolution, accuracy and repeatability separate | Discover, ConceptQuestion, teacher guide | Implemented concept item and misconception objective; learning effectiveness pending pilot. |
| Anatomy sharp front/rear, accurate target labels | Shared PART_OUTLINES/PART_ANCHORS, vector SVG and list controls | Browser rear-step selection and Enter-key selection passed; original vector remains sharp. |
| Six-chapter history and short experiments | `src/learning/history.ts`, Discover | Source-verified dates and construction distinction; original illustrations. External sources open only by user action. |
| Objective/difficulty/seed, hints, reveal/hide, timer | App teacher workspace and tasks | Implemented. Assistance control behavior reviewed for actual effects during integration. Teacher mode is labeled local convenience. |
| Fullscreen and in-page fallback, large-font reading | App presentation and large preferences, microscope | Implemented browser Fullscreen API with fallback; actual classroom-distance check pending. |
| Progress by objectives/misconceptions, optional local persistence | App objectives, `recordLearningResult`, persistence | Pure tracking and storage-failure tests. Separate saved preferences preserve the local-saving opt-out. |
| Active exercise and unfinished response survive reload/update | App session payload and `src/platform/session.ts` | Unit regressions cover task identity, all four modes, signed offsets, transfer plates, mechanics, draft, guided step, timer and invalid-data rejection. Answer reveal is not restored. Browser reload/update behavior is reported separately in release evidence. |
| Measurement notebook with user/reference separation | `src/platform/records.ts`, App notebook | Immutable assessed state and separate response/reference unit tests. |
| Well-formed local CSV with units, status and seed | Records CSV serializer and download | CSV quote/comma/newline round-trip tests pass. Actual browser download workflow reported separately. |
| Student/teacher evaluation protocol | `docs/PILOT_PROTOCOL.md`, `docs/TEACHER_GUIDE.md` | Delivered protocol; human effectiveness explicitly Not Validated. |

## Platform, assets and delivery

| Required behavior | Implementation | Evidence / remaining scope |
| --- | --- | --- |
| Local React/TS/Vite/Three/R3F, fixed lockfile | `package.json`, `package-lock.json`, Vite config | Typecheck/build and lock installation evidence in release report. No runtime CDN. |
| WebGL2 baseline with functional 2D failure route | Graphics probe/error boundary; FlatInstrument and SVG | Browser failure route observed. Supported renderer family is singular; no WebGPU parity claim. |
| PBR, studio environment, linear color handling/tone mapping | Renderer environment and material setup | Source implemented; rasterized approximation. Photorealism is not certified by numerical tests. |
| Restrained petals, quality caps, reduced/hidden motion | Renderer Petals and quality/demand loop, App ambient setting | Seeded source and caps; real frame-time cost and actual appearance pending graphics review. |
| Synthesized sliding/contact/lock/placement audio | `src/platform/audio.ts` | Explicit enabled gesture, voice limiting and hidden suspension implemented; listening review separate. |
| Semantic navigation, labels, focus, dialogs, non-drag paths | App, microscope, learning components and CSS | Focused DOM/keyboard review and targeted text contrast checks; full WCAG conformance not claimed. |
| Accessible scale relationships without hidden answer labels | Microscope structured observations and candidate selector | Observable interval/selected-line relation provided; actual screen-reader task pending. |
| Actual `/vernier-caliper/` asset/routing/SW base | Vite base, hash router, generated SW, manifest | Preview browser opened actual subpath. Offline-unit tests exercise scope and hashed assets. |
| Explicit complete offline caching with progress/integrity | `scripts/offline-build.mjs`, `src/platform/offline.ts` | Thirteen SW harness tests cover partial/cache corruption/missing asset/hash mismatch/quota/scope/update behavior; cold offline browser restart separately reported. |
| Safe update activation and preserved old hashed assets | Worker ACTIVATE_UPDATE message, App save/apply action | Unit no premature skipWaiting and old hashed asset availability. Save/apply is blocked with a notice when local saving is off or fails. Browser assessment-transition check separate. |
| Dependency license/source inventory and asset generation | Root inventory, procedural geometry, `docs/SOURCES.md`, `docs/ASSET_MODEL.md` | Included in handover; no external font/bitmap runtime required. |
| Source, tests, docs, dist, lockfile and verified ZIP | Release packaging scripts and archive manifest | Final ZIP verification and checksum reported in handover; archive must be freshly verified after changes. |
| Separate development repository/branch, no live overwrite | Isolated fresh git project and manual deployment workflow | No existing repository or live site altered during implementation. Publication requires explicit user approval. |

## Quality-contract status mapping

| Gate | Evidence available | What remains distinct |
| --- | --- | --- |
| Q1 Mathematics | Exhaustive rational/oracle and signed/boundary unit tests | Not a physical accuracy certification |
| Q2 Contact/mesh geometry | Analytic solver residual and transformed contact-buffer tests | Canonical contact close-up visual review remains separate |
| Q3 Readability/projection | Exact descriptors; vector review; max zoom provision | Final browser coordinate assertions and real viewing distance |
| Q4–Q5 Desktop/mobile motion | Diagnostics implementation | Named real hardware60s/10min runs: Not Measured |
| Q6 Pointer latency | Native carriage input timestamps to completion of the next main/loupe render submission; local traces and coalescing counters | Software submission proxy is instrumented. Actual GPU/display latency and reference-device Q6 traces: Not Measured |
| Q7 INP | Responsive architecture and narrow mechanical store | Field/lab INP: Not Measured |
| Q8 Startup | Build sizes and readiness mark | Declared10Mbit/s100msRTT cold baseline: Not Measured |
| Q9 Offline | Manifest integrity/scope/update harness tests | Fully cached cold browser restart with disabled network is a separate required observation |
| Q10 Rendering cost | Runtime draw/triangle diagnostics and tier pixel caps | Standard-scene GPU counters with shadows/lens and timing must be actually measured |
| Q11 Stability | Store listener cycles; resource disposal implementation | Live mesh/material/audio/context-loss50/20 cycles require actual runtime profiling |
| Q12 Accessible interaction | Targeted keyboard/DOM/contrast review; equivalent controls | Screen reader,200% reflow,touch and full task audit remain separate |
| Q13 Learning usability | Full pilot protocol | Representative student outcomes: Not Validated |
| Q14 Classroom legibility | Adjustable type and microscope zoom | Actual room/display/distance observation: Not Validated |

