#!/usr/bin/env -S tsx

import OpenAI from "openai";
import { buildPhysicsPrompt } from "../tools/physicsContext";

async function main() {
  const model = process.env.PHYSICS_MODEL ?? "gpt-4o-mini";
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    console.error('Usage: essence physics:ask "your question"');
    process.exit(1);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY environment variable");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });
  const assembled = await buildPhysicsPrompt(query);

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: assembled.systemPrompt },
      { role: "user", content: assembled.userPrompt },
    ],
  });

  const answer = completion.choices[0]?.message?.content ?? "";
  console.log(answer);

  console.error("\n--- Grounding blocks used ---");
  console.error(`Model: ${model}`);
  for (const [id, meta] of Object.entries(assembled.citationHints)) {
    console.error(`${id} -> ${meta.sourcePath}:${meta.lines[0]}-${meta.lines[1]} [${meta.tag}]`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
