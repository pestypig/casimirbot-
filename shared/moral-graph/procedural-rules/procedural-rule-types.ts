import type {
  ProceduralMoralMoveV1,
  ProceduralMoralObservedPatternV1,
} from "../../procedural-moral-classification";

export type ProceduralMoralPatternRule = {
  id: string;
  cues: RegExp[];
  /** Optional conjunctive relevance check; a match invites inquiry, not a finding of fault. */
  matches?: (text: string) => boolean;
  observedPattern: ProceduralMoralObservedPatternV1;
  moralRootId: string;
  proceduralMove: ProceduralMoralMoveV1;
  explanation: string;
  missingEvidence: string[];
  warnings?: string[];
  reasonCodes: string[];
};
