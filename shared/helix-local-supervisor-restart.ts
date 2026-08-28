import { z } from "zod";

export const HELIX_LOCAL_SUPERVISOR_RESTART_SCHEMA =
  "helix.local_supervisor_restart.v1" as const;

const serviceInstanceRefSchema = z.string()
  .regex(/^service_instance:[a-f0-9]{32}$/u);
const clientSessionRefSchema = z.string().trim().min(3).max(320)
  .refine((value) => !/[\r\n\t]/u.test(value), "opaque_ref_must_be_single_line")
  .refine(
    (value) => !/(?:https?:\/\/|bearer\s|token=|password=|community=)/iu.test(value),
    "private_value_forbidden",
  );

export const helixLocalSupervisorRestartProposalInputSchema = z.object({
  expected_service_instance_ref: serviceInstanceRefSchema,
  proposer_client_session_ref: clientSessionRefSchema,
  reason_code: z.enum([
    "maintenance",
    "configuration_change",
    "software_update",
    "recovery",
    "acceptance_test",
  ]),
  acknowledgement_deadline_seconds: z.number().int().min(30).max(600),
}).strict();

export const helixLocalSupervisorRestartDispositionInputSchema = z.object({
  proposal_ref: z.string().regex(/^supervisor_restart_proposal:[a-f0-9]{32}$/u),
  client_session_ref: clientSessionRefSchema,
  disposition: z.enum(["acknowledge", "object"]),
  blocker_code: z.enum([
    "active_turn",
    "retained_runtime",
    "active_mutation_lease",
    "unsafe_to_disconnect",
    "other_typed_blocker",
  ]).nullable().default(null),
}).strict().superRefine((value, context) => {
  if (value.disposition === "acknowledge" && value.blocker_code !== null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["blocker_code"],
      message: "An acknowledgement cannot carry a blocker.",
    });
  }
  if (value.disposition === "object" && value.blocker_code === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["blocker_code"],
      message: "An objection requires a typed blocker.",
    });
  }
});

export const helixLocalSupervisorRestartOwnerDecisionInputSchema = z.object({
  proposal_ref: z.string().regex(/^supervisor_restart_proposal:[a-f0-9]{32}$/u),
  owner_client_session_ref: clientSessionRefSchema,
  decision: z.enum(["approve", "cancel"]),
}).strict();

export const helixLocalSupervisorRestartCompletionInputSchema = z.object({
  authorization_ref: z.string().regex(/^supervisor_restart_authorization:[a-f0-9]{32}$/u),
  previous_service_instance_ref: serviceInstanceRefSchema,
  new_service_instance_ref: serviceInstanceRefSchema,
}).strict().refine(
  (value) => value.previous_service_instance_ref !== value.new_service_instance_ref,
  { message: "A restart must create a new service instance epoch." },
);

export type HelixLocalSupervisorRestartState =
  | "proposed"
  | "draining"
  | "blocked"
  | "authorized"
  | "completed"
  | "cancelled"
  | "expired";

export type HelixLocalSupervisorRestartDisposition = {
  client_session_ref: string;
  profile_ref: string;
  disposition: "acknowledge" | "object";
  blocker_code: z.infer<typeof helixLocalSupervisorRestartDispositionInputSchema>["blocker_code"];
  recorded_at: string;
};

export type HelixLocalSupervisorRestartProposal = {
  schema: typeof HELIX_LOCAL_SUPERVISOR_RESTART_SCHEMA;
  proposal_ref: string;
  service_instance_ref: string;
  proposer_client_session_ref: string;
  proposer_profile_ref: string;
  installed_node_owner_profile_ref: string;
  reason_code: z.infer<typeof helixLocalSupervisorRestartProposalInputSchema>["reason_code"];
  state: HelixLocalSupervisorRestartState;
  proposed_at: string;
  acknowledgement_deadline_at: string;
  affected_client_session_refs: string[];
  dispositions: HelixLocalSupervisorRestartDisposition[];
  owner_approved_at: string | null;
  protected_claim_refs: string[];
  missing_acknowledgement_client_session_refs: string[];
  objection_client_session_refs: string[];
  authorization_ref: string | null;
  authorization_consumed_at: string | null;
  completed_at: string | null;
  new_service_instance_ref: string | null;
  client_reconnect_required: boolean;
  room_grant_revalidation_required: boolean;
  prior_runtime_grants_valid: boolean;
  trusted_supervisor_consumption_required: true;
  advisory_relay_can_authorize_restart: false;
  arbitrary_process_control: false;
  environment_mutation_authority: false;
  credential_included: false;
  private_endpoint_included: false;
  process_identity_included: false;
  hidden_reasoning_included: false;
  content_role: "local_supervisor_restart_coordination_not_authority";
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixLocalSupervisorRestartProposalInput = z.infer<
  typeof helixLocalSupervisorRestartProposalInputSchema
>;
export type HelixLocalSupervisorRestartDispositionInput = z.infer<
  typeof helixLocalSupervisorRestartDispositionInputSchema
>;
export type HelixLocalSupervisorRestartOwnerDecisionInput = z.infer<
  typeof helixLocalSupervisorRestartOwnerDecisionInputSchema
>;
export type HelixLocalSupervisorRestartCompletionInput = z.infer<
  typeof helixLocalSupervisorRestartCompletionInputSchema
>;
