import crypto from "node:crypto";
import {
  buildStagePlayBadgeGraphV1,
  type StagePlayBadgeEdgeRelationV1,
  type StagePlayBadgeGraphV1,
  type StagePlayBadgeSourceRefV1,
  type StagePlayBadgeStatusV1,
  type StagePlayBadgeV1,
  type StagePlayIntentVerbV1,
  type StagePlayLiveBindingKindV1,
} from "@shared/contracts/stage-play-badge-graph.v1";
import {
  buildStagePlayCompactObservationV1,
  type StagePlayCompactObservationV1,
  type StagePlaySceneFactKindV1,
  type StagePlaySceneFactV1,
} from "@shared/contracts/stage-play-compact-observation.v1";

export type BuildNarrativeStagePlayGraphInput = {
  observation: StagePlayCompactObservationV1;
  graphId?: string;
  title?: string;
  description?: string;
  generatedAt?: string;
};

export type BuildNarrativeCompactObservationFromTextInput = {
  observationId?: string;
  sourceIds: string[];
  fromTs: string;
  toTs: string;
  windowId?: string | null;
  text: string;
  evidenceRefs: string[];
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const lower = (value: string | null | undefined): string => String(value ?? "").toLowerCase();

const slug = (value: string): string =>
  lower(value)
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64) || "unknown";

const sourceRefIds = (refs: StagePlayBadgeSourceRefV1[]): string[] => refs.map((ref) => ref.id);

const factText = (fact: StagePlaySceneFactV1): string =>
  lower([fact.factId, fact.factKind, fact.label, fact.summary].join(" "));

const makeBinding = (
  bindingKind: StagePlayLiveBindingKindV1,
  sourceRefIdsValue: string[],
  compactValue?: string | number | boolean | null,
): StagePlayBadgeV1["liveBindings"][number] => ({
  bindingKind,
  sourceRefIds: sourceRefIdsValue,
  freshness: "fresh",
  confidence: 0.78,
  compactValue: compactValue ?? null,
});

const pushBadge = (badges: StagePlayBadgeV1[], next: StagePlayBadgeV1): string => {
  if (!badges.some((entry) => entry.id === next.id)) badges.push(next);
  return next.id;
};

const pushEdge = (
  edges: StagePlayBadgeGraphV1["edges"],
  input: {
    from: string;
    to: string;
    relation: StagePlayBadgeEdgeRelationV1;
    label: string;
    evidenceRefs: string[];
    reasonCodes?: string[];
  },
): void => {
  const id = `edge:${input.from}:${input.relation}:${input.to}`;
  if (!edges.some((edge) => edge.id === id)) {
    edges.push({
      id,
      from: input.from,
      to: input.to,
      relation: input.relation,
      label: input.label,
      evidenceRefs: input.evidenceRefs,
      reasonCodes: input.reasonCodes ?? [],
    });
  }
};

const badge = (input: {
  id: string;
  title: string;
  plainMeaning: string;
  whyItMatters: string;
  kind: StagePlayBadgeV1["kind"];
  status?: StagePlayBadgeStatusV1;
  subjects?: string[];
  tags?: string[];
  sourceRefs: StagePlayBadgeSourceRefV1[];
  evidenceRefs: string[];
  confidence?: number;
  reasonCodes?: string[];
  liveBindings?: StagePlayBadgeV1["liveBindings"];
  intentVerb?: StagePlayIntentVerbV1;
  actorId?: string | null;
  targetId?: string | null;
  preserves?: string[];
  requires?: string[];
  blocks?: string[];
  admission?: StagePlayBadgeV1["admission"];
  missingEvidence?: string[];
}): StagePlayBadgeV1 => ({
  id: input.id,
  title: input.title,
  plainMeaning: input.plainMeaning,
  whyItMatters: input.whyItMatters,
  kind: input.kind,
  status: input.status ?? "observed",
  subjects: input.subjects ?? [],
  tags: input.tags ?? [],
  liveBindings: input.liveBindings ?? [],
  sourceRefs: input.sourceRefs,
  evidenceRefs: input.evidenceRefs,
  confidence: input.confidence ?? 0.72,
  missingEvidence: input.missingEvidence ?? [],
  reasonCodes: input.reasonCodes ?? [],
  intentModule: input.intentVerb
    ? {
        verb: input.intentVerb,
        actorId: input.actorId ?? null,
        targetId: input.targetId ?? null,
        preserves: input.preserves ?? [],
        requires: input.requires ?? [],
        blocks: input.blocks ?? [],
      }
    : undefined,
  admission: input.admission ?? null,
});

const narrativeFactSpecs: Array<{
  factKind: StagePlaySceneFactKindV1;
  id: string;
  label: string;
  summary: string;
  pattern: RegExp;
  confidence: number;
}> = [
  { factKind: "setting", id: "setting.bridge", label: "Bridge", summary: "Command bridge or control-room setting is indicated.", pattern: /\bbridge\b|command deck|control room/i, confidence: 0.76 },
  { factKind: "setting", id: "setting.council_chamber", label: "Council chamber", summary: "Council, senate, or formal chamber setting is indicated.", pattern: /\bcouncil\b|senate|assembly|chamber/i, confidence: 0.74 },
  { factKind: "setting", id: "setting.battlefield", label: "Battlefield", summary: "Fleet battle or battlefield setting is indicated.", pattern: /\bbattlefield\b|front line|fleet battle|engagement/i, confidence: 0.76 },
  { factKind: "setting", id: "setting.private_meeting", label: "Private meeting", summary: "Private or closed-door meeting setting is indicated.", pattern: /private meeting|closed door|closed-door|in confidence/i, confidence: 0.74 },
  { factKind: "actor", id: "actor.speaker", label: "Speaker", summary: "A speaker or narrator role is active in the scene.", pattern: /\bspeaker\b|narrator|says|said|argues|asks/i, confidence: 0.68 },
  { factKind: "actor", id: "actor.commander", label: "Commander", summary: "Commander, admiral, captain, or military decision-maker role is indicated.", pattern: /\bcommander\b|admiral|captain|general|fleet commander/i, confidence: 0.78 },
  { factKind: "actor", id: "actor.advisor", label: "Advisor", summary: "Advisor, aide, staff officer, or counsel role is indicated.", pattern: /\badvisor\b|aide|staff officer|counsel|strategist/i, confidence: 0.74 },
  { factKind: "actor", id: "actor.faction", label: "Faction", summary: "Faction or political body is active as a narrative actor.", pattern: /\bfaction\b|alliance|empire|party|regime|nobility/i, confidence: 0.72 },
  { factKind: "resource", id: "resource.fleet", label: "Fleet", summary: "Fleet, ships, or military forces are active resources.", pattern: /\bfleet\b|ships|squadron|forces|vessels/i, confidence: 0.78 },
  { factKind: "resource", id: "resource.orders", label: "Orders", summary: "Orders or chain directives are active constraints/resources.", pattern: /\border\b|orders|directive|command/i, confidence: 0.72 },
  { factKind: "resource", id: "resource.leverage", label: "Leverage", summary: "Political, informational, or tactical leverage is indicated.", pattern: /\bleverage\b|bargaining|hostage|advantage|pressure/i, confidence: 0.72 },
  { factKind: "resource", id: "resource.intel", label: "Intel", summary: "Information, intelligence, or evidence is an active resource.", pattern: /\bintel\b|intelligence|information|evidence|report/i, confidence: 0.74 },
  { factKind: "resource", id: "resource.time", label: "Time", summary: "Time pressure or timing is active in the scene.", pattern: /\btime\b|deadline|before dawn|delay|stall|wait/i, confidence: 0.7 },
  { factKind: "hazard", id: "hazard.betrayal", label: "Betrayal", summary: "Betrayal, treachery, or hidden disloyalty is indicated.", pattern: /\bbetray\b|betrayal|traitor|treachery|double-cross/i, confidence: 0.78 },
  { factKind: "hazard", id: "hazard.tactical_disadvantage", label: "Tactical disadvantage", summary: "A weaker tactical position or inferior deployment is indicated.", pattern: /tactical disadvantage|outnumbered|surrounded|ambush|disadvantage/i, confidence: 0.76 },
  { factKind: "hazard", id: "hazard.scandal", label: "Scandal", summary: "Public scandal, reputation risk, or political exposure is indicated.", pattern: /\bscandal\b|reputation|public exposure|disgrace/i, confidence: 0.72 },
  { factKind: "hazard", id: "hazard.chain_of_command_conflict", label: "Chain-of-command conflict", summary: "Command hierarchy or lawful order conflict is indicated.", pattern: /chain of command|chain-of-command|insubordination|orders conflict|lawful order/i, confidence: 0.76 },
  { factKind: "affordance", id: "affordance.negotiate", label: "Negotiate", summary: "Negotiation remains a possible move class.", pattern: /\bnegotiate\b|parley|bargain|talks|terms/i, confidence: 0.7 },
  { factKind: "affordance", id: "affordance.attack", label: "Attack", summary: "Attack or strike remains a possible move class.", pattern: /\battack\b|strike|fire|assault|engage/i, confidence: 0.7 },
  { factKind: "affordance", id: "affordance.retreat", label: "Retreat", summary: "Retreat or withdrawal remains a possible move class.", pattern: /\bretreat\b|withdraw|fall back|evacuate/i, confidence: 0.7 },
  { factKind: "affordance", id: "affordance.delay", label: "Delay", summary: "Delay, stalling, or waiting remains a possible move class.", pattern: /\bdelay\b|stall|wait|buy time|hold position/i, confidence: 0.74 },
  { factKind: "affordance", id: "affordance.reveal", label: "Reveal", summary: "Revealing information remains a possible move class.", pattern: /\breveal\b|disclose|expose|announce|confess/i, confidence: 0.7 },
  { factKind: "affordance", id: "affordance.deceive", label: "Deceive", summary: "Deception or misdirection remains a possible move class.", pattern: /\bdeceive\b|mislead|bluff|feint|lie/i, confidence: 0.68 },
  { factKind: "affordance", id: "affordance.confirm", label: "Confirm", summary: "Confirmation or verification remains a possible move class.", pattern: /\bconfirm\b|verify|check|ask for proof|seek proof/i, confidence: 0.72 },
  { factKind: "blocked_affordance", id: "blocked.cannot_attack_yet", label: "Cannot attack yet", summary: "Attack is blocked or premature under current constraints.", pattern: /cannot attack|can't attack|do not attack|hold fire|not yet attack|attack.*premature/i, confidence: 0.8 },
  { factKind: "blocked_affordance", id: "blocked.cannot_reveal_secret", label: "Cannot reveal secret", summary: "Revealing a secret is blocked or costly under current constraints.", pattern: /cannot reveal|can't reveal|must not reveal|keep.*secret|classified|conceal/i, confidence: 0.78 },
  { factKind: "blocked_affordance", id: "blocked.cannot_retreat_without_cost", label: "Cannot retreat without cost", summary: "Retreat is constrained by strategic, political, or material cost.", pattern: /cannot retreat|can't retreat|retreat.*cost|withdraw.*cost|no retreat/i, confidence: 0.78 },
  { factKind: "objective", id: "objective.preserve_fleet", label: "Preserve fleet", summary: "Preserving fleet strength or lives is an active objective.", pattern: /preserve.*fleet|save.*fleet|protect.*fleet|minimize casualties|preserve forces/i, confidence: 0.76 },
  { factKind: "objective", id: "objective.gain_legitimacy", label: "Gain legitimacy", summary: "Legitimacy, mandate, or public authority is an active objective.", pattern: /\blegitimacy\b|mandate|public support|authority|claim to rule/i, confidence: 0.72 },
  { factKind: "objective", id: "objective.expose_deception", label: "Expose deception", summary: "Exposing deception or betrayal is an active objective.", pattern: /expose.*deception|expose.*betray|prove.*lie|reveal.*truth/i, confidence: 0.76 },
  { factKind: "objective", id: "objective.delay_conflict", label: "Delay conflict", summary: "Delaying conflict or preventing immediate escalation is an active objective.", pattern: /delay.*conflict|avoid.*battle|postpone|deescalate|de-escalate/i, confidence: 0.74 },
  { factKind: "dialogue_act", id: "dialogue_act.accusation", label: "Accusation", summary: "Accusatory dialogue act is indicated.", pattern: /\baccuse\b|accusation|blame|charges/i, confidence: 0.68 },
  { factKind: "dialogue_act", id: "dialogue_act.order", label: "Order", summary: "Command or order dialogue act is indicated.", pattern: /\border\b|orders|commands|instructs/i, confidence: 0.68 },
  { factKind: "dialogue_act", id: "dialogue_act.question", label: "Question", summary: "Questioning or challenge dialogue act is indicated.", pattern: /\bquestion\b|asks|demand.*answer|why\b|what\b/i, confidence: 0.64 },
];

const factIdToBadgeId = (fact: StagePlaySceneFactV1): string => {
  if (/^(setting|actor|resource|hazard|affordance|blocked|objective|dialogue_act)\./.test(fact.factId)) {
    if (fact.factKind === "objective") return fact.factId.replace(/^objective\./, "goal.");
    return fact.factId.replace(/^blocked\./, "blocked.");
  }
  const labelSlug = slug(fact.label);
  switch (fact.factKind) {
    case "setting":
      return `setting.${labelSlug}`;
    case "actor":
      return `actor.${labelSlug}`;
    case "resource":
      return `resource.${labelSlug}`;
    case "hazard":
      return `hazard.${labelSlug}`;
    case "affordance":
      return `affordance.${labelSlug}`;
    case "blocked_affordance":
      return `blocked.${labelSlug}`;
    case "objective":
      return `goal.${labelSlug}`;
    case "conflict":
      return `constraint.${labelSlug}`;
    default:
      return `world_state.${labelSlug}`;
  }
};

const factKindToBadgeKind = (factKind: StagePlaySceneFactKindV1): StagePlayBadgeV1["kind"] => {
  switch (factKind) {
    case "setting":
      return "setting";
    case "actor":
      return "actor";
    case "resource":
      return "resource";
    case "hazard":
      return "hazard";
    case "affordance":
      return "affordance";
    case "blocked_affordance":
      return "blocked_affordance";
    case "objective":
      return "goal";
    case "conflict":
      return "constraint";
    default:
      return "world_state";
  }
};

const factStatus = (factKind: StagePlaySceneFactKindV1): StagePlayBadgeStatusV1 => {
  if (factKind === "affordance") return "available";
  if (factKind === "blocked_affordance" || factKind === "hazard") return "blocked";
  if (factKind === "objective") return "candidate";
  return "observed";
};

const intentVerbForFact = (fact: StagePlaySceneFactV1): StagePlayIntentVerbV1 | null => {
  const text = factText(fact);
  if (fact.factKind === "blocked_affordance") return "avoid";
  if (/\battack|strike|assault|engage\b/.test(text)) return "attack";
  if (/\bretreat|withdraw|fall back\b/.test(text)) return "retreat";
  if (/\bdelay|stall|wait|buy time|hold position\b/.test(text)) return "delay";
  if (/\bnegotiate|parley|bargain|terms\b/.test(text)) return "negotiate";
  if (/\breveal|disclose|expose|announce|confess\b/.test(text)) return "reveal_information";
  if (/\bconfirm|verify|check|proof\b/.test(text)) return "seek_confirmation";
  if (/\bdeceive|mislead|bluff|feint\b/.test(text)) return "deceive";
  if (/\bescalate|attack|assault\b/.test(text)) return "escalate";
  if (/\bdeescalate|de-escalate|avoid battle|postpone\b/.test(text)) return "deescalate";
  return null;
};

const addIntent = (
  badges: StagePlayBadgeV1[],
  sourceRefs: StagePlayBadgeSourceRefV1[],
  evidenceRefs: string[],
  input: {
    id: string;
    title: string;
    verb: StagePlayIntentVerbV1;
    preserves?: string[];
    requires?: string[];
    blocks?: string[];
    reasonCodes?: string[];
  },
): string => pushBadge(badges, badge({
  id: input.id,
  title: input.title,
  plainMeaning: "Composable narrative verb available for Stage Play reasoning.",
  whyItMatters: "Intent modules are procedural language primitives that combine into scoreable situation predictions.",
  kind: "intent_module",
  status: "candidate",
  tags: ["intent_module", input.verb, "narrative_stage_play"],
  sourceRefs,
  evidenceRefs,
  confidence: 0.72,
  reasonCodes: input.reasonCodes ?? ["deterministic_narrative_intent_module"],
  intentVerb: input.verb,
  preserves: input.preserves,
  requires: input.requires,
  blocks: input.blocks,
  admission: "auto",
}));

const addBinding = (
  badges: StagePlayBadgeV1[],
  edges: StagePlayBadgeGraphV1["edges"],
  sourceRefs: StagePlayBadgeSourceRefV1[],
  evidenceRefs: string[],
  input: {
    id: string;
    title: string;
    components: string[];
    verb: StagePlayIntentVerbV1;
    reasonCode: string;
    possibleResult: string;
    preserves?: string[];
    requires?: string[];
    blocks?: string[];
  },
): string => {
  const bindingId = pushBadge(badges, badge({
    id: input.id,
    title: input.title,
    plainMeaning: `${input.components.join(" + ")} = ${input.title}.`,
    whyItMatters: input.possibleResult,
    kind: "procedural_binding",
    status: "candidate",
    tags: ["procedural_binding", "narrative_stage_play"],
    sourceRefs,
    evidenceRefs,
    confidence: 0.76,
    reasonCodes: [input.reasonCode],
    intentVerb: input.verb,
    preserves: input.preserves,
    requires: input.requires,
    blocks: input.blocks,
    admission: "auto",
  }));
  for (const component of input.components) {
    if (badges.some((entry) => entry.id === component)) {
      pushEdge(edges, {
        from: component,
        to: bindingId,
        relation: "composes_with",
        label: "component composes narrative procedural binding",
        evidenceRefs,
        reasonCodes: ["narrative_procedural_composition"],
      });
    }
  }
  return bindingId;
};

export function buildNarrativeCompactObservationFromText(
  input: BuildNarrativeCompactObservationFromTextInput,
): StagePlayCompactObservationV1 {
  const matchedFacts = narrativeFactSpecs
    .filter((spec) => spec.pattern.test(input.text))
    .map((spec): StagePlaySceneFactV1 => ({
      factId: spec.id,
      factKind: spec.factKind,
      label: spec.label,
      summary: spec.summary,
      confidence: spec.confidence,
      evidenceRefs: input.evidenceRefs,
    }));
  return buildStagePlayCompactObservationV1({
    observationId: input.observationId ?? `stage_play_compact_observation:${hashShort([
      input.sourceIds,
      input.fromTs,
      input.toTs,
      input.evidenceRefs,
      matchedFacts.map((fact) => fact.factId),
    ])}`,
    domain: "narrative_media",
    sourceWindow: {
      sourceIds: input.sourceIds,
      fromTs: input.fromTs,
      toTs: input.toTs,
      windowId: input.windowId ?? null,
    },
    sceneFacts: matchedFacts,
  });
}

export function buildNarrativeStagePlayGraph(
  input: BuildNarrativeStagePlayGraphInput,
): StagePlayBadgeGraphV1 {
  const observation = input.observation;
  const generatedAt = input.generatedAt ?? observation.sourceWindow.toTs;
  const sourceRefs: StagePlayBadgeSourceRefV1[] = [
    { kind: "stage_play_compact_observation", id: observation.observationId },
  ];
  const evidenceRefs = unique([
    observation.observationId,
    ...observation.sceneFacts.flatMap((fact) => fact.evidenceRefs),
  ]);
  const sourceIds = sourceRefIds(sourceRefs);
  const sourceWindow = {
    threadId: null,
    roomId: null,
    worldId: null,
    environmentId: null,
    fromTs: observation.sourceWindow.fromTs,
    toTs: observation.sourceWindow.toTs,
    latestObservationRefs: [observation.observationId],
    latestSourceDescriptorRefs: [],
    latestSourceProducerRefs: [],
    latestRawSessionBufferRefs: [],
    sources: observation.sourceWindow.sourceIds.map((sourceId) => ({
      sourceId,
      modality: observation.domain === "narrative_media" ? "audio_transcript" : observation.domain,
      status: "active" as const,
      contribution: `${observation.domain} source contributes compact Stage Play scene evidence.`,
      fidelityScore: observation.sceneFacts.length > 0 ? 0.74 : 0.42,
      selectedForStagePlay: true,
      routeTo: observation.domain === "narrative_media" ? "narrative_stage_play" as const : "debug_only" as const,
      cadenceMs: null,
      lastEventTs: observation.sourceWindow.toTs,
      missingReason: null,
      nextRequiredAction: null,
      evidenceRefs,
    })),
    latestSnapshotRefs: [],
    latestDeltaOverlayRefs: [],
    latestNavigationRefs: [],
    freshness: observation.sceneFacts.length > 0 ? "fresh" as const : "missing" as const,
  };
  const badges: StagePlayBadgeV1[] = [];
  const edges: StagePlayBadgeGraphV1["edges"] = [];
  const recommendedActions: StagePlayBadgeGraphV1["recommendedActions"] = [];

  const observerId = pushBadge(badges, badge({
    id: "observer.live_sources",
    title: "Observer",
    plainMeaning: "Source custody and routing for the narrative Stage Play window.",
    whyItMatters: "Observer shows which compact sources feed the narrative stage before any scene facts become badges.",
    kind: "observer",
    status: sourceWindow.sources.length > 0 ? "observed" : "missing_evidence",
    subjects: observation.sourceWindow.sourceIds,
    tags: ["observer", "source_custody", "narrative_stage_play"],
    sourceRefs,
    evidenceRefs,
    confidence: sourceWindow.sources.length > 0 ? 0.74 : 0.35,
    liveBindings: [
      makeBinding("source_status", sourceIds, sourceWindow.freshness),
      makeBinding("source_modality", sourceIds, observation.domain),
    ],
    reasonCodes: ["observer_source_custody", "narrative_source_routing"],
    admission: "auto",
  }));

  const sourceBadgeIds = sourceWindow.sources.map((source) => pushBadge(badges, badge({
    id: `source.${slug(source.sourceId)}`,
    title: source.modality.replace(/_/g, " "),
    plainMeaning: "A compact source handle is available for narrative Stage Play interpretation.",
    whyItMatters: "Source badges identify which admitted feed is wired into the interpreter boundary.",
    kind: "source",
    status: "observed",
    subjects: [source.sourceId],
    tags: ["source", source.modality, source.routeTo],
    sourceRefs,
    evidenceRefs,
    confidence: source.fidelityScore,
    liveBindings: [
      makeBinding("source_modality", sourceIds, source.modality),
      makeBinding("source_status", sourceIds, source.status),
    ],
    reasonCodes: ["narrative_source_handle"],
    admission: "auto",
  })));

  const interpreterId = pushBadge(badges, badge({
    id: "interpreter.narrative_stage_play",
    title: "Narrative Stage Play interpreter",
    plainMeaning: "A compact interpretation reducer maps scene facts into badges and procedural bindings.",
    whyItMatters: "The interpreter can supply evidence for reasoning, but it cannot answer, approve, or act.",
    kind: "interpreter",
    status: observation.sceneFacts.length > 0 ? "candidate" : "missing_evidence",
    subjects: observation.sourceWindow.sourceIds,
    tags: ["interpreter", "narrative_stage_play", "evidence_only"],
    sourceRefs,
    evidenceRefs,
    confidence: observation.sceneFacts.length > 0 ? 0.76 : 0.4,
    liveBindings: [
      makeBinding("source_status", sourceIds, sourceWindow.freshness),
      makeBinding("source_modality", sourceIds, observation.domain),
    ],
    reasonCodes: ["narrative_stage_play_interpreter", "compact_scene_window"],
    admission: "auto",
  }));

  for (const sourceBadgeId of sourceBadgeIds) {
    pushEdge(edges, {
      from: observerId,
      to: sourceBadgeId,
      relation: "observes",
      label: "observer tracks source custody and routing",
      evidenceRefs,
      reasonCodes: ["observer_source_routing"],
    });
    pushEdge(edges, {
      from: sourceBadgeId,
      to: interpreterId,
      relation: "feeds",
      label: "source handle feeds narrative Stage Play interpreter",
      evidenceRefs,
      reasonCodes: ["source_interpreter_binding"],
    });
  }
  pushEdge(edges, {
    from: observerId,
    to: interpreterId,
    relation: "feeds",
    label: "observer routes compact source handles to the interpreter boundary",
    evidenceRefs,
    reasonCodes: ["observer_interpreter_routing"],
  });

  const factBadgeIds = new Map<string, string>();
  for (const fact of observation.sceneFacts) {
    const factEvidenceRefs = unique([observation.observationId, ...fact.evidenceRefs]);
    const id = factIdToBadgeId(fact);
    factBadgeIds.set(fact.factId, pushBadge(badges, badge({
      id,
      title: fact.label,
      plainMeaning: fact.summary,
      whyItMatters: "Narrative scene facts define the bounded action space without deciding the answer.",
      kind: factKindToBadgeKind(fact.factKind),
      status: factStatus(fact.factKind),
      subjects: [fact.factId, fact.label],
      tags: ["narrative_stage_play", fact.factKind, slug(fact.label)],
      sourceRefs,
      evidenceRefs: factEvidenceRefs,
      confidence: fact.confidence,
      reasonCodes: [`narrative_fact_${fact.factKind}`],
      intentVerb: intentVerbForFact(fact) ?? undefined,
      admission: fact.factKind === "blocked_affordance" ? "blocked" : fact.factKind === "affordance" ? "auto" : null,
    })));
    pushEdge(edges, {
      from: interpreterId,
      to: id,
      relation: "interprets",
      label: "interpreter reduces compact scene fact into badge",
      evidenceRefs: factEvidenceRefs,
      reasonCodes: ["narrative_fact_binding"],
    });
  }

  const has = (pattern: RegExp): boolean => observation.sceneFacts.some((fact) => pattern.test(factText(fact)));
  const badgeExists = (id: string): boolean => badges.some((entry) => entry.id === id);
  const findBadgeId = (pattern: RegExp): string | null => badges.find((entry) => pattern.test(entry.id) || pattern.test(lower(entry.title)))?.id ?? null;

  const intentIds: Record<string, string> = {};
  if (has(/fleet|casualt|forces|ships/)) {
    intentIds.preserveFleet = addIntent(badges, sourceRefs, evidenceRefs, {
      id: "intent.preserve_fleet",
      title: "preserve fleet",
      verb: "avoid",
      preserves: ["fleet strength", "crew lives"],
    });
  }
  if (has(/legitimacy|mandate|public support|authority/)) {
    intentIds.gainLegitimacy = addIntent(badges, sourceRefs, evidenceRefs, {
      id: "intent.gain_legitimacy",
      title: "gain legitimacy",
      verb: "negotiate",
      preserves: ["public authority"],
    });
  }
  if (has(/betray|deception|traitor|lie|truth|expose/)) {
    intentIds.exposeDeception = addIntent(badges, sourceRefs, evidenceRefs, {
      id: "intent.expose_deception",
      title: "expose deception",
      verb: "reveal_information",
      requires: ["credible information"],
    });
  }
  if (has(/delay|stall|wait|buy time|postpone|deescalate|de-escalate/)) {
    intentIds.delayConflict = addIntent(badges, sourceRefs, evidenceRefs, {
      id: "intent.delay_conflict",
      title: "delay conflict",
      verb: "delay",
      preserves: ["time", "optional action space"],
    });
  }
  if (has(/opponent|enemy|rival|faction|commander|advisor|speaker/)) {
    intentIds.observeOpponent = addIntent(badges, sourceRefs, evidenceRefs, {
      id: "intent.observe_opponent",
      title: "observe opponent",
      verb: "observe",
      requires: ["fresh scene evidence"],
    });
  }

  const delayId = badgeExists("affordance.delay") ? "affordance.delay" : intentIds.delayConflict;
  const leverageId = badgeExists("resource.leverage") ? "resource.leverage" : badgeExists("resource.time") ? "resource.time" : null;
  if (delayId && leverageId && intentIds.observeOpponent) {
    addBinding(badges, edges, sourceRefs, evidenceRefs, {
      id: "binding.controlled_stalling",
      title: "controlled stalling",
      components: [delayId, leverageId, intentIds.observeOpponent],
      verb: "delay",
      reasonCode: "delay+preserve_leverage+observe_opponent",
      possibleResult: "Possible result: the actor buys time while preserving leverage and reading the opponent.",
      preserves: ["leverage", "time"],
      requires: ["opponent still observable"],
    });
  }

  const revealId = findBadgeId(/affordance\.reveal|intent\.expose_deception/);
  const intelId = findBadgeId(/resource\.intel|resource\.leverage/);
  if (revealId && intelId && has(/betray|deception|scandal|chain_of_command|chain-of-command/)) {
    addBinding(badges, edges, sourceRefs, evidenceRefs, {
      id: "binding.evidence_backed_reveal",
      title: "evidence backed reveal",
      components: [revealId, intelId],
      verb: "reveal_information",
      reasonCode: "reveal_information+intel+hazard_context",
      possibleResult: "Possible result: information disclosure becomes useful only if evidence and timing are sufficient.",
      requires: ["credible information", "safe disclosure timing"],
    });
  }

  const negotiateId = findBadgeId(/affordance\.negotiate|intent\.gain_legitimacy/);
  if (negotiateId && leverageId) {
    addBinding(badges, edges, sourceRefs, evidenceRefs, {
      id: "binding.leveraged_negotiation",
      title: "leveraged negotiation",
      components: [negotiateId, leverageId],
      verb: "negotiate",
      reasonCode: "negotiate+leverage",
      possibleResult: "Possible result: the actor can trade time or information for a constrained concession.",
      preserves: ["legitimacy", "optional action space"],
    });
  }

  for (const hazard of badges.filter((entry) => entry.kind === "hazard")) {
    for (const blocked of badges.filter((entry) => entry.kind === "blocked_affordance")) {
      pushEdge(edges, {
        from: hazard.id,
        to: blocked.id,
        relation: "blocks",
        label: "hazard constrains blocked move",
        evidenceRefs: unique([...hazard.evidenceRefs, ...blocked.evidenceRefs]),
        reasonCodes: ["narrative_hazard_blocks_move"],
      });
    }
  }
  for (const resource of badges.filter((entry) => entry.kind === "resource")) {
    for (const affordance of badges.filter((entry) => entry.kind === "affordance")) {
      pushEdge(edges, {
        from: resource.id,
        to: affordance.id,
        relation: "enables",
        label: "resource supports possible move class",
        evidenceRefs: unique([...resource.evidenceRefs, ...affordance.evidenceRefs]),
        reasonCodes: ["narrative_resource_affordance_binding"],
      });
    }
  }
  for (const actor of badges.filter((entry) => entry.kind === "actor")) {
    for (const setting of badges.filter((entry) => entry.kind === "setting")) {
      pushEdge(edges, {
        from: actor.id,
        to: setting.id,
        relation: "located_near",
        label: "actor participates in scene setting",
        evidenceRefs: unique([...actor.evidenceRefs, ...setting.evidenceRefs]),
        reasonCodes: ["narrative_actor_setting_binding"],
      });
    }
  }

  if (badges.some((entry) => entry.kind === "blocked_affordance")) {
    recommendedActions.push({
      id: "stage-action:explain-blocked-narrative-move",
      label: "Explain blocked narrative move",
      actionType: "explain_candidate",
      admission: "auto",
      agentExecutable: false,
      reasonCodes: ["narrative_blocked_move", "diagnostic_only"],
      evidenceRefs,
      missingEvidence: [],
    });
  }
  if (badges.some((entry) => entry.kind === "procedural_binding")) {
    recommendedActions.push({
      id: "stage-action:score-next-scene-beat",
      label: "Score next scene beat hypothesis",
      actionType: "safe_diagnostic_overlay",
      admission: "auto",
      agentExecutable: false,
      reasonCodes: ["narrative_prediction_candidate", "evidence_only"],
      evidenceRefs,
      missingEvidence: [],
    });
  }
  if (observation.sceneFacts.length === 0) {
    recommendedActions.push({
      id: "stage-action:observe-more-narrative-context",
      label: "Observe more narrative context",
      actionType: "observe_more",
      admission: "auto",
      agentExecutable: false,
      reasonCodes: ["missing_scene_facts", "diagnostic_only"],
      evidenceRefs,
      missingEvidence: ["No compact scene facts were available for this window."],
    });
  }

  return buildStagePlayBadgeGraphV1({
    generatedAt,
    graphId: input.graphId ?? `stage_play_badge_graph:narrative:${hashShort([
      observation.observationId,
      observation.sceneFacts.map((fact) => fact.factId),
    ])}`,
    title: input.title ?? "Narrative Stage Play Badge Graph",
    description: input.description ?? "Deterministic badge graph reducer over compact narrative scene observations.",
    sourceWindow,
    badges,
    edges,
    recommendedActions,
  });
}
