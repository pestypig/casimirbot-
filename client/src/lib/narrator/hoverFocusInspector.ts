import { useEffect, useRef } from "react";
import { speakVoice, type VoiceSpeakResponse } from "@/lib/agi/api";
import { buildNarratorVoiceSpeakPayload } from "@/lib/narrator/narratorVoiceBridge";
import { useNarratorStore } from "@/store/useNarratorStore";

export type HoverFocusNarratorPoint = {
  x: number;
  y: number;
};

export type HoverFocusNarratorInspection = {
  sourceId: string;
  text: string;
  dedupeKey: string;
};

const INSPECTOR_SOURCE_KIND = "hover_focus_inspector" as const;
const DEFAULT_HOVER_DELAY_MS = 120;
const DEFAULT_CHUNK_MAX_CHARS = 220;
const TEXT_NODE = 3;
const TEXT_NODE_FILTER = 4;

const MEANINGFUL_SELECTOR = [
  "[data-narrator-label]",
  "[data-narrator-description]",
  "[aria-label]",
  "[aria-describedby]",
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "[role]",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "li",
  "summary",
  "figcaption",
  "blockquote",
  "td",
  "th",
  "article",
  "section",
].join(",");

function cleanNarratorText(value: string | null | undefined): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isElementVisible(element: Element): boolean {
  const view = element.ownerDocument.defaultView;
  if (!view || !(element instanceof view.HTMLElement)) return true;
  if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
  const style = view.getComputedStyle(element);
  if (style?.display === "none" || style?.visibility === "hidden") return false;
  return true;
}

function isSensitiveElement(element: Element): boolean {
  const view = element.ownerDocument.defaultView;
  if (!view) return false;
  if (!(element instanceof view.HTMLInputElement || element instanceof view.HTMLTextAreaElement)) return false;
  return element instanceof view.HTMLInputElement && element.type.toLowerCase() === "password";
}

function ariaDescribedByText(element: Element): string | null {
  const ids = cleanNarratorText(element.getAttribute("aria-describedby"));
  if (!ids) return null;
  const text = ids
    .split(/\s+/)
    .map((id) => cleanNarratorText(element.ownerDocument.getElementById(id)?.textContent))
    .filter(Boolean)
    .join(" ");
  return text || null;
}

function elementAccessibleText(element: Element): string | null {
  const view = element.ownerDocument.defaultView;
  if (isSensitiveElement(element)) return null;
  if (element.getAttribute("data-narrator-ignore") === "true") return null;
  const explicit = [
    element.getAttribute("data-narrator-label"),
    element.getAttribute("data-narrator-description"),
    element.getAttribute("aria-label"),
    ariaDescribedByText(element),
    element.getAttribute("title"),
    view && element instanceof view.HTMLImageElement ? element.alt : null,
    view && (element instanceof view.HTMLInputElement || element instanceof view.HTMLTextAreaElement)
      ? element.placeholder
      : null,
    view && element instanceof view.HTMLSelectElement
      ? element.selectedOptions.item(0)?.textContent
      : null,
  ]
    .map(cleanNarratorText)
    .find(Boolean);
  if (explicit) return explicit;

  return cleanNarratorText(element.textContent);
}

function findMeaningfulElement(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  const candidate = target.closest(MEANINGFUL_SELECTOR);
  if (!candidate || candidate.closest("[data-narrator-ignore='true']")) return null;
  if (!isElementVisible(candidate)) return null;
  return candidate;
}

export function splitNarratorSentences(text: string, maxChars = DEFAULT_CHUNK_MAX_CHARS): string[] {
  const cleaned = cleanNarratorText(text);
  if (!cleaned) return [];
  const sentenceMatches = cleaned.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) ?? [cleaned];
  const chunks: string[] = [];
  for (const sentence of sentenceMatches.map(cleanNarratorText).filter(Boolean)) {
    if (sentence.length <= maxChars) {
      chunks.push(sentence);
      continue;
    }
    let remaining = sentence;
    while (remaining.length > maxChars) {
      const cut = Math.max(60, remaining.lastIndexOf(" ", maxChars));
      chunks.push(cleanNarratorText(remaining.slice(0, cut)));
      remaining = cleanNarratorText(remaining.slice(cut));
    }
    if (remaining) chunks.push(remaining);
  }
  return chunks;
}

function textOffsetFromPoint(element: Element, point?: HoverFocusNarratorPoint): number | null {
  if (!point) return null;
  const doc = element.ownerDocument;
  const anyDocument = doc as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const position = anyDocument.caretPositionFromPoint?.(point.x, point.y);
  const node = position?.offsetNode ?? anyDocument.caretRangeFromPoint?.(point.x, point.y)?.startContainer ?? null;
  const offset = position?.offset ?? anyDocument.caretRangeFromPoint?.(point.x, point.y)?.startOffset ?? 0;
  if (!node || node.nodeType !== TEXT_NODE) return null;
  if (!node.parentNode || !element.contains(node.parentNode)) return null;

  let textOffset = 0;
  const walker = doc.createTreeWalker(element, TEXT_NODE_FILTER);
  while (walker.nextNode()) {
    const current = walker.currentNode;
    if (current === node) return textOffset + offset;
    textOffset += current.textContent?.length ?? 0;
  }
  return null;
}

export function pickNarratorSentenceAtOffset(
  text: string,
  offset: number | null,
  maxChars = DEFAULT_CHUNK_MAX_CHARS,
): string | null {
  const chunks = splitNarratorSentences(text, maxChars);
  if (chunks.length === 0) return null;
  if (offset === null || offset <= 0) return chunks[0];

  let cursor = 0;
  for (const chunk of chunks) {
    const start = text.indexOf(chunk, cursor);
    const end = start >= 0 ? start + chunk.length : cursor + chunk.length;
    if (offset >= start && offset <= end) return chunk;
    cursor = end;
  }
  return chunks[0];
}

function elementSourceId(element: Element, text: string): string {
  const explicit =
    element.getAttribute("data-narrator-source-id") ??
    element.id ??
    element.getAttribute("aria-label") ??
    element.getAttribute("role") ??
    element.tagName.toLowerCase();
  return `hover:${cleanNarratorText(explicit).slice(0, 80)}:${text.slice(0, 48)}`;
}

export function buildHoverFocusNarratorInspection(
  target: EventTarget | null,
  point?: HoverFocusNarratorPoint,
  maxChars = DEFAULT_CHUNK_MAX_CHARS,
): HoverFocusNarratorInspection | null {
  const element = findMeaningfulElement(target);
  if (!element) return null;
  const sourceText = elementAccessibleText(element);
  if (!sourceText) return null;
  const text = pickNarratorSentenceAtOffset(sourceText, textOffsetFromPoint(element, point), maxChars);
  if (!text) return null;
  const sourceId = elementSourceId(element, text);
  return {
    sourceId,
    text,
    dedupeKey: `${INSPECTOR_SOURCE_KIND}:${sourceId}:${text}`,
  };
}

function isFailedVoiceResponse(response: VoiceSpeakResponse): boolean {
  return Boolean(
    response.kind === "json" &&
      (response.status >= 400 ||
        response.payload.ok === false ||
        response.payload.suppressed === true ||
        response.payload.dryRun === true),
  );
}

export function useNarratorHoverFocusInspector(options?: {
  hoverDelayMs?: number;
  chunkMaxChars?: number;
}): void {
  const policy = useNarratorStore((state) => state.sourcePolicies.hover_focus_inspector);
  const publishEvent = useNarratorStore((state) => state.publishEvent);
  const markQueued = useNarratorStore((state) => state.markQueued);
  const markSpoken = useNarratorStore((state) => state.markSpoken);
  const markFailed = useNarratorStore((state) => state.markFailed);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef<{ key: string; controller: AbortController; eventId: string } | null>(null);
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!policy?.enabled) return undefined;
    const hoverDelayMs = options?.hoverDelayMs ?? DEFAULT_HOVER_DELAY_MS;

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    const abortActive = () => {
      activeRef.current?.controller.abort();
      activeRef.current = null;
    };
    const schedule = (target: EventTarget | null, point?: HoverFocusNarratorPoint) => {
      const inspection = buildHoverFocusNarratorInspection(target, point, options?.chunkMaxChars);
      if (!inspection) return;
      if (inspection.dedupeKey !== lastKeyRef.current) abortActive();
      lastKeyRef.current = inspection.dedupeKey;
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        const event = publishEvent({
          sourceKind: INSPECTOR_SOURCE_KIND,
          sourceId: inspection.sourceId,
          sourceLabelMessageId: "narrator.source.hoverFocusInspector",
          text: inspection.text,
          authority: "inspection_hint",
          assistant_answer: false,
          terminal_eligible: false,
          certainty: "low",
          evidenceRefs: [inspection.sourceId],
          traceId: `narrator:hover_focus:${Date.now()}`,
          rawContentIncluded: false,
          speakable: true,
          requestedDeliveryMode: policy.deliveryMode,
          defaultDeliveryMode: "visible_only",
          dedupeKey: inspection.dedupeKey,
        }, { voiceArmed: policy.deliveryMode === "auto_speak" });
        if (!event || policy.deliveryMode !== "auto_speak") return;

        const controller = new AbortController();
        activeRef.current = { key: inspection.dedupeKey, controller, eventId: event.eventId };
        markQueued(event.eventId);
        void speakVoice(buildNarratorVoiceSpeakPayload({ event, text: inspection.text }), { signal: controller.signal })
          .then((response) => {
            if (controller.signal.aborted) return;
            if (isFailedVoiceResponse(response)) {
              markFailed(event.eventId);
            } else {
              markSpoken(event.eventId);
            }
          })
          .catch((error) => {
            if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
            markFailed(event.eventId);
          })
          .finally(() => {
            if (activeRef.current?.eventId === event.eventId) activeRef.current = null;
          });
      }, hoverDelayMs);
    };

    const onPointerMove = (event: PointerEvent) => {
      schedule(event.target, { x: event.clientX, y: event.clientY });
    };
    const onFocusIn = (event: FocusEvent) => {
      schedule(event.target);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("focusin", onFocusIn, { passive: true });
    return () => {
      clearTimer();
      abortActive();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("focusin", onFocusIn);
    };
  }, [markFailed, markQueued, markSpoken, options?.hoverDelayMs, policy?.deliveryMode, policy?.enabled, publishEvent]);
}
