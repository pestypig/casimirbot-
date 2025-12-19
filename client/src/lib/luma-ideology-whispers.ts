import type { LumaMood } from "./luma-moods";

type PanelWhisper = {
  text: string;
  node: string;
  mood?: LumaMood | null;
  tags?: string[];
};

const PANEL_IDEOLOGY_MAP: Record<string, PanelWhisper> = {
  // Mission / ethos roots
  "mission-ethos": {
    node: "mission-ethos",
    text: "Mission Ethos: steer physics with compassion; every panel is a vow.",
    mood: "friend",
  },
  "mission-ethos-source": {
    node: "mission-ethos",
    text: "Source essay: return to the vow before you tune the drive.",
    mood: "question",
  },

  // Stewardship / craft
  "helix-core": {
    node: "bodhisattva-craft",
    text: "Helix Core: bodhisattva craft—hold duty, TS, and curvature as moral ledgers.",
    mood: "friend",
  },
  "live-energy": {
    node: "stewardship-ledger",
    text: "Live Energy: steward the ledger—keep duty green and TS high.",
    mood: "happy",
  },
  "stress-map": {
    node: "stewardship-ledger",
    text: "Stress Map: watch the hull strains; compassion is structural.",
    mood: "question",
  },
  "helix-observables": {
    node: "stewardship-ledger",
    text: "Observables: listen to the vessel; let the metrics confess the truth.",
    mood: "question",
  },

  // Beginner's mind / inner spark
  "helix-noise-gens": {
    node: "beginners-mind",
    text: "Noise Generators: beginner’s mind—clean spectra, clean intent.",
    mood: "happy",
  },
  "spectrum-tuner": {
    node: "beginners-mind",
    text: "Spectrum Tuner: polish the ports; wonder lives in the harmonics.",
    mood: "friend",
  },
  "helix-luma": {
    node: "inner-spark",
    text: "Luma Lab: inner spark—let play and curiosity steer the signal.",
    mood: "love",
  },

  // Integrity / worldview
  "rag-admin": {
    node: "worldview-integrity",
    text: "RAG Admin: worldview integrity—curate sources so the chorus stays honest.",
    mood: "question",
  },
  "rag-ingest": {
    node: "worldview-integrity",
    text: "RAG Ingest: feed the corpus with care; integrity precedes inference.",
    mood: "question",
  },
  "code-admin": {
    node: "worldview-integrity",
    text: "Code Admin: worldview integrity—trust begins with traceable code paths.",
    mood: "question",
  },
  "docs-viewer": {
    node: "beginners-mind",
    text: "Docs & Papers: beginner’s mind—read, revise, and keep the vow aligned.",
    mood: "question",
  },

  // Navigation / cohorts
  "star-coherence": {
    node: "devotion-course",
    text: "Star Coherence: devotion course—hold formation so the convoy learns together.",
    mood: "friend",
  },
  "collapse-monitor": {
    node: "integrity-protocols",
    text: "Collapse Watch: integrity protocols—catch cracks early, keep the promise whole.",
    mood: "upset",
  },
  "endpoints": {
    node: "integrity-protocols",
    text: "Endpoints: integrity protocols—map the interfaces before you trust the flow.",
    mood: "question",
  },

  // Builders / tiles
  "casimir-tiles": {
    node: "inner-spark",
    text: "Casimir Tiles: inner spark—small experiments, big insights.",
    mood: "happy",
  },

  // Docs & ideology panels already covered; taskbar/control panels
  "taskbar": {
    node: "mission-ethos",
    text: "Taskbar: anchor your workspace; keep the vow visible.",
    mood: "friend",
  },
};

export function resolvePanelIdeologyWhisper(panelId: string | undefined, title?: string) {
  if (!panelId) return null;
  const key = panelId.toLowerCase();
  const entry = PANEL_IDEOLOGY_MAP[key];
  if (!entry) return null;
  const tags = ["panel", panelId, `ideology:${entry.node}`];
  if (entry.tags?.length) {
    tags.push(...entry.tags);
  }
  return {
    text: entry.text || `Opening ${title ?? panelId}`,
    tags,
    mood: entry.mood ?? null,
  };
}
