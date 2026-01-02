import { apiRequest } from "@/lib/queryClient";
import { readCoverFlowPayload } from "@/lib/noise/cover-flow";
import type {
  Generation,
  MoodPreset,
  Original,
  JobStatus,
  HelixPacket,
  CoverJobRequest,
  CoverJob,
  NoiseFieldLoopRequest,
  NoiseFieldLoopResponse,
} from "@/types/noise-gens";

const BASE = "/api/noise-gens";

const endpoints = {
  originals: `${BASE}/originals`,
  generations: `${BASE}/generations`,
  moods: `${BASE}/moods`,
  generate: `${BASE}/generate`,
  upload: `${BASE}/upload`,
  jobStatus: (jobId: string) => `${BASE}/jobs/${encodeURIComponent(jobId)}`,
  noiseField: `${BASE}/noise-field`,
} as const;

export type CreateCoverJobPayload = CoverJobRequest & {
  forceRemote?: boolean;
};

const mergeKnowledgeFileIds = (...sources: Array<readonly string[] | null | undefined>): string[] => {
  const ids = new Set<string>();
  for (const list of sources) {
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (typeof entry !== "string") continue;
      const trimmed = entry.trim();
      if (trimmed) ids.add(trimmed);
    }
  }
  return Array.from(ids);
};

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

export async function createCoverJob(
  payload: CreateCoverJobPayload,
  signal?: AbortSignal,
): Promise<{ id: string }> {
  const coverFlowPayload = readCoverFlowPayload();
  const mergedKnowledgeFileIds = mergeKnowledgeFileIds(
    payload.knowledgeFileIds,
    coverFlowPayload?.knowledgeFileIds,
  );
  const body: CreateCoverJobPayload = { ...payload };

  if (mergedKnowledgeFileIds.length) {
    body.knowledgeFileIds = mergedKnowledgeFileIds;
  } else {
    delete body.knowledgeFileIds;
  }

  if (body.kbTexture == null && coverFlowPayload?.kbTexture) {
    body.kbTexture = coverFlowPayload.kbTexture;
  }

  if (typeof body.forceRemote !== "boolean" && typeof coverFlowPayload?.forceRemote === "boolean") {
    body.forceRemote = coverFlowPayload.forceRemote;
  }

  const res = await apiRequest("POST", `${BASE}/jobs`, body, signal);
  return parseJson<{ id: string }>(res);
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

export async function fetchCoverJob(
  jobId: string,
  signal?: AbortSignal,
): Promise<CoverJob> {
  const res = await apiRequest(
    "GET",
    endpoints.jobStatus(jobId),
    undefined,
    signal,
  );
  return parseJson<CoverJob>(res);
}

export async function fetchNoiseField(
  payload: NoiseFieldLoopRequest = {},
  signal?: AbortSignal,
): Promise<NoiseFieldLoopResponse> {
  const res = await apiRequest("POST", endpoints.noiseField, payload, signal);
  return parseJson<NoiseFieldLoopResponse>(res);
}
