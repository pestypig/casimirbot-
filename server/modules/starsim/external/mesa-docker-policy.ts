import { z } from "zod";

export const mesaDockerPolicySchema = z.object({
  dockerImage: z.string().min(1),
  dockerImageDigest: z.string().optional(),
  workingDirectory: z.string().optional(),
  outputDirectory: z.string().optional(),
});

export type MesaDockerPolicy = z.infer<typeof mesaDockerPolicySchema>;

export function validateMesaDockerPolicy(value: unknown): MesaDockerPolicy {
  return mesaDockerPolicySchema.parse(value);
}
