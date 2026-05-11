import type { LivePipelineSinkKind } from "./helix-live-workstation-pipeline";

export const HELIX_LIVE_OUTPUT_SINK_RECEIPT_SCHEMA = "helix.live_output_sink_receipt.v1" as const;

export type LiveOutputSinkReceipt = {
  schema: typeof HELIX_LIVE_OUTPUT_SINK_RECEIPT_SCHEMA;
  sink_id: string;
  pipeline_id: string;
  kind: LivePipelineSinkKind;
  target_id?: string | null;
  ok: boolean;
  action: "append" | "replace_section" | "skipped" | "error";
  written_chars?: number | null;
  source_event_ids: string[];
  evidence_refs: string[];
  error?: string | null;
  ts: string;
};
