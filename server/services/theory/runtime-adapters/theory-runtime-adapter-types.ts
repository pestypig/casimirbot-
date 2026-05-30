import type { TheoryRuntimeMathTraceV1 } from "../../../../shared/contracts/theory-runtime-math-trace.v1";
import type { TheoryRuntimeReceiptV1 } from "../../../../shared/contracts/theory-runtime-receipt.v1";
import type { TheoryRuntimeRunRequestV1 } from "../../../../shared/contracts/theory-runtime-run-request.v1";

export const THEORY_RUNTIME_ADAPTER_CAPABILITY_VALUES = [
  "static_reference",
  "artifact_reader",
  "quick_runtime",
  "long_job_manifest",
  "live_runtime",
] as const;

export type TheoryRuntimeAdapterCapability =
  (typeof THEORY_RUNTIME_ADAPTER_CAPABILITY_VALUES)[number];

export type TheoryRuntimeAdapterInput = {
  runtimeId?: string | null;
  family?: string | null;
  laneId?: string | null;
  badgeIds?: string[];
  graphId?: string | null;
  args?: Record<string, unknown>;
  projectRoot?: string | null;
  generatedAt?: string | null;
};

export type TheoryRuntimeAdapter = {
  runtimeId: string;
  family: string;
  laneId: string;
  capabilities: TheoryRuntimeAdapterCapability[];
  supportedBadgeIds: string[];
  canHandle: (input: TheoryRuntimeAdapterInput) => boolean;
  buildReferenceTrace?: (input: TheoryRuntimeAdapterInput) => TheoryRuntimeMathTraceV1;
  readArtifacts?: (input: TheoryRuntimeAdapterInput) => Promise<TheoryRuntimeReceiptV1>;
  runQuick?: (input: TheoryRuntimeAdapterInput) => Promise<TheoryRuntimeReceiptV1>;
  createManifest?: (input: TheoryRuntimeAdapterInput) => Promise<TheoryRuntimeRunRequestV1>;
};
