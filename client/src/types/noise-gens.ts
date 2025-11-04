export type Original = {
  id: string;
  title: string;
  artist: string;
  listens: number;
  duration: number;
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
