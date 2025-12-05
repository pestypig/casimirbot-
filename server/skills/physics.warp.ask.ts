import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { buildPhysicsPrompt } from "../../tools/physicsContext";
import { runPhysicsValidation } from "../../tools/physicsValidation";
import { SupplementSchema, type Supplement } from "../services/planner/supplements";
import { getTool } from ".";

type AskBackend = "openai" | "ollama" | "auto";

const DEFAULT_BACKEND: AskBackend = (() => {
  const raw = (process.env.BACKEND_PHYSICS_ASK ?? "").trim().toLowerCase();
  if (raw === "ollama" || raw === "auto") return raw;
  if (raw && raw !== "openai") {
    console.warn(`[physics.warp.ask] Unknown BACKEND_PHYSICS_ASK="${raw}", defaulting to openai`);
  }
  return "openai";
})();

const DEFAULT_OPENAI_MODEL =
  (process.env.PHYSICS_ASK_OPENAI_MODEL ?? process.env.PHYSICS_MODEL ?? process.env.LLM_HTTP_MODEL)?.trim() ||
  "gpt-4.1-mini";

const DEFAULT_LOCAL_MODEL =
  (process.env.PHYSICS_ASK_LOCAL_MODEL ?? process.env.LLM_LOCAL_MODEL)?.trim() || "llama3.1-70b-instruct";

const DEFAULT_TEMPERATURE = Number.isFinite(Number(process.env.PHYSICS_ASK_TEMPERATURE))
  ? Number(process.env.PHYSICS_ASK_TEMPERATURE)
  : 0.2;

const WarpAskInput = z.object({
  question: z.string().min(3, "question required"),
  includeSnapshot: z.boolean().default(false),
  params: z.record(z.any()).optional(),
  model: z.string().optional(),
});

const WarpAskOutput = z.object({
  answer: z.string(),
  citations: z.array(z.string()),
  citationHints: z.record(z.any()),
  pipelineSnapshot: z.record(z.any()).optional(),
  pipelineCitations: z.record(z.array(z.string())).optional(),
  model: z.string(),
  supplement: SupplementSchema.optional(),
});

export const warpAskSpec: ToolSpecShape = {
  name: "physics.warp.ask",
  desc: "Grounded GR/Casimir/warp Q&A with repo context + optional pipeline snapshot for Essence chat",
  inputSchema: WarpAskInput,
  outputSchema: WarpAskOutput,
  deterministic: false,
  rateLimit: { rpm: 20 },
  safety: { risks: ["network_access"] },
  risk: { writesFiles: false, touchesNetwork: true, privileged: false },
  health: "ok",
};

const serializeMessagesForPrompt = (messages: ChatCompletionMessageParam[]): string =>
  messages
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n\n");

const callOpenAIBackend = async (
  messages: ChatCompletionMessageParam[],
  model: string,
  ctx?: any,
): Promise<{ text: string; model: string }> => {
  const apiKey = (process.env.OPENAI_API_KEY ?? process.env.LLM_HTTP_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY (or LLM_HTTP_API_KEY) is required for physics.warp.ask when using OpenAI backend");
  }
  const llm = getTool("llm.http.generate");
  if (llm) {
    const completion = await llm.handler(
      { model, messages, temperature: DEFAULT_TEMPERATURE },
      ctx ?? {},
    );
    const text =
      (completion as { text?: string })?.text ??
      (completion as { answer?: string })?.answer ??
      (completion as { content?: string })?.content ??
      "";
    const resolvedModel =
      (completion as { model?: string })?.model ??
      (completion as { data?: { model?: string } })?.data?.model ??
      model;
    if (!text) {
      throw new Error("physics.warp.ask OpenAI backend returned empty text");
    }
    return { text, model: resolvedModel };
  }

  const client = new OpenAI({ apiKey });
  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: DEFAULT_TEMPERATURE,
      messages,
    });
    const text = completion.choices[0]?.message?.content ?? "";
    if (!text) {
      throw new Error("physics.warp.ask OpenAI backend returned empty text");
    }
    return { text, model: completion.model ?? model };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if ((err as { status?: number })?.status === 401 || message.includes("Incorrect API key")) {
      throw new Error("physics.warp.ask failed: invalid OpenAI API key; set OPENAI_API_KEY");
    }
    throw err;
  }
};

const callLocalBackend = async (
  messages: ChatCompletionMessageParam[],
  model: string,
  ctx?: any,
): Promise<{ text: string; model: string }> => {
  const llmLocal = getTool("llm.local.generate");
  const llmSpawn = getTool("llm.local.spawn.generate");
  const backend = llmLocal ?? llmSpawn;
  if (!backend) {
    throw new Error("No local LLM backend registered (llm.local.generate or llm.local.spawn.generate)");
  }
  if (backend.name === "llm.local.generate") {
    const result = await backend.handler({ model, messages, temperature: DEFAULT_TEMPERATURE }, ctx ?? {});
    const text =
      (result as { text?: string })?.text ??
      (result as { answer?: string })?.answer ??
      (result as { content?: string })?.content ??
      "";
    const resolvedModel = (result as { model?: string })?.model ?? model;
    if (!text) {
      throw new Error("physics.warp.ask local backend returned empty text");
    }
    return { text, model: resolvedModel };
  }

  const prompt = serializeMessagesForPrompt(messages);
  const result = await backend.handler({ prompt, temperature: DEFAULT_TEMPERATURE }, ctx ?? {});
  const text =
    (result as { text?: string })?.text ??
    (result as { answer?: string })?.answer ??
    (result as { content?: string })?.content ??
    "";
  const resolvedModel = (result as { model?: string })?.model ?? model;
  if (!text) {
    throw new Error("physics.warp.ask spawn backend returned empty text");
  }
  return { text, model: resolvedModel };
};

const callPhysicsAskModel = async (
  backend: AskBackend,
  messages: ChatCompletionMessageParam[],
  openaiModel: string,
  localModel: string,
  ctx?: any,
): Promise<{ text: string; model: string; backend: AskBackend }> => {
  if (backend === "ollama") {
    const { text, model } = await callLocalBackend(messages, localModel, ctx);
    return { text, model, backend };
  }
  if (backend === "openai") {
    const { text, model } = await callOpenAIBackend(messages, openaiModel, ctx);
    return { text, model, backend };
  }

  // auto: prefer local, fall back to OpenAI
  try {
    const { text, model } = await callLocalBackend(messages, localModel, ctx);
    return { text, model, backend: "ollama" };
  } catch (error) {
    console.warn("[physics.warp.ask] local backend failed; falling back to OpenAI", error);
    const { text, model } = await callOpenAIBackend(messages, openaiModel, ctx);
    return { text, model, backend: "openai" };
  }
};

export const warpAskHandler: ToolHandler = async (rawInput, ctx) => {
  const input = WarpAskInput.parse(rawInput ?? {});
  const assembled = await buildPhysicsPrompt(input.question);
  let userPrompt = assembled.userPrompt;
  let pipelineSnapshot: Record<string, unknown> | undefined;
  let pipelineCitations: Record<string, string[]> | undefined;

  if (input.includeSnapshot) {
    try {
      const validation = await runPhysicsValidation(input.params ?? {});
      pipelineSnapshot = validation.snapshot as Record<string, unknown>;
      pipelineCitations = validation.citations;
      const snapshotText = JSON.stringify(validation.snapshot, null, 2);
      userPrompt = [
        assembled.userPrompt,
        "",
        "Pipeline snapshot (cite as [PIPELINE:<field>]):",
        snapshotText,
      ].join("\n");
    } catch (error) {
      console.warn("[physics.warp.ask] runPhysicsValidation failed; continuing without snapshot", error);
      userPrompt = [
        assembled.userPrompt,
        "",
        "Pipeline snapshot: unavailable (do NOT invent numeric values).",
      ].join("\n");
    }
  } else {
    userPrompt = [
      assembled.userPrompt,
      "",
      "Pipeline snapshot: not requested (do NOT invent numeric values).",
    ].join("\n");
  }

  const systemPrompt = [
    "You are the Warp Explainer for this repository.",
    "Explain how the warp bubble is modeled and computed in this codebase.",
    "Use ONLY the provided repo context blocks and the optional pipeline snapshot.",
    "You MUST NOT claim that a configuration is viable/admissible/realized, and you MUST NOT invent numeric values.",
    "Focus on:",
    "1) Warp metric: Alcubierre/Natario in ADM 3+1 form (lapse alpha, shift beta^x = -v_s f(r_s)).",
    "2) Casimir tiles feeding the energy pipeline: TS_ratio ladder, gamma_geo^3, d_eff, gamma_VdB.",
    "3) Stress-energy evaluation and guardrails (FordRomanQI, ThetaAudit, TS_ratio_min, VdB bands).",
    "4) If a snapshot is present, describe those numbers qualitatively and cite them; if absent, say numbers were not provided.",
    "",
    assembled.systemPrompt,
  ].join("\n");

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const backend = DEFAULT_BACKEND;
  const openaiModel =
    input.model ??
    process.env.PHYSICS_ASK_OPENAI_MODEL ??
    process.env.PHYSICS_MODEL ??
    process.env.LLM_HTTP_MODEL ??
    DEFAULT_OPENAI_MODEL;
  const localModel = input.model ?? process.env.PHYSICS_ASK_LOCAL_MODEL ?? DEFAULT_LOCAL_MODEL;
  const { text: answer, model: resolvedModel } = await callPhysicsAskModel(
    backend,
    messages,
    openaiModel,
    localModel,
    ctx,
  );

  const citationList = Object.keys(assembled.citationHints);
  if (pipelineCitations) {
    for (const value of Object.values(pipelineCitations)) {
      if (Array.isArray(value)) {
        citationList.push(...value);
      }
    }
  }
  const uniqueCitations = Array.from(new Set(citationList));

  const supplement: Supplement = {
    kind: "warp",
    tool: warpAskSpec.name,
    title: "Warp bubble solution pipeline",
    summary:
      "On this site the warp bubble is solved by mapping Casimir tiles -> energy pipeline -> Natario warp metric -> stress-energy validation.",
    detail: answer.trim() || undefined,
    citations: uniqueCitations,
    importance: 0.9,
  };

  return WarpAskOutput.parse({
    answer,
    citations: uniqueCitations,
    citationHints: assembled.citationHints,
    pipelineSnapshot,
    pipelineCitations,
    model: resolvedModel,
    supplement,
  });
};
