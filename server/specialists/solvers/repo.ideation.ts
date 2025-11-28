import type { z } from "zod";
import { SolverSpec, SolverInput, SolverOutput } from "@shared/agi-specialists";

type Idea = {
  title: string;
  summary: string;
  plugs_into: string[];
  pros: string[];
  cons: string[];
};

const pickConcepts = (text: string | undefined, limit = 6): string[] => {
  if (!text) return [];
  const tokens = Array.from(
    new Set(
      text
        .split(/[^A-Za-z0-9_.\\/:-]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2 && /[A-Za-z]/.test(t)),
    ),
  );
  return tokens.slice(0, limit);
};

export const repoIdeationSpec = {
  name: "repo_ideation",
  desc: "Proposes repo design/refactor options balancing novelty vs feasibility with inline plugs-into notes.",
  inputSchema: SolverInput,
  outputSchema: SolverOutput,
} satisfies z.infer<typeof SolverSpec>;

export const repoIdeationHandler = async (rawInput: unknown) => {
  const input = SolverInput.parse(rawInput);
  const summary = typeof input.problem.context?.summary === "string" ? input.problem.context.summary : "";
  const concepts = pickConcepts(summary || input.problem.goal, 8);
  const baseFiles = concepts.filter((c) => c.includes("/"));
  const goal = input.problem.goal.trim();

  const ideas: Idea[] = [
    {
      title: "Lean adapter",
      summary: "Add a thin adapter near the existing surface to extend behavior without touching core flows.",
      plugs_into: baseFiles.slice(0, 3),
      pros: ["Low blast radius", "Fast to ship"],
      cons: ["May increase indirection", "Does not clean deeper debt"],
    },
    {
      title: "Core refactor pass",
      summary: "Restructure the core module to expose explicit interfaces and seams, then attach the feature there.",
      plugs_into: baseFiles.slice(0, 2),
      pros: ["Improves long-term maintainability", "Clearer extension points"],
      cons: ["Higher upfront effort", "Needs regression coverage"],
    },
    {
      title: "Pilot behind flag",
      summary: "Implement the change behind a feature flag with telemetry to compare old vs new behavior.",
      plugs_into: baseFiles.slice(0, 2),
      pros: ["Safe rollout", "Data to inform final shape"],
      cons: ["Dual-path complexity", "Requires flag plumbing"],
    },
  ];

  const summaryLines = [
    `Goal: ${goal || "repo design"}`,
    concepts.length ? `Concepts: ${concepts.join(", ")}` : "Concepts: (not enough signal)",
    "Ideas:",
    ...ideas.map((idea, idx) => `${idx + 1}. ${idea.title} - ${idea.summary}`),
  ];

  return SolverOutput.parse({
    summary: summaryLines.join("\n"),
    data: { ideas, concepts, goal },
    artifacts: [],
    essence_ids: [],
  });
};
