# Piece-Wise Fashion Generator (Essence + Garment)

Piece-aware fashion flow (cape, shirt, pants) that normalizes to canonical templates, generates 4 looks, and drives palette -> stitch grid -> export through Essence envelopes.

## Canonical templates (1 px = 1 stitch)
- Files: `templates/fashion/{cape,shirt,pants}/template.json` plus a blank PNG matching the canvas.
- JSON stores `canvas`, `bleed`, `anchors`, `regions` (polygons). PNG is a flat blank used for warps and previews.
- Example `templates/fashion/cape/template.json`:
```
{
  "id": "cape.short_shoulder.v1",
  "canvas": [2048, 1536],
  "bleed": 0.05,
  "anchors": {
    "neck_center": [1024, 180],
    "shoulder_L": [640, 220],
    "shoulder_R": [1408, 220],
    "front_center": [1024, 400],
    "back_center": [1024, 320]
  },
  "regions": [
    {"id": "cape_body", "polygon": [[300,240],[1748,240],[1800,880],[248,880]]},
    {"id": "collar_band", "polygon": [[760,160],[1288,160],[1250,220],[798,220]]},
    {"id": "edge_rim", "polygon": [[260,220],[1788,220],[1830,900],[216,900]]}
  ]
}
```
- Size guides (calibrate with swatch later):
  - Cape: canvas 2048x1536, bleed 5%. Width {S:44 cm, M:47 cm, L:50 cm}, depth {26,28,30 cm}.
  - Shirt front: canvas 1536x2048; regions front_body, placket, collar, yoke, pocket?; anchors CF, shoulder_L/R, armhole_L/R, hem_center; bleed 3-5%.
  - Pants front: canvas 2048x2048; regions waistband, left_leg_front, right_leg_front, fly/placket; anchors waist_center, hip_L/R, knee_L/R, hem_L/R; bleed 3-5%.

## Pipeline (piece-scoped)
- Inputs: influence set (e.g., `["space-baroque","goldwork","noir"]`), sketch (motif borders and seams), editorial source. Local paths are fine (`/mnt/data/sunvax mood board.jpg`).
- Path A - Cape: segment -> crop cape -> thin-plate-spline normalize to template (snap collar to `collar_band`) -> 4 looks -> select -> palette -> stitch grid -> export.
- Path B - Shirt: segment torso (mask sleeves if front-only) -> homography using CF, shoulder_L/R, hem_center; straighten placket vertical -> 4 looks -> palette -> stitch grid -> export.
- Path C - Pants: segment pants; split left/right fronts plus waistband/fly -> align waistline horizontal, knees mid-height, hems level; warp to polygons -> 4 looks -> palette -> stitch grid -> export.
- Quality gates: normalize first (never run 4-looks on full outfit), symmetry clamp +/-2% on shirt/pants, 2-3 px opaque edge band in masks, enforce bleed, palette preview with delta E.

## API surface (when `ENABLE_ESSENCE=1`)
- `POST /api/fashion/pieces/:piece/looks`
  - Accepts upload `image` or JSON `image_url`; optional `sketch_url`, `style_hint`, `tags`, `template_id`.
  - Internals: segment -> normalize to template -> call `gpt-image-1` edits with mask (garment opaque, background transparent) -> persist 4 envelopes.
  - Response: `{ looks: [{ essence_id, uri, piece, template_id }, ...] }`.
- `POST /api/fashion/pieces/:piece/normalize`
  - Body: `{ essence_id | image_url | upload image, template_id }`.
  - Returns `{ normalized_image_uri, mask_uri }`, persists normalized envelope.
- Palette / stitch / export wrappers carry piece + template forward:
  - `POST /api/fashion/palette`
  - `POST /api/fashion/stitchgrid`
  - `POST /api/fashion/export-pack`
- Envelope additions:
```
"features": {
  "piece": { "type": "cape|shirt|pants", "template_id": "cape.short_shoulder.v1" },
  "image": { "mask_uri": "file://...", "width": 2048, "height": 1536 },
  "knit"?: { "palette_map": [...], "stitchgrid_uri": "...", "gauge": {...} }
}
```

## Prompt builder
```ts
function piecePrompt(piece: "cape"|"shirt"|"pants", style: string) {
  const base = "Isolate onto a pure white design template, laid flat, top-facing. Preserve garment pixels and edges, normalize lighting.";
  const intent = {
    cape:  "Short shoulder cape; no body, no mannequin; space-baroque floral + gold filigree.",
    shirt: "Shirt front panel with collar and placket visible; no sleeves if targeting front-only.",
    pants: "Pants front, waistband and fly visible; legs parallel; no shoes/feet."
  }[piece];
  return `${intent} ${base} ${style ? `Style: ${style}` : ""}`;
}
```

## Normalization service
- Segmentation: start with `rembg`; later swap for garment-class segmenter to distinguish pieces.
- Warp:
  - Cape: find contour -> symmetry axis -> thin-plate-spline into `cape_body`; snap collar into `collar_band`.
  - Shirt/Pants: affine or homography using anchors (shirt: CF + shoulders + hem; pants: waist/hips/knees/hems).
- Pseudo:
```ts
const mask = await segment(input);
const bbox = pieceBBoxFromMask(mask, pieceType);
const warped = warpToTemplate(input, mask, templates[pieceType]);
return { normalized: warped.image, mask: warped.mask };
```
- Keep 1 px = 1 stitch; store width/height in envelope.

## UI wiring (Essence console + Garment panel)
- Essence console:
  - Choose piece + template.
  - Upload or paste `image_url`.
  - Generate Looks (4) via `/api/fashion/pieces/:piece/looks`.
  - Select -> mark envelope `role:"selected"` with piece metadata -> open Garment panel.
- Garment panel:
  - Loads selected look for active project.
  - Gauge wizard -> Palette wizard -> Stitch grid -> Export pack.
  - Each action writes an Essence envelope carrying `features.piece.template_id`.
- Helix entry: add `fashion-lookbook` in `client/src/pages/helix-core.panels.ts` pointing to `client/src/components/essence/FashionLookbook.tsx`. Declare endpoints: `/pieces/:piece/looks`, `/pieces/:piece/normalize`, `/palette`, `/stitchgrid`, `/export-pack`.

## Gauge and stitch mapping
- User inputs swatch counts: e.g., `40 stitches = 10 cm`, `56 courses = 10 cm`.
- Compute NPI/CPI, then target: `stitches_w = round((width_cm/2.54) * NPI)`, `courses_h = round((height_cm/2.54) * CPI)`.
- Garment panel snaps canvas to that grid; write gauge into `features.knit.gauge`.

## Example calls
- Cape looks (local path):
```
curl -X POST http://localhost:3000/api/fashion/pieces/cape/looks \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "/mnt/data/sunvax mood board.jpg",
    "style_hint": "space-baroque; floral enamel; gold filigree",
    "template_id": "cape.short_shoulder.v1"
  }'
```
- Palette -> stitch -> export after selection:
```
curl -X POST http://localhost:3000/api/fashion/palette \
  -H "Content-Type: application/json" \
  -d '{"essence_id":"<SELECTED_CAPE_ID>","yarn_set_id":"lab-6","max_colors":6,"dither":"floyd-steinberg"}'

curl -X POST http://localhost:3000/api/fashion/stitchgrid \
  -H "Content-Type: application/json" \
  -d '{"essence_id":"<PALETTE_ID>","gauge":12,"width_st":320,"height_crs":220,"structure_map":[{"region":"cape_body","structure":"jacquard"}]}'

curl -X POST http://localhost:3000/api/fashion/export-pack \
  -H "Content-Type: application/json" \
  -d '{"essence_id":"<STITCHGRID_ID>","gauge":{"gg":12},"target":{"stitches_w":320,"courses_h":220},"palette":[{"name":"ivory","rgb":[235,231,220],"carrier":"1"}]}'
```
- Repeat for `/pieces/shirt/looks` and `/pieces/pants/looks` with their template IDs.

## Implementation checklist
- Templates: add JSON + blank PNG per piece; loader helper in `server/services/fashion/templates.ts` with caching and validation; optional `FASHION_TEMPLATE_DIR`.
- Routes: add `server/routes/fashion.ts` mounting `/api/fashion/pieces/:piece/looks` and `/normalize`, plus palette/stitch/export wrappers that stamp piece/template into features. Use `putBlob`, `putEnvelope`, `essenceHub.emit("created")`.
- Tools: register AGI tool `image.openai.looks` in `server/routes/agi.plan.ts` (mirrors `vision.http.describe` and `luma.generate` pattern).
- Env: add `IMAGE_LOOKS_MODEL=gpt-image-1` to `.env.example`; rely on `OPENAI_API_KEY`.
- UI: add `fashion-lookbook` panel and wire the Garment panel; include a gauge helper util to compute NPI/CPI and store in envelopes.
