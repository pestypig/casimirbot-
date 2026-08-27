import { z } from "zod";

export const mesaG1CapacityInputSchema = z.object({
  imageReference: z.string().min(1),
  imageConfigDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  imageInstalled: z.boolean(),
  compressedLayerBytes: z.number().int().positive(),
  freeBytes: z.number().int().nonnegative(),
  minimumFreeBytes: z.number().int().positive(),
});

export type MesaG1CapacityInput = z.infer<typeof mesaG1CapacityInputSchema>;

export type MesaG1CapacityDecision = {
  pass: boolean;
  code: "PASS_RUNTIME_CAPACITY" | "INSUFFICIENT_DISK_FOR_MESA_IMAGE" | "MESA_IMAGE_NOT_INSTALLED";
  detail: string;
};

export function assessMesaG1RuntimeCapacity(raw: MesaG1CapacityInput): MesaG1CapacityDecision {
  const input = mesaG1CapacityInputSchema.parse(raw);
  if (!input.imageInstalled && input.freeBytes < input.minimumFreeBytes) {
    return {
      pass: false,
      code: "INSUFFICIENT_DISK_FOR_MESA_IMAGE",
      detail:
        `Pinned image ${input.imageReference} is absent and ${input.freeBytes} free bytes ` +
        `is below the frozen ${input.minimumFreeBytes}-byte runtime minimum.`,
    };
  }
  if (!input.imageInstalled) {
    return {
      pass: false,
      code: "MESA_IMAGE_NOT_INSTALLED",
      detail: `Pinned image ${input.imageReference} is not installed.`,
    };
  }
  return {
    pass: true,
    code: "PASS_RUNTIME_CAPACITY",
    detail: `Pinned image is installed and the frozen runtime-capacity gate is satisfied.`,
  };
}
