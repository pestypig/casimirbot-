import type {
  AstronomyCatalogFrameState,
  AstronomyFrameEdge,
  AstronomyFrameLayerV1,
  AstronomyFrameNode,
  AstronomyFrameRealizationId,
  AstronomyReferenceFrameId,
} from "../../../shared/contracts/astronomy-frame.v1";
import {
  ASTRONOMY_FRAME_LAYER_CONTRACT_VERSION,
} from "../../../shared/contracts/astronomy-frame.v1";

type HiddenAnchor = {
  id: string;
  label: string;
  frame_realization: AstronomyFrameRealizationId;
};

const FRAME_NODES: AstronomyFrameNode[] = [
  {
    id: "frame:ICRS",
    kind: "frame",
    label: "International Celestial Reference System",
    frame_id: "ICRS",
  },
  {
    id: "frame:ICRF3_radio",
    kind: "frame",
    label: "ICRF3 radio realization",
    frame_id: "ICRF3_radio",
    frame_realization: "ICRF3_S/X",
  },
  {
    id: "frame:Gaia_CRF3_optical",
    kind: "frame",
    label: "Gaia-CRF3 optical realization",
    frame_id: "Gaia_CRF3_optical",
    frame_realization: "Gaia_CRF3",
  },
  {
    id: "frame:BCRS_TCB_epoch",
    kind: "frame",
    label: "BCRS epoch state in TCB",
    frame_id: "BCRS_TCB_epoch",
    frame_realization: "BCRS_TCB_epoch_2016p0",
  },
  {
    id: "render:sol_centered_accordion",
    kind: "render_view",
    label: "Sol-centered accordion render view",
    frame_id: "sol_centered_accordion_render",
    frame_realization: "NHM2_sun_centered_accessibility",
  },
];

const HIDDEN_ANCHORS: HiddenAnchor[] = [
  { id: "anchor:3C273", label: "3C 273", frame_realization: "ICRF3_S/X" },
  { id: "anchor:J0237+2848", label: "J0237+2848", frame_realization: "ICRF3_S/X" },
  { id: "anchor:Gaia-CRF3-QSO-1", label: "Gaia-CRF3 QSO 1", frame_realization: "Gaia_CRF3" },
];

export const getAstronomyReferenceFrameNodes = (): AstronomyFrameNode[] =>
  FRAME_NODES.map((node) => ({ ...node }));

export const getHiddenReferenceAnchors = (): HiddenAnchor[] =>
  HIDDEN_ANCHORS.map((anchor) => ({ ...anchor }));

const objectNodeIdFor = (entry: AstronomyCatalogFrameState): string => `catalog:${entry.id}`;
const epochNodeIdFor = (entry: AstronomyCatalogFrameState): string =>
  `epoch:${entry.id}:${entry.reference_epoch_tcb_jy ?? "unknown"}`;

export const buildAstronomyFrameLayer = (args: {
  catalog: AstronomyCatalogFrameState[];
  propagatedIds: string[];
  canonicalFrameId?: AstronomyReferenceFrameId;
}): AstronomyFrameLayerV1 => {
  const propagated = new Set(args.propagatedIds);
  const nodes: AstronomyFrameNode[] = [...getAstronomyReferenceFrameNodes()];
  const edges: AstronomyFrameEdge[] = [
    { id: "edge:icrf3:realizes:icrs", type: "realizes_frame", from: "frame:ICRF3_radio", to: "frame:ICRS" },
    { id: "edge:gaiacrf3:realizes:icrs", type: "realizes_frame", from: "frame:Gaia_CRF3_optical", to: "frame:ICRS" },
    { id: "edge:bcrs:realizes:icrs", type: "realizes_frame", from: "frame:BCRS_TCB_epoch", to: "frame:ICRS" },
    { id: "edge:render:transforms:icrs", type: "transforms_to_render", from: "frame:ICRS", to: "render:sol_centered_accordion" },
  ];

  for (const anchor of getHiddenReferenceAnchors()) {
    nodes.push({
      id: anchor.id,
      kind: "anchor",
      label: anchor.label,
      frame_id: anchor.frame_realization === "Gaia_CRF3" ? "Gaia_CRF3_optical" : "ICRF3_radio",
      frame_realization: anchor.frame_realization,
      provenance_class: "observed",
      hidden: true,
    });
    edges.push({
      id: `edge:${anchor.id}:anchored_by:${anchor.frame_realization}`,
      type: "anchored_by",
      from: anchor.frame_realization === "Gaia_CRF3" ? "frame:Gaia_CRF3_optical" : "frame:ICRF3_radio",
      to: anchor.id,
    });
  }

  const sortedCatalog = [...args.catalog].sort((left, right) => left.id.localeCompare(right.id));
  for (const entry of sortedCatalog) {
    const objectNodeId = objectNodeIdFor(entry);
    const epochNodeId = epochNodeIdFor(entry);
    nodes.push({
      id: objectNodeId,
      kind: "catalog_object",
      label: entry.label ?? entry.id,
      frame_id: entry.frame_id,
      frame_realization: entry.frame_realization,
      provenance_class: entry.provenance_class,
    });
    nodes.push({
      id: epochNodeId,
      kind: "epoch",
      label: `Epoch ${entry.reference_epoch_tcb_jy ?? "unknown"} TCB`,
      frame_id: "BCRS_TCB_epoch",
      frame_realization: "BCRS_TCB_epoch_2016p0",
    });
    edges.push({
      id: `edge:${epochNodeId}:to:${objectNodeId}`,
      type: "epoch_propagates_to",
      from: epochNodeId,
      to: objectNodeId,
    });
    if (propagated.has(entry.id)) {
      edges.push({
        id: `edge:${objectNodeId}:to:render:${entry.id}`,
        type: "transforms_to_render",
        from: objectNodeId,
        to: "render:sol_centered_accordion",
      });
    }
  }

  return {
    contractVersion: ASTRONOMY_FRAME_LAYER_CONTRACT_VERSION,
    canonical_frame_id: args.canonicalFrameId ?? "ICRS",
    render_frame_id: "sol_centered_accordion_render",
    hidden_anchor_count: HIDDEN_ANCHORS.length,
    nodes,
    edges,
  };
};

