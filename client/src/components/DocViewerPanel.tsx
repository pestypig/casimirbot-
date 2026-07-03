import React from "react";
import { marked, type MarkedOptions, type Tokens } from "marked";
import { renderToString as renderKatexToString } from "katex";
import "katex/dist/katex.min.css";
import { ArrowLeft, Folder, Languages, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { speakVoice } from "@/lib/agi/api";
import {
  DOC_MANIFEST,
  compareDocCatalogEntries,
  filterDocManifestEntries,
  findDocEntry,
  docCatalogTimestamp,
  type DocManifestEntry,
} from "@/lib/docs/docManifest";
import {
  documentMarkdownSourceId,
  enqueueDocumentMarkdownTranslationMail,
  extractDocumentMarkdownTranslationsFromRuns,
  readDocumentMarkdownMicroDeckRuns,
  runDocumentMarkdownTranslationLaneSessionControl,
} from "@/lib/docs/documentTranslationClient";
import {
  readDocumentLiveTranslationProjectionSnapshot,
  subscribeDocumentLiveTranslationProjectionRegistry,
  summarizeDocumentLiveTranslationProjectionSnapshot,
  type DocumentLiveTranslationProjectionSnapshotSummary,
} from "@/lib/docs/liveTranslationProjectionRegistry";
import { installDocumentLiveTranslationProjectionEventIngestion } from "@/lib/docs/liveTranslationProjectionEventIngestion";
import {
  documentMarkdownTranslationEntryToInlineRenderState,
  filterReadyDocumentInlineTranslationRenderStates,
  mergeDocumentLiveTranslationInlineStates,
  sameDocumentInlineTranslationRenderState,
  type DocumentInlineTranslationRenderState,
} from "@/lib/docs/liveTranslationInlineProjection";
import { renderDocumentMarkdownWithInlineTranslations } from "@/lib/docs/liveTranslationInlineRenderer";
import { consumeDocViewerIntent } from "@/lib/docs/docViewer";
import { buildWorkstationPathRef } from "@/lib/workstation/workstationDeepLink";
import {
  HELIX_WORKSTATION_PROCEDURAL_STEP_EVENT,
  type HelixWorkstationProceduralStepPayload,
} from "@/lib/workstation/proceduralPlaybackContract";
import { emitHelixAskLiveEvent } from "@/lib/helix/liveEventsBus";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import { dispatchScientificCalculatorMathPicked } from "@/lib/scientific-calculator/events";
import {
  executeDocEquationAction,
  getDocEquationActionEntryForLatex,
  getDocEquationTheoryActions,
} from "@/lib/docs/docEquationActions";
import {
  markInteraction,
  runWhenQuiet,
} from "@/lib/workstation/performance/workstationInteractionScheduler";
import { useHelixStartSettings } from "@/hooks/useHelixStartSettings";
import { getInterfaceLanguageOption } from "@/lib/i18n/interfaceLanguage";
import { useInterfaceText, type InterfaceTextResolver } from "@/lib/i18n/interfaceText";
import type { InterfaceMessageId } from "@/lib/i18n/messages/types";
import { useDocViewerStore } from "@/store/useDocViewerStore";
import { useWorkstationSessionMemoryStore } from "@/store/useWorkstationSessionMemoryStore";
import {
  hashDocumentSource,
  segmentMarkdownForTranslation,
  type DocumentTranslationUnit,
} from "@shared/document-translation";
import { HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK } from "@shared/helix-live-translation-projection-target";

type Translate = InterfaceTextResolver["t"];
type DisplayMessageMap = Record<string, InterfaceMessageId>;
export type DocumentTranslationUiStatus = "idle" | "cached" | "translating" | "ready" | "unavailable" | "error";
type InlineTranslationState = DocumentInlineTranslationRenderState;
type DocTaxonomyFilter = "all" | "canonical-research" | "current-development" | "synthetic-research" | "legacy-development" | "uncategorized";
type DocBadgeTone = "cyan" | "emerald" | "amber" | "slate";
type DocBadge = {
  label: string;
  tone: DocBadgeTone;
};

const DOC_INLINE_TRANSLATION_SESSION_PREFIX = "casimir.docs.inlineTranslation.v1";
const DOC_TRANSLATION_MAX_UNITS_PER_CHUNK = 3;
const DOC_TRANSLATION_MAX_CHARS_PER_CHUNK = 2200;
const DOC_TRANSLATION_SCAN_DEBOUNCE_MS = 360;

type StoredInlineTranslationSession = {
  enabled: boolean;
  translations: Record<string, InlineTranslationState>;
};

const EMPTY_LIVE_TRANSLATION_PROJECTION_SNAPSHOT = {
  version: 0,
  translations: {},
  laneSessions: {},
  mailLoops: {},
  goalBindings: {},
};

const documentInlineTranslationLaneSessionId = (scopeKey: string): string =>
  `lane_session:live_translation:docs:${hashDocumentSource(scopeKey)}`;

function readRecordArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((entry): entry is Record<string, unknown> =>
      Boolean(entry && typeof entry === "object" && !Array.isArray(entry))
    )
    : [];
}

function emitDocumentTranslationLaneSessionControlEvents(input: {
  response: Record<string, unknown>;
  sourceId: string;
  sourceHash: string;
}): void {
  const debug = input.response.debug && typeof input.response.debug === "object" && !Array.isArray(input.response.debug)
    ? (input.response.debug as Record<string, unknown>)
    : {};
  const summaries = [
    ...readRecordArray(input.response.capability_lane_session_debug_summaries),
    ...readRecordArray(input.response.session_debug_summaries),
    ...readRecordArray(debug.capability_lane_session_debug_summaries),
  ];
  summaries.forEach((summary, index) => {
    const eventId =
      typeof summary.latest_event_id === "string" && summary.latest_event_id.trim()
        ? summary.latest_event_id.trim()
        : `docs-translation-lane-session:${input.sourceId}:${index}:${Date.now()}`;
    emitHelixAskLiveEvent({
      contextId: HELIX_ASK_CONTEXT_ID.desktop,
      traceId: `docs-translation-lane-session:${input.sourceId}`,
      entry: {
        id: eventId,
        text: "Document translation lane session control.",
        tool: "capability_lane_session",
        tsMs: typeof summary.updated_at_ms === "number" ? summary.updated_at_ms : Date.now(),
        meta: {
          ...summary,
          sourceEventType: "lane_session",
          source_event_type: "lane_session",
          lane: "live_translation",
          sourceId: input.sourceId,
          source_id: input.sourceId,
          sourceHash: input.sourceHash,
          source_hash: input.sourceHash,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    });
  });
}

const proceduralStepMessages = {
  highlight_plus: "docsViewer.procedural.focusingPanelPicker",
  open_picker: "docsViewer.procedural.openingPanelPicker",
  target_panel: "docsViewer.procedural.selectingDocsPanel",
  open_doc: "docsViewer.procedural.openingSelectedDocument",
  read_start: "docsViewer.procedural.startingReadAloud",
  highlight_copy: "docsViewer.procedural.highlightingTopicSectionForCopy",
} satisfies DisplayMessageMap;

const docSubjectLabelMessages: DisplayMessageMap = {
  Architecture: "docsViewer.group.architecture",
  "Casimir and Quantum Bounds": "docsViewer.group.casimirAndQuantumBounds",
  "Curvature Studies": "docsViewer.group.curvatureStudies",
  "Ethos and Ideology": "docsViewer.group.ethosAndIdeology",
  "General Reference": "docsViewer.group.generalReference",
  "Helix Ask and Voice": "docsViewer.group.helixAskAndVoice",
  "Knowledge System": "docsViewer.group.knowledgeSystem",
  "Panels and UI": "docsViewer.group.panelsAndUi",
  "Physics Reference": "docsViewer.group.physicsReference",
  "Research and Development Logs": "docsViewer.group.researchAndDevelopmentLogs",
  Runbooks: "docsViewer.group.runbooks",
  "Stellar and Solar": "docsViewer.group.stellarAndSolar",
  "Warp Mechanics": "docsViewer.group.warpMechanics",
} satisfies DisplayMessageMap;

const docTaxonomyLabelMessages: Record<Exclude<DocTaxonomyFilter, "all" | "uncategorized">, InterfaceMessageId> = {
  "canonical-research": "docsViewer.taxonomy.canonicalResearch",
  "current-development": "docsViewer.taxonomy.currentDevelopment",
  "synthetic-research": "docsViewer.taxonomy.syntheticResearch",
  "legacy-development": "docsViewer.taxonomy.legacyDevelopment",
};

const docTaxonomyFilterOptions: Array<{ key: DocTaxonomyFilter; messageId: InterfaceMessageId }> = [
  { key: "all", messageId: "docsViewer.taxonomy.all" },
  { key: "canonical-research", messageId: "docsViewer.taxonomy.research" },
  { key: "current-development", messageId: "docsViewer.taxonomy.development" },
  { key: "synthetic-research", messageId: "docsViewer.taxonomy.syntheticResearchShort" },
  { key: "legacy-development", messageId: "docsViewer.taxonomy.legacyShort" },
  { key: "uncategorized", messageId: "docsViewer.taxonomy.uncategorized" },
];

export type DocMathPickContext = {
  latex: string;
  currentPath?: string;
  anchor?: string;
  clipboardWrite?: ((text: string) => Promise<void>) | null;
  dispatchEvent?: ((detail: { latex: string; sourcePath: string | null; anchor: string | null }) => void) | null;
};

export function handleDocMathPick(context: DocMathPickContext): void {
  const latex = context.latex.trim();
  if (!latex) return;
  const detail = {
    latex,
    sourcePath: context.currentPath ?? null,
    anchor: context.anchor ?? null,
  };
  const customDispatch = context.dispatchEvent;
  if (customDispatch) {
    customDispatch(detail);
  } else {
    dispatchScientificCalculatorMathPicked(detail);
  }
  const clipboardWrite = context.clipboardWrite;
  if (clipboardWrite) {
    void clipboardWrite(latex).catch(() => undefined);
  }
}

const DOC_MARKED_OPTIONS: MarkedOptions & { mangle?: boolean; headerIds?: boolean } = {
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false,
};

let activeMarkedDocPath: string | null = null;

marked.setOptions(DOC_MARKED_OPTIONS);
marked.use({
  extensions: [
    {
      name: "docMathBlock",
      level: "block",
      start(src: string) {
        const bracketStart = src.indexOf("\\[");
        const dollarStart = src.indexOf("$$");
        if (bracketStart === -1) return dollarStart;
        if (dollarStart === -1) return bracketStart;
        return Math.min(bracketStart, dollarStart);
      },
      tokenizer(src: string) {
        const bracketMatch = src.match(/^\\\[\n?([\s\S]+?)\n?\\\](?:\n|$)/);
        if (bracketMatch) {
          return {
            type: "docMathBlock",
            raw: bracketMatch[0],
            text: bracketMatch[1].trim(),
          };
        }
        const dollarMatch = src.match(/^\$\$\n?([\s\S]+?)\n?\$\$(?:\n|$)/);
        if (dollarMatch) {
          return {
            type: "docMathBlock",
            raw: dollarMatch[0],
            text: dollarMatch[1].trim(),
          };
        }
        return undefined;
      },
      renderer(token: Tokens.Generic) {
        return renderDocMath(typeof token.text === "string" ? token.text : "", true, activeMarkedDocPath);
      },
    },
    {
      name: "docMathInline",
      level: "inline",
      start(src: string) {
        return src.indexOf("\\(");
      },
      tokenizer(src: string) {
        const inlineMatch = src.match(/^\\\((.+?)\\\)/);
        if (!inlineMatch) return undefined;
        return {
          type: "docMathInline",
          raw: inlineMatch[0],
          text: inlineMatch[1].trim(),
        };
      },
      renderer(token: Tokens.Generic) {
        return renderDocMath(typeof token.text === "string" ? token.text : "", false, activeMarkedDocPath);
      },
    },
  ],
});

const DOC_AUTO_READ_PROVIDER = "elevenlabs";
const DOC_AUTO_READ_PROFILE_ID = "vU0dJF9WOwsWEUfX1Aqw";
const DOC_AUTO_READ_CHUNK_MAX = 560;
const DOC_AUTO_READ_MAX_CHARS = 12_000;
const DOC_AUTO_READ_TAG = "helix-doc-reader";
const DOC_AUTO_READ_ACTIVE_CLASS = "doc-read-active-section";
const DOC_NARRATOR_BLOCK_SELECTOR = "h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th,pre";

let globalDocReadController: AbortController | null = null;
let globalDocReadAudio: HTMLAudioElement | null = null;
let globalDocReadUrl: string | null = null;
let globalDocReadKey: string | null = null;

function stopGlobalDocRead() {
  if (globalDocReadController) {
    globalDocReadController.abort();
    globalDocReadController = null;
  }
  if (globalDocReadAudio) {
    globalDocReadAudio.pause();
    globalDocReadAudio.src = "";
    globalDocReadAudio = null;
  }
  if (globalDocReadUrl) {
    URL.revokeObjectURL(globalDocReadUrl);
    globalDocReadUrl = null;
  }
  globalDocReadKey = null;
}

export function DocViewerPanel() {
  const {
    mode,
    currentPath,
    anchor,
    pendingAutoReadNonce,
    viewDirectory,
    viewDoc,
    clearPendingAutoRead,
    applyIntent,
  } = useDocViewerStore();
  const { userSettings } = useHelixStartSettings();
  const interfaceLanguage = getInterfaceLanguageOption(userSettings.interfaceLanguage);
  const { t } = useInterfaceText(interfaceLanguage.code);
  const [query, setQuery] = React.useState("");
  const [docClassFilter, setDocClassFilter] = React.useState<DocTaxonomyFilter>("all");
  const [html, setHtml] = React.useState<string>("");
  const [rawMarkdown, setRawMarkdown] = React.useState<string>("");
  const [inlineTranslationEnabled, setInlineTranslationEnabled] = React.useState(false);
  const [inlineTranslations, setInlineTranslations] = React.useState<Record<string, InlineTranslationState>>({});
  const [translationStatus, setTranslationStatus] = React.useState<DocumentTranslationUiStatus>("idle");
  const [translationError, setTranslationError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadedDocId, setLoadedDocId] = React.useState<string | null>(null);
  const [isAutoReading, setIsAutoReading] = React.useState(false);
  const [autoReadError, setAutoReadError] = React.useState<string | null>(null);
  const [proceduralStatus, setProceduralStatus] = React.useState<string | null>(null);
  const [followLiveRead, setFollowLiveRead] = React.useState(true);
  const [readProgress, setReadProgress] = React.useState<{
    chunkIndex: number;
    chunkCount: number;
    snippet: string;
  } | null>(null);
  const rememberPanelScroll = useWorkstationSessionMemoryStore((state) => state.rememberPanelScroll);
  const readPanelScroll = useWorkstationSessionMemoryStore((state) => state.readPanelScroll);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const activeReadTargetRef = React.useRef<HTMLElement | null>(null);
  const modeRef = React.useRef(mode);
  const followLiveReadRef = React.useRef(followLiveRead);
  const liveReadChunkRef = React.useRef<string | null>(null);
  const lastProceduralTraceIdRef = React.useRef<string | null>(null);
  const visibleTranslationScanTimerRef = React.useRef<number | null>(null);
  const inFlightTranslationUnitIdsRef = React.useRef<Set<string>>(new Set());
  const documentTranslationChunkInFlightRef = React.useRef(false);
  const documentTranslationChunkIndexRef = React.useRef(0);
  const translationScopeKeyRef = React.useRef<string | null>(null);
  const currentEntry = React.useMemo(() => (currentPath ? findDocEntry(currentPath) : null), [currentPath]);
  const rawMarkdownSourceHash = React.useMemo(
    () => (rawMarkdown ? hashDocumentSource(rawMarkdown) : null),
    [rawMarkdown],
  );
  const translationUnits = React.useMemo(
    () => (rawMarkdown ? segmentMarkdownForTranslation(rawMarkdown) : []),
    [rawMarkdown],
  );
  const translationEligible =
    mode === "doc" && Boolean(currentEntry) && Boolean(rawMarkdown) && interfaceLanguage.code !== "en";
  const liveTranslationProjectionSnapshot = React.useSyncExternalStore(
    subscribeDocumentLiveTranslationProjectionRegistry,
    () =>
      currentEntry && translationEligible
        ? readDocumentLiveTranslationProjectionSnapshot({
          docPath: currentEntry.relativePath,
          locale: interfaceLanguage.code,
          sourceHash: rawMarkdownSourceHash,
          projectionTarget: HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK,
        })
        : EMPTY_LIVE_TRANSLATION_PROJECTION_SNAPSHOT,
    () => EMPTY_LIVE_TRANSLATION_PROJECTION_SNAPSHOT,
  );
  const liveTranslationProjectionSummary = React.useMemo(
    () => summarizeDocumentLiveTranslationProjectionSnapshot(liveTranslationProjectionSnapshot),
    [liveTranslationProjectionSnapshot],
  );
  const activeTranslationScopeKey = React.useMemo(
    () =>
      translationEligible && currentEntry && rawMarkdownSourceHash
        ? `${currentEntry.relativePath}:${interfaceLanguage.code}:${rawMarkdownSourceHash}`
        : null,
    [currentEntry, interfaceLanguage.code, rawMarkdownSourceHash, translationEligible],
  );
  const hasLoadingInlineTranslations = React.useMemo(
    () => Object.values(inlineTranslations).some((translation) => translation.status === "loading"),
    [inlineTranslations],
  );
  const inlineTranslationMarkdown = React.useMemo(() => {
    if (!inlineTranslationEnabled || !translationUnits.length) return rawMarkdown;
    return renderDocumentMarkdownWithInlineTranslations({
      units: translationUnits,
      translations: inlineTranslations,
      loadingText: t("docsViewer.translation.inlineLoading"),
      errorText: (reason) => t("docsViewer.translation.inlineError", { reason }),
      fallbackErrorText: t("docsViewer.translation.errorGeneric"),
    });
  }, [inlineTranslationEnabled, inlineTranslations, rawMarkdown, t, translationUnits]);
  const activeHtml = React.useMemo(() => {
    if (!currentEntry) return html;
    if (!inlineTranslationEnabled) return html;
    return renderDocumentMarkdownToHtml(inlineTranslationMarkdown, currentEntry.relativePath);
  }, [currentEntry, html, inlineTranslationEnabled, inlineTranslationMarkdown]);
  const docScrollMemoryKey = React.useMemo(
    () => (mode === "doc" && currentPath ? `docs-viewer:doc:${currentPath}` : "docs-viewer:directory"),
    [currentPath, mode],
  );

  React.useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  React.useEffect(() => {
    followLiveReadRef.current = followLiveRead;
  }, [followLiveRead]);

  React.useEffect(() => {
    const intent = consumeDocViewerIntent();
    if (intent) {
      applyIntent(intent);
    }
  }, [applyIntent]);

  React.useEffect(() => {
    if (mode !== "doc" || !currentEntry) {
      setHtml("");
      setRawMarkdown("");
      setInlineTranslationEnabled(false);
      setInlineTranslations({});
      setTranslationStatus("idle");
      setTranslationError(null);
      setError(null);
      setLoading(false);
      setLoadedDocId(null);
      return;
    }
    let canceled = false;
    setLoading(true);
    setError(null);
    setLoadedDocId(null);
    currentEntry
      .loader()
      .then((raw) => {
        if (canceled) return;
        setRawMarkdown(raw);
        setHtml(renderDocumentMarkdownToHtml(raw, currentEntry.relativePath));
        setLoadedDocId(currentEntry.id);
      })
      .catch((err) => {
        if (canceled) return;
        setError(err instanceof Error ? err.message : t("docsViewer.error.render"));
        setHtml("");
        setRawMarkdown("");
        setLoadedDocId(currentEntry.id);
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });
    return () => {
      canceled = true;
    };
  }, [mode, currentEntry, t]);

  React.useEffect(() => {
    inFlightTranslationUnitIdsRef.current.clear();
    documentTranslationChunkIndexRef.current = 0;
    setTranslationError(null);
    translationScopeKeyRef.current = activeTranslationScopeKey;
    if (!activeTranslationScopeKey) {
      setInlineTranslationEnabled(false);
      setInlineTranslations({});
      setTranslationStatus("idle");
      return;
    }
    const stored = readStoredInlineTranslationSession(activeTranslationScopeKey);
    setInlineTranslationEnabled(stored.enabled);
    setInlineTranslations(stored.translations);
    setTranslationStatus(
      stored.enabled
        ? Object.values(stored.translations).some((translation) => translation.status === "ready")
          ? "cached"
          : "ready"
        : "idle",
    );
  }, [activeTranslationScopeKey]);

  React.useEffect(() => {
    if (!activeTranslationScopeKey) return;
    writeStoredInlineTranslationSession(activeTranslationScopeKey, {
      enabled: inlineTranslationEnabled,
      translations: inlineTranslations,
    });
  }, [activeTranslationScopeKey, inlineTranslationEnabled, inlineTranslations]);

  React.useEffect(() => {
    if (!activeTranslationScopeKey || !translationEligible) return;
    if (liveTranslationProjectionSnapshot.version <= 0) return;
    const laneTranslations = Object.entries(liveTranslationProjectionSnapshot.translations);
    if (laneTranslations.length === 0) return;
    translationScopeKeyRef.current = activeTranslationScopeKey;
    setInlineTranslationEnabled(true);
    setInlineTranslations((current) =>
      mergeDocumentLiveTranslationInlineStates({
        current,
        laneStates: liveTranslationProjectionSnapshot.translations,
      })
    );
    setTranslationStatus((current) =>
      current === "error" || current === "unavailable" ? current : "cached"
    );
  }, [
    activeTranslationScopeKey,
    liveTranslationProjectionSnapshot,
    translationEligible,
  ]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!currentEntry || !translationEligible || translationUnits.length === 0) return;
    return installDocumentLiveTranslationProjectionEventIngestion({
      eventTarget: window,
      docPath: currentEntry.relativePath,
      locale: interfaceLanguage.code,
      sourceHash: rawMarkdownSourceHash,
      projectionTarget: HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK,
      units: translationUnits,
      allowStaleDisplayText: inlineTranslationEnabled,
    });
  }, [
    currentEntry,
    inlineTranslationEnabled,
    interfaceLanguage.code,
    rawMarkdownSourceHash,
    translationEligible,
    translationUnits,
  ]);

  React.useEffect(() => {
    if (!inlineTranslationEnabled) return;
    if (translationStatus === "error" || translationStatus === "unavailable") return;
    if (hasLoadingInlineTranslations) {
      if (translationStatus !== "translating") setTranslationStatus("translating");
      return;
    }
    const hasReady = Object.values(inlineTranslations).some((translation) => translation.status === "ready");
    setTranslationStatus(hasReady ? "cached" : "ready");
  }, [hasLoadingInlineTranslations, inlineTranslationEnabled, inlineTranslations, translationStatus]);

  React.useEffect(() => {
    if (mode !== "doc" || !anchor || !contentRef.current) return;
    const container = contentRef.current;
    const selector = `#${cssEscape(anchor)}`;
    const target = container.querySelector(selector) as HTMLElement | null;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.add("ring-2", "ring-cyan-400/70");
    if (typeof window === "undefined") return;
    const timeout = window.setTimeout(() => {
      target.classList.remove("ring-2", "ring-cyan-400/70");
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [activeHtml, anchor, mode]);

  React.useEffect(() => {
    if (mode !== "doc" || !contentRef.current) return;
    applyDocNarratorSourceIds(contentRef.current, currentEntry?.relativePath ?? currentPath);
  }, [activeHtml, currentEntry?.relativePath, currentPath, mode]);

  React.useLayoutEffect(() => {
    if (mode !== "doc" || anchor || loading || !contentRef.current) return;
    const saved = readPanelScroll(docScrollMemoryKey);
    if (!saved) return;
    const node = contentRef.current;
    const restore = () => {
      const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
      node.scrollTop = Math.min(saved.scrollTop, maxScrollTop);
    };
    if (typeof window === "undefined") {
      restore();
      return;
    }
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restore);
    });
    return () => window.cancelAnimationFrame(firstFrame);
  }, [activeHtml, anchor, docScrollMemoryKey, loading, mode, readPanelScroll]);

  const requestVisibleInlineTranslations = React.useCallback(async () => {
    if (
      !inlineTranslationEnabled ||
      !translationEligible ||
      !currentEntry ||
      !activeTranslationScopeKey ||
      !rawMarkdownSourceHash ||
      translationStatus === "error" ||
      translationStatus === "unavailable" ||
      documentTranslationChunkInFlightRef.current ||
      !contentRef.current
    ) {
      return;
    }
    const targetIds = collectVisibleTranslationUnitIds({
      container: contentRef.current,
      units: translationUnits,
      translations: inlineTranslations,
      inFlightIds: inFlightTranslationUnitIdsRef.current,
      sourceHash: rawMarkdownSourceHash,
      maxUnits: DOC_TRANSLATION_MAX_UNITS_PER_CHUNK,
      maxChars: DOC_TRANSLATION_MAX_CHARS_PER_CHUNK,
    });
    if (targetIds.length === 0) return;
    const targetSet = new Set(targetIds);
    const targetUnits = translationUnits.filter((unit) => targetSet.has(unit.unit_id));
    if (targetUnits.length === 0) return;
    const scopeKey = activeTranslationScopeKey;
    const laneSessionId = documentInlineTranslationLaneSessionId(scopeKey);
    const chunkIndex = documentTranslationChunkIndexRef.current + 1;
    const chunkId = `doc-inline:${rawMarkdownSourceHash}:${targetIds.join(",")}`;
    const sourceText = targetUnits.map((unit) => unit.source_markdown).join("\n\n");
    const pendingTranslationState = buildPendingDocumentInlineTranslationState({
      sourceId: documentMarkdownSourceId(currentEntry.relativePath),
      sourceHash: rawMarkdownSourceHash,
      sourceTextHash: hashDocumentSource(sourceText),
      sourceTextCharCount: sourceText.length,
      chunkId,
      chunkIndex,
      laneSessionId,
      accountLocale: interfaceLanguage.code,
      targetLanguage: interfaceLanguage.code,
    });
    translationScopeKeyRef.current = scopeKey;
    documentTranslationChunkInFlightRef.current = true;
    documentTranslationChunkIndexRef.current = chunkIndex;
    targetIds.forEach((unitId) => inFlightTranslationUnitIdsRef.current.add(unitId));
    setTranslationStatus("translating");
    setTranslationError(null);
    setInlineTranslations((current) => {
      const next = { ...current };
      targetIds.forEach((unitId) => {
        next[unitId] = pendingTranslationState;
      });
      return next;
    });

    try {
      await enqueueDocumentMarkdownTranslationMail({
        docPath: currentEntry.relativePath,
        locale: interfaceLanguage.code,
        targetLanguage: interfaceLanguage.code,
        accountLocale: interfaceLanguage.code,
        sourceHash: rawMarkdownSourceHash,
        sourceTextHash: pendingTranslationState.sourceTextHash,
        sourceTextCharCount: pendingTranslationState.sourceTextCharCount,
        title: currentEntry.title,
        sourceId: documentMarkdownSourceId(currentEntry.relativePath),
        chunkId,
        chunkIndex,
        laneSessionId,
        projectionTarget: HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK,
        units: targetUnits,
      });
      if (translationScopeKeyRef.current !== scopeKey) return;
      setInlineTranslations((current) => {
        const next = { ...current };
        targetUnits.forEach((unit) => {
          next[unit.unit_id] = current[unit.unit_id]?.status === "ready"
            ? current[unit.unit_id]
            : pendingTranslationState;
        });
        return next;
      });
      setTranslationStatus("translating");
    } catch (err) {
      if (translationScopeKeyRef.current !== scopeKey) return;
      const message =
        isAbortError(err)
          ? t("docsViewer.translation.errorTimeout")
          : err instanceof Error
            ? err.message
            : t("docsViewer.translation.errorGeneric");
      translationScopeKeyRef.current = null;
      setInlineTranslations((current) => {
        const next = { ...current };
        targetIds.forEach((unitId) => {
          delete next[unitId];
        });
        return next;
      });
      setTranslationError(message);
      setTranslationStatus("error");
    } finally {
      targetIds.forEach((unitId) => inFlightTranslationUnitIdsRef.current.delete(unitId));
      documentTranslationChunkInFlightRef.current = false;
    }
  }, [
    activeTranslationScopeKey,
    currentEntry,
    inlineTranslationEnabled,
    inlineTranslations,
    interfaceLanguage.code,
    rawMarkdownSourceHash,
    t,
    translationStatus,
    translationEligible,
    translationUnits,
  ]);

  const applyCompletedDocumentMicroDeckTranslations = React.useCallback(async (signal?: AbortSignal) => {
    if (
      !inlineTranslationEnabled ||
      !translationEligible ||
      !currentEntry ||
      !activeTranslationScopeKey ||
      !rawMarkdownSourceHash
    ) {
      return;
    }
    const sourceId = documentMarkdownSourceId(currentEntry.relativePath);
    const runs = await readDocumentMarkdownMicroDeckRuns({
      sourceId,
      threadId: HELIX_ASK_CONTEXT_ID.desktop,
      limit: 48,
      signal,
    });
    const translationByUnitId = new Map(
      extractDocumentMarkdownTranslationsFromRuns(runs).map((entry) => [entry.unitId, entry] as const),
    );
    if (!translationByUnitId.size) return;
    const translatableUnitIds = new Set(translationUnits.filter((unit) => unit.translatable).map((unit) => unit.unit_id));
    setInlineTranslations((current) => {
      let changed = false;
      const next = { ...current };
      for (const [unitId, entry] of translationByUnitId) {
        if (!translatableUnitIds.has(unitId)) continue;
        if (entry.docPath && entry.docPath !== currentEntry.relativePath) continue;
        if (entry.sourceHash && entry.sourceHash !== rawMarkdownSourceHash) continue;
        const nextState = documentMarkdownTranslationEntryToInlineRenderState(entry);
        if (sameDocumentInlineTranslationRenderState(next[unitId], nextState)) continue;
        next[unitId] = nextState;
        inFlightTranslationUnitIdsRef.current.delete(unitId);
        changed = true;
      }
      return changed ? next : current;
    });
  }, [
    activeTranslationScopeKey,
    currentEntry,
    inlineTranslationEnabled,
    rawMarkdownSourceHash,
    translationEligible,
    translationUnits,
  ]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!inlineTranslationEnabled || !hasLoadingInlineTranslations) return;
    const controller = new AbortController();
    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        await applyCompletedDocumentMicroDeckTranslations(controller.signal);
      } catch (err) {
        if (!isAbortError(err)) {
          console.warn("Document Markdown translation polling failed", err);
        }
      } finally {
        polling = false;
      }
    };
    void poll();
    const interval = window.setInterval(() => void poll(), 2200);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [
    applyCompletedDocumentMicroDeckTranslations,
    hasLoadingInlineTranslations,
    inlineTranslationEnabled,
  ]);

  const scheduleVisibleInlineTranslationScan = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (!inlineTranslationEnabled) return;
    if (visibleTranslationScanTimerRef.current !== null) {
      window.clearTimeout(visibleTranslationScanTimerRef.current);
    }
    visibleTranslationScanTimerRef.current = window.setTimeout(() => {
      visibleTranslationScanTimerRef.current = null;
      void requestVisibleInlineTranslations();
    }, DOC_TRANSLATION_SCAN_DEBOUNCE_MS);
  }, [inlineTranslationEnabled, requestVisibleInlineTranslations]);

  React.useEffect(() => {
    scheduleVisibleInlineTranslationScan();
  }, [activeHtml, inlineTranslationEnabled, scheduleVisibleInlineTranslationScan]);

  const handleContentScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const node = event.currentTarget;
      markInteraction("scrolling", "docs-viewer.content_scroll");
      const scroll = {
        scrollTop: node.scrollTop,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      };
      runWhenQuiet(() => {
        rememberPanelScroll(docScrollMemoryKey, scroll);
      }, {
        key: `workstation.scroll_memory:${docScrollMemoryKey}`,
        priority: "share_state",
        quietMs: 450,
        timeoutMs: 1800,
      });
      scheduleVisibleInlineTranslationScan();
    },
    [docScrollMemoryKey, rememberPanelScroll, scheduleVisibleInlineTranslationScan],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStep = (event: Event) => {
      const detail = (event as CustomEvent<HelixWorkstationProceduralStepPayload | null>)?.detail;
      if (!detail || detail.panelId !== "docs-viewer") return;
      if (typeof detail.traceId === "string" && detail.traceId.trim()) {
        lastProceduralTraceIdRef.current = detail.traceId.trim();
      }
      const messageId = proceduralStepMessages[detail.step as keyof typeof proceduralStepMessages];
      const label = messageId ? t(messageId) : null;
      if (!label) return;
      setProceduralStatus(label);
    };
    window.addEventListener(HELIX_WORKSTATION_PROCEDURAL_STEP_EVENT, handleStep as EventListener);
    return () => {
      window.removeEventListener(HELIX_WORKSTATION_PROCEDURAL_STEP_EVENT, handleStep as EventListener);
    };
  }, [t]);

  const clearActiveReadTarget = React.useCallback(() => {
    const target = activeReadTargetRef.current;
    if (target) {
      target.classList.remove(DOC_AUTO_READ_ACTIVE_CLASS);
      target.removeAttribute("data-doc-read-active");
    }
    activeReadTargetRef.current = null;
  }, []);

  const focusActiveReadChunk = React.useCallback(
    (chunkText: string) => {
      const container = contentRef.current;
      if (!container || modeRef.current !== "doc") return null;
      const target = findDocReadTarget(container, chunkText);
      if (!target) return null;
      if (activeReadTargetRef.current && activeReadTargetRef.current !== target) {
        activeReadTargetRef.current.classList.remove(DOC_AUTO_READ_ACTIVE_CLASS);
        activeReadTargetRef.current.removeAttribute("data-doc-read-active");
      }
      target.classList.add(DOC_AUTO_READ_ACTIVE_CLASS);
      target.setAttribute("data-doc-read-active", "true");
      activeReadTargetRef.current = target;
      if (followLiveReadRef.current) {
        keepDocReadTargetInView(container, target);
      }
      return target;
    },
    [],
  );

  const stopAutoRead = React.useCallback(() => {
    stopGlobalDocRead();
    clearActiveReadTarget();
    setIsAutoReading(false);
    setReadProgress(null);
    setFollowLiveRead(true);
    liveReadChunkRef.current = null;
  }, [clearActiveReadTarget]);

  React.useEffect(() => () => stopAutoRead(), [stopAutoRead]);

  React.useEffect(() => {
    clearActiveReadTarget();
  }, [activeHtml, clearActiveReadTarget, currentPath]);

  React.useEffect(() => {
    if (!proceduralStatus) return;
    const timeout = window.setTimeout(() => {
      setProceduralStatus((current) => (current === proceduralStatus ? null : current));
    }, 2600);
    return () => window.clearTimeout(timeout);
  }, [proceduralStatus]);

  React.useEffect(() => {
    if (mode !== "doc" || !pendingAutoReadNonce || loading) return;
    const traceId =
      lastProceduralTraceIdRef.current ??
      `docs:auto-read:${currentPath ?? "unknown"}:${pendingAutoReadNonce}`;
    const emitAutoReadEvent = (text: string, ok: boolean, detail?: string) => {
      emitHelixAskLiveEvent({
        contextId: HELIX_ASK_CONTEXT_ID.desktop,
        traceId,
        entry: {
          id: `docs-auto-read:${traceId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
          text,
          tool: "docs.auto_read",
          ts: new Date().toISOString(),
          meta: {
            kind: "docs_auto_read",
            ok,
            detail: detail ?? null,
            path: currentPath ?? null,
            pending_auto_read_nonce: pendingAutoReadNonce,
          },
        },
      });
    };

    if (error) {
      setAutoReadError(error);
      clearPendingAutoRead();
      emitAutoReadEvent(`fail: docs auto-read blocked - document load error (${error})`, false, "doc_load_error");
      return;
    }

    if (!currentEntry) {
      const message = t("docsViewer.error.autoReadMissingDocument");
      setAutoReadError(message);
      clearPendingAutoRead();
      emitAutoReadEvent(`fail: docs auto-read blocked - ${message}`, false, "doc_manifest_miss");
      return;
    }
    if (loadedDocId !== currentEntry.id) {
      return;
    }
    const plain = markdownToSpeechText(rawMarkdown);
    if (!plain) {
      clearPendingAutoRead();
      setAutoReadError(t("docsViewer.error.autoReadEmptyDocument"));
      emitAutoReadEvent("fail: docs auto-read blocked - no readable text extracted.", false, "empty_plain_text");
      return;
    }
    const readKey = `${DOC_AUTO_READ_TAG}:${currentEntry.id}:${pendingAutoReadNonce}`;
    if (globalDocReadKey === readKey) {
      clearPendingAutoRead();
      emitAutoReadEvent("ok: docs auto-read already active for this document.", true, "dedupe");
      return;
    }
    stopGlobalDocRead();
    const controller = new AbortController();
    globalDocReadController = controller;
    globalDocReadKey = readKey;
    setIsAutoReading(true);
    setAutoReadError(null);

    const run = async () => {
      const clipped = plain.slice(0, DOC_AUTO_READ_MAX_CHARS);
      const chunks = splitSpeechChunks(clipped, DOC_AUTO_READ_CHUNK_MAX);
      let heardAudio = false;
      let suppressedChunks = 0;
      emitAutoReadEvent(
        `ok: docs auto-read started (${chunks.length} chunk${chunks.length === 1 ? "" : "s"}).`,
        true,
        "start",
      );
      for (let i = 0; i < chunks.length; i += 1) {
        if (controller.signal.aborted) return;
        const response = await speakVoice(
          {
            text: chunks[i],
            mode: "briefing",
            priority: "info",
            provider: DOC_AUTO_READ_PROVIDER,
            voice_profile_id: DOC_AUTO_READ_PROFILE_ID,
            traceId: `docs:${currentEntry.id}:${pendingAutoReadNonce}`,
            eventId: `docs:${currentEntry.id}:${i + 1}`,
          },
          { signal: controller.signal },
        );
        if (response.kind === "json") {
          if (response.payload?.suppressed) {
            suppressedChunks += 1;
            continue;
          }
          throw new Error(response.payload?.error || response.payload?.message || "voice_response_json");
        }
        heardAudio = true;
        const snippet = chunks[i].slice(0, 220);
        liveReadChunkRef.current = chunks[i];
        setReadProgress({
          chunkIndex: i + 1,
          chunkCount: chunks.length,
          snippet,
        });
        focusActiveReadChunk(chunks[i]);
        await playAutoReadAudio({
          blob: response.blob,
          signal: controller.signal,
        });
      }
      if (!heardAudio) {
        const message =
          suppressedChunks > 0
            ? `No playable audio returned (${suppressedChunks} suppressed chunk${suppressedChunks === 1 ? "" : "s"}).`
            : "No playable audio returned by voice provider.";
        throw new Error(message);
      }
      emitAutoReadEvent("ok: docs auto-read completed.", true, "complete");
    };

    void run()
      .catch((err) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : t("docsViewer.error.autoReadGeneric");
        setAutoReadError(message);
        emitAutoReadEvent(`fail: docs auto-read failed (${message}).`, false, "runtime_error");
      })
      .finally(() => {
        if (globalDocReadController === controller) {
          globalDocReadController = null;
          globalDocReadKey = null;
        }
        clearPendingAutoRead();
        setIsAutoReading(false);
        setReadProgress(null);
        setFollowLiveRead(true);
        liveReadChunkRef.current = null;
        clearActiveReadTarget();
      });
  }, [
    clearActiveReadTarget,
    clearPendingAutoRead,
    currentEntry,
    currentPath,
    error,
    focusActiveReadChunk,
    loadedDocId,
    loading,
    mode,
    pendingAutoReadNonce,
    rawMarkdown,
    t,
  ]);

  React.useEffect(() => {
    if (!isAutoReading) return;
    if (mode !== "directory") return;
    setFollowLiveRead(false);
  }, [isAutoReading, mode]);

  const handleShowDirectory = React.useCallback(() => {
    if (isAutoReading) {
      setFollowLiveRead(false);
    }
    viewDirectory();
  }, [isAutoReading, viewDirectory]);

  const handleToggleInlineTranslation = React.useCallback(() => {
    if (!translationEligible || !activeTranslationScopeKey || !currentEntry || !rawMarkdownSourceHash) return;
    setTranslationError(null);
    const sourceId = documentMarkdownSourceId(currentEntry.relativePath);
    const laneSessionId = documentInlineTranslationLaneSessionId(activeTranslationScopeKey);
    const runLaneSessionControl = (action: "start" | "stop") => {
      void runDocumentMarkdownTranslationLaneSessionControl({
        action,
        docPath: currentEntry.relativePath,
        locale: interfaceLanguage.code,
        targetLanguage: interfaceLanguage.code,
        accountLocale: interfaceLanguage.code,
        sourceHash: rawMarkdownSourceHash,
        sourceTextHash: rawMarkdownSourceHash,
        sourceTextCharCount: rawMarkdown.length,
        sourceId,
        laneSessionId,
        projectionTarget: HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK,
        agentRuntime: "helix",
        reason: `document_inline_translation_${action}`,
      })
        .then((response) => {
          emitDocumentTranslationLaneSessionControlEvents({
            response: response as Record<string, unknown>,
            sourceId,
            sourceHash: rawMarkdownSourceHash,
          });
        })
        .catch((err) => {
          if (isAbortError(err)) return;
          console.warn("Document translation lane session control failed", err);
        });
    };
    if (inlineTranslationEnabled) {
      if (activeTranslationScopeKey) {
        writeStoredInlineTranslationSession(activeTranslationScopeKey, {
          enabled: false,
          translations: inlineTranslations,
        });
      }
      translationScopeKeyRef.current = null;
      inFlightTranslationUnitIdsRef.current.clear();
      setTranslationStatus("idle");
      setInlineTranslationEnabled(false);
      runLaneSessionControl("stop");
      return;
    }
    translationScopeKeyRef.current = activeTranslationScopeKey;
    setTranslationStatus("ready");
    setInlineTranslationEnabled(true);
    runLaneSessionControl("start");
  }, [
    activeTranslationScopeKey,
    currentEntry,
    inlineTranslationEnabled,
    inlineTranslations,
    interfaceLanguage.code,
    rawMarkdown,
    rawMarkdownSourceHash,
    translationEligible,
  ]);

  const rejoinLiveRead = React.useCallback(() => {
    if (!currentPath) return;
    viewDoc(currentPath, anchor);
    setFollowLiveRead(true);
    const chunkText = liveReadChunkRef.current;
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      if (!chunkText) return;
      focusActiveReadChunk(chunkText);
    }, 30);
  }, [anchor, currentPath, focusActiveReadChunk, viewDoc]);

  const queryValue = query.trim().toLowerCase();
  const queryMatchedEntries = React.useMemo(() => {
    return filterDocManifestEntries(queryValue);
  }, [queryValue]);
  const taxonomyCounts = React.useMemo(() => buildDocTaxonomyCounts(queryMatchedEntries), [queryMatchedEntries]);
  const filteredEntries = React.useMemo(() => {
    return queryMatchedEntries.filter((entry) => docMatchesTaxonomyFilter(entry, docClassFilter));
  }, [docClassFilter, queryMatchedEntries]);
  const grouped = React.useMemo(() => groupBySubject(filteredEntries, t), [filteredEntries, t]);
  const handleDocMathClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const source = target.closest("[data-doc-math-latex]") as HTMLElement | null;
      if (!source) return;
      const latex = source.dataset.docMathLatex?.trim();
      if (!latex) return;
      event.preventDefault();
      event.stopPropagation();
      const actionSource = target.closest("[data-doc-equation-action-id]") as HTMLElement | null;
      const actionId = actionSource?.dataset.docEquationActionId?.trim();
      if (actionId) {
        void executeDocEquationAction({
          currentPath,
          anchor,
          actionId,
          latex,
        });
        return;
      }
      handleDocMathPick({
        latex,
        currentPath,
        anchor,
        clipboardWrite:
          typeof navigator !== "undefined" && navigator.clipboard?.writeText
            ? navigator.clipboard.writeText.bind(navigator.clipboard)
            : null,
      });
    },
    [anchor, currentPath],
  );

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden bg-slate-950/90 text-slate-100">
      {mode === "directory" ? (
        <DirectoryRail
          entries={grouped}
          total={DOC_MANIFEST.length}
          filteredCount={filteredEntries.length}
          currentRoute={currentPath}
          query={query}
          docClassFilter={docClassFilter}
          taxonomyCounts={taxonomyCounts}
          onQueryChange={setQuery}
          onDocClassFilterChange={setDocClassFilter}
          onSelect={viewDoc}
          variant="full"
          scrollMemoryKey="docs-viewer:directory"
          t={t}
        />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col">
          <PanelHeader
            mode={mode}
            entry={currentEntry}
            anchor={anchor}
            isAutoReading={isAutoReading}
            autoReadError={autoReadError}
            proceduralStatus={proceduralStatus}
            readProgress={readProgress}
            onStopAutoRead={stopAutoRead}
            onShowDirectory={handleShowDirectory}
            canRejoinLiveRead={false}
            onRejoinLiveRead={rejoinLiveRead}
            translationEligible={translationEligible}
            translationTargetLanguage={interfaceLanguage.code}
            inlineTranslationEnabled={inlineTranslationEnabled}
            translationStatus={translationStatus}
            translationError={translationError}
            liveTranslationProjectionSummary={liveTranslationProjectionSummary}
            onToggleInlineTranslation={handleToggleInlineTranslation}
            t={t}
          />
          <div
            ref={contentRef}
            className="min-h-0 flex-1 overflow-y-scroll overflow-x-hidden"
            style={{ scrollbarGutter: "stable" }}
            onScroll={handleContentScroll}
          >
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                {t("docsViewer.loading")}
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-sm text-amber-300">{t("docsViewer.error.load")}</p>
                <p className="text-xs text-slate-400">{error}</p>
                {currentEntry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewDoc(currentEntry.route, anchor)}
                  >
                    {t("docsViewer.action.retry")}
                  </Button>
                )}
              </div>
            ) : currentEntry ? (
              <article
                className="prose prose-invert max-w-none overflow-x-hidden px-6 py-6 [&_*]:max-w-full [&_a]:break-words [&_code]:whitespace-pre-wrap [&_pre]:overflow-x-auto [&_table]:block [&_table]:overflow-x-auto"
                onClick={handleDocMathClick}
                dangerouslySetInnerHTML={{ __html: activeHtml }}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">
                {t("docsViewer.empty.selectDocument")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type GroupedDocs = {
  label: string;
  entries: DocManifestEntry[];
};

type DirectoryRailProps = {
  entries: GroupedDocs[];
  total: number;
  filteredCount: number;
  currentRoute?: string;
  query: string;
  docClassFilter: DocTaxonomyFilter;
  taxonomyCounts: Record<DocTaxonomyFilter, number>;
  onQueryChange: (value: string) => void;
  onDocClassFilterChange: (value: DocTaxonomyFilter) => void;
  onSelect: (path: string) => void;
  variant?: "rail" | "full";
  scrollMemoryKey?: string;
  t: Translate;
};

export function DirectoryRail({
  entries,
  total,
  filteredCount,
  currentRoute,
  query,
  docClassFilter,
  taxonomyCounts,
  onQueryChange,
  onDocClassFilterChange,
  onSelect,
  variant = "rail",
  scrollMemoryKey,
  t,
}: DirectoryRailProps) {
  const entryRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const rememberPanelScroll = useWorkstationSessionMemoryStore((state) => state.rememberPanelScroll);
  const readPanelScroll = useWorkstationSessionMemoryStore((state) => state.readPanelScroll);
  const isFull = variant === "full";

  React.useLayoutEffect(() => {
    if (!scrollMemoryKey || !scrollRef.current) return;
    const saved = readPanelScroll(scrollMemoryKey);
    if (!saved) return;
    const node = scrollRef.current;
    const restore = () => {
      const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
      node.scrollTop = Math.min(saved.scrollTop, maxScrollTop);
    };
    if (typeof window === "undefined") {
      restore();
      return;
    }
    const frame = window.requestAnimationFrame(restore);
    return () => window.cancelAnimationFrame(frame);
  }, [entries, query, readPanelScroll, scrollMemoryKey]);

  React.useEffect(() => {
    if (!currentRoute) return;
    if (scrollMemoryKey && readPanelScroll(scrollMemoryKey)) return;
    const target = entryRefs.current[currentRoute];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentRoute, query, entries, readPanelScroll, scrollMemoryKey]);

  const handleRailScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!scrollMemoryKey) return;
      const node = event.currentTarget;
      markInteraction("scrolling", "docs-viewer.directory_scroll");
      const scroll = {
        scrollTop: node.scrollTop,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
      };
      runWhenQuiet(() => {
        rememberPanelScroll(scrollMemoryKey, scroll);
      }, {
        key: `workstation.scroll_memory:${scrollMemoryKey}`,
        priority: "share_state",
        quietMs: 450,
        timeoutMs: 1800,
      });
    },
    [rememberPanelScroll, scrollMemoryKey],
  );

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col bg-slate-950/60",
        isFull ? "w-full" : "w-80 border-r border-white/10"
      )}
    >
      <div className="border-b border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 px-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("docsViewer.search.placeholder")}
            className="h-9 border-none bg-transparent text-sm focus-visible:ring-0"
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {t("docsViewer.search.count", { filteredCount, total })}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label={t("docsViewer.taxonomy.filterLabel")}>
          {docTaxonomyFilterOptions.map((option) => {
            const active = option.key === docClassFilter;
            const count = taxonomyCounts[option.key] ?? 0;
            return (
              <button
                key={option.key}
                type="button"
                className={cn(
                  "min-h-8 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-100"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.07]",
                )}
                aria-pressed={active}
                onClick={() => onDocClassFilterChange(option.key)}
              >
                {t(option.messageId)}
                <span className="ml-1 text-[10px] text-slate-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div
        ref={scrollRef}
        className={cn("flex-1 overflow-y-auto px-2 py-3", isFull && "px-3")}
        onScroll={handleRailScroll}
      >
        {entries.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
              <Folder className="h-3 w-3" />
              {group.label}
            </div>
            <ul className="space-y-1.5">
              {group.entries.map((entry) => {
                const selected = entry.route === currentRoute;
                const catalogDate = formatDocCatalogDate(entry, t);
                const badges = getDocBadges(entry, t);
                return (
                  <li key={entry.id}>
                    <button
                      ref={(node) => {
                        entryRefs.current[entry.route] = node;
                      }}
                      className={cn(
                        "w-full rounded-lg px-2 py-1.5 text-left transition-colors",
                        selected
                          ? "bg-cyan-500/20 text-white ring-1 ring-cyan-500/60"
                          : "text-slate-200 hover:bg-white/5"
                      )}
                      onClick={() => onSelect(entry.route)}
                    >
                      <p className="break-words text-sm font-medium leading-tight">{entry.title}</p>
                      {badges.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1" data-testid="doc-taxonomy-badges">
                          {badges.map((badge) => (
                            <span
                              key={`${entry.id}:${badge.label}`}
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-medium leading-none",
                                docBadgeToneClass(badge.tone),
                              )}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {catalogDate ? (
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-cyan-300/75">{catalogDate}</p>
                      ) : null}
                      <p className="break-all text-[11px] text-slate-400">{entry.relativePath}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-xs text-slate-400">{t("docsViewer.empty.noMatches")}</p>
        )}
      </div>
    </aside>
  );
}

type PanelHeaderProps = {
  mode: DocViewerState["mode"];
  entry: DocManifestEntry | null;
  anchor?: string;
  isAutoReading: boolean;
  autoReadError: string | null;
  proceduralStatus: string | null;
  readProgress: {
    chunkIndex: number;
    chunkCount: number;
    snippet: string;
  } | null;
  onStopAutoRead: () => void;
  onShowDirectory: () => void;
  canRejoinLiveRead: boolean;
  onRejoinLiveRead: () => void;
  translationEligible: boolean;
  translationTargetLanguage: string;
  inlineTranslationEnabled: boolean;
  translationStatus: DocumentTranslationUiStatus;
  translationError: string | null;
  liveTranslationProjectionSummary: DocumentLiveTranslationProjectionSnapshotSummary;
  onToggleInlineTranslation: () => void;
  t: Translate;
};

type DocViewerState = ReturnType<typeof useDocViewerStore.getState>;

export function PanelHeader({
  mode,
  entry,
  anchor,
  isAutoReading,
  autoReadError,
  proceduralStatus,
  readProgress,
  onStopAutoRead,
  onShowDirectory,
  canRejoinLiveRead,
  onRejoinLiveRead,
  translationEligible,
  translationTargetLanguage,
  inlineTranslationEnabled,
  translationStatus,
  translationError,
  liveTranslationProjectionSummary,
  onToggleInlineTranslation,
  t,
}: PanelHeaderProps) {
  const title =
    mode === "doc" && entry
      ? entry.title
      : t("docsViewer.title.directory");
  const subtitle =
    mode === "doc" && entry
      ? entry.relativePath + (anchor ? ` #${anchor}` : "")
      : t("docsViewer.subtitle.directory");
  const pathRef = mode === "doc" && entry ? buildWorkstationPathRef(entry.relativePath) : null;
  const isTranslating = translationStatus === "translating";
  const translationStatusLabel = getDocumentTranslationStatusLabel({
    translationStatus,
    translationError,
    liveTranslationProjectionSummary,
    t,
  });
  const hasBlockedTranslationLane =
    liveTranslationProjectionSummary.blockedLaneSessionCount > 0 ||
    liveTranslationProjectionSummary.blockedMailLoopCount > 0 ||
    liveTranslationProjectionSummary.blockedGoalBindingCount > 0;
  const hasProblemTranslationProjection =
    liveTranslationProjectionSummary.displayStatus === "blocked" ||
    liveTranslationProjectionSummary.displayStatus === "failed" ||
    liveTranslationProjectionSummary.displayStatus === "cancelled" ||
    liveTranslationProjectionSummary.displayStatus === "stale";

  const badges = entry ? getDocBadges(entry, t) : [];

  return (
    <header className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onShowDirectory}
        aria-label={t("docsViewer.action.backToDirectory")}
        className="h-9 w-9 shrink-0 rounded-full border border-white/10 text-slate-100 hover:bg-white/10 hover:text-cyan-100"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-0 flex-1">
        {pathRef ? (
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap gap-1 overflow-hidden text-[11px] uppercase tracking-wide text-slate-400 sm:gap-1.5">
              {pathRef.displaySegments.map((segment, index) => {
                const isLast = index === pathRef.displaySegments.length - 1;
                return (
                  <React.Fragment key={`${segment}:${index}`}>
                    <BreadcrumbItem className="min-w-0">
                      <BreadcrumbPage
                        className={cn(
                          "max-w-[12rem] truncate text-[11px] font-normal uppercase tracking-wide",
                          isLast ? "text-slate-200" : "text-slate-500",
                        )}
                        title={segment}
                      >
                        {segment}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                    {!isLast ? <BreadcrumbSeparator className="text-slate-600" /> : null}
                  </React.Fragment>
                );
              })}
              {anchor ? (
                <>
                  <BreadcrumbSeparator className="text-slate-600" />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage
                      className="max-w-[10rem] truncate text-[11px] font-normal uppercase tracking-wide text-cyan-200"
                      title={`#${anchor}`}
                    >
                      #{anchor}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : null}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <p className="truncate text-[11px] uppercase tracking-wide text-slate-400">{subtitle}</p>
        )}
        <h2 className="truncate text-lg font-semibold text-white">{title}</h2>
        {badges.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1" data-testid="doc-header-taxonomy-badges">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium leading-none",
                  docBadgeToneClass(badge.tone),
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
        ) : null}
        {isAutoReading ? (
          <p className="mt-0.5 text-[11px] text-cyan-200">{t("docsViewer.reading.active")}</p>
        ) : null}
        {proceduralStatus ? <p className="mt-0.5 text-[11px] text-sky-200">{proceduralStatus}</p> : null}
        {readProgress ? (
          <p className="mt-0.5 line-clamp-2 text-[11px] text-cyan-100/90">
            {t("docsViewer.reading.progress", {
              chunkIndex: readProgress.chunkIndex,
              chunkCount: readProgress.chunkCount,
              snippet: readProgress.snippet,
            })}
          </p>
        ) : null}
        {!isAutoReading && autoReadError ? (
          <p className="mt-0.5 text-[11px] text-amber-300">{t("docsViewer.reading.stopped", { reason: autoReadError })}</p>
        ) : null}
        {translationEligible ? (
          <p
            className={cn(
              "mt-0.5 text-[11px]",
              !translationStatusLabel && "hidden",
              translationStatus === "error" ||
                translationStatus === "unavailable" ||
                hasBlockedTranslationLane ||
                hasProblemTranslationProjection
                ? "text-amber-300"
                : "text-emerald-200",
            )}
            data-doc-translation-summary-version={String(liveTranslationProjectionSummary.version)}
            data-doc-translation-summary-total={String(liveTranslationProjectionSummary.totalCount)}
            data-doc-translation-summary-ready={String(liveTranslationProjectionSummary.readyCount)}
            data-doc-translation-summary-error={String(liveTranslationProjectionSummary.errorCount)}
            data-doc-translation-summary-health={liveTranslationProjectionSummary.healthStatus}
            data-doc-translation-summary-display-status={liveTranslationProjectionSummary.displayStatus}
            data-doc-translation-summary-label-visible={String(Boolean(translationStatusLabel))}
            data-doc-translation-summary-renderable={String(liveTranslationProjectionSummary.hasRenderableText)}
            data-doc-translation-summary-has-errors={String(liveTranslationProjectionSummary.hasProjectionErrors)}
            data-doc-translation-summary-projected={String(liveTranslationProjectionSummary.projectedCount)}
            data-doc-translation-summary-stale={String(liveTranslationProjectionSummary.staleCount)}
            data-doc-translation-summary-cancelled={String(liveTranslationProjectionSummary.cancelledCount)}
            data-doc-translation-summary-failed={String(liveTranslationProjectionSummary.failedCount)}
            data-doc-translation-summary-latest-status={liveTranslationProjectionSummary.latestStatus ?? ""}
            data-doc-translation-summary-latest-observed-at-ms={liveTranslationProjectionSummary.latestObservedAtMs ?? ""}
            data-doc-translation-summary-latest-source-event-id={liveTranslationProjectionSummary.latestSourceEventId ?? ""}
            data-doc-translation-summary-latest-source-event-ms={liveTranslationProjectionSummary.latestSourceEventMs ?? ""}
            data-doc-translation-summary-latest-observation-ref={liveTranslationProjectionSummary.latestObservationRef ?? ""}
            data-doc-translation-summary-latest-receipt-ref={liveTranslationProjectionSummary.latestReceiptRef ?? ""}
            data-doc-translation-summary-latest-lane-session-id={liveTranslationProjectionSummary.latestLaneSessionId ?? ""}
            data-doc-translation-summary-latest-observation-lane-session-id={liveTranslationProjectionSummary.latestObservationLaneSessionId ?? ""}
            data-doc-translation-summary-latest-goal-binding-id-from-projection={liveTranslationProjectionSummary.latestGoalBindingIdFromProjection ?? ""}
            data-doc-translation-summary-latest-session-control-key={liveTranslationProjectionSummary.latestSessionControlKey ?? ""}
            data-doc-translation-summary-latest-source-binding-key={liveTranslationProjectionSummary.latestSourceBindingKey ?? ""}
            data-doc-translation-summary-latest-observation-key={liveTranslationProjectionSummary.latestObservationKey ?? ""}
            data-doc-translation-summary-latest-mail-loop-observation-key={liveTranslationProjectionSummary.latestMailLoopObservationKey ?? ""}
            data-doc-translation-summary-latest-goal-binding-key={liveTranslationProjectionSummary.latestGoalBindingKey ?? ""}
            data-doc-translation-summary-latest-event-id={liveTranslationProjectionSummary.latestEventId ?? ""}
            data-doc-translation-summary-latest-has-observation={String(liveTranslationProjectionSummary.latestHasObservation)}
            data-doc-translation-summary-latest-selected-backend-provider={liveTranslationProjectionSummary.latestSelectedBackendProvider ?? ""}
            data-doc-translation-summary-latest-chunk-id={liveTranslationProjectionSummary.latestChunkId ?? ""}
            data-doc-translation-summary-latest-chunk-index={liveTranslationProjectionSummary.latestChunkIndex ?? ""}
            data-doc-translation-summary-latest-dedupe-key={liveTranslationProjectionSummary.latestDedupeKey ?? ""}
            data-doc-translation-summary-latest-source={liveTranslationProjectionSummary.latestSource ?? ""}
            data-doc-translation-summary-latest-source-id={liveTranslationProjectionSummary.latestSourceId ?? ""}
            data-doc-translation-summary-latest-source-hash={liveTranslationProjectionSummary.latestSourceHash ?? ""}
            data-doc-translation-summary-latest-source-kind={liveTranslationProjectionSummary.latestSourceKind ?? ""}
            data-doc-translation-summary-latest-source-text-hash={liveTranslationProjectionSummary.latestSourceTextHash ?? ""}
            data-doc-translation-summary-latest-source-text-char-count={liveTranslationProjectionSummary.latestSourceTextCharCount ?? ""}
            data-doc-translation-summary-latest-projection-key={liveTranslationProjectionSummary.latestProjectionKey ?? ""}
            data-doc-translation-summary-latest-server-projection-key={liveTranslationProjectionSummary.latestServerProjectionKey ?? ""}
            data-doc-translation-summary-latest-projection-target={liveTranslationProjectionSummary.latestProjectionTarget ?? ""}
            data-doc-translation-summary-latest-account-locale={liveTranslationProjectionSummary.latestAccountLocale ?? ""}
            data-doc-translation-summary-latest-target-language={liveTranslationProjectionSummary.latestTargetLanguage ?? ""}
            data-doc-translation-summary-latest-projection-status={liveTranslationProjectionSummary.latestProjectionStatus ?? ""}
            data-doc-translation-summary-latest-freshness-status={liveTranslationProjectionSummary.latestFreshnessStatus ?? ""}
            data-doc-translation-summary-latest-terminal-authority-status={liveTranslationProjectionSummary.latestTerminalAuthorityStatus}
            data-doc-translation-summary-latest-cancel-requested={String(liveTranslationProjectionSummary.latestCancelRequested)}
            data-doc-translation-summary-latest-error={liveTranslationProjectionSummary.latestError ?? ""}
            data-doc-translation-summary-suppressed-receipts={String(liveTranslationProjectionSummary.suppressedReceiptCount)}
            data-doc-translation-summary-latest-suppressed-observation-ref={liveTranslationProjectionSummary.latestSuppressedObservationRef ?? ""}
            data-doc-translation-summary-latest-suppressed-receipt-ref={liveTranslationProjectionSummary.latestSuppressedReceiptRef ?? ""}
            data-doc-translation-summary-latest-suppressed-observation-lane-session-id={liveTranslationProjectionSummary.latestSuppressedObservationLaneSessionId ?? ""}
            data-doc-translation-summary-latest-suppressed-goal-binding-id={liveTranslationProjectionSummary.latestSuppressedGoalBindingId ?? ""}
            data-doc-translation-summary-latest-suppressed-session-control-key={liveTranslationProjectionSummary.latestSuppressedSessionControlKey ?? ""}
            data-doc-translation-summary-latest-suppressed-source-binding-key={liveTranslationProjectionSummary.latestSuppressedSourceBindingKey ?? ""}
            data-doc-translation-summary-latest-suppressed-observation-key={liveTranslationProjectionSummary.latestSuppressedObservationKey ?? ""}
            data-doc-translation-summary-latest-suppressed-mail-loop-observation-key={liveTranslationProjectionSummary.latestSuppressedMailLoopObservationKey ?? ""}
            data-doc-translation-summary-latest-suppressed-goal-binding-key={liveTranslationProjectionSummary.latestSuppressedGoalBindingKey ?? ""}
            data-doc-translation-summary-latest-suppressed-event-id={liveTranslationProjectionSummary.latestSuppressedEventId ?? ""}
            data-doc-translation-summary-latest-suppressed-has-observation={String(liveTranslationProjectionSummary.latestSuppressedHasObservation)}
            data-doc-translation-summary-latest-suppressed-projection-status={liveTranslationProjectionSummary.latestSuppressedProjectionStatus ?? ""}
            data-doc-translation-summary-latest-suppressed-chunk-id={liveTranslationProjectionSummary.latestSuppressedChunkId ?? ""}
            data-doc-translation-summary-latest-suppressed-chunk-index={liveTranslationProjectionSummary.latestSuppressedChunkIndex ?? ""}
            data-doc-translation-summary-latest-suppressed-dedupe-key={liveTranslationProjectionSummary.latestSuppressedDedupeKey ?? ""}
            data-doc-translation-summary-latest-suppressed-source-event-id={liveTranslationProjectionSummary.latestSuppressedSourceEventId ?? ""}
            data-doc-translation-summary-latest-suppressed-source-event-ms={liveTranslationProjectionSummary.latestSuppressedSourceEventMs ?? ""}
            data-doc-translation-summary-latest-suppressed-observed-at-ms={liveTranslationProjectionSummary.latestSuppressedObservedAtMs ?? ""}
            data-doc-translation-summary-latest-suppressed-freshness-status={liveTranslationProjectionSummary.latestSuppressedFreshnessStatus ?? ""}
            data-doc-translation-summary-latest-suppressed-display-status={liveTranslationProjectionSummary.latestSuppressedDisplayStatus ?? ""}
            data-doc-translation-summary-latest-suppressed-terminal-authority-status={liveTranslationProjectionSummary.latestSuppressedTerminalAuthorityStatus}
            data-doc-translation-summary-latest-suppressed-source-id={liveTranslationProjectionSummary.latestSuppressedSourceId ?? ""}
            data-doc-translation-summary-latest-suppressed-source-hash={liveTranslationProjectionSummary.latestSuppressedSourceHash ?? ""}
            data-doc-translation-summary-latest-suppressed-source-kind={liveTranslationProjectionSummary.latestSuppressedSourceKind ?? ""}
            data-doc-translation-summary-latest-suppressed-source-text-hash={liveTranslationProjectionSummary.latestSuppressedSourceTextHash ?? ""}
            data-doc-translation-summary-latest-suppressed-source-text-char-count={liveTranslationProjectionSummary.latestSuppressedSourceTextCharCount ?? ""}
            data-doc-translation-summary-latest-suppressed-projection-key={liveTranslationProjectionSummary.latestSuppressedProjectionKey ?? ""}
            data-doc-translation-summary-latest-suppressed-server-projection-key={liveTranslationProjectionSummary.latestSuppressedServerProjectionKey ?? ""}
            data-doc-translation-summary-latest-suppressed-account-locale={liveTranslationProjectionSummary.latestSuppressedAccountLocale ?? ""}
            data-doc-translation-summary-latest-suppressed-projection-target={liveTranslationProjectionSummary.latestSuppressedProjectionTarget ?? ""}
            data-doc-translation-summary-latest-suppressed-target-language={liveTranslationProjectionSummary.latestSuppressedTargetLanguage ?? ""}
            data-doc-translation-summary-latest-suppressed-cancel-requested={String(liveTranslationProjectionSummary.latestSuppressedCancelRequested)}
            data-doc-translation-summary-latest-suppressed-reason={liveTranslationProjectionSummary.latestSuppressedReason ?? ""}
            data-doc-translation-summary-lane-sessions={String(liveTranslationProjectionSummary.laneSessionCount)}
            data-doc-translation-summary-active-lane-sessions={String(liveTranslationProjectionSummary.activeLaneSessionCount)}
            data-doc-translation-summary-blocked-lane-sessions={String(liveTranslationProjectionSummary.blockedLaneSessionCount)}
            data-doc-translation-summary-latest-lane-session-status={liveTranslationProjectionSummary.latestLaneSessionStatus ?? ""}
            data-doc-translation-summary-latest-lane-session-health={liveTranslationProjectionSummary.latestLaneSessionHealth ?? ""}
            data-doc-translation-summary-latest-lane-session-lifecycle-action={liveTranslationProjectionSummary.latestLaneSessionLifecycleAction ?? ""}
            data-doc-translation-summary-latest-lane-session-permission-profile={liveTranslationProjectionSummary.latestLaneSessionPermissionProfile ?? ""}
            data-doc-translation-summary-latest-lane-session-updated-at-ms={liveTranslationProjectionSummary.latestLaneSessionUpdatedAtMs ?? ""}
            data-doc-translation-summary-latest-lane-session-event-id={liveTranslationProjectionSummary.latestLaneSessionEventId ?? ""}
            data-doc-translation-summary-latest-lane-session-control-key={liveTranslationProjectionSummary.latestLaneSessionControlKey ?? ""}
            data-doc-translation-summary-latest-lane-session-has-observation={String(liveTranslationProjectionSummary.latestLaneSessionHasObservation)}
            data-doc-translation-summary-mail-loops={String(liveTranslationProjectionSummary.mailLoopCount)}
            data-doc-translation-summary-pending-mail-loops={String(liveTranslationProjectionSummary.pendingMailLoopCount)}
            data-doc-translation-summary-blocked-mail-loops={String(liveTranslationProjectionSummary.blockedMailLoopCount)}
            data-doc-translation-summary-latest-mail-loop-status={liveTranslationProjectionSummary.latestMailLoopStatus ?? ""}
            data-doc-translation-summary-latest-mail-loop-id={liveTranslationProjectionSummary.latestMailLoopId ?? ""}
            data-doc-translation-summary-latest-mail-loop-delivery-status={liveTranslationProjectionSummary.latestMailLoopDeliveryStatus ?? ""}
            data-doc-translation-summary-latest-previous-stage-play-mail-id={liveTranslationProjectionSummary.latestPreviousStagePlayMailId ?? ""}
            data-doc-translation-summary-latest-mail-loop-wake-kind={liveTranslationProjectionSummary.latestMailLoopWakeKind}
            data-doc-translation-summary-latest-mail-loop-observation-lane-session-id={liveTranslationProjectionSummary.latestMailLoopObservationLaneSessionId ?? ""}
            data-doc-translation-summary-latest-mail-loop-session-control-key={liveTranslationProjectionSummary.latestMailLoopSessionControlKey ?? ""}
            data-doc-translation-summary-goal-bindings={String(liveTranslationProjectionSummary.goalBindingCount)}
            data-doc-translation-summary-active-goal-bindings={String(liveTranslationProjectionSummary.activeGoalBindingCount)}
            data-doc-translation-summary-blocked-goal-bindings={String(liveTranslationProjectionSummary.blockedGoalBindingCount)}
            data-doc-translation-summary-latest-goal-binding-id={liveTranslationProjectionSummary.latestGoalBindingId ?? ""}
            data-doc-translation-summary-latest-goal-id={liveTranslationProjectionSummary.latestGoalId ?? ""}
            data-doc-translation-summary-latest-goal-binding-lane-session-id={liveTranslationProjectionSummary.latestGoalBindingLaneSessionId ?? ""}
            data-doc-translation-summary-latest-goal-binding-status={liveTranslationProjectionSummary.latestGoalBindingStatus ?? ""}
            data-doc-translation-summary-latest-goal-binding-session-status={liveTranslationProjectionSummary.latestGoalBindingSessionStatus ?? ""}
            data-doc-translation-summary-latest-goal-binding-session-health={liveTranslationProjectionSummary.latestGoalBindingSessionHealth ?? ""}
            data-doc-translation-summary-latest-goal-binding-activation-policy={liveTranslationProjectionSummary.latestGoalBindingActivationPolicy ?? ""}
            data-doc-translation-summary-latest-goal-binding-attention-policy={liveTranslationProjectionSummary.latestGoalBindingAttentionPolicy ?? ""}
            data-doc-translation-summary-latest-goal-binding-stop-condition={liveTranslationProjectionSummary.latestGoalBindingStopCondition ?? ""}
            data-doc-translation-summary-latest-goal-binding-report-policy={liveTranslationProjectionSummary.latestGoalBindingReportPolicy ?? ""}
            data-doc-translation-summary-latest-goal-binding-quiet-behavior={liveTranslationProjectionSummary.latestGoalBindingQuietBehavior ?? ""}
            data-doc-translation-summary-latest-goal-binding-report-action={liveTranslationProjectionSummary.latestGoalBindingReportAction ?? ""}
            data-doc-translation-summary-latest-goal-binding-report-reason={liveTranslationProjectionSummary.latestGoalBindingReportReason ?? ""}
            data-doc-translation-summary-latest-goal-binding-observation-ref={liveTranslationProjectionSummary.latestGoalBindingObservationRef ?? ""}
            data-doc-translation-summary-latest-goal-binding-receipt-ref={liveTranslationProjectionSummary.latestGoalBindingReceiptRef ?? ""}
            data-doc-translation-summary-latest-goal-binding-event-id={liveTranslationProjectionSummary.latestGoalBindingEventId ?? ""}
            data-doc-translation-summary-latest-goal-binding-session-control-key={liveTranslationProjectionSummary.latestGoalBindingSessionControlKey ?? ""}
            data-doc-translation-summary-latest-goal-binding-has-observation={String(liveTranslationProjectionSummary.latestGoalBindingHasObservation)}
            data-doc-translation-summary-latest-goal-binding-terminal-authority-status={liveTranslationProjectionSummary.latestGoalBindingTerminalAuthorityStatus}
            data-doc-translation-summary-latest-goal-binding-source-id={liveTranslationProjectionSummary.latestGoalBindingSourceId ?? ""}
            data-doc-translation-summary-latest-goal-binding-source-hash={liveTranslationProjectionSummary.latestGoalBindingSourceHash ?? ""}
            data-doc-translation-summary-latest-goal-binding-source-kind={liveTranslationProjectionSummary.latestGoalBindingSourceKind ?? ""}
            data-doc-translation-summary-latest-goal-binding-source-text-hash={liveTranslationProjectionSummary.latestGoalBindingSourceTextHash ?? ""}
            data-doc-translation-summary-latest-goal-binding-source-text-char-count={liveTranslationProjectionSummary.latestGoalBindingSourceTextCharCount ?? ""}
            data-doc-translation-summary-latest-goal-binding-projection-target={liveTranslationProjectionSummary.latestGoalBindingProjectionTarget ?? ""}
            data-doc-translation-summary-latest-goal-binding-account-locale={liveTranslationProjectionSummary.latestGoalBindingAccountLocale ?? ""}
            data-doc-translation-summary-latest-goal-binding-target-language={liveTranslationProjectionSummary.latestGoalBindingTargetLanguage ?? ""}
            data-doc-translation-summary-latest-goal-binding-chunk-id={liveTranslationProjectionSummary.latestGoalBindingChunkId ?? ""}
            data-doc-translation-summary-latest-goal-binding-chunk-index={liveTranslationProjectionSummary.latestGoalBindingChunkIndex ?? ""}
            data-doc-translation-summary-latest-goal-binding-dedupe-key={liveTranslationProjectionSummary.latestGoalBindingDedupeKey ?? ""}
            data-doc-translation-summary-latest-goal-binding-source-binding-key={liveTranslationProjectionSummary.latestGoalBindingSourceBindingKey ?? ""}
            data-doc-translation-summary-latest-goal-binding-observation-key={liveTranslationProjectionSummary.latestGoalBindingObservationKey ?? ""}
            data-doc-translation-summary-latest-goal-binding-mail-loop-observation-key={liveTranslationProjectionSummary.latestGoalBindingMailLoopObservationKey ?? ""}
            data-doc-translation-summary-latest-goal-binding-key-from-binding={liveTranslationProjectionSummary.latestGoalBindingKeyFromBinding ?? ""}
            data-doc-translation-summary-terminal-eligible="false"
            data-doc-translation-summary-assistant-answer="false"
            data-doc-translation-summary-raw-content-included="false"
          >
            {translationStatusLabel ?? ""}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {translationEligible ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleInlineTranslation}
            data-doc-translation-control="inline-account-language"
            data-doc-translation-control-enabled={String(inlineTranslationEnabled)}
            data-doc-translation-control-target-language={translationTargetLanguage}
            data-doc-translation-control-account-locale={interfaceLanguage.code}
            data-doc-translation-control-projection-target={HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK}
            data-doc-translation-control-terminal-eligible="false"
            data-doc-translation-control-assistant-answer="false"
            data-doc-translation-control-raw-content-included="false"
          >
            <Languages className="mr-1.5 h-3.5 w-3.5" />
            {inlineTranslationEnabled
              ? t("docsViewer.translation.hideInline")
              : isTranslating
                ? t("docsViewer.translation.generating")
                : t("docsViewer.translation.generateInline")}
          </Button>
        ) : null}
        {isAutoReading ? (
          <Button variant="destructive" size="sm" onClick={onStopAutoRead}>
            {t("docsViewer.action.stopReading")}
          </Button>
        ) : null}
        {canRejoinLiveRead ? (
          <Button variant="outline" size="sm" onClick={onRejoinLiveRead}>
            {t("docsViewer.action.rejoinLiveRead")}
          </Button>
        ) : null}
      </div>
    </header>
  );
}

function isAbortError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "name" in error && error.name === "AbortError");
}

export function getDocumentTranslationStatusLabel(args: {
  translationStatus: DocumentTranslationUiStatus;
  translationError: string | null;
  liveTranslationProjectionSummary: DocumentLiveTranslationProjectionSnapshotSummary;
  t: Translate;
}): string | null {
  if (args.liveTranslationProjectionSummary.blockedLaneSessionCount > 0) {
    return args.t("docsViewer.translation.status.sessionBlocked", {
      status: args.liveTranslationProjectionSummary.latestLaneSessionStatus ?? "blocked",
    });
  }
  if (args.liveTranslationProjectionSummary.blockedMailLoopCount > 0) {
    return args.t("docsViewer.translation.status.mailLoopBlocked", {
      status: args.liveTranslationProjectionSummary.latestMailLoopStatus ?? "blocked",
    });
  }
  if (args.liveTranslationProjectionSummary.blockedGoalBindingCount > 0) {
    return args.t("docsViewer.translation.status.goalBindingBlocked", {
      status: args.liveTranslationProjectionSummary.latestGoalBindingStatus ?? "blocked",
    });
  }
  if (args.liveTranslationProjectionSummary.failedCount > 0 && !args.liveTranslationProjectionSummary.hasRenderableText) {
    return args.t("docsViewer.translation.status.projectionFailed", {
      reason:
        args.liveTranslationProjectionSummary.latestError ??
        args.liveTranslationProjectionSummary.latestProjectionStatus ??
        "failed",
    });
  }
  if (args.liveTranslationProjectionSummary.cancelledCount > 0 && !args.liveTranslationProjectionSummary.hasRenderableText) {
    return args.t("docsViewer.translation.status.projectionCancelled", {
      status: args.liveTranslationProjectionSummary.latestProjectionStatus ?? "cancelled",
    });
  }
  if (args.liveTranslationProjectionSummary.staleCount > 0 && !args.liveTranslationProjectionSummary.hasRenderableText) {
    return args.t("docsViewer.translation.status.projectionStale", {
      status: args.liveTranslationProjectionSummary.latestFreshnessStatus ??
        args.liveTranslationProjectionSummary.latestProjectionStatus ??
        "stale",
    });
  }
  if (args.liveTranslationProjectionSummary.activeGoalBindingCount > 0 && args.translationStatus === "idle") {
    return args.t("docsViewer.translation.status.goalBindingActive", {
      status: args.liveTranslationProjectionSummary.latestGoalBindingStatus ?? "active",
    });
  }
  if (args.liveTranslationProjectionSummary.pendingMailLoopCount > 0 && args.translationStatus === "idle") {
    return args.t("docsViewer.translation.status.mailLoopPending", {
      status: args.liveTranslationProjectionSummary.latestMailLoopStatus ?? "pending",
    });
  }
  if (args.liveTranslationProjectionSummary.activeLaneSessionCount > 0 && args.translationStatus === "idle") {
    return args.t("docsViewer.translation.status.sessionActive", {
      status: args.liveTranslationProjectionSummary.latestLaneSessionStatus ?? "running",
    });
  }
  if (
    args.liveTranslationProjectionSummary.hasRenderableText &&
    args.liveTranslationProjectionSummary.healthStatus === "ready" &&
    (args.translationStatus === "idle" || args.translationStatus === "cached")
  ) {
    return args.t("docsViewer.translation.status.ready", {
      status: args.liveTranslationProjectionSummary.latestProjectionStatus ?? "projected",
    });
  }
  if (
    args.liveTranslationProjectionSummary.hasRenderableText &&
    args.liveTranslationProjectionSummary.healthStatus === "degraded" &&
    (args.translationStatus === "idle" || args.translationStatus === "cached")
  ) {
    return args.t("docsViewer.translation.status.projectionDegraded", {
      status:
        args.liveTranslationProjectionSummary.latestSuppressedDisplayStatus ??
        args.liveTranslationProjectionSummary.latestProjectionStatus ??
        args.liveTranslationProjectionSummary.healthStatus,
    });
  }
  switch (args.translationStatus) {
    case "cached":
      return args.t("docsViewer.translation.status.cached");
    case "translating":
      return args.t("docsViewer.translation.status.translating");
    case "ready":
      return args.t("docsViewer.translation.status.inlineEnabled");
    case "unavailable":
      return args.t("docsViewer.translation.status.unavailable", {
        reason: args.translationError ?? args.t("docsViewer.translation.errorGeneric"),
      });
    case "error":
      return args.t("docsViewer.translation.status.error", {
        reason: args.translationError ?? args.t("docsViewer.translation.errorGeneric"),
      });
    case "idle":
    default:
      return null;
  }
}

function groupBySubject(entries: DocManifestEntry[], t: Translate): GroupedDocs[] {
  const map = new Map<string, DocManifestEntry[]>();
  entries.forEach((entry) => {
    const label = localizeDocSubjectLabel(entry.subjectLabel, t);
    const bucket = map.get(label);
    if (bucket) {
      bucket.push(entry);
    } else {
      map.set(label, [entry]);
    }
  });
  return Array.from(map.entries())
    .sort((a, b) => groupRecencyScore(b[1]) - groupRecencyScore(a[1]) || a[0].localeCompare(b[0]))
    .map(([label, bucket]) => ({
      label,
      entries: bucket.sort(compareDocCatalogEntries),
    }));
}

function buildDocTaxonomyCounts(entries: DocManifestEntry[]): Record<DocTaxonomyFilter, number> {
  const counts: Record<DocTaxonomyFilter, number> = {
    all: entries.length,
    "canonical-research": 0,
    "current-development": 0,
    "synthetic-research": 0,
    "legacy-development": 0,
    uncategorized: 0,
  };
  entries.forEach((entry) => {
    const key = normalizeDocTaxonomyFilter(entry.docClass);
    counts[key] += 1;
  });
  return counts;
}

function docMatchesTaxonomyFilter(entry: DocManifestEntry, filter: DocTaxonomyFilter): boolean {
  if (filter === "all") return true;
  return normalizeDocTaxonomyFilter(entry.docClass) === filter;
}

function normalizeDocTaxonomyFilter(docClass: string | null | undefined): DocTaxonomyFilter {
  if (
    docClass === "canonical-research" ||
    docClass === "current-development" ||
    docClass === "synthetic-research" ||
    docClass === "legacy-development"
  ) {
    return docClass;
  }
  return "uncategorized";
}

function getDocBadges(entry: DocManifestEntry, t: Translate): DocBadge[] {
  const badges: DocBadge[] = [];
  const docClass = normalizeDocTaxonomyFilter(entry.docClass);
  if (docClass !== "all" && docClass !== "uncategorized") {
    badges.push({
      label: t(docTaxonomyLabelMessages[docClass]),
      tone: docClass === "canonical-research" ? "cyan" : docClass === "current-development" ? "emerald" : docClass === "synthetic-research" ? "amber" : "slate",
    });
  }
  if (entry.toolHints?.calculatorReady === true) {
    badges.push({ label: t("docsViewer.taxonomy.calculatorReady"), tone: "emerald" });
  }
  if (entry.sidecars.length > 0) {
    badges.push({ label: t("docsViewer.taxonomy.sidecarsAttached"), tone: "slate" });
  }
  return badges;
}

function docBadgeToneClass(tone: DocBadgeTone): string {
  switch (tone) {
    case "cyan":
      return "bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-400/25";
    case "emerald":
      return "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-400/25";
    case "amber":
      return "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/25";
    case "slate":
    default:
      return "bg-slate-400/10 text-slate-200 ring-1 ring-slate-300/15";
  }
}

export const __testDocViewerTaxonomy = {
  buildPendingDocumentInlineTranslationState,
  collectVisibleTranslationUnitIds,
  buildDocTaxonomyCounts,
  docMatchesTaxonomyFilter,
  getDocBadges,
};

function localizeDocSubjectLabel(subjectLabel: string | null | undefined, t: Translate): string {
  const normalized = subjectLabel?.trim();
  if (!normalized) return t("docsViewer.group.generalReference");
  const messageId = docSubjectLabelMessages[normalized];
  return messageId ? t(messageId) : normalized;
}

function groupRecencyScore(entries: DocManifestEntry[]): number {
  return entries.reduce((score, entry) => {
    return Math.max(score, docCatalogTimestamp(entry));
  }, 0);
}

function formatDocCatalogDate(entry: DocManifestEntry, t: Translate): string | null {
  if (!entry.catalogDate) return null;
  if (entry.catalogDateSource === "mtime") return t("docsViewer.catalog.editedDate", { date: entry.catalogDate });
  return t("docsViewer.catalog.datedDate", { date: entry.catalogDate });
}

function readStoredInlineTranslationSession(scopeKey: string): StoredInlineTranslationSession {
  if (typeof window === "undefined") return { enabled: false, translations: {} };
  try {
    const raw = window.sessionStorage.getItem(`${DOC_INLINE_TRANSLATION_SESSION_PREFIX}:${scopeKey}`);
    if (!raw) return { enabled: false, translations: {} };
    const parsed = JSON.parse(raw) as Partial<StoredInlineTranslationSession> | null;
    const translations = parsed?.translations && typeof parsed.translations === "object"
      ? filterReadyDocumentInlineTranslationRenderStates(parsed.translations)
      : {};
    return {
      enabled: Boolean(parsed?.enabled),
      translations,
    };
  } catch {
    return { enabled: false, translations: {} };
  }
}

function writeStoredInlineTranslationSession(scopeKey: string, session: StoredInlineTranslationSession): void {
  if (typeof window === "undefined") return;
  const readyTranslations = filterReadyDocumentInlineTranslationRenderStates(session.translations);
  try {
    window.sessionStorage.setItem(
      `${DOC_INLINE_TRANSLATION_SESSION_PREFIX}:${scopeKey}`,
      JSON.stringify({
        enabled: session.enabled,
        translations: readyTranslations,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Session persistence is best-effort; the live MicroDeck source remains authoritative.
  }
}

function buildPendingDocumentInlineTranslationState(args: {
  sourceId: string;
  sourceHash: string;
  sourceTextHash: string;
  sourceTextCharCount: number;
  chunkId: string;
  chunkIndex: number;
  laneSessionId?: string | null;
  accountLocale: string;
  targetLanguage: string;
}): InlineTranslationState {
  return {
    status: "loading",
    observationRef: null,
    receiptRef: null,
    laneSessionId: args.laneSessionId ?? null,
    observationLaneSessionId: null,
    goalBindingId: null,
    latestEventId: null,
    hasObservation: false,
    selectedBackendProvider: null,
    projectionStatus: "missing",
    chunkId: args.chunkId,
    chunkIndex: args.chunkIndex,
    dedupeKey: args.chunkId,
    sourceEventId: null,
    sourceEventMs: null,
    observedAtMs: null,
    freshnessStatus: "pending",
    terminalAuthorityStatus: "not_terminal_authority",
    sourceId: args.sourceId,
    sourceHash: args.sourceHash,
    sourceKind: "document_markdown",
    sourceTextHash: args.sourceTextHash,
    sourceTextCharCount: args.sourceTextCharCount,
    accountLocale: args.accountLocale,
    projectionTarget: HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_DOCS_CHUNK,
    targetLanguage: args.targetLanguage,
    cancelRequested: false,
    source: "capability_lane",
    terminalEligible: false,
    assistantAnswer: false,
    rawContentIncluded: false,
  };
}

function collectVisibleTranslationUnitIds(args: {
  container: HTMLDivElement;
  units: DocumentTranslationUnit[];
  translations: Record<string, InlineTranslationState>;
  inFlightIds: Set<string>;
  sourceHash?: string | null;
  maxUnits: number;
  maxChars: number;
}): string[] {
  const translatableUnitsById = new Map(
    args.units.filter((unit) => unit.translatable).map((unit) => [unit.unit_id, unit] as const),
  );
  const containerRect = args.container.getBoundingClientRect();
  const verticalBuffer = Math.max(160, containerRect.height * 0.75);
  const markers = Array.from(
    args.container.querySelectorAll<HTMLElement>("[data-doc-translation-anchor]"),
  );
  const visibleIds: string[] = [];
  let sourceChars = 0;
  const maxUnits = Math.max(1, args.maxUnits);
  const maxChars = Math.max(1, args.maxChars);
  for (const marker of markers) {
    const unitId = marker.dataset.docTranslationAnchor;
    if (!unitId) continue;
    const unit = translatableUnitsById.get(unitId);
    if (!unit) continue;
    const renderStatus = marker.dataset.docTranslationRenderStatus;
    const displayStatus = marker.dataset.docTranslationDisplayStatus;
    const projectionStatus = marker.dataset.docTranslationProjectionStatus;
    const markerSourceHash = marker.dataset.docTranslationSourceHash;
    const hasDomProjectionState =
      Boolean(renderStatus && renderStatus !== "empty") ||
      Boolean(displayStatus && displayStatus !== "empty") ||
      Boolean(projectionStatus && projectionStatus !== "missing");
    const projectionStateMatchesCurrentSource =
      !args.sourceHash ||
      !markerSourceHash ||
      markerSourceHash === args.sourceHash;
    if (hasDomProjectionState && projectionStateMatchesCurrentSource) continue;
    const existingTranslation = args.translations[unitId];
    const existingTranslationMatchesCurrentSource =
      !args.sourceHash ||
      !existingTranslation?.sourceHash ||
      existingTranslation.sourceHash === args.sourceHash;
    const inFlightTranslationMatchesCurrentSource =
      args.inFlightIds.has(unitId) &&
      (!existingTranslation || existingTranslationMatchesCurrentSource);
    if ((existingTranslation && existingTranslationMatchesCurrentSource) || inFlightTranslationMatchesCurrentSource) continue;
    const rect = marker.getBoundingClientRect();
    const nearViewport =
      rect.top >= containerRect.top - verticalBuffer &&
      rect.top <= containerRect.bottom + verticalBuffer;
    if (!nearViewport) continue;
    const nextChars = sourceChars + unit.source_markdown.length;
    if (visibleIds.length > 0 && nextChars > maxChars) break;
    visibleIds.push(unitId);
    sourceChars = nextChars;
    if (visibleIds.length >= maxUnits) break;
  }
  return visibleIds;
}

function renderDocumentMarkdownToHtml(markdown: string, docPath?: string | null): string {
  let rendered: string | Promise<string>;
  try {
    activeMarkedDocPath = docPath ?? null;
    rendered = marked.parse(renderMathMarkdown(markdown, docPath));
  } finally {
    activeMarkedDocPath = null;
  }
  const renderedHtml = typeof rendered === "string" ? rendered : String(rendered);
  return renderMathInRenderedHtml(renderedHtml, docPath);
}

export function applyDocNarratorSourceIds(container: ParentNode, docPath?: string | null): number {
  const root =
    container instanceof Element && container.matches("article")
      ? container
      : container.querySelector("article");
  if (!root) return 0;
  const docToken = stableDocNarratorToken(docPath ?? "unknown-doc");
  let applied = 0;
  Array.from(root.querySelectorAll<HTMLElement>(DOC_NARRATOR_BLOCK_SELECTOR)).forEach((element, index) => {
    const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (!text) return;
    if (element.closest(".doc-math-clickable-display")) return;
    if (!element.getAttribute("data-narrator-source-id")) {
      element.setAttribute(
        "data-narrator-source-id",
        `docs-viewer:${docToken}:${element.tagName.toLowerCase()}:${index}`,
      );
      applied += 1;
    }
  });
  return applied;
}

function stableDocNarratorToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "unknown-doc";
}

function markdownToSpeechText(markdown: string): string {
  if (!markdown) return "";
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*\|/gm, "")
    .replace(/\|/g, " ")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(". ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function splitSpeechChunks(source: string, maxChars: number): string[] {
  const text = source.trim();
  if (!text) return [];
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > 0) {
    if (rest.length <= maxChars) {
      chunks.push(rest.trim());
      break;
    }
    const window = rest.slice(0, maxChars);
    const sentenceBreak = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "));
    const splitAt = sentenceBreak > 200 ? sentenceBreak + 1 : window.lastIndexOf(" ");
    const index = splitAt > 0 ? splitAt : maxChars;
    const chunk = rest.slice(0, index).trim();
    if (chunk) chunks.push(chunk);
    rest = rest.slice(index).trimStart();
  }
  return chunks;
}

async function playAutoReadAudio(args: {
  blob: Blob;
  signal: AbortSignal;
}): Promise<void> {
  if (args.signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  if (globalDocReadUrl) {
    URL.revokeObjectURL(globalDocReadUrl);
    globalDocReadUrl = null;
  }
  const url = URL.createObjectURL(args.blob);
  globalDocReadUrl = url;
  const audio = new Audio(url);
  globalDocReadAudio = audio;
  await new Promise<void>((resolve, reject) => {
    const finalize = (error?: unknown) => {
      audio.onended = null;
      audio.onerror = null;
      args.signal.removeEventListener("abort", handleAbort);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };
    const handleAbort = () => {
      audio.pause();
      finalize(new DOMException("Aborted", "AbortError"));
    };
    audio.onended = () => finalize();
    audio.onerror = () => finalize(new Error("audio_playback_failed"));
    args.signal.addEventListener("abort", handleAbort, { once: true });
    void audio.play().catch((error) => finalize(error));
  });
}

function findDocReadTarget(container: HTMLDivElement, chunkText: string): HTMLElement | null {
  const chunk = normalizeDocReadText(chunkText);
  if (!chunk) return null;
  const article = container.querySelector("article") ?? container;
  const blocks = Array.from(
    article.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th,pre"),
  ).filter((element) => normalizeDocReadText(element.textContent ?? "").length > 0);
  if (!blocks.length) return article instanceof HTMLElement ? article : null;

  const directNeedle = chunk.slice(0, Math.min(160, chunk.length));
  const directMatch = blocks.find((element) => normalizeDocReadText(element.textContent ?? "").includes(directNeedle));
  if (directMatch) return directMatch;

  const terms = chunk
    .split(" ")
    .filter((term) => term.length > 3)
    .slice(0, 34);
  let best: { element: HTMLElement; score: number } | null = null;
  for (const element of blocks) {
    const text = normalizeDocReadText(element.textContent ?? "");
    const matches = terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
    const prefixBoost = text && chunk.includes(text.slice(0, Math.min(80, text.length))) ? 8 : 0;
    const score = matches + prefixBoost;
    if (!best || score > best.score) {
      best = { element, score };
    }
  }
  return best && best.score >= Math.max(3, Math.ceil(Math.min(terms.length, 18) * 0.28)) ? best.element : null;
}

function keepDocReadTargetInView(container: HTMLDivElement, target: HTMLElement) {
  const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
  if (maxTop <= 0) return;
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const comfortPad = Math.min(180, Math.max(72, containerRect.height * 0.24));
  const alreadyComfortable =
    targetRect.top >= containerRect.top + comfortPad &&
    targetRect.bottom <= containerRect.bottom - comfortPad;
  if (alreadyComfortable) return;
  const targetTop = targetRect.top - containerRect.top + container.scrollTop;
  const centeredTop = targetTop + targetRect.height / 2 - container.clientHeight / 2;
  container.scrollTo({
    top: Math.max(0, Math.min(maxTop, Math.round(centeredTop))),
    behavior: "smooth",
  });
}

function normalizeDocReadText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cssEscape(value: string) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/"/g, '\\"');
}

function renderDocMath(expression: string, displayMode: boolean, docPath?: string | null): string {
  if (!expression.trim()) return "";
  try {
    const rendered = renderKatexToString(expression, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
    const escapedExpression = escapeHtml(expression);
    const className = displayMode
      ? "doc-math-clickable doc-math-clickable-display"
      : "doc-math-clickable doc-math-clickable-inline";
    const equationActionEntry = getDocEquationActionEntryForLatex(docPath, expression);
    const theoryActions = getDocEquationTheoryActions(equationActionEntry);
    const actionMarkup = theoryActions
      .map((action) => {
        const title = action.claimBoundaryNote
          ? `${action.label}: ${action.claimBoundaryNote}`
          : action.label;
        return `<span class="doc-equation-action-chip" data-doc-equation-action-id="${escapeHtml(action.actionId)}" role="button" tabindex="0" title="${escapeHtml(title)}">T</span>`;
      })
      .join("");
    const equationIdAttr = equationActionEntry
      ? ` data-doc-equation-id="${escapeHtml(equationActionEntry.equationId)}"`
      : "";
    if (displayMode) {
      return `<div class="${className}"${equationIdAttr} data-doc-math-latex="${escapedExpression}" role="button" tabindex="0" title="Copy LaTeX to clipboard and ingest in calculator">${actionMarkup}${rendered}</div>`;
    }
    return `<span class="${className}"${equationIdAttr} data-doc-math-latex="${escapedExpression}" role="button" tabindex="0" title="Copy LaTeX to clipboard and ingest in calculator">${rendered}${actionMarkup}</span>`;
  } catch {
    return `<code>${escapeHtml(expression)}</code>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMathMarkdown(markdown: string, docPath?: string | null): string {
  if (!markdown) return markdown;
  const FENCE_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;
  let output = "";
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = FENCE_RE.exec(markdown)) !== null) {
    output += renderMathInNonCodeMarkdown(markdown.slice(cursor, match.index), docPath);
    output += renderMathFenceBlock(match[0], docPath) ?? match[0];
    cursor = match.index + match[0].length;
  }
  output += renderMathInNonCodeMarkdown(markdown.slice(cursor), docPath);
  return output;
}

function renderMathInNonCodeMarkdown(segment: string, docPath?: string | null): string {
  const INLINE_CODE_RE = /`[^`\n]*`/g;
  let output = "";
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE_CODE_RE.exec(segment)) !== null) {
    output += renderMathExpressions(segment.slice(cursor, match.index), docPath);
    output += match[0];
    cursor = match.index + match[0].length;
  }
  output += renderMathExpressions(segment.slice(cursor), docPath);
  return output;
}

function renderMathExpressions(source: string, docPath?: string | null): string {
  return source
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_full, expr: string) => renderDocMath(expr, true, docPath))
    .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_full, expr: string) => renderDocMath(expr, true, docPath))
    .replace(/\\\((.+?)\\\)/g, (_full, expr: string) => renderDocMath(expr, false, docPath));
}

function renderMathFenceBlock(fence: string, docPath?: string | null): string | null {
  const match = fence.match(/^(?:```|~~~)\s*math\s*\r?\n([\s\S]*?)\r?\n(?:```|~~~)\s*$/i);
  if (!match) return null;
  const expr = match[1].trim();
  if (!expr) return "";
  return renderDocMath(expr, true, docPath);
}

function renderMathInRenderedHtml(html: string, docPath?: string | null): string {
  if (!html) return html;
  const CODE_BLOCK_RE = /(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/gi;
  let output = "";
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = CODE_BLOCK_RE.exec(html)) !== null) {
    output += renderMathExpressions(html.slice(cursor, match.index), docPath);
    output += match[0];
    cursor = match.index + match[0].length;
  }
  output += renderMathExpressions(html.slice(cursor), docPath);
  return output;
}

export default DocViewerPanel;
