export type MissionCalloutPriority = "info" | "warn" | "critical" | "action";

export type SalienceInput = {
  missionId: string;
  eventType: string;
  classification: MissionCalloutPriority;
  entityId?: string;
  riskId?: string;
  timerId?: string;
  dedupeKey?: string;
  tsMs?: number;
};

export type SalienceDecision = {
  speak: boolean;
  priority: MissionCalloutPriority;
  dedupeKey: string;
  reason: "emit" | "dedupe_cooldown" | "mission_rate_limited";
  cooldownMs: number;
};

export type SalienceState = {
  dedupeUntilMs: Map<string, number>;
  missionCalloutTs: Map<string, number[]>;
};

const PRIORITY_COOLDOWN_SECONDS: Record<MissionCalloutPriority, number> = {
  info: 60,
  warn: 30,
  critical: 10,
  action: 5,
};

const buildKey = (input: SalienceInput): string => {
  if (input.dedupeKey?.trim()) return input.dedupeKey.trim();
  const entity = input.entityId?.trim() || "entity:none";
  const risk = input.riskId?.trim() || "risk:none";
  const timer = input.timerId?.trim() || "timer:none";
  return `${input.eventType}:${entity}:${risk}:${timer}`;
};

export const createSalienceState = (): SalienceState => ({
  dedupeUntilMs: new Map<string, number>(),
  missionCalloutTs: new Map<string, number[]>(),
});

export const evaluateSalience = (
  input: SalienceInput,
  state: SalienceState,
): SalienceDecision => {
  const now = Number.isFinite(input.tsMs) ? Math.floor(input.tsMs as number) : Date.now();
  const dedupeKey = buildKey(input);
  const cooldownMs = PRIORITY_COOLDOWN_SECONDS[input.classification] * 1000;

  const dedupeUntil = state.dedupeUntilMs.get(dedupeKey) ?? 0;
  if (dedupeUntil > now) {
    return {
      speak: false,
      priority: input.classification,
      dedupeKey,
      reason: "dedupe_cooldown",
      cooldownMs,
    };
  }

  const missionWindowStart = now - 15_000;
  const previous = state.missionCalloutTs.get(input.missionId) ?? [];
  const recent = previous.filter((ts) => ts >= missionWindowStart);
  const canBypassCap = input.classification === "critical" || input.classification === "action";

  if (!canBypassCap && recent.length >= 2) {
    state.missionCalloutTs.set(input.missionId, recent);
    return {
      speak: false,
      priority: input.classification,
      dedupeKey,
      reason: "mission_rate_limited",
      cooldownMs,
    };
  }

  state.dedupeUntilMs.set(dedupeKey, now + cooldownMs);
  recent.push(now);
  state.missionCalloutTs.set(input.missionId, recent);

  return {
    speak: true,
    priority: input.classification,
    dedupeKey,
    reason: "emit",
    cooldownMs,
  };
};
