import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { findDocSectionByHeading, readDocSectionIndex } from "../services/helix-ask/doc-sections";

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
  const index = readDocSectionIndex(input.path);
  const section = findDocSectionByHeading(index, input.heading);
  const headingText = section?.heading ?? input.heading;
  const level = section?.level ?? 2;
  const header = `${"#".repeat(level)} ${headingText}`;
  const headerPath = section?.headerPath?.length ? `Header path: ${section.headerPath.join(" > ")}` : "";
  const body = section?.bodyLines?.length ? section.bodyLines.join("\n").trim() : "";
  const sectionLines = [
    header,
    headerPath,
    "",
    body || `Context extracted for ${headingText}.`,
  ].filter(Boolean);
  return {
    section: sectionLines.join("\n"),
    citation: { type: "md" as const, path: input.path, heading: input.heading.replace(/^#+\s*/, "") },
  };
};
