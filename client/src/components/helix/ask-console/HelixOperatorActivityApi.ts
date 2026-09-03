import {
  helixOperatorActivityPageSchema,
  helixOperatorActivityStreamListSchema,
  type HelixOperatorActivityCursor,
  type HelixOperatorActivityPage,
  type HelixOperatorActivityStreamList,
} from "@shared/helix-operator-activity";

const readJson = async (response: Response): Promise<unknown> => {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body
      ? String((body as { message?: unknown }).message)
      : "Helix activity is unavailable.";
    throw new Error(message);
  }
  return body;
};

const encodeCursor = (cursor: HelixOperatorActivityCursor): string => {
  const bytes = new TextEncoder().encode(JSON.stringify(cursor));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
};

export const fetchHelixOperatorActivityStreams = async (
  signal?: AbortSignal,
): Promise<HelixOperatorActivityStreamList> => {
  const response = await fetch(
    "/api/account/session/operator-activity/streams?limit=100",
    { signal, credentials: "same-origin", cache: "no-store" },
  );
  return helixOperatorActivityStreamListSchema.parse(await readJson(response));
};

export const fetchHelixOperatorActivityPage = async (input: {
  streamRef: string;
  nodeRef: string;
  cursor?: HelixOperatorActivityCursor | null;
  signal?: AbortSignal;
}): Promise<HelixOperatorActivityPage> => {
  const query = new URLSearchParams({
    stream_ref: input.streamRef,
    node_ref: input.nodeRef,
    limit: "50",
  });
  if (input.cursor) query.set("cursor", encodeCursor(input.cursor));
  const response = await fetch(
    `/api/account/session/operator-activity?${query.toString()}`,
    { signal: input.signal, credentials: "same-origin", cache: "no-store" },
  );
  return helixOperatorActivityPageSchema.parse(await readJson(response));
};
