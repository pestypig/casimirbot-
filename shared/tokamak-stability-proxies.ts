import { z } from "zod";

export const TokamakStabilityProxyMetrics = z.object({
  gradp_p95: z.number().nonnegative().optional(),
  gradp_edge_p95: z.number().nonnegative().optional(),
  current_p95: z.number().nonnegative().optional(),
  current_edge_p95: z.number().nonnegative().optional(),
  psi_core_fraction: z.number().min(0).max(1).optional(),
  psi_edge_fraction: z.number().min(0).max(1).optional(),
});

export type TTokamakStabilityProxyMetrics = z.infer<
  typeof TokamakStabilityProxyMetrics
>;
