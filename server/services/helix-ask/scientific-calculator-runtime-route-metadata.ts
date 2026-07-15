import { z } from "zod";
import {
  THEORY_RUNTIME_CONTEXT_READ_CAPABILITY,
  THEORY_RUNTIME_EXECUTE_CAPABILITY,
  THEORY_RUNTIME_EXPLANATION_CANONICAL_GOAL,
  THEORY_RUNTIME_EXPLANATION_INVOCATION_KIND,
  THEORY_RUNTIME_EXPLANATION_PROVIDER_TERMINAL,
  THEORY_RUNTIME_EXPLANATION_ROUTE_SCHEMA,
  THEORY_RUNTIME_EXPLANATION_ROUTE_SOURCE,
  THEORY_RUNTIME_EXPLANATION_SOURCE_TARGET,
  THEORY_RUNTIME_EXPLANATION_TERMINAL_PRODUCT,
  THEORY_RUNTIME_EXPLANATION_TOOL_FAMILY,
} from "@shared/contracts/theory-runtime-explanation-route.v1";

const boundedIdentity = z.string().trim().min(1).max(512);

export const ScientificCalculatorRuntimeRouteMetadataSchema = z
  .object({
    schema: z.literal(THEORY_RUNTIME_EXPLANATION_ROUTE_SCHEMA),
    source: z.literal(THEORY_RUNTIME_EXPLANATION_ROUTE_SOURCE),
    invocationKind: z.literal(THEORY_RUNTIME_EXPLANATION_INVOCATION_KIND),
    sourceTarget: z.literal(THEORY_RUNTIME_EXPLANATION_SOURCE_TARGET),
    requiredCanonicalGoal: z.literal(THEORY_RUNTIME_EXPLANATION_CANONICAL_GOAL),
    allowedCapabilities: z.tuple([z.literal(THEORY_RUNTIME_CONTEXT_READ_CAPABILITY)]),
    forbiddenCapabilities: z.tuple([z.literal(THEORY_RUNTIME_EXECUTE_CAPABILITY)]),
    evidenceRefs: z.tuple([boundedIdentity, boundedIdentity]),
    requiredToolFamily: z.literal(THEORY_RUNTIME_EXPLANATION_TOOL_FAMILY),
    requiredTerminalProductKind: z.literal(THEORY_RUNTIME_EXPLANATION_TERMINAL_PRODUCT),
    allowedTerminalProductKinds: z.tuple([
      z.literal(THEORY_RUNTIME_EXPLANATION_TERMINAL_PRODUCT),
      z.literal(THEORY_RUNTIME_EXPLANATION_PROVIDER_TERMINAL),
    ]),
    compact_context: z
      .object({
        theory_runtime_context_ref: boundedIdentity,
        request_id: boundedIdentity,
        receipt_id: boundedIdentity,
        runtime_id: z.string().trim().min(1).max(128),
        output_role: z.literal("evidence_for_synthesis"),
        terminal_eligible: z.literal(false),
        post_tool_model_step_required: z.literal(true),
      })
      .strict(),
  })
  .strict()
  .superRefine((metadata, context) => {
    const expectedRequestRef = `theory_runtime_request:${metadata.compact_context.request_id}`;
    const expectedReceiptRef = `theory_runtime_receipt:${metadata.compact_context.receipt_id}`;
    if (metadata.evidenceRefs[0] !== expectedRequestRef) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidenceRefs", 0],
        message: "runtime request evidence ref must match compact context",
      });
    }
    if (metadata.evidenceRefs[1] !== expectedReceiptRef) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidenceRefs", 1],
        message: "runtime receipt evidence ref must match compact context",
      });
    }
    const expectedContextRef =
      `theory-runtime-context:${metadata.compact_context.request_id}:${metadata.compact_context.receipt_id}`;
    if (metadata.compact_context.theory_runtime_context_ref !== expectedContextRef) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compact_context", "theory_runtime_context_ref"],
        message: "runtime context ref must bind the exact request and receipt",
      });
    }
  });

export type ScientificCalculatorRuntimeRouteMetadata = z.infer<
  typeof ScientificCalculatorRuntimeRouteMetadataSchema
>;
