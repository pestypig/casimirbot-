import type { TEssenceEnvelope } from "@shared/essence-schema";
import { putEnvelope } from "../services/essence/store";

type PolicyError = { type?: string };

export async function putEnvelopeWithPolicy(
  envelope: TEssenceEnvelope,
): Promise<void> {
  try {
    await putEnvelope(envelope);
  } catch (err) {
    if (err && typeof err === "object") {
      const tagged = err as PolicyError;
      if (!tagged.type) {
        tagged.type = "provenance_missing";
      }
      throw err;
    }
    const wrapped = new Error(err ? String(err) : "provenance missing") as PolicyError;
    wrapped.type = "provenance_missing";
    throw wrapped;
  }
}
