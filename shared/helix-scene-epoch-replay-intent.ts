export const isSceneEpochReplayPrompt = (promptText: string): boolean =>
  /\b(?:what\s+changed|changed\s+since|last\s+(?:seen\s+|situation\s+|scene\s+|visual\s+|screen\s+|live\s+)?epochs?|scene\s+epochs?|visual\s+epochs?|screen\s+epochs?|live\s+epochs?|since\s+(?:the\s+)?last\s+(?:seen|visual|capture|scene|frame|screen|epochs?)|previous\s+(?:scene|frame|visual|screen|capture|epochs?)|compare\s+(?:the\s+)?current\s+scene|compare\b[\s\S]{0,100}\b(?:last|previous)\s+(?:scene|frame|visual|screen|capture|epochs?)|(?:different|difference)\b[\s\S]{0,120}\b(?:last|previous)\s+(?:scene|frame|visual|screen|capture|epochs?)|last\s+(?:scene|frame|visual|screen|capture)\b[\s\S]{0,120}\b(?:current|now|looking\s+at|this\s+(?:scene|frame|visual|screen)))\b/i.test(promptText);

export const SCENE_EPOCH_REPLAY_FORBIDDEN_ROUTES = [
  "process_graph_overview",
  "live_environment_binding_diagnosis",
  "live_pipeline_receipt",
  "live_pipeline_control",
  "workspace_action_receipt",
  "no_tool_direct",
  "model_only_concept",
  "active_doc_identity",
  "active_doc_summary",
] as const;
