import type { InterfaceMessageId } from "../client/src/lib/i18n/messages/types";

export type InterfaceTranslationCheckStatus = "pass" | "warn" | "fail";

export type InterfaceTranslationJobV1 = {
  schema: "casimir.interface_translation_job.v1";
  job_id: string;
  locale: "haw";
  message_id: InterfaceMessageId;
  source_text: string;
  source_hash: string;
  context: string;
  placeholders: string[];
  glossary_terms: string[];
  candidate_text: string;
  candidate_source: "manual" | "procedural_catalog" | "machine_assisted";
  candidate_hash: string;
  checks: {
    placeholder_parity: "pass" | "fail";
    glossary_policy: InterfaceTranslationCheckStatus;
    orthography: InterfaceTranslationCheckStatus;
    length_ratio: number;
    fallback_used: boolean;
    icu_parse_ok: boolean;
  };
  review: {
    status: "draft" | "needs_review" | "approved" | "rejected";
    passworthy_score: 1 | 2 | 3 | 4 | 5;
    reviewer?: string;
    notes?: string;
  };
  created_at: string;
  updated_at: string;
};
