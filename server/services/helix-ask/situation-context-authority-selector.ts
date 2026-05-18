import type { HelixActiveSituationContext } from "@shared/helix-active-situation-context";
import type { HelixSituationEvidenceSelection } from "@shared/helix-situation-evidence-selection";

export type HelixSituationContextAuthoritySelection = {
  schema: "helix.situation_context_authority_selection.v1";
  selection_id: string;
  selected_authority:
    | "active_situation_context"
    | "procedure_memory"
    | "live_card_projection"
    | "legacy_context_pack"
    | "none";
  active_situation_context_id?: string | null;
  situation_evidence_selection_id?: string | null;
  legacy_context_role?: "legacy_projection_debug" | null;
  terminal_answer_may_use_legacy_projection: boolean;
  reason: string;
  assistant_answer: false;
  raw_content_included: false;
};

const hashShort = (value: unknown): string => {
  let hash = 0;
  const text = JSON.stringify(value);
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(16).slice(0, 18);
};

export function selectSituationContextAuthority(input: {
  activeContext?: HelixActiveSituationContext | null;
  evidenceSelection?: HelixSituationEvidenceSelection | null;
  hasProcedureMemory?: boolean;
  hasLiveCardProjection?: boolean;
  hasLegacyContextPack?: boolean;
}): HelixSituationContextAuthoritySelection {
  const activeContext = input.activeContext ?? null;
  const evidenceSelection = input.evidenceSelection ?? null;
  const activeEvidenceAnswerable =
    Boolean(activeContext?.situation_run_id) &&
    evidenceSelection?.answerable === true &&
    (activeContext?.status === "active" || activeContext?.status === "stale");
  const selectedAuthority: HelixSituationContextAuthoritySelection["selected_authority"] =
    activeEvidenceAnswerable ? "active_situation_context" :
    input.hasProcedureMemory ? "procedure_memory" :
    input.hasLiveCardProjection ? "live_card_projection" :
    input.hasLegacyContextPack ? "legacy_context_pack" :
    "none";
  return {
    schema: "helix.situation_context_authority_selection.v1",
    selection_id: `situation_context_authority:${hashShort([
      activeContext?.context_id ?? null,
      evidenceSelection?.selection_id ?? null,
      selectedAuthority,
    ])}`,
    selected_authority: selectedAuthority,
    active_situation_context_id: activeContext?.context_id ?? null,
    situation_evidence_selection_id: evidenceSelection?.selection_id ?? null,
    legacy_context_role: input.hasLegacyContextPack && selectedAuthority !== "legacy_context_pack"
      ? "legacy_projection_debug"
      : null,
    terminal_answer_may_use_legacy_projection: selectedAuthority === "legacy_context_pack",
    reason: activeEvidenceAnswerable
      ? "Selected active SituationRun evidence before live-card or legacy context-pack projections."
      : selectedAuthority === "procedure_memory"
        ? "Selected procedure memory because active SituationRun evidence was not answerable."
        : selectedAuthority === "live_card_projection"
          ? "Selected canonical live-card projection because no answerable SituationRun evidence was available."
          : selectedAuthority === "legacy_context_pack"
            ? "Selected legacy context pack only because higher-authority procedure evidence was unavailable."
            : "No usable situation-context authority was available.",
    assistant_answer: false,
    raw_content_included: false,
  };
}
