import type { DocumentTranslationUnit } from "@shared/document-translation";
import {
  HELIX_ASK_LIVE_EVENT_BUS_EVENT,
  coerceHelixAskLiveEventBusPayload,
} from "@/lib/helix/liveEventsBus";
import { ingestDocumentLiveTranslationProjectionFromAskLiveEvent } from "@/lib/docs/liveTranslationProjectionRegistry";

type EventTargetLike = Pick<EventTarget, "addEventListener" | "removeEventListener">;

export type InstallDocumentLiveTranslationProjectionEventIngestionInput = {
  eventTarget: EventTargetLike;
  docPath: string;
  locale: string;
  projectionTarget?: string | null;
  units: DocumentTranslationUnit[];
};

export function installDocumentLiveTranslationProjectionEventIngestion(
  input: InstallDocumentLiveTranslationProjectionEventIngestionInput,
): () => void {
  const handleLiveTranslationProjection = (event: Event) => {
    const payload = coerceHelixAskLiveEventBusPayload((event as CustomEvent<unknown>)?.detail);
    if (!payload) return;
    ingestDocumentLiveTranslationProjectionFromAskLiveEvent({
      docPath: input.docPath,
      locale: input.locale,
      projectionTarget: input.projectionTarget ?? "docs_chunk",
      units: input.units,
      eventPayload: payload,
    });
  };
  input.eventTarget.addEventListener(
    HELIX_ASK_LIVE_EVENT_BUS_EVENT,
    handleLiveTranslationProjection as EventListener,
  );
  return () => {
    input.eventTarget.removeEventListener(
      HELIX_ASK_LIVE_EVENT_BUS_EVENT,
      handleLiveTranslationProjection as EventListener,
    );
  };
}
