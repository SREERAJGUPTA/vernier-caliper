# Mechanical coordinates and modeling contract

The instrument uses **millimetres throughout**. The exported `mmToWorld` conversion is the identity. X follows the beam toward the depth rod; Y points toward the inside jaws; Z points toward the engraved front of the instrument. There is one authoritative continuous opening `d`, bounded to 0…150 mm.

| Feature | Fixed datum | Moving datum / bounds |
|---|---|---|
| External measuring faces | x=0 | x=d; y=−36…−8; z=−3…+3 |
| Main-scale origin | x=0 | Main ticks k at x=k; includes negative support |
| Vernier pattern | Carriage mechanical origin x=d | Printed zero x=d+e; final tick x=d+e+N−1 |
| Inside outward contacts | x=0, y=20, z=0 | x=d, y=20, z=0 |
| Inside insertion envelope | At least 5 mm accessible bore | Conservative paired opening ≥3.2 mm; insertion depth ≥3 mm |
| Depth reference plane | x=215 | Rod tip x=215+d; y=0,z=−2.6 |
| Depth rod cross-section | 1.4×1.4 mm square | Corner clearance checked against aperture |
| Rear step faces | x=0, y=1,z=−5.15 | x=d, y=1,z=−4.85 |
| Beam support | x=−8 to215 | The nominal range is not total beam length |

The moving external jaw, moving inside jaw, carriage, Vernier plate, depth bar and moving rear face all use the same translation `[d,0,0]`. They cannot acquire independent openings. Cosmetic motion of a thumb roller or locking screw cannot change that relationship. Exploded view adds explanatory offsets to rendering only; the assembled state must be preserved and measurement interactions must be suspended until reassembly.

## Hero construction and contact surfaces

The procedural source `src/rendering/geometry.ts` defines reproducible bevelled outlines, exact measuring pads and common anatomy anchors. Cosmetic steel bodies stop short of the measuring surfaces. `measuringPadGeometry` supplies the actual visible vertex buffers used by the scene and inspected by the geometry tests. Pads are not inferred from the broad mesh bounding box. The depth bar routes behind the beam rather than intersecting its solid center. The 215 mm beam supports the full 49 mm plate even at maximum travel and positive zero offset.

Internal blade bodies are complementary and staggered in Z; their wedge-shaped pads converge to the same z=0 measuring section. This permits closure without impossible overlapping solids while measuring a true bore diameter. This is a generic educational geometry, not a certified commercial replica. Its long exchangeable teaching plate and semantic microscope labels are further deliberate modifications.

## Canonical fixture poses

External objects seat their left support at x=0. Their measuring section is centered near y=−22; permitted offset stays within finite jaw reach. A block's projected support follows its actual width/height and tilt, though a tilted reading fails the alignment criterion. Round objects use their geometric support radii. Sphere contact is at its equatorial support plane within jaw reach.

An internal circular bore has its axis along Y, so the upper jaw tips insert through its mouth at y=19. Its cross-section is in XZ; the pads at y=20 share the z=0 measuring section. A transverse Z offset `b` yields intersections separated by 2√(R²−b²). Seating places the left wall at x=0. Only b=0 is a valid diameter task; a chord remains demonstrably different from the intended diameter. The entire insertion envelope must fit before expansion.

Depth specimens place the rim at x=215, with the selected bottom at x=215+floor. Their local `geometry.depth` includes bottom material and therefore exceeds `floor`. The rod must clear cavity walls and the beam reference must be seated on the rim. The actual beam-end rectangle spans y=−4.5…7.5 and z=−1.6…1.6; its radial extent must overlap the specimen's rim annulus. A mouth so wide that the beam end falls wholly inside it is rejected. The generated small vessel uses a 6 mm inner radius so the actual reference face can seat without an invented depth-base attachment.

Step specimens are positioned so their local levelA coincides with x=0; their second plane lies at x=levelB−levelA. Complementary rear pads occupy separate adjacent Z layers: the fixed pad faces negative X and the moving pad faces positive X. A recessed reference shoulder permits the moving pad to retract without penetrating that shoulder. Rear pads make these contacts. External jaws are not substituted for step measurement.

For a stepped cavity, the visible shoulder is at 45% of the selected depth and the lower aperture radius is 75% of the upper aperture radius. Placement validates the complete path using this narrower lower opening. Reference-face seating still uses the upper rim; the selected measured bottom remains at `floor`.

The displayed contact inspector is an explanatory section of those same shapes and state. Hiding it cannot change geometry or complete contact. A placed but unseated object is a visibly marked placement preview, not a claimed solid measuring pose.
