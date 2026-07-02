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
} from "@/lib/docs/documentTranslationClient";
import {
  readDocumentLiveTranslationProjectionSnapshot,
  subscribeDocumentLiveTranslationProjectionRegistry,
} from "@/lib/docs/liveTranslationProjectionRegistry";
import { installDocumentLiveTranslationProjectionEventIngestion } from "@/lib/docs/liveTranslationProjectionEventIngestion";
import { sameDocumentInlineTranslationRenderState } from "@/lib/docs/liveTranslationInlineProjection";
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

type Translate = InterfaceTextResolver["t"];
type DisplayMessageMap = Record<string, InterfaceMessageId>;
type DocumentTranslationUiStatus = "idle" | "cached" | "translating" | "ready" | "unavailable" | "error";
type InlineTranslationState = {
  status: "loading" | "ready" | "error";
  text?: string;
  error?: string;
  observationRef?: string | null;
  receiptRef?: string | null;
  projectionStatus?: string | null;
  chunkId?: string | null;
  chunkIndex?: number | null;
  dedupeKey?: string | null;
  sourceEventId?: string | null;
  sourceEventMs?: number | null;
  observedAtMs?: number | null;
  freshnessStatus?: string;
  projectionTarget?: string | null;
  targetLanguage?: string | null;
  cancelRequested?: boolean;
  source?: "capability_lane";
  terminalEligible?: false;
  assistantAnswer?: false;
  rawContentIncluded?: false;
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
};

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
          projectionTarget: "docs_chunk",
        })
        : EMPTY_LIVE_TRANSLATION_PROJECTION_SNAPSHOT,
    () => EMPTY_LIVE_TRANSLATION_PROJECTION_SNAPSHOT,
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
    return renderMarkdownWithInlineTranslations(translationUnits, inlineTranslations, t);
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
    setInlineTranslations((current) => {
      let changed = false;
      const next = { ...current };
      for (const [unitId, laneState] of laneTranslations) {
        const currentState = next[unitId];
        if (laneState.status === "ready" && typeof laneState.text === "string" && laneState.text.trim()) {
          const nextState = {
            status: "ready",
            text: laneState.text,
            observationRef: laneState.observationRef,
            receiptRef: laneState.receiptRef,
            projectionStatus: laneState.projectionStatus,
            chunkId: laneState.chunkId,
            chunkIndex: laneState.chunkIndex,
            dedupeKey: laneState.dedupeKey,
            sourceEventId: laneState.sourceEventId,
            sourceEventMs: laneState.sourceEventMs,
            observedAtMs: laneState.observedAtMs,
            freshnessStatus: laneState.freshnessStatus,
            projectionTarget: laneState.projectionTarget,
            targetLanguage: laneState.targetLanguage,
            cancelRequested: laneState.cancelRequested,
            source: laneState.source,
            terminalEligible: false,
            assistantAnswer: false,
            rawContentIncluded: false,
          } satisfies InlineTranslationState;
          if (sameDocumentInlineTranslationRenderState(currentState, nextState)) continue;
          next[unitId] = nextState;
          changed = true;
          continue;
        }
        if (!currentState || currentState.status === "loading") {
          next[unitId] = {
            status: "error",
            error: laneState.error,
            observationRef: laneState.observationRef,
            receiptRef: laneState.receiptRef,
            projectionStatus: laneState.projectionStatus,
            chunkId: laneState.chunkId,
            chunkIndex: laneState.chunkIndex,
            dedupeKey: laneState.dedupeKey,
            sourceEventId: laneState.sourceEventId,
            sourceEventMs: laneState.sourceEventMs,
            observedAtMs: laneState.observedAtMs,
            freshnessStatus: laneState.freshnessStatus,
            projectionTarget: laneState.projectionTarget,
            targetLanguage: laneState.targetLanguage,
            cancelRequested: laneState.cancelRequested,
            source: laneState.source,
            terminalEligible: false,
            assistantAnswer: false,
            rawContentIncluded: false,
          };
          changed = true;
        }
      }
      return changed ? next : current;
    });
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
      projectionTarget: "docs_chunk",
      units: translationUnits,
    });
  }, [
    currentEntry,
    interfaceLanguage.code,
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
      maxUnits: DOC_TRANSLATION_MAX_UNITS_PER_CHUNK,
      maxChars: DOC_TRANSLATION_MAX_CHARS_PER_CHUNK,
    });
    if (targetIds.length === 0) return;
    const targetSet = new Set(targetIds);
    const targetUnits = translationUnits.filter((unit) => targetSet.has(unit.unit_id));
    if (targetUnits.length === 0) return;
    const scopeKey = activeTranslationScopeKey;
    translationScopeKeyRef.current = scopeKey;
    documentTranslationChunkInFlightRef.current = true;
    targetIds.forEach((unitId) => inFlightTranslationUnitIdsRef.current.add(unitId));
    setTranslationStatus("translating");
    setTranslationError(null);
    setInlineTranslations((current) => {
      const next = { ...current };
      targetIds.forEach((unitId) => {
        next[unitId] = { status: "loading" };
      });
      return next;
    });

    try {
      await enqueueDocumentMarkdownTranslationMail({
        docPath: currentEntry.relativePath,
        locale: interfaceLanguage.code,
        sourceHash: rawMarkdownSourceHash,
        title: currentEntry.title,
        sourceId: documentMarkdownSourceId(currentEntry.relativePath),
        chunkId: `doc-inline:${rawMarkdownSourceHash}:${targetIds.join(",")}`,
        units: targetUnits,
      });
      if (translationScopeKeyRef.current !== scopeKey) return;
      setInlineTranslations((current) => {
        const next = { ...current };
        targetUnits.forEach((unit) => {
          next[unit.unit_id] = current[unit.unit_id]?.status === "ready"
            ? current[unit.unit_id]
            : { status: "loading" };
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
        if (entry.status === "ready") {
          if (next[unitId]?.status === "ready" && next[unitId]?.text === entry.text) continue;
          next[unitId] = { status: "ready", text: entry.text };
        } else {
          if (next[unitId]?.status === "error" && next[unitId]?.error === entry.error) continue;
          next[unitId] = { status: "error", error: entry.error };
        }
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
    if (!translationEligible || !activeTranslationScopeKey) return;
    setTranslationError(null);
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
      return;
    }
    translationScopeKeyRef.current = activeTranslationScopeKey;
    setTranslationStatus("ready");
    setInlineTranslationEnabled(true);
  }, [activeTranslationScopeKey, inlineTranslationEnabled, inlineTranslations, translationEligible]);

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
  const filteredEntries = React.useMemo(() => {
    return filterDocManifestEntries(queryValue);
  }, [queryValue]);
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
          onQueryChange={setQuery}
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
            inlineTranslationEnabled={inlineTranslationEnabled}
            translationStatus={translationStatus}
            translationError={translationError}
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
  onQueryChange: (value: string) => void;
  onSelect: (path: string) => void;
  variant?: "rail" | "full";
  scrollMemoryKey?: string;
  t: Translate;
};

function DirectoryRail({
  entries,
  total,
  filteredCount,
  currentRoute,
  query,
  onQueryChange,
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
  inlineTranslationEnabled: boolean;
  translationStatus: DocumentTranslationUiStatus;
  translationError: string | null;
  onToggleInlineTranslation: () => void;
  t: Translate;
};

type DocViewerState = ReturnType<typeof useDocViewerStore.getState>;

function PanelHeader({
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
  inlineTranslationEnabled,
  translationStatus,
  translationError,
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
    t,
  });

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
        {translationStatusLabel ? (
          <p
            className={cn(
              "mt-0.5 text-[11px]",
              translationStatus === "error" || translationStatus === "unavailable"
                ? "text-amber-300"
                : "text-emerald-200",
            )}
          >
            {translationStatusLabel}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {translationEligible ? (
          <Button variant="outline" size="sm" onClick={onToggleInlineTranslation}>
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

function getDocumentTranslationStatusLabel(args: {
  translationStatus: DocumentTranslationUiStatus;
  translationError: string | null;
  t: Translate;
}): string | null {
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
      ? Object.fromEntries(
        Object.entries(parsed.translations).filter((entry): entry is [string, InlineTranslationState] => {
          const value = entry[1] as InlineTranslationState | undefined;
          return value?.status === "ready" && typeof value.text === "string" && value.text.trim().length > 0;
        }),
      )
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
  const readyTranslations = Object.fromEntries(
    Object.entries(session.translations).filter((entry): entry is [string, InlineTranslationState] => {
      const value = entry[1];
      return value.status === "ready" && typeof value.text === "string" && value.text.trim().length > 0;
    }),
  );
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

function renderMarkdownWithInlineTranslations(
  units: DocumentTranslationUnit[],
  translations: Record<string, InlineTranslationState>,
  t: Translate,
): string {
  return units
    .map((unit) => {
      if (!unit.translatable) return unit.source_markdown;
      const anchor = `<div class="doc-translation-anchor not-prose h-0" data-doc-translation-anchor="${escapeHtml(unit.unit_id)}"></div>`;
      const state = translations[unit.unit_id];
      if (!state) return `${unit.source_markdown}\n${anchor}`;
      const projectionAttrs = [
        state.source ? `data-doc-translation-source="${escapeHtml(state.source)}"` : "",
        state.projectionStatus ? `data-doc-translation-projection-status="${escapeHtml(state.projectionStatus)}"` : "",
        state.observationRef ? `data-doc-translation-observation-ref="${escapeHtml(state.observationRef)}"` : "",
        state.receiptRef ? `data-doc-translation-receipt-ref="${escapeHtml(state.receiptRef)}"` : "",
        state.chunkId ? `data-doc-translation-chunk-id="${escapeHtml(state.chunkId)}"` : "",
        typeof state.chunkIndex === "number" ? `data-doc-translation-chunk-index="${String(state.chunkIndex)}"` : "",
        state.dedupeKey ? `data-doc-translation-dedupe-key="${escapeHtml(state.dedupeKey)}"` : "",
        state.sourceEventId ? `data-doc-translation-source-event-id="${escapeHtml(state.sourceEventId)}"` : "",
        typeof state.sourceEventMs === "number" ? `data-doc-translation-source-event-ms="${String(state.sourceEventMs)}"` : "",
        typeof state.observedAtMs === "number" ? `data-doc-translation-observed-at-ms="${String(state.observedAtMs)}"` : "",
        state.freshnessStatus ? `data-doc-translation-freshness-status="${escapeHtml(state.freshnessStatus)}"` : "",
        state.projectionTarget ? `data-doc-translation-projection-target="${escapeHtml(state.projectionTarget)}"` : "",
        state.targetLanguage ? `data-doc-translation-target-language="${escapeHtml(state.targetLanguage)}"` : "",
        typeof state.cancelRequested === "boolean" ? `data-doc-translation-cancel-requested="${String(state.cancelRequested)}"` : "",
        state.source === "capability_lane" ? `data-doc-translation-terminal-eligible="false"` : "",
        state.source === "capability_lane" ? `data-doc-translation-assistant-answer="false"` : "",
        state.source === "capability_lane" ? `data-doc-translation-raw-content-included="false"` : "",
      ].filter(Boolean).join(" ");
      const projectionAttrSuffix = projectionAttrs ? ` ${projectionAttrs}` : "";
      if (state.status === "loading") {
        return `${unit.source_markdown}\n${anchor}\n<div class="doc-generated-translation not-prose my-2 border-l-2 border-emerald-400/60 pl-3 text-sm leading-relaxed text-emerald-300/80 animate-pulse" data-doc-translation-line="${escapeHtml(unit.unit_id)}">${escapeHtml(t("docsViewer.translation.inlineLoading"))}</div>`;
      }
      if (state.status === "error") {
        return `${unit.source_markdown}\n${anchor}\n<div class="doc-generated-translation not-prose my-2 border-l-2 border-amber-400/70 pl-3 text-sm leading-relaxed text-amber-300" data-doc-translation-line="${escapeHtml(unit.unit_id)}"${projectionAttrSuffix}>${escapeHtml(t("docsViewer.translation.inlineError", { reason: state.error ?? t("docsViewer.translation.errorGeneric") }))}</div>`;
      }
      const translatedText = formatInlineTranslationText(state.text ?? "");
      return `${unit.source_markdown}\n${anchor}\n<div class="doc-generated-translation not-prose my-2 border-l-2 border-emerald-400/70 pl-3 text-sm leading-relaxed text-emerald-300" data-doc-translation-line="${escapeHtml(unit.unit_id)}"${projectionAttrSuffix}>${escapeHtml(translatedText).replace(/\n/g, "<br />")}</div>`;
    })
    .join("\n");
}

function collectVisibleTranslationUnitIds(args: {
  container: HTMLDivElement;
  units: DocumentTranslationUnit[];
  translations: Record<string, InlineTranslationState>;
  inFlightIds: Set<string>;
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
    if (args.translations[unitId] || args.inFlightIds.has(unitId)) continue;
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

function formatInlineTranslationText(text: string): string {
  return text
    .replace(/^ {0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s*\|\s?/gm, "")
    .replace(/\s+\|\s*$/gm, "")
    .trim();
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
