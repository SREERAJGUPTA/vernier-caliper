# Original instrument model and rendering evidence

## Provenance and reference

This model was built from new parametric source for this rebuild. It does not reuse an earlier Precision Lab implementation. The silhouette and component naming are informed by Mitutoyo's **Calipers** catalogue, especially the conventional Vernier examples and the part/measurement diagrams on printed pages D-34 and D-35:

- [Mitutoyo caliper catalogue](https://www.mitutoyo.com/webfoo/wp-content/uploads/D_section.pdf)
- [Mitutoyo quick guide](https://www2.mitutoyo.co.jp/eng/products/menu/quick_guide.pdf)
- [Three.js metallic/roughness material documentation](https://threejs.org/docs/pages/MeshStandardMaterial.html)
- [R3F performance guidance](https://r3f.docs.pmnd.rs/advanced/pitfalls)

These sources describe reference instruments and rendering practices. This educational model is a **generic four-way caliper**, not a manufacturer-certified replica. Source references are retained offline here; links open only when a learner or reviewer chooses them.

## Model construction

Every model length is in millimetres. The beam extends to x=215 mm and the allowed slider travel is 0–150 mm. The extra beam length supports the complete 49 mm, 50-division direct Vernier even at maximum opening and a positive zero offset. Mechanical d controls the moving jaw, inside blade, carriage, Vernier plate, depth bar and rear step blade as one rigid assembly. Zero error e translates only the graduation pattern.

The fixed and moving external jaws use separately authored beveled polygon extrusions. A raised steel main-scale insert and a front-mounted Vernier plate keep both engraved surfaces ahead of the jaw bodies, so the leading Vernier ticks remain visible. Their visually machined measuring pads terminate at exactly x=0 and x=d. Cosmetic bevels stop behind the contact pads. The caliper also has internal blades, a hollow slider collar around the visible beam scale, a rotary thumb friction roller with merged knurl, a locking screw, two face screws, rear step blades and a routed rectangular depth bar. The roller represents manual fine adjustment; there is no invented gear train or micrometer ratchet.

Shared part outlines and anchors drive the vector anatomy view. The full procedural source is supplied, together with a reproducible OBJ snapshot and CPU geometry inventory. The OBJ is an inspection/export convenience; it excludes some runtime cosmetic details and does not replace the working parametric instrument.

### Explicit educational modifications

- Interchangeable 10-, 20- and 50-division metric plates share a broad 52 mm carrier. This supports easy comparison and is not a claim about a production instrument's interchangeable parts.
- Main graduations lie at z=3.06 mm and Vernier graduations at z=3.36 mm, a 0.30 mm separation used by the parallax demonstration.
- Inside blade bodies occupy complementary front/back layers. The true knife contact vertices lie at z=0, x=0/d. Inside specimens have their bore axis along Y; the jaws enter through the mouth at y=19 mm. This prevents the physically impossible scene in which a whole stem passes through the lower wall of a front-facing ring. An off-center inside placement uses transverse Z offset and is a chord, not a true diameter.
- The rear step blades use complementary layers, with contact faces at x=0/d and centers near z=-5.15/-4.85 mm. Two original stepped fixtures provide clearance for the moving blade at d=0. The reference shoulder is recessed in Z so the moving blade can pass before contacting the second level. Both block and flange profiles are generated from the same separation and independently checked for forbidden pad penetration.
- Depth specimens are intentionally cut away to expose the reference and bottom. The cutaway does not change the analytic wall or bottom constraints. The rectangular depth bar has a 1.4 mm square section; wall clearance accounts for its corners, not an assumed zero-thickness ray.
- The stepped cavity has an actual annular shoulder at 45% of its depth, followed by a lower bore with 75% of the entry radius. This is distinct geometry from the straight blind bore and vessel. Bottom-depth assessment remains referenced to the selected bottom; the narrower lower bore is included in rod-clearance checks.
- Invalid/unseated placements are translucent previews. They are not presented as valid solid contacts.

## Materials, light and environmental motion

Rendering uses Three.js 0.180.0 WebGLRenderer through R3F 9.3.0. There is one active rendering context. An immediately discarded capability probe detects browsers with WebGL 2 disabled before mounting R3F's asynchronous renderer; such a browser receives the same-state SVG/DOM instrument instead of a blank canvas.

Steel uses MeshStandardMaterial, a deterministic 128×128 directional roughness texture, and local PMREM-filtered RoomEnvironment lighting. The studio environment is generated from the bundled Three.js source and requires no HDR download or runtime CDN. Input colors use sRGB conversion; color engraving textures are marked sRGB, roughness is non-color data, and output uses one ACES filmic tone-mapping policy. Contact pads use physical geometry and are never displaced by a material map.

The studio combines warm key, cool fill and rim lights with a restrained floor shadow. There is no bloom, motion blur, chromatic aberration, lens distortion, or depth of field during measurement. Gallery petals use one instanced mesh (12 enhanced, 6 standard, zero constrained), deterministic phases, a slow wind/drag approximation and a hard non-measuring floor with occasional settling. Petals are excluded from ray picking and measurement collisions. Ambient motion and hidden-document handling can stop this animation.

## Interaction and optics

The renderer reads one authoritative mechanical snapshot per frame and directly assigns d to transforms. Dragging does not tween the jaw. A pointer ownership controller separates carriage and specimen drags from orbiting; cancellation, lost capture and window blur release ownership. Near-singular side projection enters a front pose instead of amplifying pointer travel. The projected-axis mapping preserves the initial grab offset. Camera rotation lock does not lock the carriage.

Camera presets cover front, rear, side, top and three-quarter views. Reading switches to orthographic projection. Camera damping is elapsed-time-based and independently tested at 30, 60 and 120 Hz. Exploded poses separate the jaws, upper blades, slider collar and plate while preserving d; measurement input is paused by the application during explosion.

The surface loupe uses a new scissored camera pass into the existing renderer. Its viewport shows the underlying geometry at higher sampling density; it never enlarges an existing screenshot or creates another WebGL context. Its movable viewfinder is a square inspection lens. The always-available vector microscope remains the metrologically precise reading surface, including on the constrained and 2D tiers.

## Resource discipline and runtime diagnostics

Graduations are merged into two geometry buffers. Thumb-wheel knurl is also merged. Petals are instanced. Geometry/material/texture creation occurs on semantic state changes, not on pointer movement; replaced specimen resources and scale textures are disposed. A demand-based frame loop renders only while requested, with continued invalidation for active movement/camera settling/ambient petals. Document hiding stops continued invalidation.

Runtime diagnostics report the actual renderer's draw calls and triangles across the main and optional loupe passes, live geometry/texture counters, scene mesh/material counts, and drawing-buffer pixels. The standard buffer cap is approximately 2 megapixels; DOM/SVG remains at native display resolution. These counters become evidence only when collected in a working WebGL environment.

The active-frame interval window excludes demand-loop idle gaps and an initial two-second warm-up. It retains up to 240 active intervals and exposes p95/p99 only after at least 15 samples spanning at least three seconds. The callback includes dragging status so quality changes can wait until pointer release. This diagnostic window is an adaptation aid, not the prescribed 60-second or ten-minute reference-device benchmark.

### Static cost estimate (not measured GPU data)

A standard assembled scene has approximately 35 mesh draws before shadow processing, depending on the specimen. About 25 of those meshes cast a shadow. With the optional second loupe render, a conservative source-level estimate is roughly 120 geometry draws, including repeated shadow work. PMREM initialization is a separate startup cost. Driver decisions, Three.js shadow updates and actual visibility can change these counts; only the live diagnostic values should be used to assert Q10. The generated inventory supplies exact CPU triangle counts for its exported structural subset.

Texture memory is **Not Measured**. CPU texture dimensions are known (4096×128 main numerals, 2048×128 Vernier numerals, 128×128 roughness), but PMREM atlas layout, mip chains, driver formats, shadow attachments and allocation overhead must be included before claiming a GPU byte figure.

## Validation status and remaining fidelity gate

Executed source tests independently check transformed contact-mesh vertices, actual internal-blade clearance in the smallest supported curved bore, tick-buffer positions, and both stepped fixture meshes throughout representative travel. Pointer ownership, side-view degeneracy, frame-rate-independent camera damping and graphics capability failure have separate tests.

`docs/evidence/geometry-study.png` was produced from the exported OBJ's actual triangles using the supplied CPU orthographic projection script. Its front, rear and three-quarter views were inspected. The review exposed leading Vernier ticks hidden behind the moving jaw in an earlier geometry draft; a physical raised scale insert and correctly placed front Vernier plate resolved that defect. The inspected views show both tick bands, the four-jaw silhouette, continued beam support, depth-bar extension and the modeled collar. This is a geometric silhouette/occlusion review with simple face shading, **not** a browser screenshot or a review of the finished PBR material appearance.

The available browser disables WebGL 2. The alternative local Chromium process could not create its required system socket under the execution policy. These are limitations of the test environment, not evidence of rendering success or failure on a supported device. **3D visual review and real-device rendering performance remain Not Measured/Not Reviewed.** The same-state 2D fallback can be reviewed and exercised independently.

Before approving production replacement, review front, rear, three-quarter, jaw contact, inside contact, depth contact, step contact and magnifier poses on a WebGL 2 capable browser. Pay particular attention to metallic highlights, jaw silhouettes, tiny geometry overlaps, near-camera clipping, contact lighting and label aliasing. The supplied static CPU tests establish geometric properties; they cannot certify beauty, photorealism or the perceived clarity of 3D contact.
