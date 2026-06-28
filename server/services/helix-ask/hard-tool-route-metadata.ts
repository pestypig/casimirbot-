import { z } from "zod";

export const HardToolBackendEntrypointRouteMetadataSchema = z
  .object({
    schema: z.string().min(1).optional(),
    source: z.literal("hard_tool_backend_entrypoint").optional(),
    sourceTarget: z.string().min(1).optional(),
    source_target: z.string().min(1).optional(),
    requiredToolFamily: z.string().min(1).optional(),
    required_tool_family: z.string().min(1).optional(),
    source_target_intent: z.record(z.unknown()).optional(),
    mandatory_next_tool: z.record(z.unknown()).optional(),
  })
  .passthrough()
  .refine(
    (value) =>
      value.source === "hard_tool_backend_entrypoint" ||
      Boolean(value.requiredToolFamily || value.required_tool_family || value.mandatory_next_tool),
    {
      message: "hard tool route metadata must identify a hard entrypoint or mandatory tool",
      path: ["source"],
    },
  );

export type HardToolBackendEntrypointRouteMetadata = z.infer<
  typeof HardToolBackendEntrypointRouteMetadataSchema
>;

export const readHardRouteRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

export const readHardRouteText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const readHardToolBackendEntrypointRouteMetadata = (
  value: unknown,
): HardToolBackendEntrypointRouteMetadata | null => {
  const parsed = HardToolBackendEntrypointRouteMetadataSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  const record = readHardRouteRecord(value);
  if (!record) return null;
  const targetSource =
    readHardRouteText(record.target_source) ??
    readHardRouteText(record.targetSource) ??
    readHardRouteText(record.target_kind) ??
    readHardRouteText(record.targetKind);
  const hardSourceTargetIntent =
    (readHardRouteText(record.schema) === "helix.ask_source_target_intent.v1" ||
      record.must_enter_backend_ask === true ||
      record.allow_no_tool_direct === false) &&
    Boolean(targetSource);
  if (!hardSourceTargetIntent) return null;
  const candidate = {
    schema: "helix.ask.route_metadata.v1",
    source: "hard_tool_backend_entrypoint",
    sourceTarget: targetSource,
    requiredToolFamily:
      targetSource === "calculator_stream"
        ? "calculator"
        : targetSource === "docs_viewer" || targetSource === "active_doc"
        ? "docs_viewer"
        : targetSource === "repo_code"
        ? "repo_code"
        : targetSource === "internet_search"
        ? "internet_search"
        : targetSource === "workspace_diagnostic"
        ? "workspace_directory"
        : targetSource === "live_environment" || targetSource === "live_source_mailbox"
        ? "live_env"
        : undefined,
    source_target_intent: record,
    mandatory_next_tool: readHardRouteRecord(record.mandatory_next_tool) ?? undefined,
  };
  const candidateParsed = HardToolBackendEntrypointRouteMetadataSchema.safeParse(candidate);
  return candidateParsed.success ? candidateParsed.data : null;
};

export const readHardToolRouteMetadataFromSources = (
  ...sources: unknown[]
): HardToolBackendEntrypointRouteMetadata | null => {
  for (const source of sources) {
    const direct = readHardToolBackendEntrypointRouteMetadata(source);
    if (direct) return direct;
    const record = readHardRouteRecord(source);
    const nested =
      readHardToolBackendEntrypointRouteMetadata(record?.route_metadata) ??
      readHardToolBackendEntrypointRouteMetadata(record?.routeMetadata) ??
      readHardToolBackendEntrypointRouteMetadata(record?.source_target_intent) ??
      readHardToolBackendEntrypointRouteMetadata(record?.sourceTargetIntent);
    if (nested) return nested;
  }
  return null;
};

export const readHardToolMandatoryNextTool = (
  metadata: HardToolBackendEntrypointRouteMetadata | null | undefined,
): Record<string, unknown> | null => {
  const record = readHardRouteRecord(metadata);
  if (!record) return null;
  const direct = readHardRouteRecord(record.mandatory_next_tool);
  if (direct) return direct;
  const sourceTargetIntent = readHardRouteRecord(record.source_target_intent);
  return readHardRouteRecord(sourceTargetIntent?.mandatory_next_tool);
};

export const readHardToolSelectedCapability = (
  metadata: HardToolBackendEntrypointRouteMetadata | null | undefined,
): string | null => {
  const mandatoryNextTool = readHardToolMandatoryNextTool(metadata);
  return (
    readHardRouteText(mandatoryNextTool?.tool_name) ??
    readHardRouteText(mandatoryNextTool?.selected_capability) ??
    readHardRouteText(mandatoryNextTool?.capability) ??
    readHardRouteText(mandatoryNextTool?.required_capability) ??
    null
  );
};

export const isHardCalculatorRouteMetadata = (
  metadata: HardToolBackendEntrypointRouteMetadata | null | undefined,
): boolean => {
  const record = readHardRouteRecord(metadata);
  if (!record) return false;
  const sourceTargetIntent = readHardRouteRecord(record.source_target_intent);
  const mandatoryNextTool = readHardToolMandatoryNextTool(metadata);
  const family =
    readHardRouteText(record.requiredToolFamily) ??
    readHardRouteText(record.required_tool_family);
  const target =
    readHardRouteText(record.sourceTarget) ??
    readHardRouteText(record.source_target) ??
    readHardRouteText(sourceTargetIntent?.target_source) ??
    readHardRouteText(sourceTargetIntent?.targetSource) ??
    readHardRouteText(sourceTargetIntent?.target_kind) ??
    readHardRouteText(sourceTargetIntent?.targetKind);
  const selectedCapability = readHardToolSelectedCapability(metadata);
  return (
    family === "calculator" ||
    target === "calculator_stream" ||
    /^scientific-calculator\./i.test(selectedCapability ?? "") ||
    /^calculator(?:\.|_)/i.test(readHardRouteText(mandatoryNextTool?.tool_id) ?? "")
  );
};
