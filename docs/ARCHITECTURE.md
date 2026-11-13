# Architecture and consequential decisions

## Fresh implementation boundary

This checkout was created as a new Git repository on `rebuild/precision-lab-v2`. Application, model, interaction, styles, learning modules, service-worker generation, and tests were written afresh. The supplied master specification was copied into documentation as the acceptance contract. No earlier Precision Lab implementation or production archive was recovered or repackaged. Third-party packages were installed from the pinned dependency manifest.

## Authoritative state and ownership

`createLabStore` contains exactly one `d` in millimetres. `move(requestedD)` applies `constrainMovement` before publishing a snapshot. The meshes read this store in the render frame; the control and microscope components subscribe locally. App-level navigation and response drafts do not produce another jaw position. The full React application does not rerender for every mechanical frame.

Camera rotation lock is presentation state. The physical slider lock belongs to the domain state and is checked centrally for every movement request. Reset measurement deliberately releases it; reset view does not. New specimens are unseated and do not establish contact automatically. An unseated or offset pose is shown as an explanatory preview until aligned.

The interaction controller grants one owner and rejects simultaneous owners. It uses pointer capture, preserves the initial projected-axis drag offset, checks singular projections, and aborts on lost capture, cancellation, blur, and secondary input. A side view redirects an unstable drag to a front interaction pose. Active displacement has no easing. Camera and explanatory explosion transitions use elapsed-time damping.

## Mathematics and geometry

The rendering/learning/assessment layers use common scale descriptors. Independent tests derive expected readings with integer micrometres; they do not use the production helper as their oracle. The exact coincidence threshold is 1e-9 mm and is independent of pixels or line width. Continuous positions stay continuous when plates change. Half-away-from-zero estimates never move a jaw or a graduation.

The contact solver uses support functions, circle-line intersections, a finite rod cross-section, and named plane separations. It does not read an answer-key field. Independent reference dimensions are derived separately from specimen geometry. Contact and calculation success are distinct outcomes. Actual mesh vertex/ray-intersection tests catch geometric disagreement that shared formulas alone would miss.

The supported fixtures are rigid and intentionally constrained; they are not a general rigid-body physics simulator. Pressure, compliance, arbitrary object orientation, and manufacturer-specific calibration accuracy are discussed rather than falsely simulated. See METROLOGY and COORDINATES for detailed assumptions.

## Rendering choice

The release implements one WebGL2 renderer family, React Three Fiber 9 with React 19 and Three r180. No WebGPU branch or ray-tracing dependency was added. Procedural beveled silhouettes, true contact pads, a raised main-scale insert, roughness detail, studio PMREM, and merged graduations are reproducible local assets. Color textures are sRGB; roughness data are untagged color data; one ACES tone-mapping policy is used.

The surface lens uses a fresh cropped camera pass inside the same renderer. The SVG microscope remains independent of GPU resolution and magnifies to 320 CSS pixels/mm. The quality tiers change decorations and rendering cost, not mechanics or learning results. The automatic tier uses warm-up-filtered active-frame samples with hysteresis and defers a change during a drag. Native-resolution DOM/SVG is retained.

WebGL capability and creation failures call back to the application, preserving the store and opening its functional 2D route. Loss of context also preserves state. An immediately released capability-probe context is not maintained alongside the single rendering canvas.

### Q6 input-to-render diagnostics

Carriage dragging has a separate software latency instrument in `interaction/latency.ts`. After a two-second startup warm-up, the handler records the **native pointer event's timestamp**, including any queueing before handler execution. The same handler applies the constrained movement to the authoritative store. The next render frame reads that store and submits the main scene and any active surface-loupe pass. Immediately after those synchronous `gl.render` calls return, `performance.now()` supplies the submission endpoint.

Modern event timestamps are already on the performance clock. Explicit epoch-millisecond timestamps are normalized with `performance.timeOrigin`; invalid, future or incompatible values are rejected and counted. The instrument does not substitute handler receipt time for a missing or invalid timestamp. Hidden-tab interruption and cancelled gestures clear pending samples. Idle demand-render gaps produce no latency samples.

Several accepted pointer events can precede one rendered frame. Its `latencyMs` uses the latest contributing event, because intermediate mechanical states may have been superseded. `oldestPendingLatencyMs` and `eventCount` expose the rest of that batch. This is application-level coalescing, not a claim that the browser delivered every hardware sample through `getCoalescedEvents()`.

Two local DOM events support repeatable profiling:

| Event | Timing evidence |
| --- | --- |
| `precision-lab-input-render` | One sample per submitted frame with pending carriage input: input/submission timestamps, latest-event latency, oldest pending latency, event count, source and endpoint. A local collector can retain a complete 60-second run. |
| `precision-lab-diagnostics` | Existing diagnostic event adds `inputRender`: a rolling window of at most 240 samples, retained event/coalescing counts, rejected/cancelled counts, latest latency and nearest-rank p50/p95/p99/max after at least 20 samples. The rolling summary is separate from frame-interval p95/p99. |

A `precision-lab-pointer-to-render` User Timing measure is also issued for browser-trace inspection. Its performance-buffer entry is cleared after emission to avoid unbounded retained entries; observers or browser tracing can capture it. Diagnostics contain timing/resource data, no specimen dimensions, student answers or other hidden assessment state. They remain entirely local and perform no network requests.

This measures **event timestamp to rendering-command submission**, including CPU work through both scene passes. It does not wait for GPU completion, compositor presentation or display scanout, and therefore is not input-to-photon latency. Browser timestamp precision and diagnostic overhead are practical limits. The supplied sequencing/clock/coalescing tests validate the instrumentation logic; actual Q6 results still require the declared WebGL-capable reference devices and a controlled profiling run. No numerical device pass is inferred from the existence of this code.

## Assessment and local records

Instrument settings, response drafts, frozen inspection snapshots, and submitted records are separate values. A frozen microscope is clearly labeled and prevents verification until Live resumes. Every submitted observation clones the complete assessed state. Optional working fields are assessed only when entered; earlier reading errors are diagnosed before subsequent arithmetic. CSV keeps entered and reference values in separate columns and escapes quotes, line breaks, and spreadsheet formula-leading text.

Challenge names, prompts, and pre-attempt explanations do not print unknown dimensions or select the answer tick. Structured observations describe visible scale relationships. Teacher reveal/hide is a classroom convenience rather than access security. The software has no accounts or remote tracking.

## Static delivery and offline updates

Vite's base is `/vernier-caliper/`; navigation uses hash routes. All runtime URLs are local. The build script enumerates runtime files, hashes their exact bytes, and emits a versioned service worker. Source maps, `.nojekyll`, and development files are excluded from the runtime offline package. `.nojekyll` remains in `dist` for static hosting.

An explicit offline installation verifies every required response, reports progress, and writes its Ready marker only after all entries are present. Errors retain normal online use. A waiting update activates only after an explicit save-work action. Old hashed asset caches remain available for older controlled tabs; this favors assessment consistency over aggressive cache reclamation. Browser storage eviction is handled by readiness checking, and never described as impossible.

No existing GitHub repository was mutated. The included publication workflow is manual and checks an explicit approval string. This is an operational guard, not an access-control replacement for repository permissions or environment protections.

## Validation limits

See VALIDATION.md for executed results. Source checks, integer oracles, actual geometry tests, and software-browser workflows provide different evidence. No test count establishes real GPU performance, beauty, human learning effectiveness, or accessibility conformance. Unavailable hardware and participant gates remain labeled.
