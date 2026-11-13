# Reproducible original model

`src/rendering/geometry.ts` defines the original millimetre silhouettes, exact measuring pads, graduated surfaces, rear step fixtures, and merged thumb-wheel knurl. `src/rendering/Scene.tsx` builds the complete runtime hierarchy with local PBR lighting, meshes, engraving textures, materials, specimen forms, and petals. No previous Precision Lab source or model was used.

The runtime model is procedural and has no remote asset dependencies. Both its high-detail geometry and normal-resolution front view are generated from the same dimensions. All 3D markings use the exact common scale descriptors; text textures add engraved labels, not tick locations.

To export a reusable geometry snapshot, use **Node 24 or later** and run from the project root:

```sh
node assets/generation/generate-model.mjs
```

This regenerates `assets/generated/caliper-reference.obj` and `model-inventory.json`. The OBJ contains the structural and graduation meshes at the fixed 50-division example `d=23.44 mm, e=+0.04 mm`. It is a geometry reference for Blender/CAD inspection; the live renderer remains authoritative for materials, cameras, screws, numerals, specimen placement, and interactions. The OBJ is not fetched by the web app, so it does not add to offline runtime transfer.

CPU triangle and bounding-box counts are source inventory evidence. They do not establish GPU performance, rendered contact appearance, or real-device frame rates.
