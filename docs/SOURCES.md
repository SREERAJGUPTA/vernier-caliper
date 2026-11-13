# Source notes and original learning assets

Checked 13 November 2026. These notes are included in the downloadable project so the basic provenance remains available offline. The application makes no request to these sources until a reader chooses an external reference link. Text and illustrations in the application were written or drawn for this rebuild; external figures and photographs were not copied.

## Primary manufacturer and metrology sources

| Source | Where it informs Precision Lab | Scope and qualifications |
| --- | --- | --- |
| [Mitutoyo, Quick Guide to Precision Measuring Instruments](https://www2.mitutoyo.co.jp/eng/products/menu/quick_guide.pdf), caliper section, printed pages 20–22 | Main/Vernier construction; outside, inside, depth and step technique; parallax; zero checking; terminology | A generic teaching caliper inspired by four-way instrument practice, not a certified replica. The publication also documents different encoder technologies; the lesson does not claim that all digital calipers use one sensing mechanism. |
| [Mitutoyo, General notes on use of caliper](https://www2.mitutoyo.co.jp/eng/useful/E11003/pageindices/index23.html) | Parallax from the height difference between scale planes; measuring pressure; inside alignment | The parallax workshop uses actual model plane separation of 0.3 mm and the orthographic, parallel-ray relation Δx = −h tan θ. Oblique projection does not alter physical tick positions. |
| [Mitutoyo, Basic Rules on Using Measuring Tools](https://dev.mitutoyo.com/webfoo/wp-content/uploads/7002-Basic-Rules-on-Using-Measuring-Tools.pdf), caliper depth/step diagrams | Flush reference contact; reading from the front | The contact engine deliberately restricts supported fixture poses instead of implying that arbitrary free-body motion has been solved. |
| [Mitutoyo, Origin and Development of Calipers](https://www2.mitutoyo.co.jp/eng/support/service/catalog/08/E12029.pdf) | Caliper-like instruments predate the 1631 Vernier publication; development into manufacturing instruments | The pupil lesson avoids assigning an unsupported single inventor to all calipers. Its first chapter is an original thought experiment, not a reconstruction of a specific archaeological artifact. |
| [JCGM, International Vocabulary of Metrology, §2.39 Calibration](https://jcgm.bipm.org/vim/en/2.39.html) | Separating zero checking, numerical correction, calibration and adjustment | Calibration relates indications to reference quantity values with uncertainties; it is not synonymous with adjustment. The teaching table is an idealized mathematical example, not a calibration certificate or a complete physical procedure. |
| [JCGM VIM, §2.13 Measurement accuracy](https://jcgm.bipm.org/vim/en/2.13.html), [§2.21 Measurement repeatability](https://jcgm.bipm.org/vim/en/2.21.html), [§4.14 Resolution](https://jcgm.bipm.org/vim/en/4.14.html) | Distinguishing resolution, closeness to a reference, and agreement of repeated readings | The classroom wording is simplified; least count is a scale-construction quantity, not proof of physical accuracy or a complete uncertainty budget. |

## History sources and boundaries

[“Pierre Vernier (c. 1580–1637),” International Hydrographic Review](https://journals.lib.unb.ca/index.php/ihr/article/download/28565/1882521320/1882521568), pp. 1–2, describes Nunes's 1542 nonius and Vernier's 1631 publication on a quadrant. It describes the former as several differently divided concentric arcs and the latter as a movable auxiliary scale. It is a historical published account, not a surviving original manuscript; this distinction is retained here. The instruction to rely on primary technical sources does not make this historical account an original 1542 or 1631 source. The user-provided specification explicitly names it as the historical starting point.

The two constructions are not presented as identical. Vernier is not credited with inventing all caliper-shaped tools. Earlier users are not described as incapable of interpolating between marks. The six chapters use original learning questions to connect history to the current experiment.

## Asset authorship and licenses

| Asset/module | Origin | License / handling |
| --- | --- | --- |
| `src/learning/Discover.tsx`: history drawings, scale workshop, parallax and zero-error SVG | Original code-authored vector drawings for this rebuild | Covered by this project's license; no third-party bitmap assets. Each historical illustration is labeled as a modern teaching reconstruction. |
| `src/learning/Anatomy.tsx` | Original SVG composition from `PART_OUTLINES`, `PART_ANCHORS` and common scale descriptors | Shares instrument geometry with the procedural 3D model. No manufacturer drawing is copied. |
| `src/learning/history.ts`, `tasks.ts` | Original wording and deterministic learning-task definitions | Source links establish factual context; the source publications are not redistributed. |
| Fonts | Deliberate system serif/sans-serif stacks | No font is downloaded by the runtime and no font binary is distributed. |

For rendering-specific geometry, lighting assets, and dependency licenses, see `ASSET_MODEL.md` and the root license inventory.

## Deliberate educational models

The bench uses a rigid caliper guide and rigid specimens. The error model shifts the Vernier engraving pattern by a signed additive offset; it does not deform the jaws. The discovery calibration table can optionally add a 0.1% scale factor error **only to its explanatory table**, to show why checking zero alone is insufficient. It does not mutate the active instrument, and the extra digits are mathematical values, not a claim about readable physical precision.

The discovery overview preserves true relative spacing but is not the high-magnification reading microscope. The main reading workspace supplies the precision local crop. Anatomical explosion is an explanatory pose; the assembled mechanical state is retained separately and restored unchanged.
