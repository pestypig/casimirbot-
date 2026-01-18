export type NeuroStreamKind = "eeg" | "meg" | "emg" | "eog" | "eye" | "aux";

export interface NeuroFrame {
  stream: NeuroStreamKind;
  deviceId: string;
  tsDevice?: number;
  tsRecvMono: number;
  tsAligned?: number;
  samples: number[][];
  sampleRateHz: number;
  channelNames: string[];
  units?: string;
}

export interface NeuroMarker {
  tsRecvMono: number;
  tsAligned?: number;
  source: "ui" | "protocol" | "external" | "sim";
  label: string;
  payload?: Record<string, unknown>;
}

export interface FeatureWindow {
  tsStart: number;
  tsEnd: number;
  stream: NeuroStreamKind;
  features: Record<string, number>;
  artifacts: Record<string, number>;
  quality: {
    snrEstimate?: number;
    dropoutRate?: number;
    confidence: number;
  };
}

export interface NeuroState {
  ts: number;
  locked: boolean;
  lockReason?: string;
  phase?: {
    refHz: number;
    phaseRad: number;
    phaseErrorRad: number;
    plv?: number;
    subharmonicTag?: number;
  };
  bands?: Record<string, number>;
  coherence?: Record<string, number>;
  artifactScores: Record<string, number>;
  summary: Record<string, number>;
  phase_dispersion?: number;
  gamma_sync?: number;
  gamma_sync_z?: number;
  gamma_sync_null_mean?: number;
  gamma_sync_null_std?: number;
  gamma_baseline_ready?: number;
  gamma_baseline_progress?: number;
  gamma_baseline_count?: number;
  gamma_artifact_pass?: number;
  gamma_emg_plv?: number;
  gamma_emg_burst_ratio?: number;
}
