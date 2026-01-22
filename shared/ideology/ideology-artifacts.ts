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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/civic-signal-loop",
    title: "Civic signal loop",
    summary: "Survey signals translated into lawful, accountable action.",
    body:
      "Use the three tenets loop to map community signals to policy moves with data dignity and review triggers.",
    tags: ["citizens-arc", "survey", "policy", "three-tenets-loop"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "civic-signal-loop",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/lawful-interface-protocol",
    title: "Lawful interface protocol",
    summary: "Checklist for lawful, accountable civic interfaces with enforcement.",
    body:
      "Publish boundaries, require dual-key approval, provide safe reporting, enforce non-harm standards, and audit incentives.",
    tags: ["citizens-arc", "lawful", "oversight", "accountability"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "lawful-interface-protocol",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/public-safety-spine",
    title: "Public safety governance spine",
    summary: "Pack-ready bridges for lawful, harm-reducing enforcement.",
    body:
      "A compact governance spine that keeps enforcement lawful, transparent, and grounded in harm reduction.",
    tags: ["citizens-arc", "public-safety", "governance", "oversight"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "public-safety-spine",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/warp-ambition-spine",
    title: "Warp ambition spine",
    summary: "Civic floor to warp horizon, translated for public and technical audiences.",
    body:
      "Anchors warp ambition to a stable civic floor, reality-paced discovery, and constraint-honest verification.",
    tags: ["citizens-arc", "warp", "ambition", "research"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "warp-ambition-spine",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/federal-civic-listening-circuit",
    title: "Federal civic listening circuit",
    summary: "Scheduled local input loops that keep policy grounded.",
    body:
      "Fixed listening cycles with response ledgers so federal policy reflects local realities.",
    tags: ["citizens-arc", "listening", "civic-memory", "right-speech"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "federal-civic-listening-circuit",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/metric-integrity-guardrail",
    title: "Metric integrity guardrail",
    summary: "Replace quota logic with harm-reduction metrics.",
    body:
      "Metric registers and review triggers that block quota-driven capture.",
    tags: ["citizens-arc", "metrics", "integrity", "capture-resistance"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "metric-integrity-guardrail",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/harm-weighted-priority-standard",
    title: "Harm-weighted priority standard",
    summary: "Prioritize credible harm with due process and independent review.",
    body:
      "A public standard for prioritization with audit and appeal loops.",
    tags: ["citizens-arc", "non-harm", "priority", "due-process"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "harm-weighted-priority-standard",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/integration-ladder",
    title: "Integration ladder",
    summary: "Lawful on-ramp for long-term integrated residents.",
    body:
      "Convert long-term integration into legal status with clear criteria, timelines, and audits.",
    tags: ["citizens-arc", "integration", "repair", "due-process"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "integration-ladder",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/local-stability-compact",
    title: "Local stability compact",
    summary: "Mitigate enforcement shocks to local economies.",
    body:
      "Requires impact statements and mitigation plans to avoid staffing or small-business disruption.",
    tags: ["citizens-arc", "stability", "economy", "interbeing"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "local-stability-compact",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/access-to-counsel-pathway",
    title: "Access-to-counsel pathway",
    summary: "Ensure rights are usable with counsel and language access.",
    body:
      "Counsel access, referral SLAs, and language coverage for due process.",
    tags: ["citizens-arc", "counsel", "rights", "integrity"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "access-to-counsel-pathway",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/training-certification-gate",
    title: "Training and certification gate",
    summary: "Safety doctrine enforced through training and renewal.",
    body:
      "Certification registers with renewal cycles and incident-linked reviews.",
    tags: ["citizens-arc", "training", "safety", "verification"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "training-certification-gate",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/anti-mutation",
    title: "Anti-mutation addendum",
    summary: "Mechanisms that keep selection from hardening into status.",
    body:
      "Sortition oversight, rotating authority, power decomposition, exit rights, and cultural immunology keep trials from becoming a caste system.",
    tags: ["citizens-arc", "anti-mutation", "governance", "selection"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "anti-mutation",
    formats: ["png", "svg"]
  },
  {
    id: "citizens-arc/stress-test",
    title: "Stress test register",
    summary: "Attack packets mapped to civic countermeasures.",
    body:
      "Charismatic optimizers, caregiver exodus, audit coups, border koans, and crisis velocity failures must have named counters and reversal triggers.",
    tags: ["citizens-arc", "stress-test", "risk", "resilience"],
    panelId: "mission-ethos",
    nodeId: "citizens-arc",
    exportKind: "pill",
    exportTargetId: "stress-test",
    formats: ["png", "svg"]
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
    formats: ["png", "svg"]
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
    id: "ideology/scarcity-justice",
    title: "Scarcity Justice",
    summary:
      "Fairness under scarcity is a legitimacy engine when restoration is uneven.",
    tags: ["scarcity", "justice", "allocation"],
    panelId: "mission-ethos",
    nodeId: "scarcity-justice",
    exportKind: "node-card",
    formats: ["json", "md"]
  },
  {
    id: "ideology/three-tenets-loop",
    title: "Three Tenets Loop",
    summary:
      "Not-knowing, bearing witness, taking action: a governance cycle that learns in public.",
    tags: ["three-tenets", "governance", "feedback"],
    panelId: "mission-ethos",
    nodeId: "three-tenets-loop",
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
