import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

const DocsHeadingSectionInput = z.object({
  path: z.string().min(1),
  heading: z.string().min(1),
});

const DocsHeadingSectionOutput = z.object({
  section: z.string(),
  citation: z.object({
    type: z.literal("md"),
    path: z.string(),
    heading: z.string(),
  }),
});

export const docsHeadingSectionSpec: ToolSpecShape = {
  name: "docs.heading.section.md",
  desc: "Return a markdown section by heading for deeper debate context.",
  inputSchema: DocsHeadingSectionInput,
  outputSchema: DocsHeadingSectionOutput,
  deterministic: true,
  rateLimit: { rpm: 30 },
  safety: { risks: [] },
};

export const docsHeadingSectionHandler: ToolHandler = async (rawInput) => {
  const input = DocsHeadingSectionInput.parse(rawInput ?? {});
  const header = input.heading.startsWith("#") ? input.heading : `## ${input.heading}`;
  const sectionLines = [`${header}`, "", `Context extracted for ${input.heading}.`, "", "- placeholder line 1", "- placeholder line 2"];
  return {
    section: sectionLines.join("\n"),
    citation: { type: "md" as const, path: input.path, heading: input.heading.replace(/^#+\s*/, "") },
  };
};

