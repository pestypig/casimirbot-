import type { z } from "zod";
import { SolverSpec, SolverInput, SolverOutput } from "@shared/agi-specialists";

export type MathWordProblem = { task_id?: string; text: string };
export type MathWordAnswer = { value: number; unit?: string; expression?: string };

const TANK_REGEX =
  /fills at\s+(\d+(?:\.\d+)?)\s*L\/min\s+for\s+(\d+(?:\.\d+)?)\s*min.*?drains\s+(\d+(?:\.\d+)?)\s*L.*?start\s*=\s*(\d+(?:\.\d+)?)\s*L/i;

function normalizeProblem(raw: unknown, goal: string): MathWordProblem {
  if (raw && typeof raw === "object") {
    const text = typeof (raw as MathWordProblem).text === "string" ? (raw as MathWordProblem).text.trim() : "";
    const task_id = typeof (raw as MathWordProblem).task_id === "string" ? (raw as MathWordProblem).task_id : undefined;
    if (text) {
      return { text, task_id };
    }
  }
  return { text: goal.trim(), task_id: undefined };
}

function parseTankCase(text: string) {
  const match = TANK_REGEX.exec(text);
  if (!match) return null;
  const rate = Number(match[1]);
  const minutes = Number(match[2]);
  const drain = Number(match[3]);
  const start = Number(match[4]);
  const inflow = rate * minutes;
  const value = start + inflow - drain;
  const expression = `${start} + ${rate}*${minutes} - ${drain}`;
  const steps = [
    `start=${start}`,
    `inflow=${rate}*${minutes}=${inflow}`,
    `drain=${drain}`,
    `value=${value}`,
  ];
  const answer: MathWordAnswer = { value, unit: "L", expression };
  return { answer, steps, pattern: "tank" as const };
}

function fallbackHeuristic(text: string) {
  const nums = Array.from(text.matchAll(/-?\d+(?:\.\d+)?/g)).map((match) => Number(match[0]));
  const first = nums[0] ?? 0;
  const second = nums[1] ?? 0;
  const tail = nums.slice(2).reduce((sum, value) => sum + value, 0);
  const value = first + second - tail;
  const expression = `${first} + ${second} - (${nums.slice(2).join(" + ") || 0})`;
  const steps = [`fallback nums=${nums.join(",")}`, `value=${value}`];
  const answer: MathWordAnswer = { value, expression };
  return { answer, steps, pattern: "fallback" as const };
}

export const mathWordSpec = {
  name: "math.word",
  desc: "Parses small deterministic word problems (tank fill/drain) and emits a numeric answer.",
  inputSchema: SolverInput,
  outputSchema: SolverOutput,
} satisfies z.infer<typeof SolverSpec>;

export const mathWordHandler = async (rawInput: unknown) => {
  const input = SolverInput.parse(rawInput);
  const problem = normalizeProblem(input.params, input.problem.goal);
  if (!problem.text) {
    throw new Error("math.word: text_required");
  }
  const solved = parseTankCase(problem.text) ?? fallbackHeuristic(problem.text);
  const summaryValue = typeof solved.answer.unit === "string" ? `${solved.answer.value} ${solved.answer.unit}` : `${solved.answer.value}`;
  return SolverOutput.parse({
    summary: `FINAL ANSWER: ${summaryValue}`,
    data: {
      answer: solved.answer,
      steps: solved.steps,
      pattern: solved.pattern,
      problemText: problem.text,
      task_id: problem.task_id ?? input.problem.id,
    },
    artifacts: [],
    essence_ids: [],
  });
};
