import type { EssenceProfileSummaryResult } from "@shared/inferenceProfile";
import { listTaskTracesForPersona } from "../db/agi";
import { upsertProfileSummary, type EssenceProfileSummary } from "../db/profileSummaries";

type SummarizeOptions = {
  hours?: number;
  limit?: number;
  persist?: boolean;
};

const getFetch = async (): Promise<typeof fetch> => {
  if (typeof fetch === "function") {
    return fetch;
  }
  const mod = await import("node-fetch");
  return (mod.default ?? mod) as unknown as typeof fetch;
};

const buildChatSnippets = (traces: Awaited<ReturnType<typeof listTaskTracesForPersona>>): string[] =>
  traces.map((trace, idx) => {
    const lines = [`${idx + 1}. ts=${trace.created_at}`];
    lines.push(`goal: ${trace.goal}`);
    if (trace.result_summary) {
      lines.push(`result: ${trace.result_summary}`);
    }
    if (trace.telemetry_summary) {
      lines.push(`telemetry: ${typeof trace.telemetry_summary === "string" ? trace.telemetry_summary : JSON.stringify(trace.telemetry_summary).slice(0, 400)}`);
    }
    if (trace.resonance_selection) {
      lines.push(`resonance: ${JSON.stringify(trace.resonance_selection).slice(0, 200)}`);
    }
    return lines.join("\n");
  });

const systemPrompt = [
  "You are updating an Essence profile from recent console chats and task traces.",
  "Operate like an observer physicist: infer only what the user did or asked, not emotions or diagnoses.",
  "Map behaviors to: focus_areas, aspiration_signals, interaction_style, rhythms (periodicity), sustainability, longevity signals.",
  "Use neutral, editable numbers (0-1) or short phrases. Favor brevity and factual phrasing.",
  "If evidence is thin, leave fields unset instead of guessing.",
  "Output strict JSON matching EssenceProfileSummaryResult with an updated_at ISO timestamp.",
].join(" ");

const userPromptHeading = [
  "Recent Essence console activity (truncated to the last few entries).",
  "Infer observable patterns only. Respect formatting preferences (bullets vs prose, detail level, tone).",
  "Highlight sustainability (small steps, follow-through) and periodicity (short sessions, batching) if present.",
  "Return JSON ONLY.",
].join(" ");

async function callPrimaryLlm(prompt: string): Promise<string> {
  const fetch = await getFetch();

  // Prefer local Ollama if configured; otherwise use OpenAI-compatible HTTP.
  const ollamaEndpoint = (process.env.OLLAMA_ENDPOINT ?? "").replace(/\/+$/, "");
  if (ollamaEndpoint) {
    const model =
      process.env.OLLAMA_PROFILE_MODEL?.trim() ||
      process.env.LUMA_MODEL?.trim() ||
      "mistral:7b-instruct";
    const response = await fetch(`${ollamaEndpoint}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!response.ok) {
      const message = await response.text().catch(() => `status=${response.status}`);
      throw new Error(`ollama_failed:${message}`);
    }
    const payload = (await response.json()) as any;
    const text = payload?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("ollama_empty_response");
    }
    return text.trim();
  }

  const base = (process.env.LLM_HTTP_BASE ?? "").replace(/\/+$/, "");
  const apiKey = process.env.LLM_HTTP_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!base || !apiKey) {
    throw new Error("llm_http_unconfigured");
  }
  const model = (process.env.LLM_HTTP_MODEL ?? "gpt-4o-mini").trim();
  const response = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => `status=${response.status}`);
    throw new Error(`llm_http_failed:${message}`);
  }
  const payload = (await response.json()) as any;
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("llm_http_empty_response");
  }
  return text.trim();
}

const parseSummaryJson = (text: string): EssenceProfileSummaryResult => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const slice = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  const parsed = JSON.parse(slice) as EssenceProfileSummaryResult;
  if (!parsed.updated_at) {
    parsed.updated_at = new Date().toISOString();
  }
  return parsed;
};

export async function summarizeEssenceProfileFromChats(
  personaId: string,
  opts?: SummarizeOptions,
): Promise<{ summary: EssenceProfileSummaryResult | null; persisted?: EssenceProfileSummary | null; usedTraces: number }> {
  const hours = opts?.hours ?? 24;
  const limit = opts?.limit ?? 60;
  const traces = await listTaskTracesForPersona(personaId, { hours, limit });
  if (!traces.length) {
    return { summary: null, persisted: null, usedTraces: 0 };
  }
  const snippets = buildChatSnippets(traces);
  const payload = [userPromptHeading, "----", ...snippets].join("\n");
  const raw = await callPrimaryLlm(payload);
  const summary = parseSummaryJson(raw);
  const persist = opts?.persist !== false;
  let persisted: EssenceProfileSummary | null = null;
  if (persist) {
    persisted = await upsertProfileSummary(personaId, summary);
  }
  return { summary, persisted, usedTraces: traces.length };
}
