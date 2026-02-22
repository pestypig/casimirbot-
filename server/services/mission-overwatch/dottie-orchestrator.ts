import { buildMicroDebrief, type MissionMicroDebrief } from "./micro-debrief";
import {
  normalizeMissionEvent,
  type MissionNormalizedEvent,
  type MissionRawEvent,
} from "./event-normalizer";
import { createSalienceState, evaluateSalience, type SalienceDecision } from "./salience";

export type DottieOutcome = {
  normalizedEvent: MissionNormalizedEvent;
  salience: SalienceDecision;
  microDebrief?: MissionMicroDebrief;
};

export class DottieOrchestrator {
  private salienceState = createSalienceState();

  process(raw: MissionRawEvent): DottieOutcome {
    const normalized = normalizeMissionEvent(raw);
    const salience = evaluateSalience(
      {
        missionId: normalized.missionId,
        eventType: normalized.eventType,
        classification: normalized.classification,
        dedupeKey: raw.eventId,
        tsMs: Date.parse(normalized.ts),
      },
      this.salienceState,
    );

    const shouldDebrief = normalized.classification === "critical" || normalized.classification === "action";
    const microDebrief = shouldDebrief
      ? buildMicroDebrief({
          missionId: normalized.missionId,
          trigger: normalized,
          advice: salience.speak ? "Operator action required." : "Suppressed due to cooldown/rate policy.",
        })
      : undefined;

    return {
      normalizedEvent: normalized,
      salience,
      microDebrief,
    };
  }
}
