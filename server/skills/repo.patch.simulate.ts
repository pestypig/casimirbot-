import { z } from "zod";
import { execa } from "execa";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const RepoPatchSimulateInput = z.object({
  patch: z.string().min(1, "patch required"),
  staged: z.boolean().default(false),
  reverse: z.boolean().default(false),
});

const RepoPatchSimulateOutput = z.object({
  ok: z.boolean(),
  exitCode: z.number().int().nullable(),
  stdout: z.string(),
  stderr: z.string().optional(),
});

export const repoPatchSimulateSpec: ToolSpecShape = {
  name: "repo.patch.simulate",
  desc: "Dry-run a unified diff against the repo using git apply --check (no writes).",
  inputSchema: RepoPatchSimulateInput,
  outputSchema: RepoPatchSimulateOutput,
  deterministic: true,
  rateLimit: { rpm: 10 },
  safety: { risks: [] },
};

export const repoPatchSimulateHandler: ToolHandler = async (rawInput) => {
  const input = RepoPatchSimulateInput.parse(rawInput ?? {});
  const args = ["apply", "--check", "--verbose", "--whitespace=nowarn"];
  if (input.staged) {
    args.push("--cached");
  }
  if (input.reverse) {
    args.push("--reverse");
  }
  const child = await execa("git", args, {
    reject: false,
    input: input.patch,
  });
  return RepoPatchSimulateOutput.parse({
    ok: child.exitCode === 0,
    exitCode: child.exitCode ?? null,
    stdout: child.stdout ?? "",
    stderr: child.stderr || undefined,
  });
};
