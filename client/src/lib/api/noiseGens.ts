import { apiRequest } from "@/lib/queryClient";
import type {
  Generation,
  MoodPreset,
  Original,
  JobStatus,
  HelixPacket,
} from "@/types/noise-gens";

const BASE = "/api/noise-gens";

const endpoints = {
  originals: `${BASE}/originals`,
  generations: `${BASE}/generations`,
  moods: `${BASE}/moods`,
  generate: `${BASE}/generate`,
  upload: `${BASE}/upload`,
  jobStatus: (jobId: string) => `${BASE}/jobs/${encodeURIComponent(jobId)}`,
} as const;

const withSearch = (endpoint: string, q?: string) =>
  q ? `${endpoint}?search=${encodeURIComponent(q)}` : endpoint;

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export async function fetchTopOriginals(
  search?: string,
  signal?: AbortSignal,
): Promise<Original[]> {
  const res = await apiRequest(
    "GET",
    withSearch(endpoints.originals, search),
    undefined,
    signal,
  );
  return parseJson<Original[]>(res);
}

export async function fetchTopGenerations(
  search?: string,
  signal?: AbortSignal,
): Promise<Generation[]> {
  const res = await apiRequest(
    "GET",
    withSearch(endpoints.generations, search),
    undefined,
    signal,
  );
  return parseJson<Generation[]>(res);
}

export async function fetchMoodPresets(
  signal?: AbortSignal,
): Promise<MoodPreset[]> {
  const res = await apiRequest("GET", endpoints.moods, undefined, signal);
  return parseJson<MoodPreset[]>(res);
}

export async function requestGeneration(payload: {
  originalId: string;
  moodId: string;
  seed?: number;
  helixPacket?: HelixPacket;
}): Promise<{ jobId: string }> {
  const res = await apiRequest("POST", endpoints.generate, payload);
  return parseJson<{ jobId: string }>(res);
}

export async function uploadOriginal(
  formData: FormData,
  signal?: AbortSignal,
): Promise<{ trackId: string }> {
  const res = await fetch(endpoints.upload, {
    method: "POST",
    body: formData,
    credentials: "include",
    signal,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      errorBody || `Upload failed with status ${res.status ?? "unknown"}`,
    );
  }

  return parseJson<{ trackId: string }>(res);
}

export async function fetchJobStatus(
  jobId: string,
  signal?: AbortSignal,
): Promise<{ status: JobStatus; detail?: string }> {
  const res = await apiRequest(
    "GET",
    endpoints.jobStatus(jobId),
    undefined,
    signal,
  );
  return parseJson<{ status: JobStatus; detail?: string }>(res);
}
