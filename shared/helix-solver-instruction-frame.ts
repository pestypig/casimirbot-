export const HELIX_SOLVER_INSTRUCTION_FRAME_SCHEMA = "helix.solver_instruction_frame.v1" as const;

export type HelixSolverInstructionFrame = {
  schema: typeof HELIX_SOLVER_INSTRUCTION_FRAME_SCHEMA;
  turn_id: string;

  active_rules: string[];
  negative_user_constraints: string[];
  source_identity_rules: string[];
  capability_permission_rules: string[];
  terminal_authority_rules: string[];

  codex_boundary: {
    codex_owned_runtime_forbidden: string[];
    helix_owned_policy_allowed: string[];
  };

  assistant_answer: false;
  raw_content_included: false;
};
