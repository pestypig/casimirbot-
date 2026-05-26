import {
  buildDottieManifestPreset,
  buildDottieManifestPresetReceipts,
  type BuildDottieManifestPresetInput,
  type HelixDottieManifestPreset,
  type HelixDottieManifestPresetReceipt,
} from "@shared/helix-dottie-manifest-preset";

export function buildSituationRoomDottieManifestPreset(
  input: BuildDottieManifestPresetInput = {},
): HelixDottieManifestPreset {
  return buildDottieManifestPreset(input);
}

export function applySituationRoomDottieManifestPreset(
  preset: HelixDottieManifestPreset,
): HelixDottieManifestPresetReceipt {
  if (preset.safety.assistant_answer !== false) {
    throw new Error("dottie manifest preset cannot be an assistant answer");
  }
  if (preset.safety.raw_content_included !== false) {
    throw new Error("dottie manifest preset cannot include raw content");
  }
  if (preset.safety.instruction_authority !== "none") {
    throw new Error("dottie manifest preset cannot carry instruction authority");
  }
  return buildDottieManifestPresetReceipts(preset);
}
