export const HELIX_SITUATION_GRAPH_RECIPE_SCHEMA = "helix.situation_graph_recipe.v1" as const;

export type HelixSituationGraphRecipe = {
  schema: typeof HELIX_SITUATION_GRAPH_RECIPE_SCHEMA;
  recipe_id: string;
  title: string;
  aliases: string[];
  description: string;
  required_bindings: string[];
  optional_bindings: string[];
  nodes: Array<{
    local_id: string;
    capability_id: string;
    title?: string;
    params?: Record<string, unknown>;
  }>;
  edges: Array<{
    from: string;
    from_port: string;
    to: string;
    to_port: string;
  }>;
  output_contract: {
    attachment_policy: "manual_only";
    context_injection: "explicit_attachment_only";
    command_lane_enabled: false;
  };
};

const recipe = (input: Omit<HelixSituationGraphRecipe, "schema" | "output_contract">): HelixSituationGraphRecipe => ({
  schema: HELIX_SITUATION_GRAPH_RECIPE_SCHEMA,
  output_contract: {
    attachment_policy: "manual_only",
    context_injection: "explicit_attachment_only",
    command_lane_enabled: false,
  },
  ...input,
});

export const HELIX_SITUATION_GRAPH_RECIPES: HelixSituationGraphRecipe[] = [
  recipe({
    recipe_id: "two_way_interpreter",
    title: "Two-way interpreter",
    aliases: ["live interpreter", "interpreter", "interpret this call", "interpret this voice chat", "interpret this discord"],
    description: "Speaker-aware two-way translation between two participants.",
    required_bindings: [
      "room_id",
      "source_ids",
      "speaker_a_id",
      "speaker_b_id",
      "speaker_a_native_language",
      "speaker_b_native_language",
      "output_mode",
    ],
    optional_bindings: ["voice_output"],
    nodes: [
      { local_id: "source", capability_id: "source.browser_tab_audio", title: "Conversation audio" },
      { local_id: "split", capability_id: "identity.speaker_split", title: "Speaker split" },
      { local_id: "speaker_map", capability_id: "identity.speaker_profile_map", title: "Speaker map" },
      { local_id: "translate_a_to_b", capability_id: "transform.translate", title: "Speaker A to B" },
      { local_id: "translate_b_to_a", capability_id: "transform.translate", title: "Speaker B to A" },
      { local_id: "panel_output", capability_id: "output.panel_transcript", title: "Interpreter output" },
      { local_id: "health", capability_id: "monitor.translation_health", title: "Translation health" },
    ],
    edges: [
      { from: "source", from_port: "audio", to: "split", to_port: "audio" },
      { from: "split", from_port: "speakers", to: "speaker_map", to_port: "speaker" },
      { from: "speaker_map", from_port: "speaker", to: "translate_a_to_b", to_port: "text" },
      { from: "speaker_map", from_port: "speaker", to: "translate_b_to_a", to_port: "text" },
      { from: "translate_a_to_b", from_port: "translation", to: "panel_output", to_port: "text" },
      { from: "translate_b_to_a", from_port: "translation", to: "panel_output", to_port: "text" },
      { from: "translate_a_to_b", from_port: "translation", to: "health", to_port: "translation" },
      { from: "translate_b_to_a", from_port: "translation", to: "health", to_port: "translation" },
    ],
  }),
  recipe({
    recipe_id: "voice_chat_monitor",
    title: "Voice chat monitor",
    aliases: ["monitor this voice chat", "watch this call", "listen to this call"],
    description: "Capture-safe monitor graph for voice chat activity and explicit Helix attachment.",
    required_bindings: ["room_id", "source_ids", "monitor_mode"],
    optional_bindings: ["interjection_policy"],
    nodes: [
      { local_id: "source", capability_id: "source.browser_tab_audio", title: "Voice chat source" },
      { local_id: "source_monitor", capability_id: "monitor.source_activity", title: "Source activity" },
      { local_id: "gate", capability_id: "policy.interjection_gate", title: "Interjection gate" },
      { local_id: "helix", capability_id: "helix.attach_context", title: "Attach to Helix" },
    ],
    edges: [
      { from: "source", from_port: "audio", to: "source_monitor", to_port: "audio" },
      { from: "source_monitor", from_port: "signal", to: "gate", to_port: "signal" },
      { from: "gate", from_port: "context", to: "helix", to_port: "context" },
    ],
  }),
  recipe({
    recipe_id: "meeting_summary",
    title: "Meeting summary",
    aliases: ["meeting summary", "summarize this call", "summarize this meeting"],
    description: "Summarizes selected room evidence into manual-only outputs.",
    required_bindings: ["room_id", "source_ids"],
    optional_bindings: ["summary_cadence"],
    nodes: [
      { local_id: "source", capability_id: "source.browser_tab_audio", title: "Meeting source" },
      { local_id: "summary", capability_id: "transform.rolling_summary", title: "Rolling summary" },
      { local_id: "output", capability_id: "output.panel_transcript", title: "Summary output" },
    ],
    edges: [
      { from: "source", from_port: "audio", to: "summary", to_port: "text" },
      { from: "summary", from_port: "summary", to: "output", to_port: "text" },
    ],
  }),
  recipe({
    recipe_id: "prompt_composer_from_room",
    title: "Prompt composer from room",
    aliases: ["prompt composer pipeline", "turn this call into a prompt", "make a prompt from this voice chat"],
    description: "Builds a prompt draft from explicitly selected room evidence.",
    required_bindings: ["room_id", "source_ids"],
    optional_bindings: ["prompt_goal"],
    nodes: [
      { local_id: "source", capability_id: "source.browser_tab_audio", title: "Room source" },
      { local_id: "composer", capability_id: "transform.prompt_composer", title: "Prompt composer" },
      { local_id: "output", capability_id: "output.panel_transcript", title: "Prompt output" },
    ],
    edges: [
      { from: "source", from_port: "audio", to: "composer", to_port: "text" },
      { from: "composer", from_port: "prompt", to: "output", to_port: "text" },
    ],
  }),
  recipe({
    recipe_id: "action_item_monitor",
    title: "Action-item monitor",
    aliases: ["monitor this voice chat for action items", "action item monitor", "extract action items from this call"],
    description: "Extracts action items from selected room evidence.",
    required_bindings: ["room_id", "source_ids"],
    optional_bindings: ["assignee_policy"],
    nodes: [
      { local_id: "source", capability_id: "source.browser_tab_audio", title: "Conversation source" },
      { local_id: "items", capability_id: "transform.action_items", title: "Action items" },
      { local_id: "output", capability_id: "output.panel_transcript", title: "Action item output" },
    ],
    edges: [
      { from: "source", from_port: "audio", to: "items", to_port: "text" },
      { from: "items", from_port: "items", to: "output", to_port: "text" },
    ],
  }),
  recipe({
    recipe_id: "minecraft_situation_monitor",
    title: "Minecraft situation monitor",
    aliases: ["watch minecraft", "minecraft monitor", "interrupt only for danger"],
    description: "Monitors game context through explicit source and interjection policy nodes.",
    required_bindings: ["room_id", "source_ids", "monitor_mode"],
    optional_bindings: ["interjection_policy"],
    nodes: [
      { local_id: "source", capability_id: "source.browser_tab_audio", title: "Game audio/source" },
      { local_id: "monitor", capability_id: "monitor.source_activity", title: "Game signal monitor" },
      { local_id: "gate", capability_id: "policy.interjection_gate", title: "Danger-only gate", params: { mode: "high_salience" } },
      { local_id: "helix", capability_id: "helix.attach_context", title: "Helix observation" },
    ],
    edges: [
      { from: "source", from_port: "audio", to: "monitor", to_port: "audio" },
      { from: "monitor", from_port: "signal", to: "gate", to_port: "signal" },
      { from: "gate", from_port: "context", to: "helix", to_port: "context" },
    ],
  }),
  recipe({
    recipe_id: "browser_video_translation",
    title: "Browser video translation",
    aliases: ["translate this video", "browser video translation", "translate browser audio"],
    description: "Translates browser video audio into a panel output without auto-attaching transcript context.",
    required_bindings: ["room_id", "source_ids", "target_language"],
    optional_bindings: ["native_language"],
    nodes: [
      { local_id: "source", capability_id: "source.browser_tab_audio", title: "Browser audio" },
      { local_id: "translate", capability_id: "transform.translate", title: "Video translation" },
      { local_id: "output", capability_id: "output.panel_transcript", title: "Translation output" },
    ],
    edges: [
      { from: "source", from_port: "audio", to: "translate", to_port: "text" },
      { from: "translate", from_port: "translation", to: "output", to_port: "text" },
    ],
  }),
];

export const getHelixSituationGraphRecipe = (recipeId: string): HelixSituationGraphRecipe | undefined =>
  HELIX_SITUATION_GRAPH_RECIPES.find((entry) => entry.recipe_id === recipeId);

export const matchHelixSituationGraphRecipeForPrompt = (prompt: string): HelixSituationGraphRecipe | undefined => {
  const normalized = prompt.toLowerCase();
  return HELIX_SITUATION_GRAPH_RECIPES.find((entry) =>
    entry.aliases.some((alias) => normalized.includes(alias.toLowerCase())),
  );
};
