import {
  isDocEquationContextArtifactV1,
  type DocEquationContextArtifactV1,
} from "@shared/contracts/doc-equation-context.v1";
import {
  emitHelixAskLiveEvent,
  type HelixAskLiveEventBusPayload,
} from "@/lib/helix/liveEventsBus";
import { HELIX_ASK_CONTEXT_ID } from "@/lib/helix/voice-surface-contract";
import { useDocEquationContextStore } from "@/store/useDocEquationContextStore";

export const DOC_EQUATION_CONTEXT_EVENT = "helix-doc-equation-context" as const;

type DispatchTarget = {
  dispatchEvent: (event: Event) => boolean;
};

type EmitDocEquationContextOptions = {
  target?: DispatchTarget | null;
  contextId?: string;
  emitLocalEvent?: boolean;
  emitLiveEvent?: boolean;
  recordStore?: boolean;
};

const fallbackEventTarget = (): DispatchTarget | null =>
  typeof window === "undefined" ? null : window;

function makeCustomEvent<T>(type: string, detail: T): Event {
  if (typeof CustomEvent === "function") {
    return new CustomEvent<T>(type, { detail });
  }
  const event = new Event(type) as Event & { detail?: T };
  Object.defineProperty(event, "detail", {
    configurable: false,
    enumerable: true,
    value: detail,
  });
  return event;
}

const clip = (value: string, max = 180): string => {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}...`;
};

export function summarizeDocEquationContext(artifact: DocEquationContextArtifactV1): string {
  const preferred = artifact.preferredBadgeId ?? artifact.badgeIds[0] ?? "no badge";
  const scope = artifact.commentaryHints.scope.replace(/_/g, " ");
  const note = artifact.actionClaimBoundaryNote ?? artifact.claimBoundaryNotes[0] ?? "Diagnostic context only.";
  return `Doc equation context: ${artifact.equationLabel} -> ${preferred}. Scope: ${scope}. ${clip(note, 140)}`;
}

export function buildDocEquationContextLiveEventPayload(
  artifact: DocEquationContextArtifactV1,
  contextId = HELIX_ASK_CONTEXT_ID.desktop,
): HelixAskLiveEventBusPayload {
  return {
    contextId,
    traceId: `doc-equation-context:${artifact.equationId}:${artifact.actionId}`,
    entry: {
      id: `doc-equation-context:${artifact.equationId}:${artifact.actionId}:${Date.now()}`,
      text: summarizeDocEquationContext(artifact),
      tool: "docs-viewer.doc_equation_context",
      ts: artifact.generatedAt,
      meta: {
        kind: "doc_equation_context",
        assistant_answer: false,
        terminal_eligible: false,
        artifact,
      },
    },
  };
}

export function emitDocEquationContextArtifact(
  artifact: DocEquationContextArtifactV1,
  options: EmitDocEquationContextOptions = {},
): DocEquationContextArtifactV1 | null {
  if (!isDocEquationContextArtifactV1(artifact)) return null;

  if (options.recordStore !== false) {
    useDocEquationContextStore.getState().recordContext(artifact);
  }

  if (options.emitLocalEvent !== false) {
    const target = options.target ?? fallbackEventTarget();
    if (target) {
      target.dispatchEvent(makeCustomEvent(DOC_EQUATION_CONTEXT_EVENT, artifact));
    }
  }

  if (options.emitLiveEvent !== false) {
    emitHelixAskLiveEvent(buildDocEquationContextLiveEventPayload(
      artifact,
      options.contextId ?? HELIX_ASK_CONTEXT_ID.desktop,
    ));
  }

  return artifact;
}
