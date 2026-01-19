export type IdeologyArtifactFormat = "png" | "svg" | "json" | "md";
export type IdeologyArtifactKind = "pill" | "node-card";

export type IdeologyArtifact = {
  id: string;
  title: string;
  summary?: string;
  body?: string;
  tags?: string[];
  panelId: string;
  nodeId?: string;
  exportKind: IdeologyArtifactKind;
  exportTargetId?: string;
  formats?: IdeologyArtifactFormat[];
};

export type IdeologyArtifactSearchParams = {
  query?: string;
  panelId?: string;
  nodeId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
};

export type IdeologyArtifactSearchResponse = {
  query?: string;
  items: IdeologyArtifact[];
  total: number;
  filters: {
    panelId?: string;
    nodeId?: string;
    tags?: string[];
  };
};

export const IDEOLOGY_ARTIFACTS: IdeologyArtifact[] = [
  {
    id: "citizens-arc/societal-view",
    title: "Societal view",
    summary:
      "Mission Ethos reframes society as a living watershed with leadership focused on stewardship.",
    body:
      "If Mission Ethos is taken seriously, the big picture stops looking like a jungle gym. It becomes a living watershed where leadership is the job of keeping water clean, channels unblocked, and droughts honest. Think: soft ground, hard tests, clear mirrors.",
    tags: ["citizens-arc", "society", "leadership", "watershed"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "societal-view",
    formats: ["png"]
  },
  {
    id: "citizens-arc/core-shape",
    title: "The core shape",
    summary: "Three interlocking layers: floor, ladder, roof.",
    body:
      "A durable society with this ethos crystallizes into three interlocking layers.",
    tags: ["citizens-arc", "structure", "layers"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "core-shape",
    formats: ["png"]
  },
  {
    id: "citizens-arc/core-floor",
    title: "The Floor",
    summary: "Interbeing and Scarcity Justice create a dignity baseline.",
    body:
      "Interbeing and Scarcity Justice create a dignity baseline that keeps desperation from becoming policy.",
    tags: ["citizens-arc", "floor", "scarcity-justice", "interbeing"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "core-floor",
    formats: ["png"]
  },
  {
    id: "citizens-arc/core-ladder",
    title: "The Ladder",
    summary: "Capability Gradient and Promise Trials reveal competence.",
    body:
      "Capability Gradient and Promise Trials reveal competence and integrity without manufacturing cruelty.",
    tags: ["citizens-arc", "ladder", "capability", "promise-trials"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "core-ladder",
    formats: ["png"]
  },
  {
    id: "citizens-arc/core-roof",
    title: "The Roof",
    summary: "Koan Governance and Integrity Protocols keep tradeoffs visible.",
    body:
      "Koan Governance and Integrity Protocols keep tradeoffs visible and belief revision normal.",
    tags: ["citizens-arc", "roof", "koan-governance", "integrity"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "core-roof",
    formats: ["png"]
  },
  {
    id: "citizens-arc/floor",
    title: "The Floor - Interbeing + Scarcity Justice",
    summary:
      "A non-negotiable dignity baseline that prevents desperation from becoming policy.",
    tags: ["citizens-arc", "floor", "scarcity-justice", "interbeing"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "floor",
    formats: ["png"]
  },
  {
    id: "citizens-arc/ladder",
    title: "The Ladder - Capability + Promise Trials",
    summary:
      "Legitimate separation of roles through voluntary, staged, fair trials.",
    tags: ["citizens-arc", "ladder", "promise-trials", "capability"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "ladder",
    formats: ["png"]
  },
  {
    id: "citizens-arc/roof",
    title: "The Roof - Koan Governance",
    summary:
      "Decision systems that keep tradeoffs visible and ideology revisable.",
    tags: ["citizens-arc", "roof", "koan-governance", "integrity"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "roof",
    formats: ["png"]
  },
  {
    id: "citizens-arc/sangha-architecture",
    title: "Sangha Architecture",
    summary: "Community structure that keeps competence local and legible.",
    tags: ["citizens-arc", "sangha", "community", "architecture"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "sangha-architecture",
    formats: ["png"]
  },
  {
    id: "citizens-arc/no-bypass",
    title: "No Bypass Guardrail",
    summary: "Integrity protocols that block shortcuts to power.",
    tags: ["citizens-arc", "integrity", "no-bypass"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "no-bypass",
    formats: ["png"]
  },
  {
    id: "citizens-arc/inner-spark",
    title: "Inner Spark + Trust Ledger",
    summary: "Align motivation with service and evidence-based trust.",
    tags: ["citizens-arc", "inner-spark", "trust-ledger"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "inner-spark",
    formats: ["png"]
  },
  {
    id: "citizens-arc/solitude-to-signal",
    title: "Solitude to Signal + Habit Breaks",
    summary: "Structured retreats that reset signal and prevent drift.",
    tags: ["citizens-arc", "solitude", "habits", "signal"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "solitude-to-signal",
    formats: ["png"]
  },
  {
    id: "citizens-arc/lifecycle",
    title: "Citizen's arc",
    summary: "Belonging, skill, trials, stewardship, elder calibration.",
    tags: ["citizens-arc", "lifecycle", "stewardship", "trials"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "citizen-arc",
    formats: ["png"]
  },
  {
    id: "citizens-arc/reconciliation",
    title: "Philosophical reconciliation",
    summary:
      "Protecting from coercive scarcity creates fair trials and capable leaders.",
    tags: ["citizens-arc", "reconciliation", "leadership"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "reconciliation",
    formats: ["png"]
  },
  {
    id: "citizens-arc/failure-modes",
    title: "Failure modes and counters",
    summary: "Known failure modes with countermeasures.",
    tags: ["citizens-arc", "risk", "governance"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "failure-modes",
    formats: ["png"]
  },
  {
    id: "citizens-arc/big-picture",
    title: "One-sentence big picture",
    summary:
      "A dignity-floor civilization with auditable trials and koan governance.",
    tags: ["citizens-arc", "summary", "governance"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "big-picture",
    formats: ["png"]
  },
  {
    id: "ideology/mission-ethos",
    title: "Mission Ethos",
    summary:
      "The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion.",
    tags: ["ethos", "stewardship", "compassion"],
    panelId: "mission-ethos",
    nodeId: "mission-ethos",
    exportKind: "node-card",
    formats: ["json", "md"]
  },
  {
    id: "ideology/interbeing-systems",
    title: "Interbeing Systems",
    summary:
      "Dependent systems make promises real; every public commitment is a dependency graph.",
    tags: ["systems", "interdependence", "coherence"],
    panelId: "mission-ethos",
    nodeId: "interbeing-systems",
    exportKind: "node-card",
    formats: ["json", "md"]
  },
  {
    id: "ideology/koan-governance",
    title: "Koan Governance",
    summary:
      "Governance keeps contradictions visible and requires revision when reality disagrees.",
    tags: ["governance", "tradeoffs", "revision"],
    panelId: "mission-ethos",
    nodeId: "koan-governance",
    exportKind: "node-card",
    formats: ["json", "md"]
  },
  {
    id: "ideology/integrity-protocols",
    title: "Integrity Protocols",
    summary: "Audits, accountability, and clear consequences for deception.",
    tags: ["integrity", "accountability", "protocols"],
    panelId: "mission-ethos",
    nodeId: "integrity-protocols",
    exportKind: "node-card",
    formats: ["json", "md"]
  }
];
