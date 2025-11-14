import type { z } from "zod";
import { SolverSpec, SolverInput, SolverOutput } from "@shared/agi-specialists";

export type CodeTask = { task_id?: string; prompt: string };
export type CodeAnswer = { language: "ts"; source: string; tests: string[] };

const SOURCE = `export function isBalanced(s) {
  const stack = [];
  const map = { ")": "(", "]": "[", "}": "{" };
  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);
    } else if (ch === ")" || ch === "]" || ch === "}") {
      if (stack.length === 0) return false;
      const top = stack.pop();
      if (map[ch] !== top) return false;
    }
  }
  return stack.length === 0;
}
`;

const PUBLIC_TESTS = [
  `isBalanced("()") === true`,
  `isBalanced("([])") === true`,
  `isBalanced("([)]") === false`,
  `isBalanced("(((") === false`,
  `isBalanced("{[()]}") === true`,
  `isBalanced(")") === false`,
];

export const codeIsBalancedSpec = {
  name: "code.isBalanced",
  desc: "Provides a deterministic stack-based bracket matcher implementation in TypeScript.",
  inputSchema: SolverInput,
  outputSchema: SolverOutput,
} satisfies z.infer<typeof SolverSpec>;

export const codeIsBalancedHandler = async (rawInput: unknown) => {
  const input = SolverInput.parse(rawInput);
  const params = (input.params ?? {}) as Partial<CodeTask>;
  const prompt = typeof params.prompt === "string" && params.prompt.trim().length > 0 ? params.prompt.trim() : input.problem.goal;
  const answer: CodeAnswer = { language: "ts", source: SOURCE, tests: PUBLIC_TESTS };
  return SolverOutput.parse({
    summary: "Provided stack-based implementation for isBalanced(s).",
    data: { answer, prompt },
    artifacts: [],
    essence_ids: [],
  });
};
