export const HELIX_REHEARSAL_SPACE_CATALOG_SCHEMA =
  "helix.rehearsal_space_catalog.v1" as const;

export type HelixRehearsalSpaceId =
  | "minecraft"
  | "browser_app"
  | "desktop_app"
  | "simulation"
  | "robotics"
  | "real_world"
  | "custom";

export type HelixRehearsalSpaceStatus =
  | "available"
  | "partial"
  | "waiting_for_source"
  | "future";

export type HelixRehearsalSpace = {
  space_id: HelixRehearsalSpaceId;
  label: string;
  domain_adapter: string;
  status: HelixRehearsalSpaceStatus;
  summary: string;
  supported_rehearsal_modes: Array<
    "rules_only" | "state_snapshot_only" | "server_probe" | "shadow_world" | "client_mod_dry_run"
  >;
  required_modalities: string[];
  available_modalities: string[];
  additive_fidelity_hint: number;
  may_execute_live_actions: false;
  default_enabled: boolean;
};

export type HelixRehearsalSpaceCatalog = {
  schema: typeof HELIX_REHEARSAL_SPACE_CATALOG_SCHEMA;
  spaces: HelixRehearsalSpace[];
  selected_space_id: HelixRehearsalSpaceId | null;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
};

const hasText = (values: Array<string | null | undefined>, pattern: RegExp): boolean =>
  values.some((value) => pattern.test(String(value ?? "")));

const statusFor = (required: string[], available: Set<string>): HelixRehearsalSpaceStatus => {
  const count = required.filter((entry) => available.has(entry)).length;
  if (count === required.length) return "available";
  if (count > 0) return "partial";
  return "waiting_for_source";
};

export function buildRehearsalSpaceCatalog(input: {
  sourceIds?: string[];
  modalities?: string[];
  lineKeys?: string[];
  objective?: string | null;
  preset?: string | null;
}): HelixRehearsalSpaceCatalog {
  const sourceIds = input.sourceIds ?? [];
  const available = new Set<string>(input.modalities ?? []);
  if (hasText([input.objective, input.preset, ...sourceIds], /\bminecraft|minehut|paper|bukkit\b/i)) {
    available.add("environment_state");
    available.add("procedure_graph");
  }
  if ((input.lineKeys ?? []).some((key) => ["situation", "actor_state", "resources", "affordances"].includes(key))) {
    available.add("environment_state");
  }
  if ((input.lineKeys ?? []).some((key) => ["possibilities", "rehearsal", "recommendation"].includes(key))) {
    available.add("procedure_graph");
  }
  if (hasText(sourceIds, /\bvisual|frame|screen|browser\b/i)) available.add("visual_frame");
  if (hasText(sourceIds, /\bsim|simulation|calculator|physics\b/i)) available.add("simulation_stream");
  if (hasText(sourceIds, /\brobot|ros|lidar|real_world|sensor\b/i)) available.add("environment_affordance");

  const definitions: Array<Omit<HelixRehearsalSpace, "status" | "available_modalities" | "default_enabled">> = [
    {
      space_id: "minecraft",
      label: "Minecraft",
      domain_adapter: "minecraft.paper_plugin.v1",
      summary: "Structured state, affordance checks, and read-only rehearsal for Minecraft runs.",
      supported_rehearsal_modes: ["rules_only", "state_snapshot_only", "server_probe"],
      required_modalities: ["environment_state", "procedure_graph"],
      additive_fidelity_hint: 0.08,
      may_execute_live_actions: false,
    },
    {
      space_id: "browser_app",
      label: "Browser app",
      domain_adapter: "browser_app.dom_visual.v1",
      summary: "Future DOM, screenshot, and interaction dry-run space for browser workflows.",
      supported_rehearsal_modes: ["rules_only", "state_snapshot_only", "server_probe"],
      required_modalities: ["visual_frame", "environment_state"],
      additive_fidelity_hint: 0.05,
      may_execute_live_actions: false,
    },
    {
      space_id: "desktop_app",
      label: "Desktop app",
      domain_adapter: "desktop_app.screen_state.v1",
      summary: "Future screen-state rehearsal space for desktop tools and workstation apps.",
      supported_rehearsal_modes: ["rules_only", "state_snapshot_only"],
      required_modalities: ["visual_frame", "environment_state"],
      additive_fidelity_hint: 0.04,
      may_execute_live_actions: false,
    },
    {
      space_id: "simulation",
      label: "Simulation",
      domain_adapter: "simulation.state_stream.v1",
      summary: "Read-only rehearsal against simulation or calculation streams.",
      supported_rehearsal_modes: ["rules_only", "state_snapshot_only", "shadow_world"],
      required_modalities: ["simulation_stream", "procedure_graph"],
      additive_fidelity_hint: 0.06,
      may_execute_live_actions: false,
    },
    {
      space_id: "robotics",
      label: "Robotics",
      domain_adapter: "robotics.sensor_map.v1",
      summary: "Future sensor-map rehearsal with strict no-actuation gates.",
      supported_rehearsal_modes: ["rules_only", "state_snapshot_only", "server_probe"],
      required_modalities: ["environment_state", "environment_affordance"],
      additive_fidelity_hint: 0.07,
      may_execute_live_actions: false,
    },
    {
      space_id: "real_world",
      label: "Real world",
      domain_adapter: "real_world.sensor_fusion.v1",
      summary: "Future rehearsal space for strong external sensors; recommendations stay confirmation-gated.",
      supported_rehearsal_modes: ["rules_only", "state_snapshot_only"],
      required_modalities: ["environment_state", "environment_affordance"],
      additive_fidelity_hint: 0.04,
      may_execute_live_actions: false,
    },
  ];

  const spaces = definitions.map((definition) => {
    const status = definition.space_id === "custom"
      ? "future" as const
      : statusFor(definition.required_modalities, available);
    return {
      ...definition,
      status,
      available_modalities: definition.required_modalities.filter((entry) => available.has(entry)),
      default_enabled: status === "available",
    };
  });
  const selected = spaces.find((space) => space.status === "available") ?? spaces.find((space) => space.status === "partial") ?? null;
  return {
    schema: HELIX_REHEARSAL_SPACE_CATALOG_SCHEMA,
    spaces,
    selected_space_id: selected?.space_id ?? null,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
  };
}
