import fs from "node:fs";
import path from "node:path";

export type RuntimeDegradeStep =
  | "none"
  | "reduce_output_tokens"
  | "reduce_tool_calls"
  | "swap_to_smaller_model"
  | "drop_vision_fps"
  | "force_clarify"
  | "queue_deep_work";

export type RuntimeLane = "llm" | "media" | "perception" | "physics" | "io";

export type RuntimeFrameContract = {
  profile: string;
  clockA: {
    p95_ms: number;
    hard_deadline_ms: number;
    max_tool_calls: number;
    max_plan_steps: number;
    max_output_tokens: number;
  };
  clockB: {
    max_concurrent_jobs: number;
    job_timeslice_ms: number;
    max_queue_depth: number;
  };
  kv: { max_tokens: number; evict: "oldest" };
  session_memory: { ttl_ms: number; max_items: number };
  tools: Record<string, Record<string, unknown>>;
  lanes: Record<RuntimeLane, { max_concurrent: number }>;
  degrade_ladder: RuntimeDegradeStep[];
};

const DEFAULT_PROFILE_ID = "499";
let cachedContract: RuntimeFrameContract | null = null;

const profilePathFor = (profileId = DEFAULT_PROFILE_ID): string =>
  path.resolve(process.cwd(), "server/services/runtime/profiles", `${profileId}.json`);

export const loadRuntimeFrameContract = (profileId = DEFAULT_PROFILE_ID): RuntimeFrameContract => {
  if (profileId === DEFAULT_PROFILE_ID && cachedContract) {
    return cachedContract;
  }
  const raw = fs.readFileSync(profilePathFor(profileId), "utf8");
  const parsed = JSON.parse(raw) as RuntimeFrameContract;
  if (profileId === DEFAULT_PROFILE_ID) {
    cachedContract = parsed;
  }
  return parsed;
};

export const resetRuntimeFrameContractCache = (): void => {
  cachedContract = null;
};
