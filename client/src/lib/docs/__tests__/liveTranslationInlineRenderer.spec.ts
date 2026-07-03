import { describe, expect, it } from "vitest";
import type { DocumentTranslationUnit } from "@shared/document-translation";
import { renderDocumentMarkdownWithInlineTranslations } from "@/lib/docs/liveTranslationInlineRenderer";

const unit = (unitId: string, sourceMarkdown: string, translatable = true): DocumentTranslationUnit => ({
  unit_id: unitId,
  kind: "paragraph",
  source_markdown: sourceMarkdown,
  translatable,
  protected_spans: [],
});

describe("document live translation inline renderer", () => {
  it("marks missing governed inline projections as empty without adding visible translation text", () => {
    const rendered = renderDocumentMarkdownWithInlineTranslations({
      units: [unit("u0001", "Original source paragraph.")],
      translations: {},
      loadingText: "Translating...",
      errorText: (reason) => `Could not translate: ${reason}`,
      fallbackErrorText: "translation failed",
    });

    expect(rendered).toContain("Original source paragraph.");
    expect(rendered).toContain('data-doc-translation-anchor="u0001"');
    expect(rendered).toContain('data-doc-translation-role="governed-inline-projection-anchor"');
    expect(rendered).toContain('data-doc-translation-governed-projection="true"');
    expect(rendered).toContain('data-doc-translation-authority-policy="projection_only_not_answer_authority"');
    expect(rendered).toContain('data-doc-translation-display-status="empty"');
    expect(rendered).toContain('data-doc-translation-render-status="empty"');
    expect(rendered).toContain('data-doc-translation-projection-status="missing"');
    expect(rendered).toContain('data-doc-translation-terminal-eligible="false"');
    expect(rendered).toContain('data-doc-translation-assistant-answer="false"');
    expect(rendered).toContain('data-doc-translation-raw-content-included="false"');
    expect(rendered).not.toContain("Translating...");
    expect(rendered).not.toContain("Could not translate");
    expect(rendered).not.toContain("doc-generated-translation");
  });

  it("renders governed translation projection separately from source text with non-authority metadata", () => {
    const rendered = renderDocumentMarkdownWithInlineTranslations({
      units: [
        unit("u0001", "Original source paragraph."),
        unit("u0002", "Protected source paragraph.", false),
      ],
      translations: {
        u0001: {
          status: "ready",
          text: "### Parrafo traducido\n- linea dos",
          observationRef: "obs:docs:u1",
          receiptRef: "receipt:docs:u1",
          serverProjectionKey: "server-projection-key-current",
          observationLaneSessionId: "lane-session-observation-u1",
          goalBindingId: "goal-binding-translate-docs",
          latestEventId: "lane-session-docs:observation_recorded:300",
          hasObservation: true,
          selectedBackendProvider: "live_translation.local_runtime",
          projectionStatus: "projected",
          chunkId: "u0001",
          chunkIndex: 0,
          dedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
          sourceEventId: "source-event:docs:u0001",
          sourceEventMs: 240,
          observedAtMs: 300,
          freshnessStatus: "fresh",
          terminalAuthorityStatus: "not_terminal_authority",
          sourceId: "document_markdown:docs/research/nhm2.md",
          sourceHash: "source-hash-current",
          sourceKind: "document_markdown",
          sourceTextHash: "source-text-hash-current",
          sourceTextCharCount: 27,
          accountLocale: "es-US",
          projectionTarget: "docs_chunk",
          targetLanguage: "es",
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      loadingText: "Translating...",
      errorText: (reason) => `Could not translate: ${reason}`,
      fallbackErrorText: "translation failed",
    });

    expect(rendered).toContain("Original source paragraph.");
    expect(rendered).toContain("Protected source paragraph.");
    expect(rendered).toContain('data-doc-translation-anchor="u0001"');
    expect(rendered).toContain('data-doc-translation-role="governed-inline-projection-anchor"');
    expect(rendered).toContain('data-doc-translation-display-status="ready"');
    expect(rendered).toContain('data-doc-translation-render-status="ready"');
    expect(rendered).toContain('data-doc-translation-observation-ref="obs:docs:u1"');
    expect(rendered).toContain('data-doc-translation-receipt-ref="receipt:docs:u1"');
    expect(rendered).toContain('data-doc-translation-server-projection-key="server-projection-key-current"');
    expect(rendered).toContain('class="doc-generated-translation');
    expect(rendered).toContain("border-emerald-400/70 text-emerald-300");
    expect(rendered).toContain('data-doc-translation-line="u0001"');
    expect(rendered).toContain('data-doc-translation-role="governed-inline-projection"');
    expect(rendered).toContain('data-doc-translation-governed-projection="true"');
    expect(rendered).toContain('data-doc-translation-authority-policy="projection_only_not_answer_authority"');
    expect(rendered).toContain('data-doc-translation-render-status="ready"');
    expect(rendered).toContain('data-doc-translation-display-status="ready"');
    expect(rendered).toContain('data-doc-translation-observation-ref="obs:docs:u1"');
    expect(rendered).toContain('data-doc-translation-receipt-ref="receipt:docs:u1"');
    expect(rendered).toContain('data-doc-translation-observation-lane-session-id="lane-session-observation-u1"');
    expect(rendered).toContain('data-doc-translation-goal-binding-id="goal-binding-translate-docs"');
    expect(rendered).toContain('data-doc-translation-latest-event-id="lane-session-docs:observation_recorded:300"');
    expect(rendered).toContain('data-doc-translation-has-observation="true"');
    expect(rendered).toContain('data-doc-translation-terminal-authority-status="not_terminal_authority"');
    expect(rendered).toContain('data-doc-translation-terminal-eligible="false"');
    expect(rendered).toContain('data-doc-translation-assistant-answer="false"');
    expect(rendered).toContain('data-doc-translation-raw-content-included="false"');
    expect(rendered).toContain('data-doc-translation-chunk-id="u0001"');
    expect(rendered).toContain('data-doc-translation-chunk-index="0"');
    expect(rendered).toContain(
      'data-doc-translation-dedupe-key="document_markdown:docs/research/nhm2.md:u0001:es"',
    );
    expect(rendered).toContain('data-doc-translation-source-event-id="source-event:docs:u0001"');
    expect(rendered).toContain('data-doc-translation-source-event-ms="240"');
    expect(rendered).toContain('data-doc-translation-observed-at-ms="300"');
    expect(rendered).toContain('data-doc-translation-freshness-status="fresh"');
    expect(rendered).toContain('data-doc-translation-source-kind="document_markdown"');
    expect(rendered).toContain('data-doc-translation-source-hash="source-hash-current"');
    expect(rendered).toContain([
      'data-doc-translation-projection-key="document_markdown:docs/research/nhm2.md',
      'source-hash-current',
      'source-text-hash-current',
      'docs_chunk',
      'es',
      'u0001',
      'receipt:docs:u1"',
    ].join("::"));
    expect(rendered).toContain('data-doc-translation-source-text-hash="source-text-hash-current"');
    expect(rendered).toContain('data-doc-translation-source-text-char-count="27"');
    expect(rendered).toContain("Parrafo traducido<br />linea dos");
  });

  it("keeps inline projection keys distinct when source text hash changes", () => {
    const rendered = renderDocumentMarkdownWithInlineTranslations({
      units: [
        unit("u0001", "Original source paragraph."),
        unit("u0002", "Original source paragraph."),
      ],
      translations: {
        u0001: {
          status: "ready",
          text: "Texto anterior",
          observationRef: "obs:docs:u1",
          receiptRef: "receipt:docs:shared",
          projectionStatus: "projected",
          freshnessStatus: "fresh",
          terminalAuthorityStatus: "not_terminal_authority",
          sourceId: "document_markdown:docs/research/nhm2.md",
          sourceHash: "source-hash-current",
          sourceTextHash: "source-text-hash-old",
          projectionTarget: "docs_chunk",
          targetLanguage: "es",
          chunkId: "u0001",
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
        u0002: {
          status: "ready",
          text: "Texto nuevo",
          observationRef: "obs:docs:u2",
          receiptRef: "receipt:docs:shared",
          projectionStatus: "projected",
          freshnessStatus: "fresh",
          terminalAuthorityStatus: "not_terminal_authority",
          sourceId: "document_markdown:docs/research/nhm2.md",
          sourceHash: "source-hash-current",
          sourceTextHash: "source-text-hash-new",
          projectionTarget: "docs_chunk",
          targetLanguage: "es",
          chunkId: "u0001",
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      loadingText: "Translating...",
      errorText: (reason) => `Could not translate: ${reason}`,
      fallbackErrorText: "translation failed",
    });

    expect(rendered).toContain([
      'data-doc-translation-projection-key="document_markdown:docs/research/nhm2.md',
      'source-hash-current',
      'source-text-hash-old',
      'docs_chunk',
      'es',
      'u0001',
      'receipt:docs:shared"',
    ].join("::"));
    expect(rendered).toContain([
      'data-doc-translation-projection-key="document_markdown:docs/research/nhm2.md',
      'source-hash-current',
      'source-text-hash-new',
      'docs_chunk',
      'es',
      'u0001',
      'receipt:docs:shared"',
    ].join("::"));
  });

  it("keeps projection errors visible as receipts instead of translated answers", () => {
    const rendered = renderDocumentMarkdownWithInlineTranslations({
      units: [unit("u0001", "Original source paragraph.")],
      translations: {
        u0001: {
          status: "error",
          error: "translation_projection_stale",
          observationRef: "obs:docs:stale",
          receiptRef: "receipt:docs:stale",
          projectionStatus: "stale",
          freshnessStatus: "stale",
          terminalAuthorityStatus: "not_terminal_authority",
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      loadingText: "Translating...",
      errorText: (reason) => `Could not translate: ${reason}`,
      fallbackErrorText: "translation failed",
    });

    expect(rendered).toContain("Original source paragraph.");
    expect(rendered).toContain('data-doc-translation-anchor="u0001"');
    expect(rendered).toContain('data-doc-translation-role="governed-inline-projection-anchor"');
    expect(rendered).toContain('data-doc-translation-display-status="stale"');
    expect(rendered).toContain('data-doc-translation-render-status="error"');
    expect(rendered).toContain('data-doc-translation-observation-ref="obs:docs:stale"');
    expect(rendered).toContain("Could not translate: translation_projection_stale");
    expect(rendered).toContain("border-amber-400/70 text-amber-300");
    expect(rendered).toContain('data-doc-translation-role="governed-inline-projection"');
    expect(rendered).toContain('data-doc-translation-governed-projection="true"');
    expect(rendered).toContain('data-doc-translation-render-status="error"');
    expect(rendered).toContain('data-doc-translation-display-status="stale"');
    expect(rendered).toContain('data-doc-translation-projection-status="stale"');
    expect(rendered).toContain('data-doc-translation-observation-ref="obs:docs:stale"');
    expect(rendered).toContain('data-doc-translation-terminal-eligible="false"');
    expect(rendered).toContain('data-doc-translation-assistant-answer="false"');
  });

  it("renders source identity mismatches as blocked governed projection state", () => {
    const rendered = renderDocumentMarkdownWithInlineTranslations({
      units: [unit("u0001", "Original source paragraph.")],
      translations: {
        u0001: {
          status: "error",
          error: "translation_projection_source_text_mismatch",
          observationRef: null,
          receiptRef: null,
          projectionStatus: "missing",
          freshnessStatus: "unknown",
          terminalAuthorityStatus: "not_terminal_authority",
          sourceId: "document_markdown:docs/research/nhm2.md",
          sourceHash: "source-hash-current",
          sourceTextHash: "source-text-current",
          sourceTextCharCount: 27,
          projectionTarget: "docs_chunk",
          targetLanguage: "es",
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      loadingText: "Translating...",
      errorText: (reason) => `Could not translate: ${reason}`,
      fallbackErrorText: "translation failed",
    });

    expect(rendered).toContain("Original source paragraph.");
    expect(rendered).toContain("Could not translate: translation_projection_source_text_mismatch");
    expect(rendered).toContain('data-doc-translation-display-status="blocked"');
    expect(rendered).toContain('data-doc-translation-render-status="error"');
    expect(rendered).toContain('data-doc-translation-projection-status="missing"');
    expect(rendered).toContain('data-doc-translation-source-hash="source-hash-current"');
    expect(rendered).toContain('data-doc-translation-source-text-hash="source-text-current"');
    expect(rendered).toContain('data-doc-translation-source-text-char-count="27"');
    expect(rendered).toContain('data-doc-translation-terminal-eligible="false"');
    expect(rendered).toContain('data-doc-translation-assistant-answer="false"');
    expect(rendered).not.toContain("Texto viejo");
  });

  it("keeps suppressed stale projection identity inspectable while rendering current ready text", () => {
    const rendered = renderDocumentMarkdownWithInlineTranslations({
      units: [unit("u0001", "Original source paragraph.")],
      translations: {
        u0001: {
          status: "ready",
          text: "Texto actual",
          observationRef: "obs:docs:current",
          receiptRef: "receipt:docs:current",
          serverProjectionKey: "server-projection-key-current",
          projectionStatus: "projected",
          freshnessStatus: "fresh",
          terminalAuthorityStatus: "not_terminal_authority",
          sourceId: "document_markdown:docs/research/nhm2.md",
          sourceHash: "source-hash-current",
          sourceTextHash: "source-text-current",
          projectionTarget: "docs_chunk",
          targetLanguage: "es",
          chunkId: "u0001",
          suppressedObservationRef: "obs:docs:stale",
          suppressedReceiptRef: "receipt:docs:stale",
          suppressedServerProjectionKey: "server-projection-key-stale",
          suppressedProjectionStatus: "stale",
          suppressedFreshnessStatus: "stale",
          suppressedSourceId: "document_markdown:docs/research/nhm2.md",
          suppressedSourceHash: "source-hash-previous",
          suppressedSourceTextHash: "source-text-previous",
          suppressedProjectionTarget: "docs_chunk",
          suppressedTargetLanguage: "es",
          suppressedChunkId: "u0001",
          suppressedReason: "stale_projection_did_not_replace_fresh_text",
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      loadingText: "Translating...",
      errorText: (reason) => `Could not translate: ${reason}`,
      fallbackErrorText: "translation failed",
    });

    expect(rendered).toContain("Texto actual");
    expect(rendered).toContain('data-doc-translation-display-status="ready"');
    expect(rendered).toContain([
      'data-doc-translation-projection-key="document_markdown:docs/research/nhm2.md',
      'source-hash-current',
      'source-text-current',
      'docs_chunk',
      'es',
      'u0001',
      'receipt:docs:current"',
    ].join("::"));
    expect(rendered).toContain([
      'data-doc-translation-suppressed-projection-key="document_markdown:docs/research/nhm2.md',
      'source-hash-previous',
      'source-text-previous',
      'docs_chunk',
      'es',
      'u0001',
      'receipt:docs:stale"',
    ].join("::"));
    expect(rendered).toContain('data-doc-translation-server-projection-key="server-projection-key-current"');
    expect(rendered).toContain('data-doc-translation-suppressed-server-projection-key="server-projection-key-stale"');
    expect(rendered).toContain('data-doc-translation-suppressed-observation-ref="obs:docs:stale"');
    expect(rendered).toContain('data-doc-translation-suppressed-receipt-ref="receipt:docs:stale"');
    expect(rendered).toContain('data-doc-translation-suppressed-source-hash="source-hash-previous"');
    expect(rendered).toContain('data-doc-translation-suppressed-source-text-hash="source-text-previous"');
    expect(rendered).toContain('data-doc-translation-suppressed-chunk-id="u0001"');
    expect(rendered).toContain('data-doc-translation-suppressed-freshness-status="stale"');
    expect(rendered).toContain('data-doc-translation-suppressed-reason="stale_projection_did_not_replace_fresh_text"');
    expect(rendered).not.toContain("Could not translate");
  });

  it("keeps active translation projection traceable as non-authoritative lane state", () => {
    const rendered = renderDocumentMarkdownWithInlineTranslations({
      units: [unit("u0001", "Original source paragraph.")],
      translations: {
        u0001: {
          status: "loading",
          observationRef: "obs:docs:pending",
          receiptRef: "receipt:docs:pending",
          laneSessionId: "lane-session-docs-translation",
          hasObservation: false,
          selectedBackendProvider: "live_translation.local_runtime",
          projectionStatus: "missing",
          freshnessStatus: "fresh",
          terminalAuthorityStatus: "not_terminal_authority",
          sourceId: "document_markdown:docs/research/nhm2.md",
          sourceHash: "source-hash-current",
          sourceKind: "document_markdown",
          accountLocale: "es-US",
          projectionTarget: "docs_chunk",
          targetLanguage: "es",
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      loadingText: "Translating...",
      errorText: (reason) => `Could not translate: ${reason}`,
      fallbackErrorText: "translation failed",
    });

    expect(rendered).toContain("Translating...");
    expect(rendered).toContain('data-doc-translation-anchor="u0001"');
    expect(rendered).toContain('data-doc-translation-role="governed-inline-projection-anchor"');
    expect(rendered).toContain('data-doc-translation-display-status="active"');
    expect(rendered).toContain('data-doc-translation-render-status="loading"');
    expect(rendered).toContain('data-doc-translation-lane-session-id="lane-session-docs-translation"');
    expect(rendered).toContain("border-cyan-400/70 text-cyan-300/85 animate-pulse");
    expect(rendered).toContain('data-doc-translation-role="governed-inline-projection"');
    expect(rendered).toContain('data-doc-translation-governed-projection="true"');
    expect(rendered).toContain('data-doc-translation-render-status="loading"');
    expect(rendered).toContain('data-doc-translation-display-status="active"');
    expect(rendered).toContain('data-doc-translation-projection-status="missing"');
    expect(rendered).toContain('data-doc-translation-lane-session-id="lane-session-docs-translation"');
    expect(rendered).toContain('data-doc-translation-has-observation="false"');
    expect(rendered).toContain('data-doc-translation-source-hash="source-hash-current"');
    expect(rendered).toContain('data-doc-translation-terminal-authority-status="not_terminal_authority"');
    expect(rendered).toContain('data-doc-translation-terminal-eligible="false"');
    expect(rendered).toContain('data-doc-translation-assistant-answer="false"');
    expect(rendered).toContain('data-doc-translation-raw-content-included="false"');
  });

  it("keeps generic loading translation projection as pending when no lane session is active", () => {
    const rendered = renderDocumentMarkdownWithInlineTranslations({
      units: [unit("u0001", "Original source paragraph.")],
      translations: {
        u0001: {
          status: "loading",
          projectionStatus: "missing",
          freshnessStatus: "fresh",
          terminalAuthorityStatus: "not_terminal_authority",
          source: "capability_lane",
          terminalEligible: false,
          assistantAnswer: false,
          rawContentIncluded: false,
        },
      },
      loadingText: "Translating...",
      errorText: (reason) => `Could not translate: ${reason}`,
      fallbackErrorText: "translation failed",
    });

    expect(rendered).toContain("Translating...");
    expect(rendered).toContain("border-emerald-400/60 text-emerald-300/80 animate-pulse");
    expect(rendered).toContain('data-doc-translation-render-status="loading"');
    expect(rendered).toContain('data-doc-translation-display-status="pending"');
    expect(rendered).toContain('data-doc-translation-terminal-eligible="false"');
    expect(rendered).toContain('data-doc-translation-assistant-answer="false"');
  });

  it("projects cancelled, failed, and blocked display health without making receipts answers", () => {
    const renderFor = (unitId: string, state: Parameters<typeof renderDocumentMarkdownWithInlineTranslations>[0]["translations"][string]) =>
      renderDocumentMarkdownWithInlineTranslations({
        units: [unit(unitId, "Original source paragraph.")],
        translations: { [unitId]: state },
        loadingText: "Translating...",
        errorText: (reason) => `Could not translate: ${reason}`,
        fallbackErrorText: "translation failed",
      });

    const cancelled = renderFor("u-cancelled", {
      status: "error",
      error: "translation_projection_cancelled",
      observationRef: "obs:docs:cancelled",
      receiptRef: "receipt:docs:cancelled",
      projectionStatus: "cancelled",
      freshnessStatus: "fresh",
      terminalAuthorityStatus: "not_terminal_authority",
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    expect(cancelled).toContain('data-doc-translation-display-status="cancelled"');
    expect(cancelled).toContain("border-zinc-400/70 text-zinc-300");
    expect(cancelled).toContain('data-doc-translation-terminal-eligible="false"');
    expect(cancelled).toContain('data-doc-translation-assistant-answer="false"');

    const failed = renderFor("u-failed", {
      status: "error",
      error: "translation_projection_failed",
      observationRef: "obs:docs:failed",
      receiptRef: "receipt:docs:failed",
      projectionStatus: "failed",
      freshnessStatus: "fresh",
      terminalAuthorityStatus: "not_terminal_authority",
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    expect(failed).toContain('data-doc-translation-display-status="failed"');
    expect(failed).toContain("border-rose-400/70 text-rose-300");
    expect(failed).toContain('data-doc-translation-terminal-eligible="false"');
    expect(failed).toContain('data-doc-translation-assistant-answer="false"');

    const blocked = renderFor("u-blocked", {
      status: "error",
      error: "translation_projection_blocked",
      observationRef: "obs:docs:blocked",
      receiptRef: "receipt:docs:blocked",
      projectionStatus: "missing",
      freshnessStatus: "fresh",
      terminalAuthorityStatus: "not_terminal_authority",
      source: "capability_lane",
      terminalEligible: false,
      assistantAnswer: false,
      rawContentIncluded: false,
    });
    expect(blocked).toContain('data-doc-translation-display-status="blocked"');
    expect(blocked).toContain("border-amber-400/70 text-amber-300");
    expect(blocked).toContain('data-doc-translation-terminal-eligible="false"');
    expect(blocked).toContain('data-doc-translation-assistant-answer="false"');
  });
});
