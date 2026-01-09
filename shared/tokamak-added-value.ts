import { z } from "zod";
import { DerivedArtifactInformationBoundaryAudit } from "./information-boundary-derived";

export const TokamakAddedValueLeadPoint = z.object({
  threshold: z.number(),
  recall: z.number().min(0).max(1),
  false_alarms_per_hour: z.number().nonnegative(),
  lead_time_mean_s: z.number().nonnegative().optional(),
  lead_time_p50_s: z.number().nonnegative().optional(),
});

export type TTokamakAddedValueLeadPoint = z.infer<
  typeof TokamakAddedValueLeadPoint
>;

export const TokamakAddedValueFixedRecall = z.object({
  recall: z.number().min(0).max(1),
  threshold: z.number().optional(),
  false_alarms_per_hour: z.number().nonnegative().nullable(),
});

export type TTokamakAddedValueFixedRecall = z.infer<
  typeof TokamakAddedValueFixedRecall
>;

export const TokamakAddedValueModelReport = z.object({
  features: z.array(z.string()).min(1),
  auc: z.number().min(0).max(1).nullable(),
  pr_auc: z.number().min(0).max(1).nullable(),
  lead_time_curve: z.array(TokamakAddedValueLeadPoint),
  false_alarms_at_recall: TokamakAddedValueFixedRecall,
});

export type TTokamakAddedValueModelReport = z.infer<
  typeof TokamakAddedValueModelReport
>;

export const TokamakAddedValueDelta = z.object({
  auc: z.number().nullable(),
  pr_auc: z.number().nullable(),
  false_alarms_per_hour: z.number().nullable(),
});

export type TTokamakAddedValueDelta = z.infer<typeof TokamakAddedValueDelta>;

export const TokamakAddedValueReport = DerivedArtifactInformationBoundaryAudit.extend(
  {
    schema_version: z.literal("tokamak_added_value_report/1"),
    kind: z.literal("tokamak_added_value_report"),
    generated_at_iso: z.string().datetime(),
    dataset_path: z.string().optional(),
    report_hash: z.string().min(8),
    recall_target: z.number().min(0).max(1),
    physics_only: TokamakAddedValueModelReport,
    combined: TokamakAddedValueModelReport,
    delta: TokamakAddedValueDelta,
  },
);

export type TTokamakAddedValueReport = z.infer<typeof TokamakAddedValueReport>;
