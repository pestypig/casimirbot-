import fs from "node:fs/promises";
import path from "node:path";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";

type ReadmeInput = {
  section?: string;
  max_chars?: number;
};

type SectionResult = {
  excerpt: string;
  heading?: string;
  matched: boolean;
};

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const readmePath = path.resolve(repoRoot, "README.md");

function parseInput(input: unknown): { section?: string; maxChars: number } {
  if (!input || typeof input !== "object") {
    return { maxChars: 1600 };
  }
  const payload = input as Record<string, unknown>;
  const section =
    typeof payload.section === "string" && payload.section.trim() ? payload.section.trim() : undefined;
  const maxCharsRaw = typeof payload.max_chars === "number" ? payload.max_chars : undefined;
  const maxChars = clamp(maxCharsRaw ?? 1600, 200, 6000);
  return { section, maxChars };
}

function collectHeadings(source: string, limit = 8): string[] {
  const headings: string[] = [];
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("#")) continue;
    const heading = trimmed.replace(/^#+\s*/, "").trim();
    if (!heading) continue;
    headings.push(heading);
    if (headings.length >= limit) break;
  }
  return headings;
}

function extractSection(content: string, sectionName?: string): SectionResult {
  if (!sectionName) {
    return { excerpt: content.trim(), matched: false };
  }
  const lines = content.split(/\r?\n/);
  const target = sectionName.trim().toLowerCase();
  let startIdx = -1;
  let matchedHeading: string | undefined;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith("#")) continue;
    const heading = line.replace(/^#+\s*/, "").trim();
    if (!heading) continue;
    if (heading.toLowerCase().includes(target)) {
      startIdx = i;
      matchedHeading = heading;
      break;
    }
  }
  if (startIdx === -1) {
    return { excerpt: content.trim(), matched: false };
  }
  const sectionLines: string[] = [lines[startIdx]];
  for (let i = startIdx + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim().startsWith("#")) {
      break;
    }
    sectionLines.push(line);
  }
  return {
    excerpt: sectionLines.join("\n").trim(),
    heading: matchedHeading,
    matched: true,
  };
}

export const readmeSpec: ToolSpecShape = {
  name: "docs.readme.extract",
  desc: "Read the local README.md file and return an excerpt or specific section.",
  inputSchema: {
    type: "object",
    properties: {
      section: { type: "string", description: "Heading or keyword to focus on." },
      max_chars: {
        type: "number",
        minimum: 200,
        maximum: 6000,
        description: "Maximum number of characters to return.",
      },
    },
  },
  outputSchema: {
    type: "object",
    properties: {
      path: { type: "string" },
      excerpt: { type: "string" },
      total_chars: { type: "number" },
      truncated: { type: "boolean" },
      section: { type: ["string", "null"] },
      matched_section: { type: "boolean" },
      headings: { type: "array", items: { type: "string" } },
    },
    required: ["path", "excerpt", "total_chars", "truncated", "matched_section", "headings"],
  },
  deterministic: true,
  rateLimit: { rpm: 24 },
  safety: { risks: [] },
};

export const readmeHandler: ToolHandler = async (input: unknown) => {
  const { section, maxChars } = parseInput(input);
  const raw = await fs.readFile(readmePath, "utf-8");
  const trimmed = raw.trim();
  const headings = collectHeadings(trimmed);
  const sectionResult = extractSection(trimmed, section);
  const excerpt =
    sectionResult.excerpt.length > maxChars
      ? `${sectionResult.excerpt.slice(0, Math.max(0, maxChars - 3))}...`
      : sectionResult.excerpt;

  return {
    path: "README.md",
    excerpt,
    total_chars: sectionResult.excerpt.length,
    truncated: sectionResult.excerpt.length > maxChars,
    section: sectionResult.heading ?? null,
    matched_section: sectionResult.matched,
    headings,
  };
};
