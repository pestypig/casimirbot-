import { ETHOS_PROMPT } from "./luma-prompt";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

type Provider = "openai" | "ollama" | "vllm";
const PROVIDER = (process.env.LUMA_PROVIDER || "openai") as Provider;
const MODEL = process.env.LUMA_MODEL || "gpt-4o-mini";
const API_KEY = process.env.LUMA_API_KEY || "";
const BASE_INTERNAL_URL =
  process.env.LUMA_BASE_URL || `http://127.0.0.1:${process.env.PORT || "5000"}`;

function assertSameOrigin(url: string) {
  if (!/^https?:\/\//.test(url) && !url.startsWith("/")) {
    throw new Error("Unsupported URL format");
  }
  const normalized = url.startsWith("http") ? new URL(url) : new URL(url, BASE_INTERNAL_URL);
  if (normalized.origin !== new URL(BASE_INTERNAL_URL).origin) {
    throw new Error("External fetch blocked by policy");
  }
  if (!/^\/(api|documents|halobank|warp)\b/.test(normalized.pathname)) {
    throw new Error("URL outside approved scope");
  }
}

export async function summarizeUrl(url: string): Promise<string> {
  assertSameOrigin(url);
  const target = url.startsWith("http") ? url : new URL(url, BASE_INTERNAL_URL).toString();
  const res = await fetch(target, { headers: { Accept: "text/html,application/json" } });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const text = await res.text();
  const snippet = text.length > 50_000 ? text.slice(0, 50_000) : text;
  const messages: ChatMsg[] = [
    {
      role: "system",
      content: `${ETHOS_PROMPT}\nSummarize the provided page faithfully in 1-2 short paragraphs and include the source URL.`,
    },
    { role: "user", content: `URL: ${target}\n\n---\n${snippet}` },
  ];
  let summary = "";
  for await (const delta of chatStream({ messages, temperature: 0.2 })) {
    summary += delta;
  }
  return `${summary.trim()}\n\nSource: ${target}`;
}

export async function* chatStream(options: { messages: ChatMsg[]; temperature?: number }) {
  const { messages, temperature = 0.2 } = options;
  const fullMessages: ChatMsg[] = [{ role: "system", content: ETHOS_PROMPT }, ...messages];

  if (PROVIDER === "ollama") {
    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: fullMessages,
        stream: true,
        options: { temperature },
      }),
    });
    if (!response.ok || !response.body) {
      throw new Error(`ollama error ${response.status}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const content = parsed.message?.content;
          if (typeof content === "string") {
            yield content;
          }
        } catch {
          // ignore malformed JSON chunks
        }
      }
    }
    return;
  }

  const endpoint =
    PROVIDER === "openai"
      ? "https://api.openai.com/v1/chat/completions"
      : "http://127.0.0.1:8000/v1/chat/completions";
  const headers: Record<string, string> =
    PROVIDER === "openai"
      ? { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` }
      : { "Content-Type": "application/json" };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: MODEL,
      messages: fullMessages,
      temperature,
      stream: true,
    }),
  });
  if (!response.ok || !response.body) {
    throw new Error(`LLM error ${response.status}`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const segments = buffer.split("\n");
    buffer = segments.pop() || "";
    for (const segment of segments) {
      const trimmed = segment.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") {
        return;
      }
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (typeof delta === "string") {
          yield delta;
        }
      } catch {
        // ignore malformed payload
      }
    }
  }
}

export function planSteps(task: string) {
  return {
    for: task,
    plan: [
      "1. Restate the task in one line.",
      "2. Note preconditions, inputs, or source docs you will consult.",
      "3. Sketch 3-5 numbered actions, citing /api/papers or /documents if relevant.",
      "4. Flag guardrails (green-zone, falsifiability lab) before risky claims.",
    ],
  };
}

export async function proposePatch(title: string, rationale: string, filesHint?: string[]) {
  const prompt: ChatMsg[] = [
    {
      role: "system",
      content: `${ETHOS_PROMPT}\nReturn a unified diff only. Do not add commentary or explanations.`,
    },
    {
      role: "user",
      content: `Create a unified diff for "${title}". Rationale: ${rationale || "(not provided)"}.
Files to consider: ${Array.isArray(filesHint) && filesHint.length > 0 ? filesHint.join(", ") : "unspecified"}.
Only produce diff hunks; if uncertain, leave TODO comments instead of speculative edits.`,
    },
  ];
  let diff = "";
  for await (const delta of chatStream({ messages: prompt, temperature: 0.1 })) {
    diff += delta;
  }
  return diff.trim();
}
