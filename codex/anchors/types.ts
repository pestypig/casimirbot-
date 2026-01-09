export type AnchorMode = "chat" | "patch";
export type Intent = "architecture" | "ideology" | "hybrid" | "none";

export type MissingAnchorBehavior = "warn-and-drop" | "error";

export interface AnchorConfig {
  version: number;
  anchors: {
    minPerAnswer: number;
    maxPerAnswer: number;
    modePolicy: Record<AnchorMode, { missingAnchorBehavior: MissingAnchorBehavior }>;
  };
  ideology: {
    ideologyJsonPath: string;
    maxNodes: number;
  };
  architecture: {
    defaultBundle: { path: string; why: string }[];
    subsystemRoots: { name: string; keywords: string[]; paths: string[] }[];
    topicBundles: { name: string; keywords: string[]; paths: string[] }[];
  };
  router: {
    architectureKeywords: string[];
    ideologyKeywords: string[];
    hybridTieBreak: "architecture-first" | "ideology-first";
  };
  security: {
    allowedAnchorRoots: string[];
  };
}

export interface ArchitectureAnchor {
  path: string;
  why: string;
}

export interface IdeologyAnchor {
  nodeId: string;
  why: string;
}

export interface AnchoredAnswer {
  answer: string;
  architectureAnchors?: ArchitectureAnchor[];
  ideologyAnchors?: IdeologyAnchor[];
  assumptions?: string[];
  clarifier?: string;
  meta?: {
    intent?: Intent;
    warnings?: string[];
  };
}

export type RetrieveSource = "defaultBundle" | "subsystemRoot" | "topicBundle";

export interface RetrieveCandidate {
  path: string;
  reason: string;
  source: RetrieveSource;
}

export interface VerificationResult {
  ok: boolean;
  warnings: string[];
  errors: string[];
  sanitized: AnchoredAnswer;
}
