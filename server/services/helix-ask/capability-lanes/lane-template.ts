import type {
  HelixCapabilityLaneBackendProviderDescriptor,
  HelixCapabilityLaneBackendFamily,
  HelixCapabilityLaneDescriptor,
  HelixCapabilityLaneId,
  HelixCapabilityLaneModelVisibleHint,
} from "@shared/helix-capability-lane";
import type { HelixCapabilityLaneBackendProviderTemplate } from "./backend-provider-config";

export type HelixCapabilityLaneCapabilityTemplate = {
  capability_id: string;
  label: string;
  one_shot_status: "executable" | "shadow_only" | "not_supported";
  session_status: "supported" | "not_supported";
  backend_provider_required: boolean;
  model_visible_hint?: HelixCapabilityLaneModelVisibleHint;
};

export type HelixCapabilityLaneTemplate = {
  lane_id: HelixCapabilityLaneId;
  family: HelixCapabilityLaneDescriptor["family"];
  label: string;
  description: string;
  backend_family: HelixCapabilityLaneBackendFamily;
  model_or_service_ref: string | null;
  safety_tags: string[];
  required_env_vars?: string[];
  configured(env: NodeJS.ProcessEnv): boolean;
  cost_class: HelixCapabilityLaneBackendProviderDescriptor["cost_class"];
  latency_class: HelixCapabilityLaneBackendProviderDescriptor["latency_class"];
  privacy_class: HelixCapabilityLaneBackendProviderDescriptor["privacy_class"];
  one_shot_supported: boolean;
  session_supported: boolean;
  goal_binding_supported: boolean;
  backend_provider_templates?: HelixCapabilityLaneBackendProviderTemplate[];
  default_backend_provider?: string;
  capabilities: HelixCapabilityLaneCapabilityTemplate[];
};
