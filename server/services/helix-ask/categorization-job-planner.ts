import type { ContinuousCategorizationSourceFamily } from "@shared/helix-continuous-categorization-job";

export type CategorizationJobPlan = {
  schema: "helix.categorization_job_plan.v1";
  should_start_job: boolean;
  source_family: ContinuousCategorizationSourceFamily;
  objective: string;
  reason: string;
  archive_on_stop: boolean;
};

export function planCategorizationJobForPrompt(prompt: string): CategorizationJobPlan {
  const normalized = prompt.toLowerCase();
  if (/\b(?:minecraft|minehut|game|world|cortana|keep watching|categorize|farm|building)\b/.test(normalized)) {
    return {
      schema: "helix.categorization_job_plan.v1",
      should_start_job: true,
      source_family: "minecraft_events",
      objective: prompt.trim() || "Categorize the live Minecraft session.",
      reason: "Prompt asks for an ongoing Minecraft/world interpretation substrate.",
      archive_on_stop: true,
    };
  }
  return {
    schema: "helix.categorization_job_plan.v1",
    should_start_job: false,
    source_family: "custom",
    objective: prompt.trim(),
    reason: "No live categorization source family was implied.",
    archive_on_stop: false,
  };
}
