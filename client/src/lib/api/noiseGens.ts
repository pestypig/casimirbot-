import { apiRequest } from "@/lib/queryClient";
import { readCoverFlowPayload } from "@/lib/noise/cover-flow";
import type {
  Generation,
  MoodPreset,
  Original,
  OriginalDetails,
  OriginalStem,
  NoisegenRecipe,
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
  pendingOriginals: `${BASE}/originals/pending`,
  originalDetails: (originalId: string) =>
    `${BASE}/originals/${encodeURIComponent(originalId)}`,
  originalStems: (originalId: string) =>
    `${BASE}/originals/${encodeURIComponent(originalId)}/stems`,
  generations: `${BASE}/generations`,
  moods: `${BASE}/moods`,
  recipes: `${BASE}/recipes`,
  recipe: (recipeId: string) => `${BASE}/recipes/${encodeURIComponent(recipeId)}`,
  generate: `${BASE}/generate`,
  upload: `${BASE}/upload`,
  previews: `${BASE}/previews`,
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

export async function fetchOriginalDetails(
  originalId: string,
  signal?: AbortSignal,
): Promise<OriginalDetails> {
  const res = await apiRequest("GET", endpoints.originalDetails(originalId), undefined, signal);
  return parseJson<OriginalDetails>(res);
}

export async function fetchPendingOriginals(
  search?: string,
  signal?: AbortSignal,
): Promise<Original[]> {
  try {
    const res = await apiRequest(
      "GET",
      withSearch(endpoints.pendingOriginals, search),
      undefined,
      signal,
    );
    return parseJson<Original[]>(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const statusMatch = message.match(/^(\d{3})\s*:/);
    if (statusMatch && (statusMatch[1] === "404" || statusMatch[1] === "501")) {
      return [];
    }
    throw error;
  }
}

export async function fetchOriginalStems(
  originalId: string,
  signal?: AbortSignal,
): Promise<OriginalStem[]> {
  const res = await apiRequest(
    "GET",
    endpoints.originalStems(originalId),
    undefined,
    signal,
  );
  const payload = await parseJson<{ stems: OriginalStem[] }>(res);
  return payload?.stems ?? [];
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

export async function fetchRecipes(
  search?: string,
  signal?: AbortSignal,
): Promise<NoisegenRecipe[]> {
  const res = await apiRequest(
    "GET",
    withSearch(endpoints.recipes, search),
    undefined,
    signal,
  );
  return parseJson<NoisegenRecipe[]>(res);
}

export async function fetchRecipe(
  recipeId: string,
  signal?: AbortSignal,
): Promise<NoisegenRecipe> {
  const res = await apiRequest(
    "GET",
    endpoints.recipe(recipeId),
    undefined,
    signal,
  );
  return parseJson<NoisegenRecipe>(res);
}

export async function saveRecipe(
  payload: {
    name: string;
    coverRequest: CoverJobRequest;
    seed?: string | number;
    notes?: string;
  },
  signal?: AbortSignal,
): Promise<NoisegenRecipe> {
  const res = await apiRequest("POST", endpoints.recipes, payload, signal);
  return parseJson<NoisegenRecipe>(res);
}

export async function deleteRecipe(
  recipeId: string,
  signal?: AbortSignal,
): Promise<{ ok: boolean }> {
  const res = await apiRequest(
    "DELETE",
    endpoints.recipe(recipeId),
    undefined,
    signal,
  );
  return parseJson<{ ok: boolean }>(res);
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

export type UploadProgress = {
  loaded: number;
  total?: number;
  pct?: number;
};

export type UploadOriginalOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: UploadProgress) => void;
};

export async function uploadOriginal(
  formData: FormData,
  options: UploadOriginalOptions = {},
): Promise<{ trackId: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abortSignal = options.signal;

    const cleanup = () => {
      if (abortSignal) {
        abortSignal.removeEventListener("abort", handleAbort);
      }
      xhr.upload.onprogress = null;
      xhr.onload = null;
      xhr.onerror = null;
      xhr.onabort = null;
    };

    const handleAbort = () => {
      xhr.abort();
    };

    if (abortSignal) {
      if (abortSignal.aborted) {
        reject(new DOMException("Upload aborted", "AbortError"));
        return;
      }
      abortSignal.addEventListener("abort", handleAbort);
    }

    xhr.open("POST", endpoints.upload);
    xhr.withCredentials = true;
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!options.onProgress) return;
      const total = event.lengthComputable ? event.total : undefined;
      const pct = total && total > 0 ? event.loaded / total : undefined;
      options.onProgress({ loaded: event.loaded, total, pct });
    };

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        const response =
          typeof xhr.response === "object" && xhr.response
            ? (xhr.response as { trackId?: string })
            : (() => {
                try {
                  return JSON.parse(xhr.responseText);
                } catch {
                  return null;
                }
              })();
        if (response?.trackId) {
          resolve({ trackId: response.trackId });
        } else {
          reject(new Error("Upload succeeded but response was invalid."));
        }
        return;
      }
      const errorMessage =
        xhr.responseText ||
        xhr.statusText ||
        `Upload failed with status ${xhr.status ?? "unknown"}`;
      reject(new Error(errorMessage));
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error("Upload failed due to a network error."));
    };

    xhr.onabort = () => {
      cleanup();
      reject(new DOMException("Upload aborted", "AbortError"));
    };

    xhr.send(formData);
  });
}

export async function uploadCoverPreview(
  jobId: string,
  blob: Blob,
  signal?: AbortSignal,
): Promise<{ previewUrl: string }> {
  const payload = new FormData();
  payload.append("jobId", jobId);
  payload.append("preview", blob, "preview.wav");
  const res = await fetch(endpoints.previews, {
    method: "POST",
    body: payload,
    credentials: "include",
    signal,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      errorBody || `Preview upload failed with status ${res.status ?? "unknown"}`,
    );
  }

  return parseJson<{ previewUrl: string }>(res);
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
