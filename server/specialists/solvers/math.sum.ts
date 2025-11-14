import { createHash, randomUUID } from "node:crypto";
import type { z } from "zod";
import { SolverSpec, SolverInput, SolverOutput } from "@shared/agi-specialists";
import { EssenceEnvelope } from "@shared/essence-schema";
import { putBlob } from "../../storage";
import { putEnvelope } from "../../services/essence/store";

export const mathSumSpec = {
  name: "math.sum",
  desc: "Adds a list of numbers deterministically.",
  inputSchema: SolverInput,
  outputSchema: SolverOutput,
} satisfies z.infer<typeof SolverSpec>;

export const mathSumHandler = async (rawInput: unknown, ctx: Record<string, unknown>) => {
  const input = SolverInput.parse(rawInput);
  const numbers: number[] = Array.isArray((input.params as any)?.numbers) ? (input.params as any).numbers : [];
  const safeNumbers = numbers.map((value) => (Number.isFinite(value) ? Number(value) : 0));
  const total = safeNumbers.reduce((sum, value) => sum + value, 0);
  const summary = `sum(${safeNumbers.join(", ")}) = ${total}`;

  const personaId = typeof ctx?.personaId === "string" ? ctx.personaId : "persona:unknown";
  const now = new Date().toISOString();
  const buffer = Buffer.from(summary, "utf8");
  const blob = await putBlob(buffer, { contentType: "text/plain" });
  const digest = createHash("sha256").update(buffer).digest("hex");

  const envelope = EssenceEnvelope.parse({
    header: {
      id: randomUUID(),
      version: "essence/1.0",
      modality: "text",
      created_at: now,
      source: {
        uri: blob.uri,
        cid: blob.cid,
        original_hash: { algo: "sha256", value: digest },
        creator_id: personaId,
        license: "CC-BY-4.0",
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility: "public", groups: [] },
    },
    features: {
      text: {
        lang: input.problem.context?.lang ?? "en",
      },
    },
    provenance: {
      pipeline: [
        {
          name: "math.sum",
          impl_version: "1.0.0",
          lib_hash: { algo: "sha256", value: digest },
          params: { numbers: safeNumbers },
          input_hash: { algo: "sha256", value: createHash("sha256").update(JSON.stringify(safeNumbers)).digest("hex") },
          output_hash: { algo: "sha256", value: digest },
          started_at: now,
          ended_at: new Date().toISOString(),
        },
      ],
      merkle_root: { algo: "sha256", value: digest },
      previous: null,
      signatures: [],
    },
    embeddings: [],
  });
  await putEnvelope(envelope);

  return SolverOutput.parse({
    summary: `Computed sum ${total}`,
    data: { total, inputs: safeNumbers },
    artifacts: [{ kind: "text", uri: blob.uri, cid: blob.cid }],
    essence_ids: [envelope.header.id],
  });
};
