# CFP-1 desktop media and WASM byte crosswalk — 2026-09-19

Status: read-only inspection at HEAD `256554ca2637b2978a83616d9f9670069fdfd8c4`, with uncommitted documentation changes. The local `dist/public` and `apps/desktop/runtime/dist/public` directories are **not** a frozen, signed release cohort; HEAD is the inspection revision, not proof of which commit built either directory. This is source-byte evidence for R-ASSET-01, not an authorship finding, redistribution permission, complete SBOM or final-installer inventory. The [per-file CSV](2026-09-19-desktop-media-byte-crosswalk-13.csv) records each inspected path, byte length, SHA-256, matched local input and staged-runtime comparison.

## Observed candidate assets

`apps/desktop/scripts/stage-runtime.mjs` copies `dist/public` into the desktop runtime. Of 636 files in the inspected local `dist/public` tree, this crosswalk selects the 100 files with PNG, SVG, GLB, WAV, WASM, WOFF, WOFF2 or TTF extensions. All 100 have the same relative path and SHA-256 in the inspected staged-runtime tree. Their exact bytes also match one of the following local inputs:

| Byte-matched input class | Files | What the match establishes |
| --- | ---: | --- |
| `client/public` | 36 | A same-byte source file under the client public tree, including icons, scene/model and sound assets. It does not identify the creator, commission, license or permission to redistribute. |
| `node_modules/katex/dist/fonts` | 59 | The bundled font bytes match local KaTeX package fonts. Installed package metadata reports KaTeX `0.16.45`, `MIT`, and a `LICENSE` file; selected artifact notices and exact upstream provenance still need review. |
| `node_modules/web-tree-sitter`, `tree-sitter-typescript`, `tree-sitter-javascript` | 5 | Four copied parser WASM files plus one Vite-hashed web-tree-sitter WASM output match local package bytes. Installed metadata reports versions `0.25.10`, `0.23.2` and `0.25.0`, respectively, with `MIT` and local `LICENSE` files. This is not a shipped-license check. |

The 100 files comprise 24 SVGs, four PNGs, three GLBs, five WAVs, five WASMs and 59 fonts. The CSV's `rights_state=review_required` applies to **every** row; a byte match to `client/public` or a package is not a rights grant. The raw `public/` tree, JavaScript/CSS bundles, vendor Plotly/map code, Electron/ASAR dependencies, native libraries and separately provisioned Minecraft companions are outside this crosswalk. A future build may add, remove or transform assets, so CFP-3 must inventory the selected signed installer and separately provisioned profile anew.

## Reviewer and distribution handoff

For the 36 `client/public` rows, the asset owner supplies creator/origin, any outside contribution or commission record, permitted commercial redistribution and required attribution per selected item. For the 64 package-derived rows, the rights reviewer maps actual package versions and texts to bundled bytes and required notices. CFP-3.DISTRIBUTION then records include/exclude decisions, final installer paths and notice locations; any exclusion is a reviewed packaging change, not an inference from unused UI code. R-MAP-01 and the broader bundled-code/native SBOM remain separate. R-ASSET-01 stays open until the reviewer accepts the selected artifact's complete asset and notice map.

No source, build, runtime, package, installer, feed or production setting was changed for this inspection.
