import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { codexProvider } from "../codex-provider";

const ENV_KEYS = [
  "CODEX_AGENT_FAKE_STDOUT",
  "CODEX_AGENT_FAKE_STDOUT_SEQUENCE",
  "CODEX_AGENT_FAKE_CALL_INDEX",
  "CODEX_AGENT_FAKE_EXIT_CODE",
  "CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH",
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Codex provider continuation state", () => {
  it("supplies a non-terminal continuation state to a model-only Codex turn and returns it in debug", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "codex-continuation-state-"));
    const promptPath = path.join(directory, "prompt.txt");
    process.env.CODEX_AGENT_FAKE_STDOUT = "2 + 2 = 4";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = promptPath;

    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "ask:provider-continuation:model-only",
          question: "Answer normally with no tools: what is 2+2?",
        },
      });
      const state = result.agent_continuation_state as Record<string, unknown>;
      const debug = result.debug as Record<string, unknown>;
      const prompt = fs.readFileSync(promptPath, "utf8");

      expect(result.answer).toBe("2 + 2 = 4");
      expect(state).toMatchObject({
        schema: "helix.agent_continuation_state.v1",
        trigger: "final_review",
        goal: {
          status: "satisfied",
          satisfied: true,
        },
        allowed_decisions: ["answer"],
        terminal_eligible: false,
        assistant_answer: false,
      });
      expect(debug.agent_continuation_state).toMatchObject({
        schema: "helix.agent_continuation_state.v1",
        authority: "runtime_agent_decides_within_admitted_boundaries",
      });
      expect(prompt).toContain("Helix continuation state (non-terminal adapter evidence)");
      expect(prompt).toContain("Budgets are resource boundaries, not conclusions.");
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("completes an exact explicit-doc locator turn from current-turn occurrence evidence", async () => {
    const answer = "Exact locator answer from current-turn docs evidence.";
    const question =
      "Open docs/research/nhm2-current-status-whitepaper.md. Find every occurrence of alpha = 0.7 and alpha = 0.995. For each occurrence, provide the enclosing sentence and its nearest section heading. Do not summarize or infer.";
    process.env.CODEX_AGENT_FAKE_STDOUT = answer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:provider-continuation:exact-doc-locators",
        agent_runtime: "codex",
        question,
        source_target_intent: {
          selected_capability: "docs-viewer.search_docs",
          mandatory_next_tool: {
            args: { query: question, paths: ["docs"] },
          },
        },
      },
    });

    const ledger = result.current_turn_artifact_ledger as Array<Record<string, any>>;
    const docsResults = ledger.find((artifact) => artifact.kind === "doc_search_results");
    expect(result).toMatchObject({
      ok: true,
      answer,
      terminal_artifact_kind: "model_synthesized_answer",
    });
    expect(docsResults?.payload).toMatchObject({
      exact_terms: ["alpha = 0.7", "alpha = 0.995"],
      exact_location_match_count: expect.any(Number),
      exact_location_matches: expect.arrayContaining([
        expect.objectContaining({ term: "alpha = 0.7", heading: "Abstract" }),
        expect.objectContaining({
          term: "alpha = 0.995",
          heading: "6.7 Twin Paradox trip clocking interpretation",
        }),
      ]),
    });
    expect(docsResults?.payload.exact_location_match_count).toBe(3);
    expect(ledger.map((artifact) => artifact.kind)).toEqual(expect.arrayContaining([
      "provider_terminal_authority_bridge",
      "model_synthesized_answer",
    ]));
  }, 30_000);

  it("grounds an exact zero-result answer in the named document rather than broad docs hits", async () => {
    const answer = "0 occurrences. No evidence locations found.";
    const question =
      "Open docs/research/nhm2-current-status-whitepaper.md. Find every occurrence of alpha = 0.123456. Return only the occurrence count and evidence locations. Do not infer alternatives.";
    process.env.CODEX_AGENT_FAKE_STDOUT = answer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:provider-continuation:zero-exact-doc-locator",
        agent_runtime: "codex",
        question,
        source_target_intent: {
          selected_capability: "docs-viewer.search_docs",
          mandatory_next_tool: { args: { query: question, paths: ["docs"] } },
        },
      },
    });

    const ledger = result.current_turn_artifact_ledger as Array<Record<string, any>>;
    const docsResults = ledger.find((artifact) => artifact.kind === "doc_search_results");
    expect(result).toMatchObject({
      ok: true,
      answer,
      terminal_artifact_kind: "model_synthesized_answer",
    });
    expect(docsResults?.payload).toMatchObject({
      paths: ["docs/research/nhm2-current-status-whitepaper.md"],
      exact_terms: ["alpha = 0.123456"],
      exact_location_matches: [],
      exact_location_match_count: 0,
    });
    expect(ledger.map((artifact) => artifact.kind)).toEqual(expect.arrayContaining([
      "retrieval_context",
      "provider_terminal_authority_bridge",
      "model_synthesized_answer",
    ]));
  }, 30_000);

  it("re-enters a named section observation before answering", async () => {
    const answer = "Line 1053: For `alpha = 0.995`, this gives about `0.099875`.";
    const question =
      "Open docs/research/nhm2-current-status-whitepaper.md. Under section \"6.7 Twin Paradox trip clocking interpretation\", extract every sentence containing alpha. Preserve the original wording and line numbers. Do not summarize.";
    process.env.CODEX_AGENT_FAKE_STDOUT = answer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:provider-continuation:named-doc-section",
        agent_runtime: "codex",
        question,
        source_target_intent: {
          selected_capability: "docs-viewer.search_docs",
          mandatory_next_tool: { args: { query: question, paths: ["docs"] } },
        },
      },
    });

    const ledger = result.current_turn_artifact_ledger as Array<Record<string, any>>;
    const docsResults = ledger.find((artifact) => artifact.kind === "doc_search_results");
    const retrieval = ledger.find((artifact) => artifact.kind === "retrieval_context");
    expect(result).toMatchObject({
      ok: true,
      answer,
      terminal_artifact_kind: "model_synthesized_answer",
    });
    expect(docsResults?.payload.section_observation).toMatchObject({
      matched_heading: "6.7 Twin Paradox trip clocking interpretation",
      heading_line: 999,
      truncated: false,
      contains_matches: expect.arrayContaining([
        expect.objectContaining({ line: 1053, term: "alpha" }),
      ]),
    });
    expect(retrieval?.payload.section_observation.section_excerpt).toContain(
      "For `alpha = 0.995`, this gives about `0.099875`.",
    );
  }, 30_000);

  it("does not overwrite an explicit local-doc section answer with a scholarly recovery plan", async () => {
    const answer = "1053: For `alpha = 0.995`, this gives about `0.099875`.";
    const question =
      "Open docs/research/nhm2-current-status-whitepaper.md. Within section \"6.7 Twin Paradox trip clocking interpretation\", return only complete prose sentences containing the literal lowercase token alpha. Exclude display equations, headings, identifiers, and sentence fragments. Preserve original wording and line numbers. Do not summarize.";
    process.env.CODEX_AGENT_FAKE_STDOUT = answer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:provider-continuation:local-doc-not-scholarly",
        agent_runtime: "codex",
        question,
        source_target_intent: {
          selected_capability: "docs-viewer.search_docs",
          mandatory_next_tool: { args: { query: question, paths: ["docs"] } },
        },
      },
    });

    const ledger = result.current_turn_artifact_ledger as Array<Record<string, any>>;
    const docsResults = ledger.find((artifact) => artifact.kind === "doc_search_results");
    expect(result).toMatchObject({
      ok: true,
      answer,
      terminal_artifact_kind: "model_synthesized_answer",
    });
    expect(docsResults?.payload.section_observation).toMatchObject({
      matched_heading: "6.7 Twin Paradox trip clocking interpretation",
      contains_terms: ["alpha"],
      truncated: false,
    });
  }, 30_000);

  it("re-enters two independently bounded sections before comparison synthesis", async () => {
    const answer = "Section 6.7 and 6.8 comparison from bounded evidence.";
    const question =
      "Open docs/research/nhm2-current-status-whitepaper.md. Compare only sections \"6.7 Twin Paradox trip clocking interpretation\" and \"6.8 Profile-scoped trip clocking index.\" For each section, list every source line containing the exact case-sensitive term alpha, preserving complete lines and line numbers. Keep results separated by section and use no evidence from elsewhere.";
    process.env.CODEX_AGENT_FAKE_STDOUT = answer;
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "ask:provider-continuation:two-doc-sections",
        agent_runtime: "codex",
        question,
        source_target_intent: {
          selected_capability: "docs-viewer.search_docs",
          mandatory_next_tool: { args: { query: question, paths: ["docs"] } },
        },
      },
    });

    const ledger = result.current_turn_artifact_ledger as Array<Record<string, any>>;
    const docsResults = ledger.find((artifact) => artifact.kind === "doc_search_results");
    const retrieval = ledger.find((artifact) => artifact.kind === "retrieval_context");
    expect(result.answer).toBe(answer);
    expect(docsResults?.payload.section_observations).toEqual([
      expect.objectContaining({ matched_heading: "6.7 Twin Paradox trip clocking interpretation", contains_match_count: 5 }),
      expect.objectContaining({ matched_heading: "6.8 Profile-scoped trip clocking index", contains_match_count: 3 }),
    ]);
    expect(retrieval?.payload.section_observations).toHaveLength(2);
  }, 30_000);

});
