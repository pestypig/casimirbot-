export type Original = {
  id: string;
  title: string;
  artist: string;
  listens: number;
  duration: number;
  tempo?: TempoMeta;
};

export type Generation = {
  id: string;
  originalId: string;
  title: string;
  mood: string;
  listens: number;
};

export type MoodPreset = {
  id: string;
  label: string;
  style: number;
  sample: number;
  weird: number;
  description?: string;
};

export type RankRow = {
  id: string;
  title: string;
  listens: number;
  mood?: string;
  originalId?: string;
};

export type DragData = {
  id: string;
  title: string;
};

export type JobStatus = "queued" | "processing" | "ready" | "error";

export type ImmersionScores = import("@/lib/noise/immersion").ImmersionScores;

export type CoverEvidence = {
  idi: number;
  idiConfidence: number;
  immersion: ImmersionScores;
};

export type HelixPacket = {
  seed: string;
  rc: number;
  tau: number;
  lambda?: number;
  K: number;
  weirdness?: number;
  branch?: number;
  peaks: Array<{
    omega: number;
    gamma: number;
    alpha: number;
  }>;
};

export type TimeSig = `${number}/${number}`;

export type TempoMeta = {
  bpm: number;
  timeSig: TimeSig;
  offsetMs: number;
  barsInLoop?: number;
  quantized?: boolean;
};

export type BarWindow = {
  startBar: number;
  endBar: number;
};

export type KBTextureId = string;

export type KBTexture = {
  id: KBTextureId;
  name: string;
  barkProfile: number[];
  peaks?: Array<{
    f: number;
    q: number;
    gain: number;
  }>;
};

export type KBMatch = {
  kb: KBTexture;
  score: number;
  confidence: number;
};

export type CoverJobRequest = {
  originalId: string;
  barWindows: BarWindow[];
  linkHelix: boolean;
  helix?: HelixPacket;
  kbTexture?: KBTextureId | null;
  kbConfidence?: number;
  knowledgeFileIds?: string[];
  forceRemote?: boolean;
  sampleInfluence?: number;
  styleInfluence?: number;
  weirdness?: number;
  tempo?: TempoMeta;
};

export type CoverJob = {
  id: string;
  status: JobStatus;
  request: CoverJobRequest;
  createdAt: number;
  updatedAt: number;
  previewUrl?: string;
  error?: string;
  evidence?: CoverEvidence;
};

export type OriginalUpload = {
  title: string;
  creator: string;
  instrumental: File;
  vocal?: File;
  notes?: string;
  tempo?: TempoMeta;
};
