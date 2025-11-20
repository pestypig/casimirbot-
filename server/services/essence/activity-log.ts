import { ActivitySample, type TActivitySample } from "@shared/essence-activity";
import { insertActivitySamples, listActivitySamples, type PersistedActivitySample } from "../../db/essence-activity";

const DEFAULT_WINDOW_HOURS = 24;

export async function recordActivityEvents(
  ownerId: string | null | undefined,
  samples: TActivitySample[],
): Promise<number> {
  if (!samples.length) {
    return 0;
  }
  const normalized = samples
    .map((sample) => ActivitySample.safeParse(sample))
    .filter((entry): entry is { success: true; data: TActivitySample } => entry.success)
    .map((entry) => entry.data);
  if (!normalized.length) {
    return 0;
  }
  return insertActivitySamples(ownerId, normalized);
}

export async function getActivityWindow(
  ownerId: string,
  hours = DEFAULT_WINDOW_HOURS,
  now = new Date(),
): Promise<PersistedActivitySample[]> {
  const windowHours = Number.isFinite(hours) ? Math.max(1, Math.min(72, hours)) : DEFAULT_WINDOW_HOURS;
  const windowMs = windowHours * 60 * 60 * 1000;
  const since = new Date(now.getTime() - windowMs).toISOString();
  return listActivitySamples(ownerId, since, now.toISOString(), 2000);
}
