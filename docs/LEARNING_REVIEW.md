# Learning-module review

Reviewed 13 November 2026 against the fresh rebuild working tree. The main validation report identifies the final build and distinguishes these observations from release-wide checks.

## What was exercised

The executable preview was opened at the actual `/vernier-caliper/` subpath in the supported cloud Chromium browser. Viewport was **1363 × 936 CSS pixels**, device-pixel ratio 1. Hardware and GPU were not supplied. The browser reported that 3D inspection was unavailable and the application's functional 2D route remained available. These observations therefore **do not certify the 3D art direction, GPU performance, or the physical-device targets**.

The initial direct Playwright attempt in the shell did not run: its default browser binary was absent, and the system Chromium executable could not create its required socket in that execution environment. Review continued through the supported isolated preview/browser route. That first failed launch is not counted as a passed test.

| Check | Observed result | Evidence category |
| --- | --- | --- |
| Select the 50-division discovery plate | UI shows 50 main divisions over 50 mm; 50 Vernier intervals over 49 mm; 51 Vernier lines | Browser DOM and visual inspection |
| Enter a prediction of 0.02 mm | Correct least-count feedback; 1 − 49/50 = 0.02 mm | Browser interaction |
| Advance from zero by one least count | 0.020 mm position; index 1 coincidence; 0.02 mm contribution | Browser interaction and accessible state |
| Use the keyboard to move another 0.001 mm | At 0.021 mm the lesson explicitly says no exact coincidence | Browser keyboard interaction |
| Switch the zero-error lesson to −0.02 mm | Tick 49 coincides with main tick 48; 23.48 − (−0.02) = 23.50 mm | Browser interaction and SVG inspection |
| Move the parallax angle to 60° | Shared 0.3 mm plane gap produces −0.520 mm apparent shift, rounded for display | Browser interaction; independent trigonometric check |
| Enable the illustrative scale-error comparison | At 100 mm, indication 100.140 mm and zero-corrected 100.100 mm | Browser interaction |
| Select the moving rear step face | Description changes to the correct rear measuring face; rear illustration is selected | Browser interaction |
| Explode then reassemble | Moving external-jaw SVG polygon coordinates restore exactly | Read-only browser DOM comparison |
| Select the Vernier with Enter | Component selection and function explanation update | Browser keyboard interaction |
| Horizontal overflow | Document width did not exceed viewport width at the reviewed desktop viewport | Browser DOM measurement |
| Primary anatomy component controls | Thirteen component buttons measured 44 px high | Browser DOM measurement |

The preview was under active development. Source updates could remount the app between review actions. Those development refreshes are not counted as evidence of final-build persistence behavior. The main release checks should be run on a frozen production build.

## Visual findings and changes

The first review exposed a duplicated large page heading in the discovery route. Component headings were reduced to compact h2 introductions under the application's single h1. The revised view places the scale workshop much earlier in the page.

The workshop, zero-error close-up, parallax explanation, calibration table and six history chapters remained legible in the reviewed desktop capture. Warm surfaces and dark green/ink text were visually coherent. The broad discovery overview communicates relative spacing; it is explicitly not the fine-resolution reading microscope. The latter is in the main measuring workspace.

A discovery button originally rounded a continuous position to the next lattice point while labeled “advance by one least count.” That was corrected to add exactly one LC to the current position, preserving its fractional phase. A direct keyboard step was observed to retain honest off-lattice feedback.

Anatomy's annotation points and part outlines come from the same definitions as the hero model. Selecting a rear step face switches to the rear illustration, and the selected explanation names the reference and probing roles separately. The illustration is labeled as a teaching model rather than a certified instrument drawing.

## Contrast and semantic checks

The ratios below use the WCAG relative-luminance formula for the stated opaque colors. They are targeted checks, not an automated full-page accessibility certificate.

| Pair | Ratio | Interpretation |
| --- | ---: | --- |
| Body text `#4b5b53` on anatomy detail panel `#eef1e8` | 6.29:1 | Above 4.5:1 normal-text threshold |
| Selected button white on `#356b67` | 6.09:1 | Above 4.5:1 normal-text threshold |
| Main ink `#22313c` on ivory `#f7f3e9` | 12.05:1 | Above 4.5:1 normal-text threshold |
| Muted heading `#54665d` on `#fffdf8` | 6.01:1 | Above 4.5:1 normal-text threshold |
| Focus ring `#356b67` against ivory `#f7f3e9` | 5.49:1 | Above 3:1 non-text threshold |

React server rendering also completed for Discover, assembled Anatomy, maximum-travel exploded Anatomy and a conceptual question. The components introduce no nested `main` landmark. Discovery labels, slider names, fieldset/legend, external-source links, selected component buttons, and feedback roles were present in the browser accessibility tree. A browser accessibility tree is **not** a test with a real screen reader.

## Automated learning tests

`tests/unit/learning.test.ts` contains five passing tests covering deterministic objective replay, all mixed objectives, plate-representable bounded zero errors, genuine plate transfer, conceptual answer-option integrity, and separate misconception/completion tracking. At the time of this review, the complete project test command reported **93 passing tests across 8 files**; use the final release report for the final count after later changes.

## Evidence files

- `evidence/precision-discover-review.jpg`: complete discovery route, including the 0.02 mm experiment, signed zero correction, parallax, calibration and history.
- `evidence/precision-anatomy-exploded-review.jpg`: explanatory exploded drawing in its page context.
- `evidence/precision-anatomy-complete-review.jpg`: assembled anatomy guide and its component controls.

These are actual browser captures of the isolated rebuild. No image has been edited to imply an unavailable rendering capability.

## Not measured or not validated

- Phone/tablet touch-device operation: **Not Measured** by this focused review.
- Browser 200% zoom: **Not Validated** here; attempted keyboard zoom did not change the viewport or pixel ratio, so it is not recorded as a pass.
- Screen-reader task completion: **Not Validated**.
- Actual classroom display/viewing-distance legibility: **Not Validated**.
- Student learning effectiveness and 90-second first-task target: **Not Validated**; see `PILOT_PROTOCOL.md`.
- 3D metal realism, surface-lens quality, physical GPU performance and thermal behavior: **Not Measured** by this review.

