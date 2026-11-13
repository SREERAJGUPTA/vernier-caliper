# Precision Lab: classroom pilot protocol

**Status: Prepared; educational effectiveness Not Validated.** No student trial, teacher interview, classroom-distance observation, or causal learning claim has been manufactured for this release.

## Purpose and participants

Recruit 10–12 representative Grade 8–10 students and one physics teacher. Include different prior familiarity with Vernier instruments, reading confidence, and primary input methods. Record grade, prior exposure, and input device without collecting names in the application. Follow the school's ordinary consent and safeguarding process. The app remains local and does not transmit responses.

The pilot asks whether learners can establish valid contact, identify the two reading inputs, handle signed zero error, and transfer the method to a different object/plate. It evaluates usability and misconceptions; a small convenience sample cannot establish learning causality.

## Equipment and environment record

For every session record the build/commit, browser and version, operating system, device, GPU if known, display size, viewport, input method, selected quality tier, and motion/audio settings. For classroom use record room lighting, physical display size and resolution, and the farthest student's viewing distance. Emulated screenshots do not replace this observation.

Prepare one mouse/keyboard laptop, one available touch device, and the intended smartboard if available. Keep a real four-way Vernier caliper and suitable reference specimen available for teacher-led transfer discussion. Do not imply the simulator calibrates a physical instrument.

## Moderator instructions

Read only the task text. Ask the student to think aloud; do not point to the matching graduation or name the next control. Start timing when the usable instrument and task appear. Record pauses, wrong turns, and the exact point of any help. A reminder to think aloud is not instructional rescue; identifying the correct jaw, input or tick is rescue. Stop any stressful timing exercise; the product does not require timed progress.

## Task sequence

| Task | Pupil instruction | Observation and success definition |
| --- | --- | --- |
| 1. First outside measurement, N = 10, e = 0 | “Predict the size. Place and align the object. Make a measurement, read the scales and submit.” | Valid reference and probe contact plus correct main-scale reading and coincidence index within 90 seconds, without verbal rescue. Record prediction separately; an inaccurate prediction is not a failure. |
| 2. Reading transfer, N = 20 | “Use the new plate to measure a new object. Explain what the matching line contributes.” | Distinguishes division index from printed major labels and from division count. Does not add the endpoint as an extra millimetre. |
| 3. Negative zero error, N = 50, e = −0.02 mm | “Check the displayed zero condition and correct the reading.” | Explains that subtracting a negative error increases the result. Record whether tick 49 is interpreted correctly. |
| 4. Inside diameter | “Measure this opening.” | Inserts the jaws, centers the section and expands to valid contact. Can explain why an off-center chord is not the diameter. |
| 5. Depth reference | “The rod has touched the bottom, but the reference face is not seated. Is the measurement valid?” | Rejects bottom contact alone and establishes the rim/reference contact. |
| 6. Step faces | “Measure the separation between the two levels.” | Chooses the actual rear faces, not external jaws under a different label. |
| 7. Resolution vs accuracy | “This caliper has a 0.02 mm least count. What does that prove?” | States a resolution claim without assuming equivalent accuracy; mentions technique or calibration. |
| 8. Independent repeat | “Measure again with the same instrument. What can repeated agreement tell you?” | Separates repeatability from closeness to a reference value. |

Present tasks 2–8 without a mandatory timer. Counterbalance tasks 3–6 across participants when practical to reduce fixed ordering effects. Use the same seeded scenarios within each comparison group.

## Parallel pre/post questions

Use two equivalent sets with different values and objects. Do not reuse the same numerical answer as proof of transfer.

| Objective | Form A | Form B | Expected reasoning |
| --- | --- | --- | --- |
| Least count | 20 divisions span 19 mm. Find LC. | 50 divisions span 49 mm. Find LC. | 1 − (N−1)/N, with units. |
| Reading | MSR 12 mm, index 7 on N = 20 | MSR 23 mm, index 24 on N = 50 | 12.35 mm and 23.48 mm respectively. |
| Signed correction | Observed 23.48 mm, e = +0.04 mm | Observed 23.48 mm, e = −0.02 mm | 23.44 mm and 23.50 mm respectively. |
| Contact validity | Off-center internal contact | Unseated depth reference | Contact can exist without a valid requested dimension. |
| Resolution / accuracy | Finer graduations but wrong zero | Repeatable results against a wrong reference | Fine resolution or repeated agreement does not alone prove accuracy. |

Record each explanation as correct, partly correct or incorrect against a written rubric. Report counts rather than an unsupported percentage gain. If forms differ in difficulty, describe that limitation.

## Accessibility task checks

With an experienced screen-reader user, run first measurement, scale observation, manual response, feedback, and record export using a named screen reader/browser combination. Record actual results. A DOM snapshot is not a screen-reader trial. Repeat the first measurement with keyboard alone and with non-drag single-pointer controls. Test 200% zoom, narrow reflow, reduced motion, touch portrait/landscape, and a saved-preference reload.

Record any inaccessible control, ambiguous announcement, focus loss, repeated speech, or disclosed answer. Report automated checks separately from human assistive-technology results.

## Classroom legibility check

Show the finest plate in presentation mode and use microscope zoom. Ask the teacher and a learner at the farthest intended seat to identify a chosen main/Vernier tick pair, a plus/minus sign, the units, and a feedback instruction. Increase type/zoom where needed. Record display size, viewing distance, lighting, corrected failures and unresolved failures. A 4K screenshot alone is insufficient evidence.

## Acceptance and reporting

Proposed first-task target: at least 80% of participants succeed within 90 seconds without rescue. For 10 pupils this means 8; for 11 it means 9; for 12 it means 10. Report the numerator and denominator and any exclusions. Report median/range of completion times and how many required rescue. A task completed after a hint remains useful evidence but does not meet the unassisted target.

Maintain a misconception log: off-by-one index, mistaken main interval, least-count calculation, multiplication, zero sign, units, invalid contact, off-center diameter, unseated reference, and resolution/accuracy confusion. Tie revision decisions to observed events.

## Blank results record

| Category | Result | Evidence | Follow-up |
| --- | --- | --- | --- |
| First-task completion | Not Validated | Participants unavailable in the build environment | Run moderated pilot |
| Zero-error sign transfer | Not Validated | Participants unavailable | Use parallel tasks |
| Unfamiliar object / plate transfer | Not Validated | Participants unavailable | Run tasks 2, 4–6 |
| Screen-reader workflow | Not Validated | Actual assistive-technology user trial pending | Record named device/browser/reader |
| Classroom distance | Not Validated | Physical room/display unavailable | Test intended classroom |

Do not replace these entries with passes until the corresponding observation has actually been performed.
