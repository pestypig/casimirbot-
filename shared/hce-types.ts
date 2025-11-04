export interface HcePeak {
  omega: number;
  gamma: number;
  alpha: number;
}

export interface HceConfigPayload {
  seed?: string;
  peaks: HcePeak[];
  rc: number;
  tau: number;
  beta: number;
  lambda?: number;
  K: number;
  latentDim?: number;
  dt?: number;
}

export interface HceResolvedConfig {
  seed: string;
  rc: number;
  tau: number;
  beta: number;
  lambda: number;
  K: number;
  latentDim: number;
  dt: number;
}

export interface HceBranchSummary {
  index: number;
  energy: number;
}

export interface HceAudioPeak {
  f: number;
  q: number;
  gain: number;
}

export interface HceAudioPacket {
  type: "set";
  seed: number;
  branch: number;
  peaks: HceAudioPeak[];
  xfadeMs?: number;
}

export interface HceConfigResponse {
  runId: string;
  branchCenters: number[][];
  initialState: number[];
  config: HceResolvedConfig;
}

export interface HceStreamEvent {
  t: number;
  psi: number[];
  energies: number[];
  suggestedBranch: number;
}

export interface HceMeasurePayload {
  runId: string;
  text: string;
  weirdness: number;
  lambda?: number;
}

export interface HceMeasureResponse {
  branch: number;
  energies: number[];
  audioParams: HceAudioPacket;
  summary: string;
}

export const DEFAULT_HCE_CONFIG: Pick<
  HceResolvedConfig,
  "rc" | "tau" | "beta" | "lambda" | "K" | "latentDim" | "dt"
> = {
  rc: 0.25,
  tau: 2.5,
  beta: 0.45,
  lambda: 0.65,
  K: 3,
  latentDim: 32,
  dt: 0.05,
};
