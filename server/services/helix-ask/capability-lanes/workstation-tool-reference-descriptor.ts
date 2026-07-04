import type { HelixCapabilityLaneTemplate } from "./lane-template";

export const workstationToolReferenceLaneTemplate: HelixCapabilityLaneTemplate = {
  lane_id: "workstation_tool_reference",
  family: "workstation_tool_reference",
  label: "Workstation tool reference",
  description: "Reference lane for the existing workstation gateway catalog; no tool migration occurs here.",
  backend_family: "helix_workstation_gateway",
  model_or_service_ref: "workstation_gateway_existing",
  safety_tags: ["existing_gateway_reference", "no_lane_reroute", "observation_or_receipt_only"],
  configured: () => true,
  cost_class: "free_local",
  latency_class: "local",
  privacy_class: "local_only",
  one_shot_supported: true,
  session_supported: false,
  goal_binding_supported: false,
  capabilities: [
    {
      capability_id: "workstation_tool_reference.list_capabilities",
      label: "List workstation gateway capabilities",
      one_shot_status: "executable",
      session_status: "not_supported",
      backend_provider_required: false,
      model_visible_hint: {
        required_input_fields: [],
        optional_input_fields: ["requested_backend_provider"],
        when_to_use:
          "Use to inspect the governed workstation gateway capability catalog as observation-only reference data.",
        request_shape_hint: {
          capability_lane_call: {
            capability: "workstation_tool_reference.list_capabilities",
          },
        },
      },
    },
  ],
};
