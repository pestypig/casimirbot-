export type HelixTurnInputItem =
  | {
      type: "text";
      text: string;
      source: "user";
    }
  | {
      type: "image";
      image_ref?: string | null;
      image_base64?: string | null;
      mime_type: string;
      file_name?: string | null;
      evidence_id?: string | null;
      raw_image_included: boolean;
      raw_image_scope?: "turn_input_only" | null;
    }
  | {
      type: "evidence_ref";
      evidence_id: string;
      evidence_kind:
        | "visual_frame_evidence"
        | "visual_extraction_evidence"
        | "synthetic_evidence"
        | "subgoal_evaluation"
        | "interpreted_event"
        | "tool_observation";
      compact_summary?: string | null;
      assistant_answer: false;
      raw_content_included: false;
    };
