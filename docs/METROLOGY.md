# Metrology and contact model

This is a new implementation. The pure engine in `src/domain`, `src/contact`, and `src/mechanics` has no browser, React, Three.js, audio or network dependency. All lengths are millimetres; `d` is continuous physical slider displacement, not a rounded display value. Supported displacement is 0–150 mm. The supported signed additive zero-error setting is −0.10 to +0.10 mm. `N` is 10, 20 or 50.

## Exact direct Vernier construction

One main division is 1 mm. N Vernier intervals span N−1 mm, so VSD=(N−1)/N mm and LC=1/N mm. There are N+1 lines, including both endpoints. A printed numeral is not a semantic division index. Every drawing uses the common descriptor returned by `scaleTicks`.

For main datum a=0, the main tick position is k, and Vernier tick j is at d+e+j(N−1)/N. The zero-error e shifts only the graduation pattern. It never shifts a jaw or changes a specimen's geometry. The raw observed indication is r=d+e; the ideal corrected indication is r−e. This is an additive zero-error teaching model, not a simulation of all real instrument errors.

For exact r=m+n/N, m=floor(r) and n is the nonnegative remainder index 0…N−1. Tick n aligns with main tick m+n. In particular, d=0,e=−0.02,N=50 produces m=−1,n=49. The introductory calibration explanation may express this as e=−(50−49)×0.02=−0.02 mm. At integer indications, n=0 is canonical; the far endpoint also coincides and must not add a millimetre.

The declared coincidence tolerance is **1e−10 mm**, solely for floating-point arithmetic noise. It is independent of screen pixels, line width, zoom, and LC. An arbitrary continuous state normally has no exact coincidence. Such states retain their actual geometry and return `index: null`, rather than a falsely highlighted exact tick. Nearest-resolution estimates use symmetric half-away-from-zero rounding. Rounding does not mutate d, e, or any tick position. Off-lattice verification explicitly describes an estimate, using the nearest indicated reading before subtracting the signed zero error.

Changing the plate preserves the physical state. If the same d/e becomes off-lattice, the caller must communicate this and clear stale answers. Challenge configuration changes start a new task; this workflow is owned by the learning/store layer.

## Independent assessment and contact

The contact solver never reads an answer-key value. The specimen contains reproducible geometric dimensions. An external contact is a support-surface difference; an inside contact is a circle-line intersection; a depth contact is the selected floor plane relative to the rim; a step contact is separation of the two ledge planes. `referenceDimension` independently derives the intended reference dimension from specimen geometry for assessment. In the inside off-centre case, the solver returns a chord while the reference dimension remains the diameter. This intentionally makes a numerical wall-to-wall reading insufficient for a diameter claim.

The fixture model assumes rigid objects, a straight guide, and ideal aligned measuring surfaces. It does not infer force from pointer speed or simulate real material compression. A finite insertion envelope, finite external jaw reach, real rod cross-section, cavity wall, bottom thickness, rear-face ledge access, and 150 mm range are checked. The rod is a 1.4×1.4 mm square; its furthest corner must fit inside the circular opening, including transverse offset. Complementary inside blade bodies are staggered in z to close without occupying the same volume; their wedge pads converge to a common z=0 contact section. The internal bore is oriented along the insertion direction Y. These are explicitly documented educational adaptations.

Supported families are external cylinders, spheres, coin-like disks, bolt shafts and blocks; internal rings, washers, pipes and bearing-like sockets; blind holes, stepped cavities and vessels; two-level blocks and stepped flanges. Thread decoration is not the bolt shaft measurement. Each seeded specimen is generated on the active LC lattice for introductory exact-coincidence work.

Loading is distinct from measuring. `canPlace` returns a feasibility result without changing d. A positioned but unseated specimen is a preview, and reference contact remains invalid. Aligning/seating establishes the fixed reference, then the learner still needs to move the slider. `constrainMovement` clips a requested continuous path at the first relevant measuring surface, so a large pointer jump cannot tunnel through a supported fixture. Physical lock blocks all requests at that central function. An impossible wall/clearance configuration blocks movement until it is corrected or removed.

`evaluateContact` reports reference validity, probe validity, alignment, signed gap, penetration and placement phase independently. A rod at a floor with its beam reference unseated remains invalid. Locking an invalid pose also remains invalid. Reveal/hide decisions belong to the UI; `target` and reference values must not be rendered before an authorized reveal in a challenge.

## Verification and units

Student drafts never mutate the physical state. Scale-work fields use mm; the final result accepts mm, cm or m. Equivalent numeric formatting is accepted. Verification separately returns technique correctness and calculation correctness. It reports the earliest relevant calculation error and recognizes consistent arithmetic based on a mistaken earlier input. Optional fields are checked when supplied. Contact errors take precedence in overall physical success while the calculation result is retained.

Resolution, accuracy and repeatability are distinct. Numerical tolerances in this software are not claims of a real caliper's accuracy. Mathematical zero correction does not repair an instrument. Calibration compares indications with independently known reference dimensions; a virtual zero reset is not a complete physical calibration procedure.

## Automated evidence

Run `npm test`. The scale oracle uses integer micrometres and independent Euclidean division rather than the production scale helper. The exhaustive test covers **102,019** exact opening/zero-offset states over all three plates, including negative indications and maximum travel. Additional tests cover 3,000 off-lattice states, fixed examples, immediately adjacent non-noise values, ties, configuration changes and both endpoint coincidences.

Contact tests cover **3,360** seeded family/plate fixtures, plus independently authored fixtures for all four measurement modes, misplaced/tilted cases, bore limits, unseated depth references, wall clearance, pointer jumps, lock behavior, removal and repeated opening/closing. Rendering tests instantiate the actual measuring-pad BufferGeometry, apply independent scene transforms, inspect every vertex and compare measuring surfaces with analytic datums to 0.001 mm. Actual 3D tick-buffer centres are checked against independently written equations. Float32 renderer precision and domain arithmetic precision are deliberately separate tolerances.

These checks establish the tested model's arithmetic and geometric invariants. They do not establish classroom learning effectiveness, physical-device performance, or certified metrology accuracy. Those require their separately documented validation procedures.

