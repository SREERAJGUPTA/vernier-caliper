# Teaching with Precision Lab

## A first five-minute encounter

Begin with the 0.1 mm plate and one outside measurement. Ask pupils to predict the object size before placing it. Help them separate three questions: **Have the right surfaces touched? Where is Vernier zero? Which line coincides?** A correct number from invalid contact is still an invalid physical measurement.

Use Place/Align and the slider movement buttons when dragging is difficult. These are equivalent learning routes. The physical slider lock freezes the opening; the camera lock only stops rotation. Reset View changes the viewpoint, while Reset Measurement prepares a new attempt with the same object and settings.

## A useful teaching sequence

1. **Explore:** inspect the external/internal jaws, beam, depth bar, and rear step faces. Use Anatomy to select a component and connect its function to the 3D part.
2. **Predict and contact:** seat one reference surface and bring the probing surface into contact. Ask what would invalidate the measurement.
3. **Read:** use the overview to locate zero and the local microscope to compare lines. Students first enter MSR, index and result.
4. **Explain:** after an attempt, use the scale overlay and arithmetic to connect the observed spacing difference to the fractional contribution.
5. **Discover:** compare 10 over 9, 20 over 19, and 50 over 49. Ask students to count intervals, not just lines.
6. **Correct:** study positive and negative zero errors. Keep zero checking, mathematical correction, calibration and physical adjustment distinct.
7. **Transfer:** change object family, measurement type and plate. Use the Contact Inspector for inside, depth and step tasks.

## Objective and difficulty choices

`intro` chooses the 10-division plate and short instructions. `standard` retains the selected plate. `advanced` enables the most demanding selected objective; advanced continuous positions must be treated as estimates, not exact-coincidence puzzles. Seeded tasks can be repeated for discussion or parallel classrooms. Changing a plate within a challenge starts a new task; the old task should remain unscored/skipped, not silently change its answer.

The available objectives cover outside, inside, depth and step measurements, least count, both zero-error signs, wrong-tick diagnosis, resolution versus accuracy, and transfer. Some objectives present a short conceptual question before or alongside measurement. Explanations appear after submission. Requesting a hint is a learning choice, not a failed measurement.

## What to emphasize

| Common confusion | Useful question or intervention |
| --- | --- |
| Counting the zero line as index 1 | “How many spaces are between the zero line and the line you selected?” |
| Treating 50 lines as 50 divisions | “Draw a fence with 6 posts. How many gaps are there?” |
| Choosing the main tick just to the right of zero | “Which whole millimetre has the zero already passed?” |
| Adding an endpoint coincidence as an extra millimetre | “At a whole-millimetre reading, what fractional part remains?” |
| Subtracting the magnitude of every zero error | “Write the error with its sign before using observed minus error.” |
| Calling every inside wall contact a diameter | “Is this measuring section through the center, or is it a chord?” |
| Accepting depth-tip contact alone | “Where is the reference face? What surface defines zero depth?” |
| Calling slider lock proof of contact | “Could you lock the jaws while they are still in the air?” |
| Equating least count with accuracy | “Could a fine scale still be shifted, tilted or incorrectly calibrated?” |
| Inferring force from fast mouse motion | “The simulator models rigid contact. What extra real-world effects would pressure introduce?” |

## Projection and physical technique

The parallax lesson projects two physically separated graduation planes along an oblique line of sight. The marks do not move relative to the instrument. Looking straight on eliminates this modeled apparent shift. Explain clean faces, suitable jaw reach, gentle even pressure, zero checking, and appropriate units; these are not cosmetic habits.

The ideal guide and rigid specimens exclude jaw flexure, surface roughness, thermal expansion, and full uncertainty propagation. Calibration examples illustrate the distinction between checking zero and comparing reference dimensions across the range. They are not instructions for certifying a physical instrument.

## Classroom presentation and privacy

Use the teacher workspace to set an objective, difficulty and seed, choose assistance, and reveal or hide a solution. Teacher mode is a local presentation control, not access security. In a classroom, hide solutions until an attempt has been discussed. Use the large-font microscope and fullscreen or its in-page equivalent; keep the active scale visible.

The application uses local progress and records when browser storage is available. No account, analytics or remote database is required. Export meaningful observations to CSV after completion. Student entries and verified reference values occupy separate columns so a teacher can distinguish an arithmetic misconception from an incorrect contact technique.

Use Reset Session for current work. Clearing saved progress is a separate explicit action. Downloaded CSV files remain on the device until the user removes them.

## Before a lesson without internet

Load the application over HTTPS or localhost, choose **Make Available Offline**, and wait for the full package to report ready. Then test offline navigation on that actual device. The first visit still needs the static assets. Browser storage may be evicted; offline readiness should be rechecked before a class. Double-clicking `index.html` is not the PWA hosting route.

## Validation boundary

Automated mathematical tests and browser workflows are engineering evidence, not proof of classroom effectiveness. The structured 10–12 pupil pilot and the physical smartboard viewing-distance check are provided in `PILOT_PROTOCOL.md`; both require real participants and equipment.
