import type { HelixWorldEvent } from "@shared/helix-world-event";
import type { SituationSemanticEvent } from "@shared/helix-situation-semantics";
import type { SituationEventSignal } from "@shared/helix-situation-standby";
import { buildMinecraftSemanticEvent } from "./minecraft-semantic-dictionary";

export function buildSituationSemanticEvents(args: {
  event?: HelixWorldEvent | null;
  signal: SituationEventSignal;
}): SituationSemanticEvent[] {
  const { event, signal } = args;
  if (event && signal.source === "minecraft_event") {
    return [buildMinecraftSemanticEvent({ event, signal })];
  }
  return [];
}
