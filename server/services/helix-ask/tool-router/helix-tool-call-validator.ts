import type { HelixRuntimeToolCallV1 } from "@shared/helix-agent-step-observation-packet";
import type { HelixToolSurfacePacket } from "@shared/helix-tool-surface";

export type HelixToolRouterContext = {
  explicitAttachmentAvailable?: boolean;
  confirmationGranted?: boolean;
  explicitUserInstruction?: boolean;
};

const schemaRequiredArgs = (schema: Record<string, unknown>): string[] =>
  Array.isArray(schema.required)
    ? schema.required.map((entry) => String(entry ?? "").trim()).filter(Boolean)
    : [];

export const validateHelixRouterToolCall = (
  call: HelixRuntimeToolCallV1,
  surface: HelixToolSurfacePacket,
  context: HelixToolRouterContext = {},
): HelixRuntimeToolCallV1 => {
  const entry = surface.entries.find((candidate) => candidate.capability_key === call.capability_key) ?? null;
  const violations: string[] = [];
  if (!entry) {
    violations.push("capability_not_in_surface_packet");
  } else {
    for (const required of schemaRequiredArgs(entry.input_schema)) {
      const value = call.args[required];
      if (value === undefined || value === null || value === "") violations.push(`missing_arg:${required}`);
    }
    if (entry.manual_only && !context.explicitUserInstruction) violations.push("manual_only_requires_explicit_user_instruction");
    if (entry.explicit_attachment_only && !context.explicitAttachmentAvailable) {
      violations.push("explicit_attachment_missing");
    }
    if (entry.confirmation_required && !context.confirmationGranted) violations.push("confirmation_required");
    if (entry.mutating && !context.confirmationGranted && !context.explicitUserInstruction) {
      violations.push("mutating_action_requires_confirmation_or_explicit_instruction");
    }
  }
  return {
    ...call,
    validation: {
      ok: violations.length === 0,
      violations,
      ...(violations.length > 0 ? { repair_hint: violations[0] } : {}),
    },
  };
};
