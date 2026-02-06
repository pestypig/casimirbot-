export type HelixAskEnvelopeMode = "brief" | "standard" | "extended";

export type HelixAskEnvelopeTier = "F0" | "F1" | "F2" | "F3";

export type HelixAskEnvelopeSection = {
  title: string;
  body: string;
  citations?: string[];
  layer?: "details" | "proof";
  defaultOpen?: boolean;
};

export type HelixAskProofGate = {
  name?: string;
  status?: string;
  residuals?: string;
  constraints?: string;
  certificate?: string;
  integrity_ok?: boolean;
  source?: string;
};

export type HelixAskProofEnvelope = {
  gate?: HelixAskProofGate;
  evidence?: Array<{ path: string }>;
  trace_ids?: string[];
};

export type HelixAskAnswerExtension = {
  available: boolean;
  title?: string;
  body?: string;
  citations?: string[];
};

export type HelixAskResponseEnvelope = {
  mode: HelixAskEnvelopeMode;
  tier: HelixAskEnvelopeTier;
  secondaryTier?: HelixAskEnvelopeTier;
  answer: string;
  sections?: HelixAskEnvelopeSection[];
  proof?: HelixAskProofEnvelope;
  extension?: HelixAskAnswerExtension;
};
