import { z } from "zod";
import { execa } from "execa";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const RepoDiffReviewInput = z.object({
  path: z.string().trim().min(1).optional(),
  staged: z.boolean().default(false),
  context: z.number().int().min(0).max(200).default(20),
});

const RepoDiffReviewOutput = z.object({
  ok: z.boolean(),
  diff: z.string(),
  exitCode: z.number().int().nullable(),
  stderr: z.string().optional(),
});

export const repoDiffReviewSpec: ToolSpecShape = {
  name: "repo.diff.review",
  desc: "Render a git diff (read-only) for the repo or a specific path with configurable context.",
  inputSchema: RepoDiffReviewInput,
  outputSchema: RepoDiffReviewOutput,
  deterministic: true,
  rateLimit: { rpm: 10 },
  safety: { risks: [] },
};

export const repoDiffReviewHandler: ToolHandler = async (rawInput) => {
  const input = RepoDiffReviewInput.parse(rawInput ?? {});
  const args = ["diff", "--no-color", `--unified=${input.context}`];
  if (input.staged) {
    args.push("--cached");
  }
  if (input.path) {
    args.push(input.path);
  }
  const child = await execa("git", args, { reject: false });
  return RepoDiffReviewOutput.parse({
    ok: child.exitCode === 0,
    diff: child.stdout ?? "",
    exitCode: child.exitCode ?? null,
    stderr: child.stderr || undefined,
  });
};
