import type {
  HelixClientCapability,
  HelixClientCapabilityActionKind,
} from "./helix-client-capability-action";

export const HELIX_CLIENT_CAPABILITY_ADOPTION_SCHEMA =
  "helix.client_capability_adoption.v1" as const;

export type HelixClientCapabilityAdoption = {
  schema: typeof HELIX_CLIENT_CAPABILITY_ADOPTION_SCHEMA;
  adoption_id: string;
  action_request_id: string;
  thread_id: string;
  capability: HelixClientCapability;
  action: HelixClientCapabilityActionKind;
  source_id?: string | null;
  producer_id?: string | null;
  client_id: string;
  ok: boolean;
  observed_state: Record<string, unknown>;
  next_required_action?: string | null;
  error?: string | null;
  assistant_answer: false;
  raw_content_included: false;
};

