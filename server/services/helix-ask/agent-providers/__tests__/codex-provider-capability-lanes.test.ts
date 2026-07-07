import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { codexProvider } from "../codex-provider";

describe("Codex provider capability lane adapter", () => {
  const previousLiveTranslationExternalBackends = process.env.HELIX_LIVE_TRANSLATION_EXTERNAL_BACKENDS_ENABLED;

  const writeMinimalPdf = (filePath: string, pages: string[]): void => {
    const objects: string[] = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    ];
    pages.forEach((_, index) => {
      const pageObjectNumber = 3 + index;
      const contentObjectNumber = 3 + pages.length + index;
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjectNumber} 0 R /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> >>`);
    });
    pages.forEach((text) => {
      const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
      const stream = `BT /F1 18 Tf 72 720 Td (${escaped}) Tj ET`;
      objects.push(`<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`);
    });
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(Buffer.byteLength(pdf, "ascii"));
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, "ascii");
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    fs.writeFileSync(filePath, pdf, "ascii");
  };

  beforeEach(() => {
    process.env.HELIX_LIVE_TRANSLATION_EXTERNAL_BACKENDS_ENABLED = "false";
  });

  afterEach(() => {
    if (previousLiveTranslationExternalBackends === undefined) {
      delete process.env.HELIX_LIVE_TRANSLATION_EXTERNAL_BACKENDS_ENABLED;
    } else {
      process.env.HELIX_LIVE_TRANSLATION_EXTERNAL_BACKENDS_ENABLED = previousLiveTranslationExternalBackends;
    }
  });

  it("surfaces configured LLM model metadata for UI receipts", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousModel = process.env.LLM_HTTP_MODEL;
    process.env.CODEX_AGENT_FAKE_STDOUT = "Hello from configured model.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.LLM_HTTP_MODEL = "gpt-4o-mini";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-model-metadata",
          question: "Say hello.",
        },
      });
      const debug = result.debug as Record<string, unknown>;

      expect(result).toMatchObject({
        llm_http_model_configured: "gpt-4o-mini",
        llm_model: "gpt-4o-mini",
      });
      expect(debug).toMatchObject({
        llm_http_model_configured: "gpt-4o-mini",
        llm_model: "gpt-4o-mini",
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousModel === undefined) {
        delete process.env.LLM_HTTP_MODEL;
      } else {
        process.env.LLM_HTTP_MODEL = previousModel;
      }
    }
  });

  it("makes active visible document translation context explicit in the Codex prompt", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-visible-doc-context-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    process.env.CODEX_AGENT_FAKE_STDOUT = "I need the translation lane before finalizing.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-visible-doc-translation-context",
          question: "Translate this visible document to Spanish.",
          workspace_context_snapshot: {
            active_doc_visible_translation_context: {
              schema: "helix.ask.active_doc_visible_translation_context.v1",
              doc_path: "docs/current.md",
              source_id: "document_markdown:docs/current.md",
              source_hash: "fnv1a32:11111111",
              source_text_hash: "fnv1a32:22222222",
              source_text_char_count: 14,
              account_locale: "en",
              target_language: "es",
              projection_target: "docs_chunk",
              chunks: [{
                chunk_id: "u0001",
                chunk_index: 1,
                visible_text: "# Current doc",
                bbox: { x: 8, y: 16, width: 220, height: 32, source: "visible-doc-title" },
                dedupe_key: "document_markdown:docs/current.md::u0001::es",
                assistant_answer: false,
                terminal_eligible: false,
                answer_authority: false,
                reentry_required: true,
              }],
            },
          },
        },
      });
      const prompt = fs.readFileSync(capturePromptPath, "utf8");
      expect(prompt).toContain("workspace_context_snapshot.active_doc_visible_translation_context");
      expect(prompt).toContain("first request workstation.visible_text.collect_translation_targets");
      expect(prompt).toContain("The legacy equivalent is workstation_tool_reference.collect_visible_translation_targets");
      expect(prompt).toContain(
        "pass active_doc_visible_translation_context: workspace_context_snapshot.active_doc_visible_translation_context",
      );
      expect(prompt).toContain("After Helix returns that collector observation");
      expect(prompt).toContain("request live_translation.translate_text for admitted collected chunks");
      expect(prompt).toContain("If the user names a target language");
      expect(prompt).toContain("include that requested target_language on the collector request");
      expect(prompt).toContain("existing_observation_ref");
      expect(prompt).toContain("existing_receipt_ref");
      expect(prompt).toContain("existing_projection_status");
      expect(prompt).toContain("existing_freshness_status");
      expect(prompt).toContain("existing_terminal_authority_status");
      expect(prompt).toContain("existing_source_event_ms");
      expect(prompt).toContain("existing_observed_at_ms");
      expect(prompt).toContain("source_event_id");
      expect(prompt).toContain("source_event_ms");
      expect(prompt).toContain("region_id, bbox");
      expect(prompt).toContain("Preserve target_language from the collected target unless the user explicitly requested a different target language");
      expect(prompt).toContain("document_markdown:docs/current.md");
      expect(prompt).toContain("\"visible_text\": \"# Current doc\"");
      expect(prompt).toContain("\"bbox\": {");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousCapturePromptPath === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      } else {
        process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = previousCapturePromptPath;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("enriches bare visible document collector calls from the workspace snapshot", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    process.env.CODEX_AGENT_FAKE_STDOUT = "The visible document target was collected.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-visible-doc-context-enrichment",
          question: "Translate this visible document to Spanish.",
          workspace_context_snapshot: {
            active_doc_visible_translation_context: {
              schema: "helix.ask.active_doc_visible_translation_context.v1",
              panel_id: "docs-viewer",
              doc_path: "docs/current.md",
              source_id: "document_markdown:docs/current.md",
              source_hash: "sha256:doc-context",
              account_locale: "en-US",
              target_language: "es",
              projection_target: "docs_chunk",
              chunks: [{
                source_kind: "docs_viewer",
                panel_id: "docs-viewer",
                doc_path: "docs/current.md",
                source_id: "document_markdown:docs/current.md#u0001",
                source_hash: "sha256:doc-context",
                source_text_hash: "sha256:doc-context-text",
                source_text_char_count: 26,
                visible_text: "The visible document text.",
                chunk_id: "u0001",
                chunk_index: 1,
                dedupe_key: "document_markdown:docs/current.md::u0001::es",
                region_id: "docs-viewer:u0001",
                projection_target: "docs_chunk",
                assistant_answer: false,
                terminal_eligible: false,
                answer_authority: false,
                reentry_required: true,
              }],
            },
          },
          capability_lane_call: {
            capability: "workstation_tool_reference.collect_visible_translation_targets",
            visible_only: true,
            max_chunks: 12,
          },
        },
      });
      const debug = result.debug as Record<string, unknown>;
      const results = debug.capability_lane_call_results as Array<Record<string, unknown>>;
      const collector = results.find((entry) =>
        entry.capability === "workstation_tool_reference.collect_visible_translation_targets"
      );
      const targetBatch = collector?.observation &&
        typeof collector.observation === "object" &&
        "target_batch" in collector.observation
        ? (collector.observation.target_batch as Record<string, unknown>)
        : null;
      const targets = Array.isArray(targetBatch?.targets)
        ? targetBatch.targets as Array<Record<string, unknown>>
        : [];

      expect(collector).toMatchObject({
        ok: true,
        target_count: 1,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
      expect(targetBatch).toMatchObject({
        terminal_eligible: false,
        assistant_answer: false,
        answer_authority: false,
        raw_content_included: false,
      });
      expect(targets[0]).toMatchObject({
        doc_path: "docs/current.md",
        source_id: "document_markdown:docs/current.md#u0001",
        source_hash: "sha256:doc-context",
        source_text_hash: "sha256:doc-context-text",
        visible_text: "The visible document text.",
        chunk_id: "u0001",
        projection_target: "docs_chunk",
        target_language: "es",
        terminal_eligible: false,
        assistant_answer: false,
        answer_authority: false,
        raw_content_included: false,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  }, 15_000);

  it("enriches context-carried account-language UI region collector calls from the workspace snapshot", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    process.env.CODEX_AGENT_FAKE_STDOUT = "The visible interface control target was collected.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
        turn_id: "turn-codex-visible-ui-region-context-enrichment",
        question: "Translate the visible interface controls to Spanish.",
        workspace_context_snapshot: {
          active_doc_visible_translation_context: {
            schema: "helix.ask.active_doc_visible_translation_context.v1",
            panel_id: "docs-viewer",
            doc_path: "docs/current.md",
            source_id: "document_markdown:docs/current.md",
            source_hash: "sha256:doc-context",
            account_locale: "en-US",
            target_language: "es",
            projection_target: "docs_chunk",
            chunks: [],
            ui_text_regions: [{
              source_kind: "button_label",
              panel_id: "docs-viewer",
              doc_path: "docs/current.md",
              source_id: "workstation-shell#docs-viewer:translate-button",
              source_hash: "sha256:doc-context",
              source_text_hash: "fnv1a32:translate-button",
              source_text_char_count: 9,
              visible_text: "Translate",
              chunk_id: "docs-viewer:translate-button",
              chunk_index: 0,
              dedupe_key: "workstation-shell#docs-viewer:translate-button::es",
              region_id: "docs-viewer:translate-button",
              projection_target: "account_language",
              existing_observation_ref: "ask:turn:translation:observation:button",
              existing_receipt_ref: "ask:turn:translation:receipt:button",
              existing_projection_status: "projected",
              existing_freshness_status: "fresh",
              existing_terminal_authority_status: "not_terminal_authority",
              assistant_answer: false,
              terminal_eligible: false,
              answer_authority: false,
              raw_content_included: false,
              reentry_required: true,
            }],
          },
        },
        capability_lane_call: {
          capability: "workstation.visible_text.collect_translation_targets",
          visible_only: true,
          max_chunks: 12,
        },
        },
      });
      const debug = result.debug as Record<string, unknown>;
      const results = debug.capability_lane_call_results as Array<Record<string, unknown>>;
      const collector = results.find((entry) =>
        entry.capability === "workstation_tool_reference.collect_visible_translation_targets"
      );
      const targetBatch = collector?.observation &&
        typeof collector.observation === "object" &&
        "target_batch" in collector.observation
        ? (collector.observation.target_batch as Record<string, unknown>)
        : null;
      const targets = Array.isArray(targetBatch?.targets)
        ? targetBatch.targets as Array<Record<string, unknown>>
        : [];

      expect(collector).toMatchObject({
        ok: true,
        target_count: 1,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
      expect(targetBatch).toMatchObject({
        terminal_eligible: false,
        assistant_answer: false,
        answer_authority: false,
        raw_content_included: false,
      });
      expect(targets[0]).toMatchObject({
      source_kind: "button_label",
      panel_id: "docs-viewer",
      doc_path: "docs/current.md",
      source_id: "workstation-shell#docs-viewer:translate-button",
      source_hash: "sha256:doc-context",
      source_text_hash: "fnv1a32:translate-button",
      source_text_char_count: 9,
      visible_text: "Translate",
      chunk_id: "docs-viewer:translate-button",
      chunk_index: 0,
      region_id: "docs-viewer:translate-button",
      dedupe_key: "workstation-shell#docs-viewer:translate-button::es",
      projection_target: "account_language",
      account_locale: "en-US",
      target_language: "es",
      existing_observation_ref: "ask:turn:translation:observation:button",
      existing_receipt_ref: "ask:turn:translation:receipt:button",
      existing_translation_receipt_ref: "ask:turn:translation:receipt:button",
      existing_projection_status: "projected",
      existing_freshness_status: "fresh",
      existing_terminal_authority_status: "not_terminal_authority",
      terminal_eligible: false,
      assistant_answer: false,
      answer_authority: false,
      raw_content_included: false,
      reentry_required: true,
      });
      expect(debug.capability_lane_reentry_status).toBe("observation_packet_required_for_provider_reentry");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  }, 15_000);

  it("preserves explicit user target language when enriching visible document collector calls", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    process.env.CODEX_AGENT_FAKE_STDOUT = "The visible document target was collected.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-visible-doc-target-language-override",
          question: "Translate this visible document to Spanish.",
          workspace_context_snapshot: {
            active_doc_visible_translation_context: {
              schema: "helix.ask.active_doc_visible_translation_context.v1",
              panel_id: "docs-viewer",
              doc_path: "docs/current.md",
              source_id: "document_markdown:docs/current.md",
              source_hash: "sha256:doc-context",
              account_locale: "en-US",
              target_language: "en",
              projection_target: "docs_chunk",
              chunks: [{
                source_kind: "docs_viewer",
                panel_id: "docs-viewer",
                doc_path: "docs/current.md",
                source_id: "document_markdown:docs/current.md#u0001",
                source_hash: "sha256:doc-context",
                source_text_hash: "sha256:doc-context-text",
                source_text_char_count: 26,
                visible_text: "The visible document text.",
                chunk_id: "u0001",
                chunk_index: 1,
                dedupe_key: "document_markdown:docs/current.md::u0001::en",
                region_id: "docs-viewer:u0001",
                projection_target: "docs_chunk",
                assistant_answer: false,
                terminal_eligible: false,
                answer_authority: false,
                reentry_required: true,
              }],
            },
          },
          capability_lane_call: {
            capability: "workstation_tool_reference.collect_visible_translation_targets",
            visible_only: true,
            max_chunks: 12,
          },
        },
      });
      const debug = result.debug as Record<string, unknown>;
      const results = debug.capability_lane_call_results as Array<Record<string, unknown>>;
      const collector = results.find((entry) =>
        entry.capability === "workstation_tool_reference.collect_visible_translation_targets"
      );
      const targetBatch = collector?.observation &&
        typeof collector.observation === "object" &&
        "target_batch" in collector.observation
        ? (collector.observation.target_batch as Record<string, unknown>)
        : null;
      const targets = Array.isArray(targetBatch?.targets)
        ? targetBatch.targets as Array<Record<string, unknown>>
        : [];

      expect(collector).toMatchObject({
        ok: true,
        target_count: 1,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
      expect(targetBatch).toMatchObject({
        terminal_eligible: false,
        assistant_answer: false,
        answer_authority: false,
        raw_content_included: false,
      });
      expect(targets[0]).toMatchObject({
        doc_path: "docs/current.md",
        source_id: "document_markdown:docs/current.md#u0001",
        target_language: "es",
        terminal_eligible: false,
        assistant_answer: false,
        answer_authority: false,
        raw_content_included: false,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  }, 15_000);

  it("enriches provider-neutral visible text collector alias calls from the workspace snapshot", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    process.env.CODEX_AGENT_FAKE_STDOUT = "Collector alias executed.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-visible-text-alias-context-enrichment",
          question: "Translate this visible document to Spanish.",
          workspace_context_snapshot: {
            active_doc_visible_translation_context: {
              schema: "helix.ask.active_doc_visible_translation_context.v1",
              panel_id: "docs-viewer",
              doc_path: "docs/current.md",
              source_id: "document_markdown:docs/current.md",
              source_hash: "sha256:doc-context",
              account_locale: "en-US",
              target_language: "en",
              projection_target: "docs_chunk",
              chunks: [{
                source_kind: "docs_viewer",
                panel_id: "docs-viewer",
                doc_path: "docs/current.md",
                source_id: "document_markdown:docs/current.md#u0001",
                source_hash: "sha256:doc-context",
                source_text_hash: "sha256:doc-context-text",
                source_text_char_count: 26,
                visible_text: "The visible document text.",
                chunk_id: "u0001",
                chunk_index: 1,
                dedupe_key: "document_markdown:docs/current.md::u0001::en",
                region_id: "docs-viewer:u0001",
                projection_target: "docs_chunk",
                existing_observation_ref: "ask:turn:visible:observation:1",
                existing_receipt_ref: "ask:turn:visible:receipt:1",
                existing_projection_status: "projected",
                existing_freshness_status: "fresh",
                existing_terminal_authority_status: "not_terminal_authority",
                assistant_answer: false,
                terminal_eligible: false,
                answer_authority: false,
                raw_content_included: false,
                reentry_required: true,
              }],
            },
          },
          capability_lane_call: {
            capability: "workstation.visible_text.collect_translation_targets",
            visible_only: true,
            max_chunks: 12,
          },
        },
      });
      const debug = result.debug as Record<string, unknown>;
      const results = debug.capability_lane_call_results as Array<Record<string, unknown>>;
      const collector = results.find((entry) =>
        entry.capability === "workstation_tool_reference.collect_visible_translation_targets"
      );
      const targetBatch = collector?.observation &&
        typeof collector.observation === "object" &&
        "target_batch" in collector.observation
        ? (collector.observation.target_batch as Record<string, unknown>)
        : null;
      const targets = Array.isArray(targetBatch?.targets)
        ? targetBatch.targets as Array<Record<string, unknown>>
        : [];

      expect(collector).toMatchObject({
        ok: true,
        target_count: 1,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
      expect(targetBatch).toMatchObject({
        terminal_eligible: false,
        assistant_answer: false,
        answer_authority: false,
        raw_content_included: false,
      });
      expect(targets[0]).toMatchObject({
        doc_path: "docs/current.md",
        source_id: "document_markdown:docs/current.md#u0001",
        target_language: "es",
        existing_observation_ref: "ask:turn:visible:observation:1",
        existing_receipt_ref: "ask:turn:visible:receipt:1",
        existing_translation_receipt_ref: "ask:turn:visible:receipt:1",
        existing_projection_status: "projected",
        existing_freshness_status: "fresh",
        existing_terminal_authority_status: "not_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        answer_authority: false,
        raw_content_included: false,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  }, 15_000);

  it("retries a noncompliant direct translation answer before executing the lane", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-lane-retry-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "hola",
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"live_translation.translate_text","text":"hello","source_language":"en","target_language":"es"}',
        "The translation is hola.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-natural-lane-retry",
          question: "Translate hello to Spanish.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const retryPrompt = fs.readFileSync(path.join(tempDir, "prompt.2.txt"), "utf8");
      const reentryPrompt = fs.readFileSync(path.join(tempDir, "prompt.3.txt"), "utf8");

      expect(result).toMatchObject({
        ok: true,
        answer: "The translation is hola.",
      });
      expect(debug.runtime_lane_request_contract).toMatchObject({
        schema: "helix.runtime_agent_lane_request_contract.v1",
        legacy_schema: "helix.codex_runtime_lane_request_contract.v1",
        runtime_provider_adapter: "codex",
        contract_version: "2026-07-02.p7.one_shot.v1",
        request_marker: "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
        one_shot_lane_loop_enabled: true,
        initial_candidate_present: false,
        retry_attempted: true,
        retry_status: "runtime_provider_emitted_lane_request",
        final_candidate_present: true,
        execution_status: "lane_observation_reentered",
        observation_packet_count: 1,
        helix_executes_only_structured_runtime_lane_requests: true,
      });
      expect(debug.runtime_lane_request_retry).toMatchObject({
        schema: "helix.runtime_agent_lane_request_retry.v1",
        legacy_schema: "helix.codex_runtime_lane_request_retry.v1",
        runtime_provider_adapter: "codex",
        status: "runtime_provider_emitted_lane_request",
        reason: "initial_provider_response_skipped_required_one_shot_lane_request",
        prior_response_preview: "hola",
        terminal_eligible: false,
        assistant_answer: false,
      });
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        retry: expect.objectContaining({
          status: "runtime_provider_emitted_lane_request",
        }),
        candidate: expect.objectContaining({
          capability: "live_translation.translate_text",
          text: "hello",
          target_language: "es",
        }),
      });
      expect(debug.capability_lane_call_results).toEqual(expect.arrayContaining([
        expect.objectContaining({
          ok: true,
          capability: "live_translation.translate_text",
          translated_text: "hola",
        }),
      ]));
      expect(debug.provider_reasoning_reentry).toMatchObject({
        status: "completed",
        capability_lane_observation_packet_count: 1,
        evidence_reentered: true,
      });
      expect(retryPrompt).toContain("prior response did not follow the capability lane request contract");
      expect(retryPrompt).toContain("Prior non-compliant response:");
      expect(reentryPrompt).toContain("Capability lane observation block after Helix execution:");
      expect(reentryPrompt).toContain("translated_text");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousCapturePromptPath === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      } else {
        process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = previousCapturePromptPath;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("chains explicit read-aloud translation requests through text-to-speech before final answer", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-translation-tts-chain-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"live_translation.translate_text","text":"hello","source_language":"en","target_language":"es"}',
        "The translation is hola, but I do not have a text-to-speech receipt.",
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"text_to_speech.speak_text","text":"hola","source_observation_ref":"turn-codex-translate-read-aloud:translation"}',
        "The translation is hola. Voice playback status is blocked.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-translate-read-aloud",
          question: "Translate hello to Spanish and read it aloud.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const firstReentryPrompt = fs.readFileSync(path.join(tempDir, "prompt.2.txt"), "utf8");
      const speechRetryPrompt = fs.readFileSync(path.join(tempDir, "prompt.3.txt"), "utf8");
      const finalReentryPrompt = fs.readFileSync(path.join(tempDir, "prompt.4.txt"), "utf8");
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const observationPackets = debug.capability_lane_observation_packets as Array<Record<string, any>>;

      expect(result).toMatchObject({
        ok: true,
        answer: "The translation is hola. Voice playback status is blocked.",
      });
      expect(callResults.map((call) => call.capability)).toEqual([
        "live_translation.translate_text",
        "text_to_speech.speak_text",
      ]);
      expect(observationPackets.map((packet) => packet.capability_key)).toEqual([
        "live_translation.translate_text",
        "text_to_speech.speak_text",
      ]);
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        chain_step_count: 2,
        candidate_chain: [
          expect.objectContaining({ capability: "live_translation.translate_text" }),
          expect.objectContaining({ capability: "text_to_speech.speak_text", text: "hola" }),
        ],
        translation_text_to_speech_chain: expect.objectContaining({
          schema: "helix.runtime_agent_translation_text_to_speech_chain.v1",
          translation_requested: true,
          speech_requested: true,
          playback_status: expect.stringMatching(/^(pending|blocked)$/),
          terminal_eligible: false,
          assistant_answer: false,
        }),
      });
      expect(firstReentryPrompt).toContain("must request exactly one text_to_speech.speak_text lane call");
      expect(speechRetryPrompt).toContain("prior response did not follow the required text-to-speech lane request contract");
      expect(finalReentryPrompt).toContain("text-to-speech lane call");
      expect(finalReentryPrompt).toContain("Report playback as played only if the receipt proves it");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousCapturePromptPath === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      } else {
        process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = previousCapturePromptPath;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("lets Codex ask for missing translation inputs instead of forcing a lane retry", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-lane-clarify-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    process.env.CODEX_AGENT_FAKE_STDOUT =
      "What text should I translate, and what target language should I use?";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-natural-lane-clarification",
          question: "Translate this.",
        },
      });
      const debug = result.debug as Record<string, any>;

      expect(result).toMatchObject({
        ok: true,
        answer: "What text should I translate, and what target language should I use?",
      });
      expect(debug.runtime_lane_request_contract).toMatchObject({
        schema: "helix.runtime_agent_lane_request_contract.v1",
        legacy_schema: "helix.codex_runtime_lane_request_contract.v1",
        runtime_provider_adapter: "codex",
        contract_version: "2026-07-02.p7.one_shot.v1",
        initial_candidate_present: false,
        retry_attempted: false,
        final_candidate_present: false,
        execution_status: "no_lane_request_candidate",
        observation_packet_count: 0,
        helix_executes_only_structured_runtime_lane_requests: true,
        terminal_eligible: false,
        assistant_answer: false,
      });
      expect(debug.runtime_lane_request_retry).toBeNull();
      expect(debug.capability_lane_call_results).toEqual([]);
      expect(debug.provider_reasoning_reentry).toMatchObject({
        status: "pending_helix_solver_reentry",
        capability_lane_observation_packet_count: 0,
        evidence_reentered: false,
      });
      expect(fs.existsSync(path.join(tempDir, "prompt.2.txt"))).toBe(false);
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousCapturePromptPath === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      } else {
        process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = previousCapturePromptPath;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("lets ordinary Codex turns request a one-shot lane and answer after observation re-entry", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-lane-loop-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"live_translation.translate_text","text":"hello","source_language":"en","target_language":"es","requested_backend_provider":"live_translation.google_gemini"}',
        "The translation is hola.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-natural-lane-request",
          question: "Translate hello to Spanish.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const firstPrompt = fs.readFileSync(capturePromptPath, "utf8");
      const secondPrompt = fs.readFileSync(path.join(tempDir, "prompt.2.txt"), "utf8");

      expect(result).toMatchObject({
        ok: true,
        runtime: "codex",
        response_type: "final_answer",
        final_status: "completed",
        answer: "The translation is hola.",
      });
      expect(debug.runtime_lane_request_contract).toMatchObject({
        schema: "helix.runtime_agent_lane_request_contract.v1",
        legacy_schema: "helix.codex_runtime_lane_request_contract.v1",
        runtime_provider_adapter: "codex",
        contract_version: "2026-07-02.p7.one_shot.v1",
        request_marker: "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
        one_shot_lane_loop_enabled: true,
        initial_candidate_present: true,
        retry_attempted: false,
        final_candidate_present: true,
        execution_status: "lane_observation_reentered",
        observation_packet_count: 1,
        helix_executes_only_structured_runtime_lane_requests: true,
      });
      expect(debug.runtime_lane_request_loop).toMatchObject({
        schema: "helix.runtime_agent_lane_request_loop.v1",
        legacy_schema: "helix.codex_runtime_lane_request_loop.v1",
        runtime_provider_adapter: "codex",
        status: "lane_observation_reentered",
        requested_by_runtime_provider: true,
        selected_runtime_agent_provider: "codex",
        candidate: {
          capability: "live_translation.translate_text",
          text: "hello",
          target_language: "es",
          requested_backend_provider: "live_translation.google_gemini",
        },
        terminal_eligible: false,
        assistant_answer: false,
      });
      expect(debug.capability_lane_call_results).toEqual(expect.arrayContaining([
        expect.objectContaining({
          ok: true,
          capability: "live_translation.translate_text",
          lane_id: "live_translation",
          translated_text: "hola",
          lane_resolve_trace: expect.objectContaining({
            selected_backend_provider: "live_translation.local_runtime",
          }),
          terminal_eligible: false,
          assistant_answer: false,
        }),
      ]));
      expect(debug.capability_lane_backend_selections).toEqual(expect.arrayContaining([
        expect.objectContaining({
          requested_backend_provider: "live_translation.google_gemini",
          selected_backend_provider: "live_translation.local_runtime",
          selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
          execution_status: "executed_observation_only",
        }),
      ]));
      expect(debug.capability_lane_debug_events).toEqual(expect.arrayContaining([
        expect.objectContaining({ stage: "lane_requested" }),
        expect.objectContaining({ stage: "lane_backend_selected" }),
        expect.objectContaining({ stage: "lane_observation" }),
        expect.objectContaining({ stage: "lane_reentered" }),
      ]));
      expect(debug.capability_lane_turn_timeline).toEqual(expect.arrayContaining([
        expect.objectContaining({
          stage: "lane_visible",
          adapter_boundary: "helix_agent_provider_edge",
          selected_runtime_agent_provider: "codex",
          lane_visible: true,
          lane_requested: false,
          lane_executed: false,
          observation_reentered: false,
        }),
        expect.objectContaining({
          stage: "lane_requested",
          adapter_boundary: "helix_agent_provider_edge",
          selected_runtime_agent_provider: "codex",
          requested_backend_provider: "live_translation.google_gemini",
          requested_backend_provider_known: true,
          selected_backend_provider: "live_translation.local_runtime",
          fallback_backend_provider: null,
          selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
          lane_visible: false,
          lane_requested: true,
          lane_executed: false,
          observation_reentered: false,
        }),
        expect.objectContaining({
          stage: "lane_backend_selected",
          adapter_boundary: "helix_agent_provider_edge",
          selected_runtime_agent_provider: "codex",
          requested_backend_provider: "live_translation.google_gemini",
          requested_backend_provider_known: true,
          selected_backend_provider: "live_translation.local_runtime",
          fallback_backend_provider: null,
          selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
          lane_visible: false,
          lane_requested: true,
          lane_executed: false,
          observation_reentered: false,
        }),
        expect.objectContaining({
          stage: "lane_observation",
          adapter_boundary: "helix_agent_provider_edge",
          capability_id: "live_translation.translate_text",
          requested_backend_provider: "live_translation.google_gemini",
          requested_backend_provider_known: true,
          selected_backend_provider: "live_translation.local_runtime",
          fallback_backend_provider: null,
          selection_reason: "requested_backend_unconfigured_default_backend_selected_by_helix_policy",
          lane_visible: false,
          lane_requested: true,
          lane_executed: true,
          observation_reentered: false,
        }),
        expect.objectContaining({
          stage: "lane_reentered",
          adapter_boundary: "helix_agent_provider_edge",
          lane_id: "live_translation",
          capability_id: "live_translation.translate_text",
          lane_visible: false,
          lane_requested: true,
          lane_executed: false,
          observation_reentered: true,
          observation_ref: expect.any(String),
        }),
        expect.objectContaining({
          stage: "terminal_selected",
          lane_id: "helix_terminal_authority",
          status: "completed",
          lane_visible: false,
          lane_requested: true,
          lane_executed: true,
          observation_reentered: true,
          terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
        }),
      ]));
      expect(debug.provider_reasoning_reentry).toMatchObject({
        status: "completed",
        capability_lane_observation_packet_count: 1,
        evidence_reentered: true,
      });
      expect(debug.terminal_authority_status).toBe("authorized_by_helix_provider_candidate_bridge");
      expect(firstPrompt).toContain("Model-visible Helix capability lane manifest:");
      expect(firstPrompt).toContain("request live_translation.translate_text");
      expect(firstPrompt).toContain("direct translation answer before the lane observation is non-compliant");
      expect(secondPrompt).toContain("Helix executed the runtime-requested capability lane call");
      expect(secondPrompt).toContain("translated_text");
      expect(secondPrompt).toContain("hola");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousCapturePromptPath === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      } else {
        process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = previousCapturePromptPath;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("lets Codex collect a visible translation target before requesting the translation lane", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-visible-translation-chain-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability: "workstation_tool_reference.collect_visible_translation_targets",
            active_panel_id: "docs-viewer",
            doc_path: "docs/research/nhm2.md",
            source_hash: "sha256:full-document-hash",
            projection_target: "docs_chunk",
            account_locale: "es-US",
            target_language: "es",
            visible_only: true,
            max_chunks: 1,
            title_text: "hello",
          }),
        ].join(" "),
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability: "live_translation.translate_text",
            text: "hello",
            target_language: "es",
            source_id: "document_markdown:docs/research/nhm2.md#visible-chunk-1",
            doc_path: "docs/research/nhm2.md",
            source_hash: "sha256:full-document-hash",
            source_kind: "docs_viewer",
            account_locale: "es-US",
            chunk_id: "visible-chunk-1",
            chunk_index: 0,
            projection_target: "docs_chunk",
          }),
        ].join(" "),
        "The visible document title translates to hola.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-visible-translation-chain",
          question: "Translate the visible document title to Spanish.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const collectorPrompt = fs.readFileSync(path.join(tempDir, "prompt.2.txt"), "utf8");
      const finalPrompt = fs.readFileSync(path.join(tempDir, "prompt.3.txt"), "utf8");

      expect(result).toMatchObject({
        ok: true,
        runtime: "codex",
        response_type: "final_answer",
        final_status: "completed",
        answer: "The visible document title translates to hola.",
      });
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        chain_step_count: 2,
        candidate: expect.objectContaining({
          capability: "workstation_tool_reference.collect_visible_translation_targets",
        }),
        chained_candidate: expect.objectContaining({
          capability: "live_translation.translate_text",
          text: "hello",
          target_language: "es",
        }),
        visible_translation_collector_chain: expect.objectContaining({
          schema: "helix.runtime_agent_visible_translation_chain.v1",
          collector_requested: true,
          translation_requested: true,
          collected_target_count: 1,
          collector_observation_ref: expect.any(String),
          collector_batch_ref: expect.any(String),
          first_collected_source_id: "document_markdown:docs/research/nhm2.md#visible-chunk-1",
          first_collected_doc_path: "docs/research/nhm2.md",
          first_collected_chunk_id: "visible-chunk-1",
          first_collected_source_event_id: expect.stringContaining("visible-chunk-1"),
          first_collected_source_hash: "sha256:full-document-hash",
          first_collected_source_text_hash: expect.stringMatching(/^sha256:/),
          first_collected_source_text_char_count: "hello".length,
          first_collected_projection_target: "docs_chunk",
          first_collected_target_language: "es",
          translation_observation_ref: expect.any(String),
          translation_receipt_ref: expect.any(String),
          projection_receipt_status: "projected",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(debug.runtime_lane_request_contract).toMatchObject({
        execution_status: "lane_observation_reentered",
        observation_packet_count: 2,
        helix_executes_only_structured_runtime_lane_requests: true,
      });
      expect(debug.capability_lane_call_results.map((call: Record<string, unknown>) => call.capability)).toEqual([
        "workstation_tool_reference.collect_visible_translation_targets",
        "live_translation.translate_text",
      ]);
      expect(debug.capability_lane_call_results).toEqual(expect.arrayContaining([
        expect.objectContaining({
          ok: true,
          capability: "workstation_tool_reference.collect_visible_translation_targets",
          target_count: 1,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        expect.objectContaining({
          ok: true,
          capability: "live_translation.translate_text",
          translated_text: "hola",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      ]));
      expect(debug.capability_lane_observation_packets.map((packet: Record<string, unknown>) => packet.capability_key)).toEqual([
        "workstation_tool_reference.collect_visible_translation_targets",
        "live_translation.translate_text",
      ]);
      expect(debug.capability_lane_turn_timeline).toEqual(expect.arrayContaining([
        expect.objectContaining({
          stage: "lane_observation",
          lane_id: "workstation_tool_reference",
          capability_id: "workstation_tool_reference.collect_visible_translation_targets",
          lane_executed: true,
          terminal_eligible: false,
          assistant_answer: false,
        }),
        expect.objectContaining({
          stage: "lane_projection_receipt",
          lane_id: "live_translation",
          capability_id: "live_translation.translate_text",
          source_id: "document_markdown:docs/research/nhm2.md#visible-chunk-1",
          latest_chunk_id: "visible-chunk-1",
          latest_target_language: "es",
          source_projection_target: "docs_chunk",
          terminal_eligible: false,
          assistant_answer: false,
        }),
        expect.objectContaining({
          stage: "terminal_selected",
          lane_id: "helix_terminal_authority",
          status: "completed",
          observation_reentered: true,
          terminal_authority_status: "authorized_by_helix_provider_candidate_bridge",
        }),
      ]));
      expect(collectorPrompt).toContain("request one or more live_translation.translate_text lane calls");
      expect(collectorPrompt).toContain("visible_translation_target_batch");
      expect(finalPrompt).toContain("visible target collector and then the runtime-requested translation lane call");
      expect(finalPrompt).toContain("live_translation_projection_receipt");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousCapturePromptPath === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      } else {
        process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = previousCapturePromptPath;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("chains visible document translation through collector before live translation", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-visible-translation-chain-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"workstation.visible_text.collect_translation_targets","active_panel_id":"docs-viewer","doc_path":"docs/research/nhm2.md","source_hash":"sha256:full-document-hash","projection_target":"docs_chunk","account_locale":"es-US","target_language":"es","visible_only":true,"max_chunks":2,"visible_text_chunks":[{"visible_text":"hello","chunk_id":"title","chunk_index":0,"region_id":"title","bbox":{"x":8,"y":16,"width":220,"height":32,"source":"visible-doc-title"},"source_kind":"docs_viewer","existing_observation_ref":"ask:lane:existing:obs","existing_receipt_ref":"ask:lane:existing:receipt","existing_projection_status":"projected","existing_freshness_status":"fresh","existing_terminal_authority_status":"not_terminal_authority"}]}',
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"live_translation.translate_text","text":"hello","source_language":"en","target_language":"es","source_id":"document_markdown:docs/research/nhm2.md#title","doc_path":"docs/research/nhm2.md","source_hash":"sha256:full-document-hash","source_kind":"docs_viewer","account_locale":"es-US","chunk_id":"title","chunk_index":0,"bbox":{"x":8,"y":16,"width":220,"height":32,"source":"visible-doc-title"},"dedupe_key":"document_markdown:docs/research/nhm2.md#title:sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824:es:title","projection_target":"docs_chunk"}',
        "The visible document title translation is hola.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-visible-document-translation-chain",
          question: "Traduce este documento visible al español.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const firstPrompt = fs.readFileSync(capturePromptPath, "utf8");
      const collectorReentryPrompt = fs.readFileSync(path.join(tempDir, "prompt.2.txt"), "utf8");
      const translationReentryPrompt = fs.readFileSync(path.join(tempDir, "prompt.3.txt"), "utf8");
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const observationPackets = debug.capability_lane_observation_packets as Array<Record<string, any>>;

      expect(result).toMatchObject({
        ok: true,
        runtime: "codex",
        response_type: "final_answer",
        final_status: "completed",
        answer: "The visible document title translation is hola.",
      });
      expect(callResults.map((call) => call.capability)).toEqual([
        "workstation_tool_reference.collect_visible_translation_targets",
        "live_translation.translate_text",
      ]);
      expect(observationPackets.map((packet) => packet.capability_key)).toEqual([
        "workstation_tool_reference.collect_visible_translation_targets",
        "live_translation.translate_text",
      ]);
      expect(callResults.map((call) => call.capability)).not.toContain("docs-viewer.read_visible_surface");
      expect(observationPackets.map((packet) => packet.capability_key)).not.toContain("docs-viewer.read_visible_surface");
      expect(callResults[0]).toMatchObject({
        ok: true,
        lane_id: "workstation_tool_reference",
        capability: "workstation_tool_reference.collect_visible_translation_targets",
        observation: expect.objectContaining({
          target_batch: expect.objectContaining({
            target_count: 1,
            translation_capability_required: "live_translation.translate_text",
            targets: [
              expect.objectContaining({
                source_kind: "docs_viewer",
                panel_id: "docs-viewer",
                doc_path: "docs/research/nhm2.md",
                source_id: "document_markdown:docs/research/nhm2.md#title",
                source_hash: "sha256:full-document-hash",
                source_text_hash: "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
                chunk_id: "title",
                chunk_index: 0,
                bbox: { x: 8, y: 16, width: 220, height: 32, source: "visible-doc-title" },
                projection_target: "docs_chunk",
                account_locale: "es-US",
                target_language: "es",
                existing_observation_ref: "ask:lane:existing:obs",
                existing_receipt_ref: "ask:lane:existing:receipt",
                existing_translation_receipt_ref: "ask:lane:existing:receipt",
                existing_projection_status: "projected",
                existing_freshness_status: "fresh",
                existing_terminal_authority_status: "not_terminal_authority",
                terminal_eligible: false,
                assistant_answer: false,
                raw_content_included: false,
              }),
            ],
          }),
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(callResults[1]).toMatchObject({
        ok: true,
        lane_id: "live_translation",
        capability: "live_translation.translate_text",
        translated_text: "hola",
        observation: expect.objectContaining({
          source_id: "document_markdown:docs/research/nhm2.md#title",
          doc_path: "docs/research/nhm2.md",
          source_hash: "sha256:full-document-hash",
          source_kind: "docs_viewer",
          chunk_id: "title",
          bbox: { x: 8, y: 16, width: 220, height: 32, source: "visible-doc-title" },
          target_language: "es",
          terminal_authority_status: "pending_helix_terminal_authority",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(observationPackets[1].state_delta.live_translation_projection_receipt).toMatchObject({
        source_id: "document_markdown:docs/research/nhm2.md#title",
        doc_path: "docs/research/nhm2.md",
        source_hash: "sha256:full-document-hash",
        source_text_hash: callResults[1].observation.source_text_hash,
        chunk_id: "title",
        bbox: { x: 8, y: 16, width: 220, height: 32, source: "visible-doc-title" },
        target_language: "es",
        observation_ref: callResults[1].observation.observation_ref,
        receipt_ref: expect.any(String),
        terminal_authority_status: "pending_helix_terminal_authority",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        candidate: expect.objectContaining({
          capability: "workstation.visible_text.collect_translation_targets",
        }),
        chained_candidate: expect.objectContaining({
          capability: "live_translation.translate_text",
        }),
        chain_step_count: 2,
        visible_translation_collector_chain: {
          schema: "helix.runtime_agent_visible_translation_chain.v1",
          requested_collector_capability: "workstation.visible_text.collect_translation_targets",
          collector_capability: "workstation_tool_reference.collect_visible_translation_targets",
          translation_capability: "live_translation.translate_text",
          collector_requested: true,
          translation_requested: true,
          observation_packet_count: 2,
          collected_target_count: 1,
          collector_observation_ref: expect.any(String),
          collector_batch_ref: expect.any(String),
          first_collected_source_id: "document_markdown:docs/research/nhm2.md#title",
          first_collected_doc_path: "docs/research/nhm2.md",
          first_collected_chunk_id: "title",
          first_collected_source_hash: "sha256:full-document-hash",
          first_collected_source_text_hash: "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
          first_collected_source_text_char_count: "hello".length,
          first_collected_projection_target: "docs_chunk",
          first_collected_bbox: { x: 8, y: 16, width: 220, height: 32, source: "visible-doc-title" },
          first_collected_target_language: "es",
          first_collected_existing_observation_ref: "ask:lane:existing:obs",
          first_collected_existing_receipt_ref: "ask:lane:existing:receipt",
          first_collected_existing_projection_status: "projected",
          first_collected_existing_freshness_status: "fresh",
          first_collected_existing_terminal_authority_status: "not_terminal_authority",
          translation_observation_ref: callResults[1].observation.observation_ref,
          translation_receipt_ref: expect.any(String),
          projection_receipt_status: "projected",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      });
      expect(debug.terminal_authority_status).toBe("authorized_by_helix_provider_candidate_bridge");
      expect(firstPrompt).toContain("workstation_tool_reference.collect_visible_translation_targets");
      expect(collectorReentryPrompt).toContain("visible target collection");
      expect(collectorReentryPrompt).toContain("live_translation.translate_text");
      expect(translationReentryPrompt).toContain("visible target collector and then the runtime-requested translation lane call");
      expect(translationReentryPrompt).toContain("hola");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousCapturePromptPath === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      } else {
        process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = previousCapturePromptPath;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("retries Image Lens crop prompts through visual_analysis without stale docs surface reads", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-image-lens-region-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "I can inspect the attached image.",
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"visual_analysis.inspect_image_region","bbox_px":{"x":0,"y":0,"width":800,"height":1152},"question":"Read the visible equation area.","reason_for_crop":"User requested Image Lens crop inspection.","assistant_answer":false,"terminal_eligible":false}',
        "The crop observation is candidate evidence only; no equation is confirmed from this fixture.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-image-lens-region-retry",
          question: "Use the Image Lens region tool to inspect the visible equation area in the attached image. Crop only the equation region and report the bbox.",
          workspace_context_snapshot: {
            activePanel: "image-lens",
            activeDocPath: "docs/audits/research/civilization-bounds-nation-procedural-network-fit-2026-06-17.md",
          },
          turn_input_items: [
            { type: "text", text: "Use the Image Lens region tool.", source: "user" },
            {
              type: "image",
              image_ref: "visual_evidence:image-lens-test",
              image_base64: "test-image",
              mime_type: "image/png",
              file_name: "equation.png",
              evidence_id: "visual_evidence:image-lens-test",
              raw_image_included: false,
            },
          ],
        },
      });
      const debug = result.debug as Record<string, any>;
      const initialPrompt = fs.readFileSync(capturePromptPath, "utf8");
      const retryPrompt = fs.readFileSync(path.join(tempDir, "prompt.2.txt"), "utf8");
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const observationPackets = debug.capability_lane_observation_packets as Array<Record<string, any>>;

      expect(result).toMatchObject({
        ok: true,
        runtime: "codex",
        response_type: "final_answer",
        final_status: "completed",
        answer: "The crop observation is candidate evidence only; no equation is confirmed from this fixture.",
      });
      expect(initialPrompt).toContain("For Image Lens, attached-image, or visible-image requests");
      expect(retryPrompt).toContain("visual_analysis.inspect_image_region");
      expect(callResults.map((call) => call.capability)).toEqual(["visual_analysis.inspect_image_region"]);
      expect(observationPackets.map((packet) => packet.capability_key)).toEqual(["visual_analysis.inspect_image_region"]);
      expect(callResults.map((call) => call.capability)).not.toContain("docs-viewer.read_visible_surface");
      expect(observationPackets.map((packet) => packet.capability_key)).not.toContain("docs-viewer.read_visible_surface");
      expect(callResults[0]).toMatchObject({
        ok: true,
        lane_id: "visual_analysis",
        capability: "visual_analysis.inspect_image_region",
        receipt: expect.objectContaining({
          source_kind: "image_attachment",
          source_image_ref: "data:image/png;base64,test-image",
          bbox_px: { x: 0, y: 0, width: 800, height: 1152 },
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        candidate: expect.objectContaining({
          capability: "visual_analysis.inspect_image_region",
        }),
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousCapturePromptPath === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      } else {
        process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = previousCapturePromptPath;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("augments single Image Lens header crop with requested equation block crops", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-image-lens-reentry-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"visual_analysis.inspect_image_region","bbox_px":{"x":0,"y":0,"width":346,"height":70},"question":"Read the header/caption text at the top.","region_label":"header_caption","reason_for_crop":"User requested separate Image Lens crops; this is the header/caption region.","assistant_answer":false,"terminal_eligible":false}',
        "The Image Lens observations include header and equation crop candidates.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        region_label: "header_caption",
        text_candidate: "As in Chapter 2 we use the Bianchi identities...",
        extraction_status: "partial",
        uncertainty: ["header OCR is fixture-backed candidate evidence"],
      },
      {
        requested_equation_label: "3.51",
        latex_candidate: "\\delta\\psi_c - \\nabla\\psi + \\Phi\\sigma_0 - S\\phi_0 = \\cdots",
        extraction_status: "partial",
        uncertainty: ["math OCR is fixture-backed candidate evidence"],
      },
      {
        requested_equation_label: "3.52",
        extraction_status: "failed",
        uncertainty: ["fixture intentionally returned no equation transcription"],
      },
      {
        requested_equation_label: "3.53",
        extraction_status: "failed",
        uncertainty: ["fixture intentionally returned no equation transcription"],
      },
      {
        requested_equation_label: "3.54",
        extraction_status: "failed",
        uncertainty: ["fixture intentionally returned no equation transcription"],
      },
      {
        requested_equation_label: "3.55",
        extraction_status: "failed",
        uncertainty: ["fixture intentionally returned no equation transcription"],
      },
    ]);
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-image-lens-equation-blocks",
          question: [
            "Use the Image Lens region tool on the attached image.",
            "Inspect the image in separate crops: 1. Header/caption text at the top.",
            "2. Each numbered equation block separately, especially equations (3.51) through (3.55).",
            "For each crop, report bbox in pixels, exact transcription candidate, LaTeX candidate, and uncertainty notes.",
          ].join(" "),
          workspace_context_snapshot: {
            activePanel: "image-lens",
          },
          turn_input_items: [
            { type: "text", text: "Use the Image Lens region tool.", source: "user" },
            {
              type: "image",
              image_ref: "data:image/png;base64,test-image",
              mime_type: "image/png",
              file_name: "bianchi-equations.png",
              evidence_id: "visual_evidence:image-lens-equations",
              width_px: 346,
              height_px: 372,
              raw_image_included: false,
            },
          ],
        },
      });
      const debug = result.debug as Record<string, any>;
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const observationPackets = debug.capability_lane_observation_packets as Array<Record<string, any>>;
      const labels = callResults.map((call) => call.receipt?.requested_equation_label ?? call.receipt?.region_label);

      expect(result).toMatchObject({
        ok: true,
        answer: "The Image Lens observations include header and equation crop candidates.",
      });
      expect(callResults.map((call) => call.capability)).toEqual([
        "visual_analysis.inspect_image_region",
        "visual_analysis.inspect_image_region",
        "visual_analysis.inspect_image_region",
        "visual_analysis.inspect_image_region",
        "visual_analysis.inspect_image_region",
        "visual_analysis.inspect_image_region",
      ]);
      expect(observationPackets).toHaveLength(6);
      expect(labels).toEqual(["header_caption", "3.51", "3.52", "3.53", "3.54", "3.55"]);
      expect(callResults[1].receipt).toMatchObject({
        region_label: "equation_3.51",
        requested_equation_label: "3.51",
        bbox_px: { x: 0, y: 70, width: 346, height: expect.any(Number) },
        latex_candidate: "\\delta\\psi_c - \\nabla\\psi + \\Phi\\sigma_0 - S\\phi_0 = \\cdots",
        extraction_status: "partial",
        terminal_eligible: false,
        assistant_answer: false,
      });
      expect(callResults.slice(2).map((call) => call.receipt?.extraction_status)).toEqual([
        "failed",
        "failed",
        "failed",
        "failed",
      ]);
      expect(observationPackets[1]).toMatchObject({
        state_delta: {
          visual_analysis_region_inspection: {
            requested_equation_label: "3.51",
            latex_candidate: "\\delta\\psi_c - \\nabla\\psi + \\Phi\\sigma_0 - S\\phi_0 = \\cdots",
            extraction_status: "partial",
          },
        },
      });
      const reentryPrompt = fs.readFileSync(capturePromptPath.replace(/(\.[^./\\]+)?$/, ".2$1"), "utf8");
      expect(reentryPrompt).toContain("using only Image Lens extraction evidence");
      expect(reentryPrompt).toContain("bbox/crop receipts alone are not text or equation transcription authority");
      expect(reentryPrompt).toContain("Only report exact text or LaTeX candidates that appear in text_candidate or latex_candidate fields");
      expect(reentryPrompt).toContain("For crops with extraction_status failed/not_run and no candidate fields");
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        image_lens_region_candidate_augmented: true,
        synthesis_reason: "explicit_image_lens_multi_region_prompt_missing_requested_equation_crops",
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousCapturePromptPath === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      } else {
        process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = previousCapturePromptPath;
      }
      if (previousExtractionFixtures === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("augments single Image Lens equation crop with requested caption text crop", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"visual_analysis.inspect_image_region","bbox_px":{"x":10,"y":8,"width":326,"height":238},"question":"Inspect the equation area first.","region_label":"equation_area","reason_for_crop":"User requested equation area first.","assistant_answer":false,"terminal_eligible":false}',
        "The Image Lens observations include equation and caption crop candidates.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        region_label: "equation_area",
        extraction_status: "failed",
        uncertainty: ["fixture intentionally returned no equation transcription"],
      },
      {
        region_label: "caption_text",
        text_candidate: "As in Chapter 2 we use the Bianchi identities...",
        extraction_status: "partial",
        uncertainty: ["caption OCR is fixture-backed candidate evidence"],
      },
    ]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-image-lens-equation-caption",
          question: [
            "Use the Image Lens region tool on the attached image.",
            "Inspect the equation area first, then inspect the caption/text area separately.",
            "For each crop, report the bbox, what information was extracted, and uncertainty.",
          ].join(" "),
          workspace_context_snapshot: {
            activePanel: "image-lens",
          },
          turn_input_items: [
            { type: "text", text: "Use the Image Lens region tool.", source: "user" },
            {
              type: "image",
              image_ref: "visual_evidence:image-lens-caption-test",
              image_base64: "test-image",
              mime_type: "image/png",
              file_name: "equation-caption.png",
              evidence_id: "visual_evidence:image-lens-caption-test",
              width_px: 346,
              height_px: 372,
              raw_image_included: false,
            },
          ],
        },
      });
      const debug = result.debug as Record<string, any>;
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const labels = callResults.map((call) => call.receipt?.region_label);

      expect(result).toMatchObject({
        ok: true,
        answer: "The Image Lens observations include equation and caption crop candidates.",
      });
      expect(labels).toEqual(["equation_area", "caption_text"]);
      expect(callResults[0].receipt).toMatchObject({
        source_image_ref: "data:image/png;base64,test-image",
        extraction_status: "failed",
      });
      expect(callResults[1].receipt).toMatchObject({
        region_label: "caption_text",
        source_image_ref: "data:image/png;base64,test-image",
        bbox_px: { x: 0, y: 0, width: 346, height: expect.any(Number) },
        text_candidate: "As in Chapter 2 we use the Bianchi identities...",
        extraction_status: "partial",
        terminal_eligible: false,
        assistant_answer: false,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousExtractionFixtures === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
      }
    }
  });

  it("bridges scientific Image Lens sidecars into Theory Badge Graph when reflection is requested", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "The scientific image sidecar was reflected through the Theory Badge Graph observation.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        region_label: "scientific_page",
        text_candidate: "Bianchi identities as field equations for the Weyl tensor.",
        latex_candidate: "\\nabla^{AA'}\\psi_{ABCD}=0",
        extraction_status: "extracted",
        uncertainty: ["fixture-backed OCR/math candidate"],
      },
      ...["3.51", "3.52", "3.53", "3.54", "3.55"].map((label) => ({
        region_label: `equation_${label}`,
        requested_equation_label: label,
        text_candidate: `Bianchi Weyl equation row \\nabla^\\mu \\psi_\\nu - D_\\nu S_\\phi = 0 (${label})`,
        latex_candidate: `\\nabla^\\mu \\psi_\\nu - D_\\nu S_\\phi = 0 \\tag{${label}}`,
        extraction_status: "extracted",
        uncertainty: ["fixture-backed labeled equation row"],
      })),
    ]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-sidecar-theory-bridge",
          question: "Here is a scientific document image. Extract the equations and compare them to the theory badge graph.",
          source_target_intent: {
            schema: "helix.ask_source_target_intent.v1",
            target_source: "scientific_image_evidence",
            target_kind: "scientific_image_evidence_sidecar",
            requested_outputs: [
              "image_lens_crop_observation",
              "scientific_evidence_packet",
              "scientific_evidence_sidecar",
              "theory_reflection",
              "calculator_payload_filter",
              "typed_failure",
            ],
            assistant_answer: false,
            raw_content_included: false,
          },
          mandatory_next_tool: {
            schema: "helix.mandatory_next_tool.v1",
            tool_name: "visual_analysis.inspect_image_region",
            missing_required_evidence: "scientific_evidence_sidecar",
            terminal_forbidden: true,
          },
          workspace_context_snapshot: {
            activePanel: "image-lens",
          },
          turn_input_items: [
            {
              type: "image",
              image_ref: "visual_evidence:scientific-image-sidecar-bridge",
              image_base64: "test-image",
              mime_type: "image/png",
              file_name: "scientific-page.png",
              evidence_id: "visual_evidence:scientific-image-sidecar-bridge",
              width_px: 346,
              height_px: 372,
              raw_image_included: false,
            },
          ],
        },
      });
      const debug = result.debug as Record<string, any>;
      const gatewayResults = debug.workstation_gateway_call_results as Array<Record<string, any>>;
      const theoryResult = gatewayResults.find((entry) =>
        entry.capability_id === "theory-badge-graph.reflect_discussion_context"
      );

      expect(result).toMatchObject({
        ok: true,
        answer: "The scientific image sidecar was reflected through the Theory Badge Graph observation.",
      });
      expect(theoryResult).toBeTruthy();
      expect(theoryResult?.observation).toMatchObject({
        scientific_evidence_source: "sidecar",
        scientific_evidence_sidecar: {
          schema: "helix.scientific_image_evidence_sidecar.v1",
          sidecar_id: "turn-codex-scientific-image-sidecar-theory-bridge:scientific_image_evidence_sidecar",
          packet_count: 8,
          admissibility: {
            status: "admissible_observation",
          },
        },
        scientific_branch_gate: {
          status: expect.stringMatching(/admitted|restricted/),
          primary_domain: "weyl_bianchi",
        },
      });
      expect(debug.current_turn_artifact_ledger).toEqual(expect.arrayContaining([
        expect.objectContaining({
          kind: "scientific_image_evidence_sidecar",
          artifact_id: expect.stringContaining(":scientific_image_sidecar"),
          sidecar_id: expect.stringContaining(":scientific_image_sidecar"),
          memory_kind: "transient_scientific_image_evidence",
          retrieval_tags: expect.arrayContaining(["scientific_image", "image_lens", "weyl_bianchi"]),
          primary_domain: "weyl_bianchi",
          admissibility_status: "admissible_observation",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
      ]));
      expect(debug.runtime_lane_request_loop).toMatchObject({
        scientific_image_sidecar_gateway_bridge: {
          status: "completed",
          capability_id: "theory-badge-graph.reflect_discussion_context",
          result_count: 1,
        },
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousExtractionFixtures === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
      }
    }
  });

  it("blocks scientific Image Lens theory reflection when the sidecar is inadmissible", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "The image evidence sidecar was not admissible, so graph reflection was blocked.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        region_label: "scientific_page",
        extraction_status: "failed",
        uncertainty: ["fixture intentionally returned no OCR or math candidate"],
      },
    ]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-sidecar-theory-blocked",
          question: "Here is a scientific document image. Extract the equations and compare them to the theory badge graph.",
          source_target_intent: {
            schema: "helix.ask_source_target_intent.v1",
            target_source: "scientific_image_evidence",
            target_kind: "scientific_image_evidence_sidecar",
            requested_outputs: [
              "image_lens_crop_observation",
              "scientific_evidence_packet",
              "scientific_evidence_sidecar",
              "theory_reflection",
              "calculator_payload_filter",
              "typed_failure",
            ],
            assistant_answer: false,
            raw_content_included: false,
          },
          mandatory_next_tool: {
            schema: "helix.mandatory_next_tool.v1",
            tool_name: "visual_analysis.inspect_image_region",
            missing_required_evidence: "scientific_evidence_sidecar",
            terminal_forbidden: true,
          },
          workspace_context_snapshot: {
            activePanel: "image-lens",
          },
          turn_input_items: [
            {
              type: "image",
              image_ref: "visual_evidence:scientific-image-sidecar-blocked",
              image_base64: "test-image",
              mime_type: "image/png",
              file_name: "scientific-page.png",
              evidence_id: "visual_evidence:scientific-image-sidecar-blocked",
              width_px: 346,
              height_px: 372,
              raw_image_included: false,
            },
          ],
        },
      });
      const debug = result.debug as Record<string, any>;
      const gatewayResults = debug.workstation_gateway_call_results as Array<Record<string, any>>;

      expect(result).toMatchObject({
        ok: true,
        answer: "The image evidence sidecar was not admissible, so graph reflection was blocked.",
      });
      expect(gatewayResults.some((entry) =>
        entry.capability_id === "theory-badge-graph.reflect_discussion_context"
      )).toBe(false);
      expect(debug.runtime_lane_request_loop).toMatchObject({
        scientific_image_sidecar_gateway_bridge: {
          status: "blocked",
          capability_id: "theory-badge-graph.reflect_discussion_context",
          result_count: 0,
          blocked_reason: "scientific_image_exact_row_promotion_missing",
          sidecar_admissibility_status: "inadmissible_for_exact_mapping",
        },
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousExtractionFixtures === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
      }
    }
  });

  it("blocks scientific image theory reflection when no image sidecar can be materialized", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "No image evidence sidecar was available, so graph reflection was blocked.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-sidecar-theory-missing",
          question: "Here is a scientific document image. Extract the equations and compare them to the theory badge graph.",
          source_target_intent: {
            schema: "helix.ask_source_target_intent.v1",
            target_source: "scientific_image_evidence",
            target_kind: "scientific_image_evidence_sidecar",
            requested_outputs: [
              "image_lens_crop_observation",
              "scientific_evidence_packet",
              "scientific_evidence_sidecar",
              "theory_reflection",
              "calculator_payload_filter",
              "typed_failure",
            ],
            assistant_answer: false,
            raw_content_included: false,
          },
          mandatory_next_tool: {
            schema: "helix.mandatory_next_tool.v1",
            tool_name: "visual_analysis.inspect_image_region",
            missing_required_evidence: "scientific_evidence_sidecar",
            terminal_forbidden: true,
          },
          workspace_context_snapshot: {
            activePanel: "image-lens",
          },
        },
      });
      const debug = result.debug as Record<string, any>;
      const gatewayResults = debug.workstation_gateway_call_results as Array<Record<string, any>>;

      expect(result).toMatchObject({
        ok: false,
        response_type: "final_failure",
        final_status: "final_failure",
        final_answer_source: "typed_failure",
        terminal_artifact_kind: "typed_failure",
      });
      expect(result.answer).toContain("could not retrieve the prior scientific image evidence sidecar");
      expect(debug.capability_lane_call_results ?? []).toEqual([]);
      expect(gatewayResults.some((entry) =>
        entry.capability_id === "theory-badge-graph.reflect_discussion_context"
      )).toBe(false);
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "prior_scientific_image_sidecar_lookup_failed",
        scientific_image_sidecar_gateway_bridge: {
          status: "blocked",
          capability_id: "theory-badge-graph.reflect_discussion_context",
          result_count: 0,
          blocked_reason: "scientific_image_evidence_sidecar_lookup_failed",
        },
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("re-enters the latest scientific image sidecar but blocks Theory Badge Graph without promoted exact rows", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "The Image Lens evidence sidecar was filed.",
        "The prior scientific image sidecar was re-entered, but exact graph reflection was blocked.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        region_label: "scientific_page",
        text_candidate: "Bianchi identities as field equations for the Weyl tensor.",
        latex_candidate: "\\nabla^{AA'}\\psi_{ABCD}=0",
        extraction_status: "extracted",
        uncertainty: ["fixture-backed OCR/math candidate"],
      },
      ...["3.51", "3.52", "3.53", "3.54", "3.55"].map((label) => ({
        region_label: `equation_${label}`,
        requested_equation_label: label,
        text_candidate: `Bianchi Weyl equation row \\nabla^\\mu \\psi_\\nu - D_\\nu S_\\phi = 0 (${label})`,
        latex_candidate: `\\nabla^\\mu \\psi_\\nu - D_\\nu S_\\phi = 0 \\tag{${label}}`,
        extraction_status: "extracted",
        uncertainty: ["fixture-backed labeled equation row"],
      })),
    ]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-continuation-source",
          session_id: "session-codex-scientific-image-continuation",
          question: "Use Image Lens on this scientific page and file the extracted equations as evidence.",
          workspace_context_snapshot: {
            activePanel: "image-lens",
          },
          capability_lane_call: {
            capability: "visual_analysis.inspect_image_region",
            region_label: "scientific_page",
            bbox_px: { x: 0, y: 0, width: 346, height: 361 },
            question: "Extract the scientific equation evidence from the page.",
            reason_for_crop: "The whole page contains the equation rows.",
            assistant_answer: false,
            terminal_eligible: false,
          },
          turn_input_items: [
            {
              type: "image",
              image_ref: "visual_evidence:scientific-image-continuation",
              image_base64: "test-image",
              mime_type: "image/png",
              file_name: "scientific-page.png",
              evidence_id: "visual_evidence:scientific-image-continuation",
              width_px: 346,
              height_px: 372,
              raw_image_included: false,
            },
          ],
        },
      });

      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-continuation-reflect",
          session_id: "session-codex-scientific-image-continuation",
          question: "Now compare this image and the previous Image Lens result against the Theory Badge Graph and report whether calculator payloads are admissible.",
          workspace_context_snapshot: {
            activePanel: "theory-badge-graph",
          },
        },
      });
      const debug = result.debug as Record<string, any>;
      const gatewayResults = debug.workstation_gateway_call_results as Array<Record<string, any>>;
      const theoryResult = gatewayResults.find((entry) =>
        entry.capability_id === "theory-badge-graph.reflect_discussion_context"
      );

      expect(result).toMatchObject({
        ok: true,
      });
      expect(result.answer).toContain("no promoted exact equation row exists yet");
      expect(result.answer).toContain("Theory Badge Graph reflection from a promoted row is blocked");
      expect(debug.scientific_image_evidence_continuation_lookup).toMatchObject({
        status: "found",
        source: "current_turn_sidecar",
        sidecar_id: expect.stringContaining("turn-codex-scientific-image-continuation-source:"),
      });
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "prior_scientific_image_sidecar_reentered",
        scientific_image_sidecar_gateway_bridge: {
          status: "blocked",
          bridge_source: "prior_turn_sidecar",
          capability_id: "theory-badge-graph.reflect_discussion_context",
          blocked_reason: "scientific_image_exact_row_promotion_missing",
        },
      });
      expect(theoryResult).toBeUndefined();
      expect(debug.current_turn_artifact_ledger).toEqual(expect.arrayContaining([
        expect.objectContaining({
          kind: "scientific_image_evidence_sidecar",
          source_scope: "prior_turn_context",
          sidecar_id: expect.stringContaining("turn-codex-scientific-image-continuation-source:"),
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
      ]));
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousExtractionFixtures === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
      }
    }
  });

  it("answers evidence continuity from the latest scientific Image Lens sidecar before scholarly memory", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "The page-level scientific Image Lens evidence was filed.",
        "The provider would otherwise ask for lookup_papers.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        region_label: "scholarly_pdf_page_2_equation_pass",
        text_candidate: "E_ab = R_ab - 1/2 R g_ab",
        latex_candidate: "E_{ab} = R_{ab} - \\frac{1}{2} R g_{ab}",
        extraction_status: "partial",
        uncertainty: ["fixture page-level equation candidate"],
      },
    ]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-continuity-source",
          session_id: "session-codex-scientific-image-continuity",
          question: "Now inspect page 2 of that same paper and extract the first displayed equation with page evidence.",
          capability_lane_call: {
            capability: "visual_analysis.inspect_image_region",
            source_id: "pdf_page_render:continuity-paper:page:2",
            source_kind: "pdf_page_render",
            source_image_ref: "data:image/png;base64,test-page-image",
            source_dimensions_px: { width: 1224, height: 1584 },
            bbox_px: { x: 0, y: 0, width: 1224, height: 1584 },
            page_number: 2,
            region_label: "scholarly_pdf_page_2_equation_pass",
            question: "Extract the first displayed equation from page 2.",
            reason_for_crop: "Page-level scholarly PDF equation extraction.",
            assistant_answer: false,
            terminal_eligible: false,
          },
        },
      });

      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-continuity-followup",
          session_id: "session-codex-scientific-image-continuity",
          question: "Tell me which paper, page, equation, crop ref, and evidence depth you are using from the prior steps.",
        },
      });
      const debug = result.debug as Record<string, any>;

      expect(result).toMatchObject({
        ok: true,
        final_answer_source: "scientific_image_evidence_continuity_summary",
        terminal_artifact_kind: "scientific_image_evidence_continuity_summary",
      });
      expect(result.text).toContain("latest scientific Image Lens evidence chain");
      expect(result.text).toContain("Evidence depth: `page_image_ocr_math_candidate`");
      expect(result.text).toContain("Page: `2`");
      expect(result.text).toContain("E_{ab} = R_{ab}");
      expect(result.text).not.toContain("lookup_papers observation packet");
      expect(debug.scientific_image_evidence_continuity_lookup).toMatchObject({
        status: "found",
        source: "current_turn_sidecar",
        source_material: expect.objectContaining({
          source_id: "pdf_page_render:continuity-paper:page:2",
          source_kind: "pdf_page_render",
          has_inline_source_image_data: true,
        }),
      });
      expect(debug.followup_referent_resolution).toBeNull();
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousExtractionFixtures === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
      }
    }
  });

  it("retries a partial exact equation row from prior Image Lens sidecar before graph reflection", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "The partial row sidecar was filed.",
        "The retried scientific image sidecar was reflected.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        bbox_key: "0,305,346,56",
        text_candidate: "partial row candidate (3.55)\nsecond equation-like line",
        latex_candidate: "\\nabla_\\mu \\psi_\\nu = 0 \\tag{3.55}\n\\Delta \\phi = 0",
        extraction_status: "partial",
        uncertainty: ["fixture initial partial row"],
      },
      {
        region_label: "retry_equation_3.55",
        text_candidate: "Bianchi Weyl exact row nabla_mu psi_nu equals zero (3.55)",
        latex_candidate: "\\nabla_\\mu \\psi_\\nu = 0 \\tag{3.55}",
        extraction_status: "extracted",
        uncertainty: [],
      },
    ]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-retry-source",
          session_id: "session-codex-scientific-image-retry",
          question: "Use Image Lens on this exact equation row and file the extracted equation evidence.",
          capability_lane_call: {
            capability: "visual_analysis.inspect_image_region",
            region_label: "equation_3.55",
            requested_equation_label: "3.55",
            bbox_px: { x: 0, y: 305, width: 346, height: 56 },
            question: "Extract equation row 3.55.",
            reason_for_crop: "Exact row extraction.",
            assistant_answer: false,
            terminal_eligible: false,
          },
          turn_input_items: [{
            type: "image",
            image_ref: "visual_evidence:scientific-image-retry",
            image_base64: "test-image",
            mime_type: "image/png",
            evidence_id: "visual_evidence:scientific-image-retry",
            width_px: 346,
            height_px: 372,
            raw_image_included: false,
          }],
        },
      });

      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-retry-reflect",
          session_id: "session-codex-scientific-image-retry",
          question: "Now compare the extracted equations against the Theory Badge Graph and report calculator payload admissibility.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const retry = debug.scientific_image_evidence_retry as Record<string, any>;
      const bridge = debug.runtime_lane_request_loop?.scientific_image_sidecar_gateway_bridge;

      expect(result.ok).toBe(true);
      expect(retry).toMatchObject({
        status: "completed",
        retry_candidate_count: 2,
        source_material_recovered: true,
        final_sidecar_admissibility: "admissible_observation",
      });
      expect(retry.retry_candidates[0]).toMatchObject({
        requested_equation_label: "3.55",
        retry_variant: "padded_row",
        original_bbox_px: { x: 0, y: 305, width: 346, height: 56 },
        retry_bbox_px: { x: 0, y: 301, width: 346, height: 64 },
        retry_bbox_lineage: expect.arrayContaining([
          expect.objectContaining({ stage: "original", bbox_px: { x: 0, y: 305, width: 346, height: 56 } }),
          expect.objectContaining({ stage: "retry", bbox_px: { x: 0, y: 301, width: 346, height: 64 } }),
        ]),
      });
      expect(retry.final_exact_equation_summary.admissible_row_count).toBeGreaterThanOrEqual(1);
      expect(retry.final_exact_equation_summary.promoted_row_count).toBeGreaterThanOrEqual(1);
      expect(bridge).toMatchObject({
        status: "completed",
        bridge_source: "prior_turn_sidecar",
        sidecar_admissibility_status: "admissible_observation",
      });
    } finally {
      if (previousStdout === undefined) delete process.env.CODEX_AGENT_FAKE_STDOUT;
      else process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      if (previousStdoutSequence === undefined) delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      else process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      if (previousCallIndex === undefined) delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      else process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      if (previousExitCode === undefined) delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      else process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      if (previousExtractionFixtures === undefined) delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      else process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
    }
  });

  it("uses retained PDF page image material to retry an unlabeled exact equation row crop", async () => {
    const sourcePng =
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGElEQVR42mP8z8DwnwEJMDGgAcYBDAwAODsEBkXvxpUAAAAASUVORK5CYII=";
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "The page-level PDF equation evidence was filed.",
        "I can’t request the row crop from this turn because the required Image Lens inputs are missing: no admitted source_id for page 2 and no exact row bbox_px are available in the context.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.HELIX_IMAGE_LENS_EXTRACTION_BACKEND = "fixture";
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        region_label: "scholarly_pdf_page_2_equation_pass",
        text_candidate: "S[phi, g] = -1/2 integral d^Dx sqrt(-g) phi [Box + xi R] phi",
        latex_candidate: "S[\\varphi, g] = -\\frac{1}{2} \\int d^Dx \\sqrt{-g} \\varphi \\left[ \\Box + \\xi R \\right] \\varphi",
        extraction_status: "extracted",
        uncertainty: ["fixture full-page PDF extraction produced a page-level target candidate"],
      },
      {
        bbox_key: "73,190,1078,87",
        text_candidate: "S[phi, g] = -1/2 integral d^Dx sqrt(-g) phi [Box + xi R] phi",
        latex_candidate: "S[\\varphi, g] = -\\frac{1}{2} \\int d^Dx \\sqrt{-g} \\varphi \\left[ \\Box + \\xi R \\right] \\varphi",
        extraction_status: "extracted",
        uncertainty: [],
      },
    ]);

    await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "turn-codex-pdf-page-exact-row-retry-seed",
        session_id: "session-codex-pdf-page-exact-row-retry",
        question: "Inspect page 2 of the paper and extract the first displayed equation with page evidence.",
        capability_lane_call: {
          capability: "visual_analysis.inspect_image_region",
          source_id: "pdf_page_render:test-paper:page:2",
          source_kind: "pdf_page_render",
          source_image_ref: `data:image/png;base64,${sourcePng}`,
          source_dimensions_px: { width: 1224, height: 1584 },
          bbox_px: { x: 0, y: 0, width: 1224, height: 1584 },
          page_number: 2,
          region_label: "scholarly_pdf_page_2_equation_pass",
          question: "Extract the first displayed equation from page 2.",
          reason_for_crop: "Page-level scholarly PDF equation extraction.",
          assistant_answer: false,
          terminal_eligible: false,
        },
      },
    });

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "turn-codex-pdf-page-exact-row-retry-followup",
        session_id: "session-codex-pdf-page-exact-row-retry",
        question: "Crop only the exact equation row from page 2 and promote it only if the row crop supports exact equation admissibility.",
      },
    });
    const debug = result.debug as Record<string, any>;

    expect(result.ok).toBe(true);
    expect(result.text).toContain("The exact equation-row retry ran from retained Image Lens page evidence.");
    expect(result.text).toContain("Retry status: `completed`");
    expect(result.text).not.toContain("I can’t request the row crop");
    expect(debug.scientific_image_evidence_continuation_lookup).toMatchObject({
      status: "found",
      source_material: expect.objectContaining({
        source_id: "pdf_page_render:test-paper:page:2",
        source_kind: "pdf_page_render",
        has_inline_source_image_data: true,
      }),
    });
    expect(debug.scientific_image_evidence_retry).toMatchObject({
      status: "completed",
      source_material_recovered: true,
    });
    expect(debug.scientific_image_evidence_retry.retry_candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        retry_variant: "row_search_band",
        row_search_band_index: 1,
        retry_bbox_px: { x: 73, y: 190, width: 1078, height: 87 },
      }),
    ]));
    expect(debug.scientific_image_evidence_retry.final_exact_equation_summary.promoted_row_count).toBeGreaterThanOrEqual(1);
  });

  it("demotes row-search fragments that do not overlap the prior page-level equation candidate", async () => {
    const sourcePng =
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGElEQVR42mP8z8DwnwEJMDGgAcYBDAwAODsEBkXvxpUAAAAASUVORK5CYII=";
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "The page-level Lagrangian equation evidence was filed.",
        "I can't crop or promote yet because this turn does not include the page-2 image source id or an exact row bbox_px.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.HELIX_IMAGE_LENS_EXTRACTION_BACKEND = "fixture";
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        region_label: "scholarly_pdf_page_2_equation_pass",
        text_candidate: "L = sqrt(-g) (R + lambda Phi^4)",
        latex_candidate: "L = \\sqrt{-g} \\left( R + \\lambda \\Phi^4 \\right)",
        extraction_status: "extracted",
        uncertainty: [],
      },
      {
        bbox_key: "73,190,1078,87",
        text_candidate: "g and sigma",
        latex_candidate: "g \\quad \\text{and} \\quad \\sigma",
        extraction_status: "extracted",
        uncertainty: [],
      },
      {
        bbox_key: "73,317,1078,87",
        text_candidate: "L = sqrt(-g) (R + lambda Phi^4)",
        latex_candidate: "L = \\sqrt{-g} \\left( R + \\lambda \\Phi^4 \\right)",
        extraction_status: "extracted",
        uncertainty: [],
      },
    ]);

    await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "turn-codex-pdf-page-target-overlap-seed",
        session_id: "session-codex-pdf-page-target-overlap",
        question: "Inspect page 2 of the paper and extract the first displayed equation with page evidence.",
        capability_lane_call: {
          capability: "visual_analysis.inspect_image_region",
          source_id: "pdf_page_render:test-paper-target:page:2",
          source_kind: "pdf_page_render",
          source_image_ref: `data:image/png;base64,${sourcePng}`,
          source_dimensions_px: { width: 1224, height: 1584 },
          bbox_px: { x: 0, y: 0, width: 1224, height: 1584 },
          page_number: 2,
          region_label: "scholarly_pdf_page_2_equation_pass",
          question: "Extract the first displayed equation from page 2.",
          reason_for_crop: "Page-level scholarly PDF equation extraction.",
          assistant_answer: false,
          terminal_eligible: false,
        },
      },
    });

    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "turn-codex-pdf-page-target-overlap-followup",
        session_id: "session-codex-pdf-page-target-overlap",
        question: "Crop only the exact equation row from page 2 and promote it only if the row crop supports exact equation admissibility.",
      },
    });
    const debug = result.debug as Record<string, any>;

    expect(result.ok).toBe(true);
    expect(result.text).toContain("The exact equation-row retry ran from retained Image Lens page evidence.");
    expect(result.text).toContain("Promoted exact rows: `1`");
    expect(debug.scientific_image_evidence_retry).toMatchObject({
      status: "completed",
      target_equation_overlap: expect.objectContaining({
        target_token_count: expect.any(Number),
      }),
      final_exact_equation_summary: expect.objectContaining({
        promoted_row_count: 1,
        partial_row_count: expect.any(Number),
      }),
    });
    expect(debug.scientific_image_evidence_retry.final_exact_equation_summary.promotion_blockers).toEqual(expect.arrayContaining([
      "retry_row_does_not_overlap_prior_page_equation_candidate",
    ]));
  });

  it("searches adjacent PDF pages before exact-row promotion when the current page has no equation target", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionBackend = process.env.HELIX_IMAGE_LENS_EXTRACTION_BACKEND;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "helix-pdf-page-search-"));
    const pdfPath = path.join(tempDir, "paper.pdf");
    writeMinimalPdf(pdfPath, [
      "Title page",
      "Text-only page with no displayed equation",
      "Equation page L = sqrt(-g) (R + lambda Phi^4)",
    ]);
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "The page-level PDF evidence had no equation candidate.",
        "I can’t crop or promote yet because this turn does not include the page-2 image source id or an exact row bbox_px.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.HELIX_IMAGE_LENS_EXTRACTION_BACKEND = "fixture";
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        region_label: "scholarly_pdf_page_2_equation_pass",
        extraction_status: "failed",
        quality_flags: ["no_ocr_or_latex_candidate"],
        uncertainty: ["fixture page 2 has no displayed equation"],
      },
      {
        region_label: "scholarly_pdf_page_3_equation_search",
        text_candidate: "L = sqrt(-g) (R + lambda Phi^4)",
        latex_candidate: "L = \\sqrt{-g} \\left( R + \\lambda \\Phi^4 \\right)",
        extraction_status: "extracted",
        uncertainty: [],
      },
      {
        region_label: "equation_row_search_1",
        text_candidate: "L = sqrt(-g) (R + lambda Phi^4)",
        latex_candidate: "L = \\sqrt{-g} \\left( R + \\lambda \\Phi^4 \\right)",
        extraction_status: "extracted",
        uncertainty: [],
      },
    ]);
    try {
      await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-pdf-adjacent-page-search-seed",
          session_id: "session-codex-pdf-adjacent-page-search",
          question: "Inspect page 2 of that same paper and extract the first displayed equation with page evidence.",
          capability_lane_call: {
            capability: "visual_analysis.inspect_image_region",
            source_id: "pdf_page_render:adjacent-search:page:2",
            source_kind: "pdf_page_render",
            source_image_ref: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGElEQVR42mP8z8DwnwEJMDGgAcYBDAwAODsEBkXvxpUAAAAASUVORK5CYII=",
            source_dimensions_px: { width: 1224, height: 1584 },
            bbox_px: { x: 0, y: 0, width: 1224, height: 1584 },
            page_number: 2,
            page_count: 3,
            scholarly_source_pdf_ref: "artifact://scholarly-pdf/adjacent-search.pdf",
            scholarly_pdf_cache_path: pdfPath,
            region_label: "scholarly_pdf_page_2_equation_pass",
            question: "Extract the first displayed equation from page 2.",
            reason_for_crop: "Page-level scholarly PDF equation extraction.",
            assistant_answer: false,
            terminal_eligible: false,
          },
        },
      });

      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-pdf-adjacent-page-search-followup",
          session_id: "session-codex-pdf-adjacent-page-search",
          question: "Use the page 2 equation you just found. Crop only the exact equation row and promote it only if the row crop supports exact equation admissibility.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const retry = debug.scientific_image_evidence_retry as Record<string, any>;

      expect(result.ok).toBe(true);
      expect(result.text).toContain("The exact equation-row retry ran from retained Image Lens page evidence.");
      expect(retry.page_search).toMatchObject({
        status: "completed",
        found_page_equation_candidate: true,
        attempted_pages: [expect.objectContaining({
          page_number: 3,
          target_equation_found: true,
        })],
      });
      expect(retry.final_exact_equation_summary.promoted_row_count).toBeGreaterThanOrEqual(1);
      expect(retry.source_material).toMatchObject({
        source_kind: "pdf_page_render",
        page_number: 3,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousExtractionBackend === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_BACKEND;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_BACKEND = previousExtractionBackend;
      }
      if (previousExtractionFixtures === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed when prior sidecar retry needs source material that was not retained", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "The partial row sidecar was filed.",
        "This model-only retry answer must not be used.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([{
      bbox_key: "0,305,346,56",
      text_candidate: "partial row candidate (3.55)\nsecond equation-like line",
      latex_candidate: "\\nabla_\\mu \\psi_\\nu = 0 \\tag{3.55}\n\\Delta \\phi = 0",
      extraction_status: "partial",
      uncertainty: ["fixture initial partial row"],
    }]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-retry-missing-source",
          session_id: "session-codex-scientific-image-retry-missing-source",
          question: "Use Image Lens on this exact equation row and file the extracted equation evidence.",
          capability_lane_call: {
            capability: "visual_analysis.inspect_image_region",
            region_label: "equation_3.55",
            requested_equation_label: "3.55",
            bbox_px: { x: 0, y: 305, width: 346, height: 56 },
            question: "Extract equation row 3.55.",
            reason_for_crop: "Exact row extraction.",
            assistant_answer: false,
            terminal_eligible: false,
          },
          turn_input_items: [{
            type: "image",
            image_ref: "ephemeral://image/retry-missing-source",
            evidence_id: "visual_evidence:retry-missing-source",
            width_px: 346,
            height_px: 372,
            raw_image_included: false,
          }],
        },
      });

      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-retry-missing-source-reflect",
          session_id: "session-codex-scientific-image-retry-missing-source",
          question: "Now compare the extracted equations against the Theory Badge Graph.",
        },
      });
      const debug = result.debug as Record<string, any>;

      expect(result).toMatchObject({
        ok: false,
        final_answer_source: "typed_failure",
        terminal_artifact_kind: "typed_failure",
      });
      expect(result.answer).toContain("exact-row retry requires the original image source bytes");
      expect(result.answer).not.toContain("model-only retry answer");
      expect(debug.fail_reason).toBe("scientific_image_retry_source_materialization_missing");
      expect(debug.scientific_image_evidence_retry).toMatchObject({
        status: "source_materialization_missing",
        source_material_recovered: false,
      });
      expect((debug.workstation_gateway_call_results as Array<Record<string, any>>).some((entry) =>
        entry.capability_id === "theory-badge-graph.reflect_discussion_context"
      )).toBe(false);
    } finally {
      if (previousStdout === undefined) delete process.env.CODEX_AGENT_FAKE_STDOUT;
      else process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      if (previousStdoutSequence === undefined) delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      else process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      if (previousCallIndex === undefined) delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      else process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      if (previousExitCode === undefined) delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      else process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      if (previousExtractionFixtures === undefined) delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      else process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
    }
  });

  it("keeps calculator payloads blocked when Image Lens retry remains partial", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "The partial row sidecar was filed.",
        "The still-partial scientific image sidecar was reflected.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        bbox_key: "0,305,346,56",
        text_candidate: "partial row candidate (3.55)\nsecond equation-like line",
        latex_candidate: "\\nabla_\\mu \\psi_\\nu = 0 \\tag{3.55}\n\\Delta \\phi = 0",
        extraction_status: "partial",
        uncertainty: ["fixture initial partial row"],
      },
      {
        region_label: "retry_equation_3.55",
        text_candidate: "partial retry row (3.55)\nsecond equation-like line",
        latex_candidate: "\\nabla_\\mu \\psi_\\nu = 0 \\tag{3.55}\n\\Delta \\phi = 0",
        extraction_status: "partial",
        uncertainty: ["fixture retry still partial"],
      },
    ]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-retry-still-partial",
          session_id: "session-codex-scientific-image-retry-still-partial",
          question: "Use Image Lens on this exact equation row and file the extracted equation evidence.",
          capability_lane_call: {
            capability: "visual_analysis.inspect_image_region",
            region_label: "equation_3.55",
            requested_equation_label: "3.55",
            bbox_px: { x: 0, y: 305, width: 346, height: 56 },
            question: "Extract equation row 3.55.",
            reason_for_crop: "Exact row extraction.",
            assistant_answer: false,
            terminal_eligible: false,
          },
          turn_input_items: [{
            type: "image",
            image_ref: "visual_evidence:scientific-image-retry-still-partial",
            image_base64: "test-image",
            mime_type: "image/png",
            evidence_id: "visual_evidence:scientific-image-retry-still-partial",
            width_px: 346,
            height_px: 372,
            raw_image_included: false,
          }],
        },
      });

      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-image-retry-still-partial-reflect",
          session_id: "session-codex-scientific-image-retry-still-partial",
          question: "Now compare the extracted equations against the Theory Badge Graph and report calculator payload admissibility.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const bridge = debug.runtime_lane_request_loop?.scientific_image_sidecar_gateway_bridge;

      expect(result.ok).toBe(true);
      expect(debug.scientific_image_evidence_retry).toMatchObject({
        status: "completed",
        source_material_recovered: true,
        final_sidecar_admissibility: "unverified_math_observation",
        retry_failure_class: "exact_row_promotion_not_available",
      });
      expect(debug.scientific_image_evidence_retry.final_exact_equation_summary.partial_row_count).toBeGreaterThanOrEqual(1);
      expect(bridge).toMatchObject({
        status: "blocked",
        blocked_reason: "scientific_image_exact_row_promotion_missing",
        sidecar_admissibility_status: "unverified_math_observation",
      });
    } finally {
      if (previousStdout === undefined) delete process.env.CODEX_AGENT_FAKE_STDOUT;
      else process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      if (previousStdoutSequence === undefined) delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      else process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      if (previousCallIndex === undefined) delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      else process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      if (previousExitCode === undefined) delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      else process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      if (previousExtractionFixtures === undefined) delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      else process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
    }
  });

  it.each([
    [
      "extracted image evidence",
      "Now compare the extracted image evidence against the Theory Badge Graph.",
    ],
    [
      "extracted equations",
      "Now compare the extracted equations against the Theory Badge Graph.",
    ],
  ])("fails closed instead of model-only answering when a %s continuation sidecar is missing", async (_label, question) => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    process.env.CODEX_AGENT_FAKE_STDOUT = "This model-only answer must not be used.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: `turn-codex-scientific-image-continuation-missing-${String(_label).replace(/\W+/g, "-")}`,
          session_id: `session-codex-scientific-image-continuation-missing-${String(_label).replace(/\W+/g, "-")}`,
          question,
        },
      });
      const debug = result.debug as Record<string, any>;

      expect(result).toMatchObject({
        ok: false,
        response_type: "final_failure",
        final_status: "final_failure",
        final_answer_source: "typed_failure",
        terminal_artifact_kind: "typed_failure",
      });
      expect(result.answer).toContain("could not retrieve the prior scientific image evidence sidecar");
      expect(result.answer).not.toContain("model-only answer");
      expect(debug.fail_reason).toBe("scientific_image_evidence_sidecar_lookup_failed");
      expect(debug.scientific_image_evidence_continuation_lookup).toMatchObject({
        status: "missing",
      });
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "prior_scientific_image_sidecar_lookup_failed",
        scientific_image_sidecar_gateway_bridge: {
          status: "blocked",
          blocked_reason: "scientific_image_evidence_sidecar_lookup_failed",
        },
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("reports Image Lens observations when the post-observation provider response leaks prompt instructions", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"visual_analysis.inspect_image_region","bbox_px":{"x":10,"y":8,"width":326,"height":238},"question":"Inspect the equation area first.","region_label":"equation_area","reason_for_crop":"User requested equation area first.","assistant_answer":false,"terminal_eligible":false}',
        "model_visible_capability_lane_manifest Available Helix workstation gateway capabilities: visual_analysis.inspect_image_region Before giving a final answer, decide whether the user request needs a one-shot capability lane.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        region_label: "equation_area",
        latex_candidate: "E = mc^2",
        extraction_status: "partial",
        uncertainty: ["fixture-backed math OCR candidate"],
      },
      {
        region_label: "caption_text",
        text_candidate: "As in Chapter 2 we use the Bianchi identities...",
        extraction_status: "partial",
        uncertainty: ["fixture-backed caption OCR candidate"],
      },
    ]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-image-lens-post-observation-leak",
          question: [
            "Use the Image Lens region tool on the attached image.",
            "Inspect the equation area first, then inspect the caption/text area separately.",
            "For each crop, report the bbox, what information was extracted, and uncertainty.",
          ].join(" "),
          workspace_context_snapshot: {
            activePanel: "image-lens",
          },
          turn_input_items: [
            { type: "text", text: "Use the Image Lens region tool.", source: "user" },
            {
              type: "image",
              image_ref: "visual_evidence:image-lens-post-observation-leak",
              image_base64: "test-image",
              mime_type: "image/png",
              file_name: "equation-caption.png",
              evidence_id: "visual_evidence:image-lens-post-observation-leak",
              width_px: 346,
              height_px: 372,
              raw_image_included: false,
            },
          ],
        },
      });
      const debug = result.debug as Record<string, any>;
      const visibleAndRawText = JSON.stringify({
        text: result.text,
        answer: result.answer,
        selected_final_answer: result.selected_final_answer,
        terminal_presentation: result.terminal_presentation,
        provider_terminal_candidate: debug.provider_terminal_candidate,
        provider_prompt_leak_guard: result.provider_prompt_leak_guard,
      });

      expect(result).toMatchObject({
        ok: true,
        runtime: "codex",
        response_type: "final_answer",
      });
      expect(result.answer).toContain("**equation_area**");
      expect(result.answer).toContain("- Label match: not_applicable");
      expect(result.answer).toContain("- Exact equation admissibility: partial_candidate");
      expect(result.answer).toContain("- Quality flags: partial_extraction_status");
      expect(result.answer).toContain("- Exact row promotion: not_applicable; reasons: context_crop_not_exact_equation_row");
      expect(result.answer).toContain("- Row/source diagnostics: requested_label=n/a, multiple_lines=false, needs_higher_resolution_source=false");
      expect(result.answer).toContain("- Sidecar exact rows: admissible=0, promoted=0, partial=0, rejected=0");
      expect(result.answer).toContain("- latex_candidate:\n```latex\nE = mc^2\n```");
      expect(result.answer).toContain("**caption_text**");
      expect(result.answer).toContain("- text_candidate:\n```text\nAs in Chapter 2 we use the Bianchi identities...\n```");
      expect(result.answer).toContain("inline image/png crop data redacted");
      expect(result.answer).not.toContain("data:image");
      expect(result.provider_prompt_leak_guard).toMatchObject({
        status: "recovered_with_image_lens_observation_report",
        recovered_with_observation_only_image_lens_report: true,
      });
      expect(visibleAndRawText).not.toContain("Available Helix workstation gateway capabilities");
      expect(visibleAndRawText).not.toContain("model_visible_capability_lane_manifest");
      expect(result.answer).not.toContain("No visual observation receipt was produced");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousExtractionFixtures === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
      }
    }
  });

  it("reports Image Lens observations for scholarly workflows when the post-observation provider response leaks prompt instructions", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"visual_analysis.inspect_image_region","bbox_px":{"x":0,"y":0,"width":1,"height":1},"question":"Inspect the rendered scholarly PDF page for equations.","region_label":"scholarly_pdf_page","reason_for_crop":"Scholarly PDF page image evidence extraction.","assistant_answer":false,"terminal_eligible":false}',
        "model_visible_capability_lane_manifest Available Helix workstation gateway capabilities: visual_analysis.inspect_image_region Before giving a final answer, decide whether the user request needs a one-shot capability lane.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([{
      region_label: "scholarly_pdf_page",
      text_candidate: "The rendered page contains a Casimir pressure equation.",
      latex_candidate: "P = -\\frac{\\pi^2 \\hbar c}{240 a^4}",
      extraction_status: "extracted",
      uncertainty: ["fixture-backed scholarly PDF page extraction"],
    }]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scholarly-image-lens-post-observation-leak",
          question: "Show me the science from this rendered PDF page.",
          workspace_context_snapshot: {
            activePanel: "docs-viewer",
          },
          turn_input_items: [
            {
              type: "image",
              image_ref: "visual_evidence:scholarly-rendered-pdf-page",
              image_base64: "test-image",
              mime_type: "image/png",
              file_name: "scholarly-rendered-page.png",
              evidence_id: "visual_evidence:scholarly-rendered-pdf-page",
              width_px: 346,
              height_px: 372,
              raw_image_included: false,
            },
          ],
        },
      });

      expect(result).toMatchObject({
        ok: true,
        response_type: "final_answer",
      });
      expect(result.answer).toContain("**scholarly_pdf_page**");
      expect(result.answer).toContain("P = -\\frac{\\pi^2 \\hbar c}{240 a^4}");
      expect(result.answer).not.toContain("No visual observation receipt was produced");
      expect(result.provider_prompt_leak_guard).toMatchObject({
        status: "recovered_with_image_lens_observation_report",
        recovered_with_observation_only_image_lens_report: true,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousExtractionFixtures === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
      }
    }
  });

  it("marks failed scholarly PDF Image Lens OCR as recovery instead of useful extracted science", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"visual_analysis.inspect_image_region","bbox_px":{"x":0,"y":0,"width":1,"height":1},"question":"Inspect the rendered scholarly PDF page for equations.","region_label":"scholarly_pdf_page_1_equation_pass","reason_for_crop":"Scholarly PDF page image evidence extraction.","assistant_answer":false,"terminal_eligible":false}',
        "model_visible_capability_lane_manifest Available Helix workstation gateway capabilities: visual_analysis.inspect_image_region Before giving a final answer, decide whether the user request needs a one-shot capability lane.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([{
      region_label: "scholarly_pdf_page_1_equation_pass",
      extraction_status: "failed",
      quality_flags: ["no_ocr_or_latex_candidate"],
      uncertainty: ["no equation visible", "unclear content"],
    }]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scholarly-image-lens-failed-page-recovery",
          question: "Show me the science from this rendered PDF page image.",
          workspace_context_snapshot: {
            activePanel: "image-lens",
          },
          turn_input_items: [
            {
              type: "image",
              image_ref: "visual_evidence:scholarly-rendered-pdf-page",
              image_base64: "test-image",
              mime_type: "image/png",
              file_name: "scholarly-rendered-page.png",
              evidence_id: "visual_evidence:scholarly-rendered-pdf-page",
              width_px: 1000,
              height_px: 1400,
              raw_image_included: false,
            },
          ],
        },
      });

      expect(result).toMatchObject({
        ok: true,
        response_type: "final_answer",
      });
      expect(result.answer).toContain("**scholarly_pdf_page_1_equation_pass**");
      expect(result.answer).toContain("Extraction status: failed");
      expect(result.answer).toContain("Recovery state: Helix rendered the scholarly PDF page");
      expect(result.answer).toContain("Next useful step: inspect the next PDF page");
      expect(result.answer).not.toContain("Extracted LaTeX:");
      expect(result.provider_prompt_leak_guard).toMatchObject({
        status: "recovered_with_image_lens_observation_report",
        recovered_with_observation_only_image_lens_report: true,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousExtractionFixtures === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
      }
    }
  });

  it("recovers scientific document image extraction prompts from post-observation provider prompt leaks", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousExtractionFixtures = process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"visual_analysis.inspect_image_region","bbox_px":{"x":0,"y":0,"width":1,"height":1},"question":"Extract scientific document image evidence.","region_label":"scientific_page","reason_for_crop":"Scientific document image evidence extraction.","assistant_answer":false,"terminal_eligible":false}',
        "model_visible_capability_lane_manifest Available Helix workstation gateway capabilities: visual_analysis.inspect_image_region Before giving a final answer, decide whether the user request needs a one-shot capability lane.",
      ],
    });
    process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = JSON.stringify([
      {
        region_label: "scientific_page",
        text_candidate: "As in Chapter 2 we use the Bianchi identities as field equations for the Weyl tensor.",
        latex_candidate: "\\nabla^{AA'}\\psi_{ABCD}=0",
        extraction_status: "extracted",
        uncertainty: ["fixture-backed scientific image extraction"],
      },
    ]);
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-scientific-document-image-post-observation-leak",
          question: [
            "Here is a scientific document image.",
            "Extract the visible text, equations, equation labels, LaTeX candidates, symbols, bbox/crop refs, confidence, and uncertainty.",
            "Do not compare to the Theory Badge Graph yet.",
          ].join(" "),
          workspace_context_snapshot: {
            activePanel: "image-lens",
          },
          turn_input_items: [
            {
              type: "image",
              image_ref: "visual_evidence:scientific-document-image",
              image_base64: "test-image",
              mime_type: "image/png",
              file_name: "scientific-document.png",
              evidence_id: "visual_evidence:scientific-document-image",
              width_px: 346,
              height_px: 372,
              raw_image_included: false,
            },
          ],
        },
      });

      expect(result).toMatchObject({
        ok: true,
        response_type: "final_answer",
        final_answer_source: "provider_image_lens_observation_report",
        terminal_artifact_kind: "image_lens_observation_report",
      });
      expect(result.answer).toContain("**scientific_page**");
      expect(result.answer).toContain("Bbox: x=0, y=0, width=346, height=372");
      expect(result.answer).toContain("Extraction status: extracted");
      expect(result.answer).toContain("\\nabla^{AA'}\\psi_{ABCD}=0");
      expect(result.answer).not.toContain("No visual observation receipt was produced");
      expect(result.provider_prompt_leak_guard).toMatchObject({
        status: "recovered_with_image_lens_observation_report",
        recovered_with_observation_only_image_lens_report: true,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousExtractionFixtures === undefined) {
        delete process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES;
      } else {
        process.env.HELIX_IMAGE_LENS_EXTRACTION_FIXTURES = previousExtractionFixtures;
      }
    }
  });

  it("synthesizes Image Lens lane request when Codex echoes the capability manifest", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        "model_visible_capability_lane_manifest visual_analysis.inspect_image_region Before giving a final answer, decide whether the user request needs a one-shot capability lane.",
        "Available Helix workstation gateway capabilities: visual_analysis.inspect_image_region",
        "The synthesized Image Lens crop observation re-entered as candidate evidence.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-image-lens-manifest-echo",
          question: "Use the Image Lens region tool to inspect the visible equation area in the attached image and report the bbox.",
          workspace_context_snapshot: {
            activePanel: "image-lens",
          },
          turn_input_items: [
            { type: "text", text: "Use the Image Lens region tool.", source: "user" },
            {
              type: "image",
              image_ref: "data:image/png;base64,test-image",
              mime_type: "image/png",
              file_name: "equation.png",
              evidence_id: "visual_evidence:image-lens-manifest-echo",
              raw_image_included: false,
            },
          ],
        },
      });
      const debug = result.debug as Record<string, any>;
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;

      expect(result).toMatchObject({
        ok: true,
        runtime: "codex",
        response_type: "final_answer",
        answer: "The synthesized Image Lens crop observation re-entered as candidate evidence.",
      });
      expect(callResults.map((call) => call.capability)).toEqual(["visual_analysis.inspect_image_region"]);
      expect(debug.runtime_lane_request_contract).toMatchObject({
        retry_attempted: true,
        synthesized_candidate_present: true,
        final_candidate_present: true,
      });
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        synthesized_by_helix_policy: true,
        synthesis_reason: "explicit_image_lens_region_prompt_with_submitted_image_but_no_runtime_lane_json",
      });
      expect(debug.runtime_lane_request_retry).toMatchObject({
        prior_response_preview: "[blocked_prompt_leak_preview]",
        retry_response_preview: "[blocked_prompt_leak_preview]",
      });
      const visibleAndRawText = JSON.stringify({
        text: result.text,
        answer: result.answer,
        selected_final_answer: result.selected_final_answer,
        terminal_presentation: result.terminal_presentation,
        provider_terminal_candidate: debug.provider_terminal_candidate,
        raw: result.raw,
        runtime_lane_request_retry: debug.runtime_lane_request_retry,
      });
      expect(visibleAndRawText).not.toContain("Available Helix workstation gateway capabilities");
      expect(visibleAndRawText).not.toContain("model_visible_capability_lane_manifest");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("enriches a chained visible translation lane request from the collected target metadata", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"workstation_tool_reference.collect_visible_translation_targets","active_panel_id":"docs-viewer","doc_path":"docs/research/nhm2.md","source_hash":"sha256:full-document-hash","projection_target":"docs_chunk","account_locale":"es-US","target_language":"es","visible_only":true,"max_chunks":1,"visible_text_chunks":[{"visible_text":"hello","chunk_id":"title","chunk_index":0,"region_id":"title","source_kind":"docs_viewer","source_event_id":"visible-source-event:title","source_event_ms":1783000000000,"observed_at_ms":1783000001000}]}',
        'HELIX_CAPABILITY_LANE_REQUEST_JSON: {"capability":"live_translation.translate_text","text":"hello","target_language":"es"}',
        "The visible document title translation is hola.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-visible-document-translation-enriched-chain",
          question: "Translate this visible document title to Spanish.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const translationResult = callResults.find((call) => call.capability === "live_translation.translate_text");
      const translationObservation = translationResult?.observation;
      const translationPacket = (debug.capability_lane_observation_packets as Array<Record<string, any>>)
        .find((packet) => packet.capability_key === "live_translation.translate_text");
      const projectionReceipt = translationPacket?.state_delta?.live_translation_projection_receipt;

      expect(result).toMatchObject({
        ok: true,
        answer: "The visible document title translation is hola.",
      });
      expect(debug.runtime_lane_request_loop).toMatchObject({
        visible_translation_collector_chain: expect.objectContaining({
          first_collected_source_event_id: "visible-source-event:title",
          first_collected_source_event_ms: 1783000000000,
          first_collected_observed_at_ms: 1783000001000,
        }),
        chained_candidate: expect.objectContaining({
          capability: "live_translation.translate_text",
          text: "hello",
          target_language: "es",
          source_id: "document_markdown:docs/research/nhm2.md#title",
          doc_path: "docs/research/nhm2.md",
          source_hash: "sha256:full-document-hash",
          source_kind: "docs_viewer",
          source_text_hash: "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
          source_text_char_count: "hello".length,
          source_event_id: "visible-source-event:title",
          source_event_ms: 1783000000000,
          now_ms: 1783000001000,
          account_locale: "es-US",
          chunk_id: "title",
          chunk_index: 0,
          projection_target: "docs_chunk",
        }),
      });
      expect(translationObservation).toMatchObject({
        source_id: "document_markdown:docs/research/nhm2.md#title",
        doc_path: "docs/research/nhm2.md",
        source_hash: "sha256:full-document-hash",
        source_kind: "docs_viewer",
        source_text_hash: "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
        source_text_char_count: "hello".length,
        source_event_id: "visible-source-event:title",
        source_event_ms: 1783000000000,
        observed_at_ms: 1783000001000,
        account_locale: "es-US",
        chunk_id: "title",
        chunk_index: 0,
        projection_target: "docs_chunk",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
      expect(projectionReceipt).toMatchObject({
        source_id: "document_markdown:docs/research/nhm2.md#title",
        doc_path: "docs/research/nhm2.md",
        source_hash: "sha256:full-document-hash",
        source_text_hash: "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
        source_event_id: "visible-source-event:title",
        source_event_ms: 1783000000000,
        observed_at_ms: 1783000001000,
        chunk_id: "title",
        target_language: "es",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("chains multiple visible chunks through translation lane calls after target collection", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability: "workstation_tool_reference.collect_visible_translation_targets",
            active_panel_id: "docs-viewer",
            doc_path: "docs/research/nhm2.md",
            source_hash: "sha256:full-document-hash",
            projection_target: "docs_chunk",
            account_locale: "es-US",
            target_language: "es",
            visible_only: true,
            max_chunks: 2,
            visible_text_chunks: [
              {
                visible_text: "hello",
                chunk_id: "title",
                chunk_index: 0,
                region_id: "title",
                source_kind: "docs_viewer",
              },
              {
                visible_text: "thank you",
                chunk_id: "summary",
                chunk_index: 1,
                region_id: "summary",
                source_kind: "docs_viewer",
              },
            ],
          }),
        ].join(" "),
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability_lane_call: [
              {
                capability: "live_translation.translate_text",
                text: "hello",
                target_language: "es",
              },
              {
                capability: "live_translation.translate_text",
                text: "thank you",
                target_language: "es",
              },
            ],
          }),
        ].join(" "),
        "The visible chunks translate to hola and gracias.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-visible-document-translation-multi-chunk-chain",
          question: "Translate this visible document to Spanish.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const translationResults = callResults.filter((call) => call.capability === "live_translation.translate_text");
      const translationPackets = (debug.capability_lane_observation_packets as Array<Record<string, any>>)
        .filter((packet) => packet.capability_key === "live_translation.translate_text");
      const projectionReceipts = translationPackets
        .map((packet) => packet.state_delta?.live_translation_projection_receipt);

      expect(result).toMatchObject({
        ok: true,
        answer: "The visible chunks translate to hola and gracias.",
      });
      expect(callResults.map((call) => call.capability)).toEqual([
        "workstation_tool_reference.collect_visible_translation_targets",
        "live_translation.translate_text",
        "live_translation.translate_text",
      ]);
      expect(debug.runtime_lane_request_loop).toMatchObject({
        chain_step_count: 3,
        chained_candidate: [
          expect.objectContaining({
            capability: "live_translation.translate_text",
            text: "hello",
            source_id: "document_markdown:docs/research/nhm2.md#title",
            chunk_id: "title",
            projection_target: "docs_chunk",
          }),
          expect.objectContaining({
            capability: "live_translation.translate_text",
            text: "thank you",
            source_id: "document_markdown:docs/research/nhm2.md#summary",
            chunk_id: "summary",
            projection_target: "docs_chunk",
          }),
        ],
        visible_translation_collector_chain: expect.objectContaining({
          collected_target_count: 2,
          collected_source_ids: [
            "document_markdown:docs/research/nhm2.md#title",
            "document_markdown:docs/research/nhm2.md#summary",
          ],
          collected_doc_paths: ["docs/research/nhm2.md"],
          collected_chunk_ids: ["title", "summary"],
          collected_target_languages: ["es"],
          translated_chunk_count: 2,
          translation_observation_refs: expect.arrayContaining([
            expect.any(String),
            expect.any(String),
          ]),
          translation_receipt_refs: expect.arrayContaining([
            expect.any(String),
            expect.any(String),
          ]),
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(translationResults).toEqual([
        expect.objectContaining({
          ok: true,
          translated_text: "hola",
          observation: expect.objectContaining({
            source_id: "document_markdown:docs/research/nhm2.md#title",
            chunk_id: "title",
            source_text_hash: "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
            source_text_char_count: "hello".length,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        }),
        expect.objectContaining({
          ok: true,
          translated_text: "gracias",
          observation: expect.objectContaining({
            source_id: "document_markdown:docs/research/nhm2.md#summary",
            chunk_id: "summary",
            source_text_hash: "sha256:844347e54f00c4b97fe4736909730faaf8365292b076ea5a1378ebd1b0fd3bbb",
            source_text_char_count: "thank you".length,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        }),
      ]);
      expect(projectionReceipts).toEqual([
        expect.objectContaining({
          source_id: "document_markdown:docs/research/nhm2.md#title",
          chunk_id: "title",
          target_language: "es",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        expect.objectContaining({
          source_id: "document_markdown:docs/research/nhm2.md#summary",
          chunk_id: "summary",
          target_language: "es",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      ]);
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("preserves visible UI region metadata through chained translation lane calls", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability: "workstation.visible_text.collect_translation_targets",
            active_panel_id: "workstation-shell",
            source_hash: "sha256:visible-ui",
            projection_target: "account_language",
            account_locale: "es-US",
            target_language: "es",
            visible_only: true,
            max_chunks: 2,
            ui_text_regions: [
              {
                source_kind: "panel_text",
                panel_id: "workstation-notes",
                visible_text: "hello",
                region_id: "workstation-notes:title",
              },
              {
                source_kind: "button_label",
                panel_id: "docs-viewer",
                label: "thank you",
                id: "docs-viewer:thanks-button",
              },
            ],
          }),
        ].join(" "),
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability_lane_call: [
              {
                capability: "live_translation.translate_text",
                text: "hello",
                target_language: "es",
              },
              {
                capability: "live_translation.translate_text",
                text: "thank you",
                target_language: "es",
              },
            ],
          }),
        ].join(" "),
        "The visible interface labels were translated through receipts.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-visible-ui-translation-chain",
          question: "Translate the visible interface labels to Spanish.",
        },
      });
      const debug = result.debug as Record<string, any>;
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const translationResults = callResults.filter((call) => call.capability === "live_translation.translate_text");
      const translationPackets = (debug.capability_lane_observation_packets as Array<Record<string, any>>)
        .filter((packet) => packet.capability_key === "live_translation.translate_text");
      const projectionReceipts = translationPackets
        .map((packet) => packet.state_delta?.live_translation_projection_receipt);

      expect(result).toMatchObject({
        ok: true,
        answer: "The visible interface labels were translated through receipts.",
      });
      expect(callResults.map((call) => call.capability)).toEqual([
        "workstation_tool_reference.collect_visible_translation_targets",
        "live_translation.translate_text",
        "live_translation.translate_text",
      ]);
      expect(debug.runtime_lane_request_loop).toMatchObject({
        chain_step_count: 3,
        chained_candidate: [
          expect.objectContaining({
            capability: "live_translation.translate_text",
            text: "hello",
            source_id: "workstation-shell#workstation-notes:title",
            panel_id: "workstation-notes",
            region_id: "workstation-notes:title",
            source_kind: "panel_text",
            chunk_id: "workstation-notes:title",
            projection_target: "account_language",
          }),
          expect.objectContaining({
            capability: "live_translation.translate_text",
            text: "thank you",
            source_id: "workstation-shell#docs-viewer:thanks-button",
            panel_id: "docs-viewer",
            region_id: "docs-viewer:thanks-button",
            source_kind: "button_label",
            chunk_id: "docs-viewer:thanks-button",
            projection_target: "account_language",
          }),
        ],
        visible_translation_collector_chain: expect.objectContaining({
          collected_target_count: 2,
          collected_source_kinds: ["panel_text", "button_label"],
          collected_projection_targets: ["account_language"],
          collected_panel_ids: ["workstation-notes", "docs-viewer"],
          translated_chunk_count: 2,
          translated_source_kinds: ["panel_text", "button_label"],
          translated_projection_targets: ["account_language"],
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(translationResults).toEqual([
        expect.objectContaining({
          ok: true,
          translated_text: "hola",
          observation: expect.objectContaining({
            source_id: "workstation-shell#workstation-notes:title",
            panel_id: "workstation-notes",
            region_id: "workstation-notes:title",
            source_kind: "panel_text",
            chunk_id: "workstation-notes:title",
            projection_target: "account_language",
            account_locale: "es-US",
            target_language: "es",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        }),
        expect.objectContaining({
          ok: true,
          translated_text: "gracias",
          observation: expect.objectContaining({
            source_id: "workstation-shell#docs-viewer:thanks-button",
            panel_id: "docs-viewer",
            region_id: "docs-viewer:thanks-button",
            source_kind: "button_label",
            chunk_id: "docs-viewer:thanks-button",
            projection_target: "account_language",
            account_locale: "es-US",
            target_language: "es",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        }),
      ]);
      expect(projectionReceipts).toEqual([
        expect.objectContaining({
          source_id: "workstation-shell#workstation-notes:title",
          panel_id: "workstation-notes",
          region_id: "workstation-notes:title",
          source_kind: "panel_text",
          chunk_id: "workstation-notes:title",
          projection_target: "account_language",
          target_language: "es",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        expect.objectContaining({
          source_id: "workstation-shell#docs-viewer:thanks-button",
          panel_id: "docs-viewer",
          region_id: "docs-viewer:thanks-button",
          source_kind: "button_label",
          chunk_id: "docs-viewer:thanks-button",
          projection_target: "account_language",
          target_language: "es",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      ]);
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("chains context-carried account-language UI title regions into translation receipts", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability: "workstation.visible_text.collect_translation_targets",
            visible_only: true,
            max_chunks: 4,
          }),
        ].join(" "),
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability: "live_translation.translate_text",
            text: "Current Status",
            target_language: "es",
          }),
        ].join(" "),
        "The visible interface title was translated through a projection receipt.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-context-ui-region-translation-chain",
          question: "Translate the visible document header controls to Spanish.",
          workspace_context_snapshot: {
            active_doc_visible_translation_context: {
              schema: "helix.ask.active_doc_visible_translation_context.v1",
              panel_id: "docs-viewer",
              doc_path: "docs/current.md",
              source_id: "document_markdown:docs/current.md",
              source_hash: "sha256:doc-context",
              account_locale: "en-US",
              target_language: "es",
              projection_target: "docs_chunk",
              chunks: [],
              ui_text_regions: [
                {
                  source_kind: "panel_text",
                  panel_id: "docs-viewer",
                  doc_path: "docs/current.md",
                  source_id: "workstation-shell#docs-viewer:title",
                  source_hash: "sha256:doc-context",
                  source_text_hash: "fnv1a32:title",
                  source_text_char_count: 14,
                  visible_text: "Current Status",
                  chunk_id: "docs-viewer:title",
                  chunk_index: 0,
                  dedupe_key: "workstation-shell#docs-viewer:title::sha256:doc-context::fnv1a32:title::docs-viewer:title::en-US::es::account_language",
                  region_id: "docs-viewer:title",
                  projection_target: "account_language",
                  existing_observation_ref: "ask:turn:translation:observation:title",
                  existing_receipt_ref: "ask:turn:translation:receipt:title",
                  existing_projection_status: "projected",
                  existing_freshness_status: "fresh",
                  existing_terminal_authority_status: "not_terminal_authority",
                  existing_source_event_ms: 1782999999000,
                  existing_observed_at_ms: 1782999999100,
                  assistant_answer: false,
                  terminal_eligible: false,
                  answer_authority: false,
                  raw_content_included: false,
                  reentry_required: true,
                },
                {
                  source_kind: "button_label",
                  panel_id: "docs-viewer",
                  doc_path: "docs/current.md",
                  source_id: "workstation-shell#docs-viewer:translate-button",
                  source_hash: "sha256:doc-context",
                  source_text_hash: "fnv1a32:78e3e875",
                  source_text_char_count: 9,
                  visible_text: "Translate",
                  chunk_id: "docs-viewer:translate-button",
                  chunk_index: 1,
                  dedupe_key: "workstation-shell#docs-viewer:translate-button::sha256:doc-context::fnv1a32:78e3e875::docs-viewer:translate-button::en-US::es::account_language",
                  region_id: "docs-viewer:translate-button",
                  projection_target: "account_language",
                  existing_observation_ref: "ask:turn:translation:observation:button",
                  existing_receipt_ref: "ask:turn:translation:receipt:button",
                  existing_projection_status: "projected",
                  existing_freshness_status: "fresh",
                  existing_terminal_authority_status: "not_terminal_authority",
                  existing_source_event_ms: 1782999999200,
                  existing_observed_at_ms: 1782999999300,
                  assistant_answer: false,
                  terminal_eligible: false,
                  answer_authority: false,
                  raw_content_included: false,
                  reentry_required: true,
                },
              ],
            },
          },
        },
      });
      const debug = result.debug as Record<string, any>;
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const translationResult = callResults.find((call) => call.capability === "live_translation.translate_text");
      const translationPacket = (debug.capability_lane_observation_packets as Array<Record<string, any>>)
        .find((packet) => packet.capability_key === "live_translation.translate_text");
      const projectionReceipt = translationPacket?.state_delta?.live_translation_projection_receipt;

      expect(result).toMatchObject({
        ok: true,
        answer: "The visible interface title was translated through a projection receipt.",
      });
      expect(callResults.map((call) => call.capability)).toEqual([
        "workstation_tool_reference.collect_visible_translation_targets",
        "live_translation.translate_text",
      ]);
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        chained_candidate: expect.objectContaining({
          capability: "live_translation.translate_text",
          text: "Current Status",
          source_id: "workstation-shell#docs-viewer:title",
          panel_id: "docs-viewer",
          region_id: "docs-viewer:title",
          doc_path: "docs/current.md",
          source_kind: "panel_text",
          source_text_hash: "fnv1a32:title",
          source_text_char_count: 14,
          chunk_id: "docs-viewer:title",
          projection_target: "account_language",
        }),
        visible_translation_collector_chain: expect.objectContaining({
          collected_target_count: 2,
          collected_source_kinds: ["panel_text", "button_label"],
          collected_projection_targets: ["account_language"],
          collected_panel_ids: ["docs-viewer"],
          translated_chunk_count: 1,
          translated_source_kinds: ["panel_text"],
          translated_projection_targets: ["account_language"],
          first_collected_existing_observation_ref: "ask:turn:translation:observation:title",
          first_collected_existing_receipt_ref: "ask:turn:translation:receipt:title",
          first_collected_existing_projection_status: "projected",
          first_collected_existing_freshness_status: "fresh",
          first_collected_existing_terminal_authority_status: "not_terminal_authority",
          first_collected_existing_source_event_ms: 1782999999000,
          first_collected_existing_observed_at_ms: 1782999999100,
          collected_existing_source_event_ms: [1782999999000, 1782999999200],
          collected_existing_observed_at_ms: [1782999999100, 1782999999300],
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(translationResult).toMatchObject({
        ok: true,
        translated_text: "[es deterministic translation] Current Status",
        observation: expect.objectContaining({
          source_id: "workstation-shell#docs-viewer:title",
          panel_id: "docs-viewer",
          region_id: "docs-viewer:title",
          doc_path: "docs/current.md",
          source_kind: "panel_text",
          chunk_id: "docs-viewer:title",
          projection_target: "account_language",
          account_locale: "en-US",
          target_language: "es",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(projectionReceipt).toMatchObject({
        source_id: "workstation-shell#docs-viewer:title",
        panel_id: "docs-viewer",
        region_id: "docs-viewer:title",
        doc_path: "docs/current.md",
        source_kind: "panel_text",
        chunk_id: "docs-viewer:title",
        projection_target: "account_language",
        target_language: "es",
        translated_text: "[es deterministic translation] Current Status",
        answer_authority: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("chains multiple visible document chunks into multiple translation projection receipts", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability: "workstation.visible_text.collect_translation_targets",
            active_doc_visible_translation_context: {
              schema: "helix.ask.active_doc_visible_translation_context.v1",
            },
            visible_only: true,
            max_chunks: 4,
          }),
        ].join(" "),
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability_lane_call: [
              {
                capability: "live_translation.translate_text",
                text: "First visible paragraph.",
                target_language: "es",
              },
              {
                capability: "live_translation.translate_text",
                text: "Second visible paragraph.",
                target_language: "es",
              },
            ],
          }),
        ].join(" "),
        "The visible document chunks were translated through projection receipts.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-visible-doc-multi-chunk-translation-chain",
          question: "Translate the visible document chunks to Spanish.",
          workspace_context_snapshot: {
            active_doc_visible_translation_context: {
              schema: "helix.ask.active_doc_visible_translation_context.v1",
              panel_id: "docs-viewer",
              doc_path: "docs/current.md",
              source_id: "document_markdown:docs/current.md",
              source_hash: "sha256:doc-context",
              account_locale: "en-US",
              target_language: "es",
              projection_target: "docs_chunk",
              chunks: [
                {
                  source_kind: "docs_viewer",
                  panel_id: "docs-viewer",
                  doc_path: "docs/current.md",
                  source_id: "document_markdown:docs/current.md",
                  source_hash: "sha256:doc-context",
                  source_text_hash: "fnv1a32:first",
                  source_text_char_count: 24,
                  visible_text: "First visible paragraph.",
                  chunk_id: "u0001",
                  chunk_index: 0,
                  dedupe_key: "document_markdown:docs/current.md::sha256:doc-context::fnv1a32:first::u0001::en-US::es",
                  region_id: "docs-viewer:u0001",
                  projection_target: "docs_chunk",
                  existing_observation_ref: "ask:turn:translation:observation:u0001",
                  existing_receipt_ref: "ask:turn:translation:receipt:u0001",
                  existing_projection_status: "projected",
                  existing_freshness_status: "fresh",
                  existing_terminal_authority_status: "not_terminal_authority",
                  existing_source_event_ms: 1782999999000,
                  existing_observed_at_ms: 1782999999100,
                  assistant_answer: false,
                  terminal_eligible: false,
                  answer_authority: false,
                  raw_content_included: false,
                  reentry_required: true,
                },
                {
                  source_kind: "docs_viewer",
                  panel_id: "docs-viewer",
                  doc_path: "docs/current.md",
                  source_id: "document_markdown:docs/current.md",
                  source_hash: "sha256:doc-context",
                  source_text_hash: "fnv1a32:second",
                  source_text_char_count: 25,
                  visible_text: "Second visible paragraph.",
                  chunk_id: "u0002",
                  chunk_index: 1,
                  dedupe_key: "document_markdown:docs/current.md::sha256:doc-context::fnv1a32:second::u0002::en-US::es",
                  region_id: "docs-viewer:u0002",
                  projection_target: "docs_chunk",
                  existing_observation_ref: null,
                  existing_receipt_ref: null,
                  existing_projection_status: null,
                  existing_freshness_status: null,
                  existing_terminal_authority_status: null,
                  existing_source_event_ms: null,
                  existing_observed_at_ms: null,
                  assistant_answer: false,
                  terminal_eligible: false,
                  answer_authority: false,
                  raw_content_included: false,
                  reentry_required: true,
                },
              ],
              ui_text_regions: [],
            },
          },
        },
      });
      const debug = result.debug as Record<string, any>;
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const translationResults = callResults.filter((call) => call.capability === "live_translation.translate_text");
      const projectionReceipts = (debug.capability_lane_observation_packets as Array<Record<string, any>>)
        .filter((packet) => packet.capability_key === "live_translation.translate_text")
        .map((packet) => packet.state_delta?.live_translation_projection_receipt);

      expect(result).toMatchObject({
        ok: true,
        answer: "The visible document chunks were translated through projection receipts.",
      });
      expect(callResults.map((call) => call.capability)).toEqual([
        "workstation_tool_reference.collect_visible_translation_targets",
        "live_translation.translate_text",
        "live_translation.translate_text",
      ]);
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        chain_step_count: 3,
        chained_candidate: [
          expect.objectContaining({
            capability: "live_translation.translate_text",
            text: "First visible paragraph.",
            chunk_id: "u0001",
            projection_target: "docs_chunk",
          }),
          expect.objectContaining({
            capability: "live_translation.translate_text",
            text: "Second visible paragraph.",
            chunk_id: "u0002",
            projection_target: "docs_chunk",
          }),
        ],
        visible_translation_collector_chain: expect.objectContaining({
          collected_target_count: 2,
          collected_source_kinds: ["docs_viewer"],
          collected_projection_targets: ["docs_chunk"],
          collected_chunk_ids: ["u0001", "u0002"],
          collected_existing_source_event_ms: [1782999999000],
          collected_existing_observed_at_ms: [1782999999100],
          translated_chunk_count: 2,
          translated_source_kinds: ["docs_viewer"],
          translated_projection_targets: ["docs_chunk"],
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(translationResults).toEqual([
        expect.objectContaining({
          ok: true,
          translated_text: "[es deterministic translation] First visible paragraph.",
          observation: expect.objectContaining({
            doc_path: "docs/current.md",
            chunk_id: "u0001",
            projection_target: "docs_chunk",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        }),
        expect.objectContaining({
          ok: true,
          translated_text: "[es deterministic translation] Second visible paragraph.",
          observation: expect.objectContaining({
            doc_path: "docs/current.md",
            chunk_id: "u0002",
            projection_target: "docs_chunk",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        }),
      ]);
      expect(projectionReceipts).toEqual([
        expect.objectContaining({
          chunk_id: "u0001",
          projection_target: "docs_chunk",
          translated_text: "[es deterministic translation] First visible paragraph.",
          answer_authority: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
        expect.objectContaining({
          chunk_id: "u0002",
          projection_target: "docs_chunk",
          translated_text: "[es deterministic translation] Second visible paragraph.",
          answer_authority: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      ]);
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("chains context-carried selected document text into translation receipts", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability: "workstation.visible_text.collect_translation_targets",
            visible_only: true,
            max_chunks: 3,
          }),
        ].join(" "),
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability: "live_translation.translate_text",
            text: "Selected sentence",
            target_language: "es",
          }),
        ].join(" "),
        "The selected document text was translated through a projection receipt.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-context-selected-text-translation-chain",
          question: "Translate the selected visible document text to Spanish.",
          workspace_context_snapshot: {
            active_doc_visible_translation_context: {
              schema: "helix.ask.active_doc_visible_translation_context.v1",
              panel_id: "docs-viewer",
              doc_path: "docs/current.md",
              source_id: "document_markdown:docs/current.md",
              source_hash: "sha256:doc-context",
              account_locale: "en-US",
              target_language: "es",
              projection_target: "docs_chunk",
              chunks: [{
                source_kind: "selection",
                panel_id: "docs-viewer",
                doc_path: "docs/current.md",
                source_id: "document_markdown:docs/current.md#docs-viewer:selection:fnv1a32:selected",
                source_hash: "sha256:doc-context",
                source_text_hash: "fnv1a32:selected",
                source_text_char_count: 17,
                visible_text: "Selected sentence",
                chunk_id: "docs-viewer:selection:fnv1a32:selected",
                chunk_index: 0,
                dedupe_key: "document_markdown:docs/current.md::sha256:doc-context::fnv1a32:selected::docs-viewer:selection:fnv1a32:selected::en-US::es::docs_selection",
                region_id: "docs-viewer:selection:fnv1a32:selected",
                projection_target: "docs_selection",
                existing_observation_ref: null,
                existing_receipt_ref: null,
                existing_projection_status: null,
                existing_freshness_status: null,
                existing_terminal_authority_status: null,
                assistant_answer: false,
                terminal_eligible: false,
                answer_authority: false,
                raw_content_included: false,
                reentry_required: true,
              }],
              ui_text_regions: [],
            },
          },
        },
      });
      const debug = result.debug as Record<string, any>;
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const translationResult = callResults.find((call) => call.capability === "live_translation.translate_text");
      const translationPacket = (debug.capability_lane_observation_packets as Array<Record<string, any>>)
        .find((packet) => packet.capability_key === "live_translation.translate_text");
      const projectionReceipt = translationPacket?.state_delta?.live_translation_projection_receipt;

      expect(result).toMatchObject({
        ok: true,
        answer: "The selected document text was translated through a projection receipt.",
      });
      expect(callResults.map((call) => call.capability)).toEqual([
        "workstation_tool_reference.collect_visible_translation_targets",
        "live_translation.translate_text",
      ]);
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        chained_candidate: expect.objectContaining({
          capability: "live_translation.translate_text",
          text: "Selected sentence",
          source_id: "document_markdown:docs/current.md#docs-viewer:selection:fnv1a32:selected",
          panel_id: "docs-viewer",
          region_id: "docs-viewer:selection:fnv1a32:selected",
          doc_path: "docs/current.md",
          source_kind: "selection",
          source_text_hash: "fnv1a32:selected",
          source_text_char_count: 17,
          chunk_id: "docs-viewer:selection:fnv1a32:selected",
          projection_target: "docs_selection",
        }),
        visible_translation_collector_chain: expect.objectContaining({
          collected_target_count: 1,
          collected_source_kinds: ["selection"],
          collected_projection_targets: ["docs_selection"],
          collected_panel_ids: ["docs-viewer"],
          translated_chunk_count: 1,
          translated_source_kinds: ["selection"],
          translated_projection_targets: ["docs_selection"],
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(translationResult).toMatchObject({
        ok: true,
        translated_text: "[es deterministic translation] Selected sentence",
        observation: expect.objectContaining({
          source_id: "document_markdown:docs/current.md#docs-viewer:selection:fnv1a32:selected",
          panel_id: "docs-viewer",
          region_id: "docs-viewer:selection:fnv1a32:selected",
          doc_path: "docs/current.md",
          source_kind: "selection",
          chunk_id: "docs-viewer:selection:fnv1a32:selected",
          projection_target: "docs_selection",
          account_locale: "en-US",
          target_language: "es",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(projectionReceipt).toMatchObject({
        source_id: "document_markdown:docs/current.md#docs-viewer:selection:fnv1a32:selected",
        panel_id: "docs-viewer",
        region_id: "docs-viewer:selection:fnv1a32:selected",
        doc_path: "docs/current.md",
        source_kind: "selection",
        chunk_id: "docs-viewer:selection:fnv1a32:selected",
        projection_target: "docs_selection",
        target_language: "es",
        translated_text: "[es deterministic translation] Selected sentence",
        answer_authority: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("chains context-carried hovered document text into translation receipts", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousStdoutSequence = process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
    const previousCallIndex = process.env.CODEX_AGENT_FAKE_CALL_INDEX;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
    process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = JSON.stringify({
      sequence: [
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability: "workstation.visible_text.collect_translation_targets",
            visible_only: true,
            max_chunks: 3,
          }),
        ].join(" "),
        [
          "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
          JSON.stringify({
            capability: "live_translation.translate_text",
            text: "Hovered sentence",
            target_language: "es",
          }),
        ].join(" "),
        "The hovered document text was translated through a projection receipt.",
      ],
    });
    process.env.CODEX_AGENT_FAKE_CALL_INDEX = "0";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-context-hovered-text-translation-chain",
          question: "Translate the hovered visible document text to Spanish.",
          workspace_context_snapshot: {
            active_doc_visible_translation_context: {
              schema: "helix.ask.active_doc_visible_translation_context.v1",
              panel_id: "docs-viewer",
              doc_path: "docs/current.md",
              source_id: "document_markdown:docs/current.md",
              source_hash: "sha256:doc-context",
              account_locale: "en-US",
              target_language: "es",
              projection_target: "docs_chunk",
              chunks: [{
                source_kind: "hover_region",
                panel_id: "docs-viewer",
                doc_path: "docs/current.md",
                source_id: "document_markdown:docs/current.md#docs-viewer:hover:u0002",
                source_hash: "sha256:doc-context",
                source_text_hash: "fnv1a32:hovered",
                source_text_char_count: 16,
                visible_text: "Hovered sentence",
                chunk_id: "docs-viewer:hover:u0002",
                chunk_index: 0,
                dedupe_key: "document_markdown:docs/current.md::sha256:doc-context::fnv1a32:hovered::docs-viewer:hover:u0002::en-US::es::docs_hover",
                region_id: "docs-viewer:hover:u0002",
                projection_target: "docs_hover",
                existing_observation_ref: null,
                existing_receipt_ref: null,
                existing_projection_status: null,
                existing_freshness_status: null,
                existing_terminal_authority_status: null,
                assistant_answer: false,
                terminal_eligible: false,
                answer_authority: false,
                raw_content_included: false,
                reentry_required: true,
              }],
              ui_text_regions: [],
            },
          },
        },
      });
      const debug = result.debug as Record<string, any>;
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const translationResult = callResults.find((call) => call.capability === "live_translation.translate_text");
      const translationPacket = (debug.capability_lane_observation_packets as Array<Record<string, any>>)
        .find((packet) => packet.capability_key === "live_translation.translate_text");
      const projectionReceipt = translationPacket?.state_delta?.live_translation_projection_receipt;

      expect(result).toMatchObject({
        ok: true,
        answer: "The hovered document text was translated through a projection receipt.",
      });
      expect(callResults.map((call) => call.capability)).toEqual([
        "workstation_tool_reference.collect_visible_translation_targets",
        "live_translation.translate_text",
      ]);
      expect(debug.runtime_lane_request_loop).toMatchObject({
        status: "lane_observation_reentered",
        chained_candidate: expect.objectContaining({
          capability: "live_translation.translate_text",
          text: "Hovered sentence",
          source_id: "document_markdown:docs/current.md#docs-viewer:hover:u0002",
          panel_id: "docs-viewer",
          region_id: "docs-viewer:hover:u0002",
          doc_path: "docs/current.md",
          source_kind: "hover_region",
          source_text_hash: "fnv1a32:hovered",
          source_text_char_count: 16,
          chunk_id: "docs-viewer:hover:u0002",
          projection_target: "docs_hover",
        }),
        visible_translation_collector_chain: expect.objectContaining({
          collected_target_count: 1,
          collected_source_kinds: ["hover_region"],
          collected_projection_targets: ["docs_hover"],
          translated_chunk_count: 1,
          translated_source_kinds: ["hover_region"],
          translated_projection_targets: ["docs_hover"],
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(translationResult).toMatchObject({
        ok: true,
        translated_text: "[es deterministic translation] Hovered sentence",
        observation: expect.objectContaining({
          source_id: "document_markdown:docs/current.md#docs-viewer:hover:u0002",
          source_kind: "hover_region",
          chunk_id: "docs-viewer:hover:u0002",
          projection_target: "docs_hover",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      });
      expect(projectionReceipt).toMatchObject({
        source_id: "document_markdown:docs/current.md#docs-viewer:hover:u0002",
        source_kind: "hover_region",
        chunk_id: "docs-viewer:hover:u0002",
        projection_target: "docs_hover",
        translated_text: "[es deterministic translation] Hovered sentence",
        answer_authority: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousStdoutSequence === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE = previousStdoutSequence;
      }
      if (previousCallIndex === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CALL_INDEX;
      } else {
        process.env.CODEX_AGENT_FAKE_CALL_INDEX = previousCallIndex;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("exposes requestable capability lanes in ordinary Codex turn debug context", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    const previousCapturePromptPath = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-provider-prompt-"));
    const capturePromptPath = path.join(tempDir, "prompt.txt");
    process.env.CODEX_AGENT_FAKE_STDOUT = "I can use live_translation.translate_text as an observation-only lane.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePromptPath;
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          turn_id: "turn-codex-model-visible-lanes",
          question: "What translation lane/tool can you use?",
        },
      });
      const prompt = fs.readFileSync(capturePromptPath, "utf8");
      const debug = result.debug as Record<string, any>;
      const modelVisible = debug.model_visible_capability_lane_manifest;
      const translation = modelVisible.lanes
        .flatMap((lane: any) => lane.capabilities)
        .find((capability: any) => capability.capability_id === "live_translation.translate_text");
      const visibleCollector = modelVisible.lanes
        .flatMap((lane: any) => lane.capabilities)
        .find((capability: any) =>
          capability.capability_id === "workstation_tool_reference.collect_visible_translation_targets"
        );

      expect(result.ok).toBe(true);
      expect(debug.runtime_lane_request_contract).toMatchObject({
        schema: "helix.runtime_agent_lane_request_contract.v1",
        legacy_schema: "helix.codex_runtime_lane_request_contract.v1",
        runtime_provider_adapter: "codex",
        contract_version: "2026-07-02.p7.one_shot.v1",
        request_marker: "HELIX_CAPABILITY_LANE_REQUEST_JSON:",
        one_shot_lane_loop_enabled: true,
        initial_candidate_present: false,
        retry_attempted: false,
        final_candidate_present: false,
        execution_status: "no_lane_request_candidate",
        observation_packet_count: 0,
        helix_executes_only_structured_runtime_lane_requests: true,
      });
      expect(modelVisible).toMatchObject({
        schema: "helix.agent_model_visible_capability_lane_manifest.v1",
        selected_runtime_agent_provider: "codex",
        authority_rules: expect.objectContaining({
          helix_owns_backend_selection: true,
          selected_runtime_provider_remains_root: true,
          lane_outputs_are_not_final_answers: true,
          terminal_authority_owner: "helix",
        }),
      });
      expect(translation).toMatchObject({
        required_input_fields: ["text", "target_language"],
        optional_input_fields: expect.arrayContaining([
          "source_language",
          "requested_backend_provider",
          "source_id",
          "doc_path",
          "source_hash",
          "source_text_hash",
          "source_text_char_count",
          "source_event_id",
          "source_event_ms",
          "chunk_id",
          "chunk_index",
          "dedupe_key",
          "projection_target",
        ]),
        result_authority: "observation_or_receipt_only",
        reentry_required: true,
        terminal_eligible: false,
        assistant_answer: false,
      });
      expect(translation.when_to_use).toContain("translate");
      expect(translation.when_not_to_use).toContain("docs-viewer.read_active_translation");
      expect(visibleCollector).toMatchObject({
        capability_id: "workstation_tool_reference.collect_visible_translation_targets",
        optional_input_fields: expect.arrayContaining([
          "active_panel_id",
          "doc_path",
          "visible_text_chunks",
          "active_doc_visible_translation_context",
          "workspace_context_snapshot",
          "target_language",
        ]),
        result_authority: "observation_or_receipt_only",
        reentry_required: true,
        terminal_eligible: false,
        assistant_answer: false,
      });
      expect(visibleCollector.when_to_use).toContain("visible UI");
      expect(visibleCollector.when_to_use).toContain("live_translation.translate_text");
      expect(visibleCollector.when_not_to_use).toContain("arbitrary unseen files");
      expect(JSON.stringify(visibleCollector.request_shape_hint)).toContain(
        "workspace_context_snapshot.active_doc_visible_translation_context",
      );
      expect(JSON.stringify(translation.request_shape_hint)).toContain("capability_lane_call");
      expect(JSON.stringify(translation.request_shape_hint)).toContain("live_translation.translate_text");
      expect(JSON.stringify(translation.request_shape_hint)).toContain("source_event_id");
      expect(JSON.stringify(translation.request_shape_hint)).toContain("source_event_ms");
      expect(JSON.stringify(translation.session_call_shape_hint)).toContain("capability_lane_session_call");
      expect(JSON.stringify(translation.session_call_shape_hint)).toContain("start | pause | resume | stop | record_observation | list");
      expect(JSON.stringify(translation.session_call_shape_hint)).toContain("source_binding");
      expect(JSON.stringify(translation.session_call_shape_hint)).toContain("source_text_hash");
      expect(JSON.stringify(translation.session_call_shape_hint)).toContain("source_text_char_count");
      expect(JSON.stringify(translation.goal_binding_call_shape_hint)).toContain("capability_lane_goal_binding_call");
      expect(JSON.stringify(translation.goal_binding_call_shape_hint)).toContain("bind | update_attention | record_mail_loop | record_report | stop");
      expect(JSON.stringify(translation.goal_binding_call_shape_hint)).toContain("terminal_authorized");
      expect(debug.agent_runtime_adapter_contract.model_visible_capability_lane_manifest).toEqual(modelVisible);
      expect(prompt).toContain("Model-visible Helix capability lane manifest:");
      expect(prompt).toContain("live_translation.translate_text");
      expect(prompt).toContain("workstation_tool_reference.collect_visible_translation_targets");
      expect(prompt).toContain("capability_lane_session_call");
      expect(prompt).toContain("start | pause | resume | stop | record_observation | list");
      expect(prompt).toContain("capability_lane_goal_binding_call");
      expect(prompt).toContain("bind | update_attention | record_mail_loop | record_report | stop");
      expect(prompt).toContain("docs-viewer.read_active_translation");
      expect(prompt).toContain("lane_outputs_are_not_final_answers");
      expect(prompt).toContain("Capability lane outputs are observations or receipts");
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
      if (previousCapturePromptPath === undefined) {
        delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      } else {
        process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = previousCapturePromptPath;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("executes structured one-shot lane calls at the provider adapter edge", async () => {
    const result = await codexProvider.runTurn({
      runtime: "codex",
      route: "/ask/turn",
      body: {
        turn_id: "turn-codex-lane-adapter",
        question: "",
        capability_lane_call: {
          capability: "utility_text.normalize_text",
          text: "  HELLO   WORKSTATION  ",
          normalization_mode: "lowercase",
          requested_backend_provider: "utility_text.openai_compatible",
        },
      },
    });
    const debug = result.debug as Record<string, unknown>;

    expect(result).toMatchObject({
      ok: false,
      runtime: "codex",
      response_type: "final_failure",
      final_status: "final_failure",
    });
    expect(debug.capability_lane_call_results).toEqual([
      expect.objectContaining({
        schema: "helix.utility_text.normalize_result.v1",
        ok: true,
        capability: "utility_text.normalize_text",
        lane_id: "utility_text",
        normalized_text: "hello workstation",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(debug.capability_lane_resolve_traces).toEqual([
      expect.objectContaining({
        requested_lane: "utility_text",
        requested_backend_provider: "utility_text.openai_compatible",
        selected_backend_provider: "utility_text.local_runtime",
        execution_status: "executed_observation_only",
      }),
    ]);
    expect(debug.capability_lane_backend_selections).toEqual([
      expect.objectContaining({
        schema: "helix.capability_lane.backend_selection_summary.v1",
        selected_runtime_agent_provider: "codex",
        lane_id: "utility_text",
        capability: "utility_text.normalize_text",
        requested_lane: "utility_text",
        requested_backend_provider: "utility_text.openai_compatible",
        selected_backend_provider: "utility_text.local_runtime",
        selection_reason: "requested_backend_recorded_but_default_backend_selected_by_helix_shadow_policy",
        execution_status: "executed_observation_only",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(debug.capability_lane_observation_packets).toEqual([
      expect.objectContaining({
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "turn-codex-lane-adapter",
        capability_key: "utility_text.normalize_text",
        status: "succeeded",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
    expect(debug.capability_lane_debug_events).toEqual([
      expect.objectContaining({ stage: "lane_requested" }),
      expect.objectContaining({ stage: "lane_backend_selected" }),
      expect.objectContaining({ stage: "lane_observation" }),
      expect.objectContaining({ stage: "lane_reentered" }),
    ]);
    expect(debug.capability_lane_turn_timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        schema: "helix.capability_lane.provider_timeline_event.v1",
        stage: "lane_visible",
        selected_runtime_agent_provider: "codex",
        lane_id: "live_translation",
        capability_id: "live_translation.translate_text",
        lane_visible: true,
        lane_requested: false,
        lane_executed: false,
        observation_reentered: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
      expect.objectContaining({
        stage: "lane_observation",
        selected_runtime_agent_provider: "codex",
        lane_id: "utility_text",
        capability_id: "utility_text.normalize_text",
        status: "completed",
        lane_visible: false,
        lane_requested: true,
        lane_executed: true,
        terminal_authority_status: "pending_helix_terminal_authority",
      }),
      expect.objectContaining({
        stage: "lane_reentered",
        lane_id: "utility_text",
        capability_id: "utility_text.normalize_text",
        observation_reentered: true,
        observation_ref: expect.any(String),
        terminal_authority_status: "pending_helix_terminal_authority",
      }),
    ]));
    expect(debug.capability_lane_reentry_status).toBe("observation_packet_required_for_provider_reentry");
    expect(debug.current_turn_artifact_ledger).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "capability_lane_observation_packet",
          observation_kind: "utility_text.normalize_text",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        }),
      ]),
      );
  });

  it("re-enters pre-admitted speech, translation, and voice lanes as non-terminal Codex observations", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    process.env.CODEX_AGENT_FAKE_STDOUT =
      "Speech, translation, and voice lane observations were re-entered as non-terminal receipts.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          agent_runtime: "codex",
          turn_id: "turn-codex-stt-translation-voice-adapter",
          question:
            "Report the statuses of the admitted speech, translation, and voice observations without treating any lane output as the final answer.",
          capability_lane_call: [
            {
              capability: "speech_to_text.transcribe_audio",
              audio_ref: "voice:audio:codex-adapter-proof",
              audio_hash: "codex-adapter-proof-audio-hash",
              transcript_text: "hello workstation",
              language: "en",
              source_id: "audio_transcript:helix-ask:desktop",
              thread_id: "helix-ask:desktop",
              capture_session_id: "capture:codex-adapter-proof",
              chunk_index: 0,
            },
            {
              capability: "live_translation.translate_text",
              text: "hello workstation",
              source_language: "en",
              target_language: "es",
              source_id: "audio_transcript:helix-ask:desktop",
              projection_target: "audio_chunk",
            },
            {
              capability: "text_to_speech.speak_text",
              text: "hola estacion de trabajo",
              source_observation_ref: "turn-codex-stt-translation-voice-adapter:translation",
            },
          ],
        },
      });
      const debug = result.debug as Record<string, any>;
      const callResults = debug.capability_lane_call_results as Array<Record<string, any>>;
      const observationPackets = debug.capability_lane_observation_packets as Array<Record<string, any>>;

      expect(result).toMatchObject({
        runtime: "codex",
        answer: "Speech, translation, and voice lane observations were re-entered as non-terminal receipts.",
      });
      expect(callResults.map((call) => call.capability)).toEqual([
        "speech_to_text.transcribe_audio",
        "live_translation.translate_text",
        "text_to_speech.speak_text",
      ]);
      expect(callResults).toEqual(expect.arrayContaining([
        expect.objectContaining({
          ok: true,
          capability: "speech_to_text.transcribe_audio",
          lane_id: "speech_to_text",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
        expect.objectContaining({
          ok: true,
          capability: "live_translation.translate_text",
          lane_id: "live_translation",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
        }),
        expect.objectContaining({
          capability: "text_to_speech.speak_text",
          lane_id: "text_to_speech",
          assistant_answer: false,
          terminal_eligible: false,
          raw_content_included: false,
          receipt: expect.objectContaining({
            playback_status: expect.stringMatching(/^(pending|blocked)$/),
            terminal_eligible: false,
            assistant_answer: false,
          }),
        }),
      ]));
      expect(observationPackets.map((packet) => packet.capability_key)).toEqual([
        "speech_to_text.transcribe_audio",
        "live_translation.translate_text",
        "text_to_speech.speak_text",
      ]);
      expect(observationPackets).toEqual(expect.arrayContaining([
        expect.objectContaining({
          status: "succeeded",
          capability_key: "speech_to_text.transcribe_audio",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
          state_delta: expect.objectContaining({
            speech_to_text_observation: expect.objectContaining({
              capability: "speech_to_text.transcribe_audio",
              transcript_preview: "hello workstation",
              assistant_answer: false,
              terminal_eligible: false,
              raw_audio_included: false,
            }),
            speech_to_text_live_source_mail_item: expect.objectContaining({
              sourceKind: "audio_transcript",
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
            }),
          }),
        }),
        expect.objectContaining({
          status: "succeeded",
          capability_key: "live_translation.translate_text",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
          state_delta: expect.objectContaining({
            live_translation_chunk: expect.objectContaining({
              terminal_eligible: false,
              assistant_answer: false,
            }),
          }),
        }),
        expect.objectContaining({
          status: expect.stringMatching(/^(client_pending|blocked)$/),
          capability_key: "text_to_speech.speak_text",
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
          state_delta: expect.objectContaining({
            text_to_speech_receipt: expect.objectContaining({
              playback_status: expect.stringMatching(/^(pending|blocked)$/),
              terminal_eligible: false,
              assistant_answer: false,
            }),
          }),
        }),
      ]));
      expect(debug.capability_lane_debug_events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ capability: "speech_to_text.transcribe_audio", stage: "lane_observation" }),
          expect.objectContaining({ capability: "live_translation.translate_text", stage: "lane_observation" }),
          expect.objectContaining({ capability: "text_to_speech.speak_text", stage: "lane_observation" }),
          expect.objectContaining({ stage: "lane_reentered" }),
        ]),
      );
      expect(debug.capability_lane_reentry_status).toBe("observation_packet_required_for_provider_reentry");
      expect(debug.current_turn_artifact_ledger).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "capability_lane_observation_packet",
            observation_kind: "speech_to_text.transcribe_audio",
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
          }),
        ]),
      );
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("normalizes Moral Graph substrate gateway observations for Codex re-entry", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    process.env.CODEX_AGENT_FAKE_STDOUT = "Moral substrate observation received.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          agent_runtime: "codex",
          turn_id: "turn-codex-moral-substrate-gateway",
          question:
            "Use moral-graph.reflect_living_substrate_context for organism boundary, sensing, homeostasis, entropy pressure, and non-human living systems.",
        },
      });
      const debug = result.debug as Record<string, any>;

      expect(debug.workstation_gateway_call_results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ok: true,
            capability_id: "moral-graph.reflect_living_substrate_context",
          }),
        ]),
      );
      expect(debug.current_turn_artifact_ledger).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "moral_living_substrate_reflection",
            observation_kind: "moral_living_substrate_reflection",
            payload_schema: "helix.moral_living_substrate_reflection_observation.v1",
            capability_key: "moral-graph.reflect_living_substrate_context",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        ]),
      );
      expect(debug.provider_observation_normalization_failures ?? []).not.toContain(
        "provider_observation_normalization_missing:moral-graph.reflect_living_substrate_context",
      );
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });

  it("normalizes general Moral Graph gateway observations for Codex re-entry", async () => {
    const previousStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
    const previousExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
    process.env.CODEX_AGENT_FAKE_STDOUT = "Moral Graph observation received.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
    try {
      const result = await codexProvider.runTurn({
        runtime: "codex",
        route: "/ask/turn",
        body: {
          agent_runtime: "codex",
          turn_id: "turn-codex-moral-graph-gateway",
          question:
            "Use moral-graph.reflect_context for inherited conditioning, purpose as inquiry, and recognition before transcendence.",
        },
      });
      const debug = result.debug as Record<string, any>;

      expect(debug.workstation_gateway_call_results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ok: true,
            capability_id: "moral-graph.reflect_context",
          }),
        ]),
      );
      expect(debug.current_turn_artifact_ledger).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "moral_graph_reflection",
            observation_kind: "moral_graph_reflection",
            payload_schema: "helix.moral_graph_reflection_observation.v1",
            capability_key: "moral-graph.reflect_context",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }),
        ]),
      );
      expect(debug.provider_observation_normalization_failures ?? []).not.toContain(
        "provider_observation_normalization_missing:moral-graph.reflect_context",
      );
    } finally {
      if (previousStdout === undefined) {
        delete process.env.CODEX_AGENT_FAKE_STDOUT;
      } else {
        process.env.CODEX_AGENT_FAKE_STDOUT = previousStdout;
      }
      if (previousExitCode === undefined) {
        delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      } else {
        process.env.CODEX_AGENT_FAKE_EXIT_CODE = previousExitCode;
      }
    }
  });
});
