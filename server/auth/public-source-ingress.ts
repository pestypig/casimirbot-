import type { ErrorRequestHandler } from "express";
import {
  HELIX_ROOM_SOURCE_INGRESS_RECEIPT_SCHEMA,
  type HelixRoomSourceIngressKind,
  type HelixRoomSourceIngressReceipt,
} from "@shared/helix-room-source-ingress";
import {
  projectRoomSourceRequestId,
  redactProtectedRoomSourceSecrets,
} from "../services/situation-room/room-source-ingress-security";

const PUBLIC_ROOM_SOURCE_INGRESS_ROUTE =
  /^\/api\/room-ingress\/v1\/bindings\/([^/]+)\/(world-events\/batch|manifest|heartbeat|probes\/pending|probes\/result|status)\/?$/;

const ROOM_SOURCE_INGRESS_KIND_BY_SUFFIX: Readonly<
  Record<string, HelixRoomSourceIngressKind>
> = {
  "world-events/batch": "world_event_batch",
  manifest: "manifest",
  heartbeat: "heartbeat",
  "probes/pending": "probe_requests",
  "probes/result": "probe_result",
  status: "status",
};

const normalizedPathname = (path: string | null | undefined): string | null => {
  const normalized = typeof path === "string" ? path.trim() : "";
  if (!normalized) return null;
  try {
    return new URL(normalized, "http://localhost").pathname;
  } catch {
    return null;
  }
};

export const isPublicRoomSourceIngressPath = (
  path: string | null | undefined,
): boolean => {
  const pathname = normalizedPathname(path);
  return pathname ? PUBLIC_ROOM_SOURCE_INGRESS_ROUTE.test(pathname) : false;
};

export const inferPublicRoomSourceIngressKind = (
  path: string | null | undefined,
): HelixRoomSourceIngressKind | null => {
  const pathname = normalizedPathname(path);
  const suffix = pathname?.match(PUBLIC_ROOM_SOURCE_INGRESS_ROUTE)?.[2];
  return suffix ? (ROOM_SOURCE_INGRESS_KIND_BY_SUFFIX[suffix] ?? null) : null;
};

const inferPublicRoomSourceBindingId = (
  path: string | null | undefined,
): string | null => {
  const pathname = normalizedPathname(path);
  const encoded = pathname?.match(PUBLIC_ROOM_SOURCE_INGRESS_ROUTE)?.[1];
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
};

type ExpressBodyParserError = {
  status?: unknown;
  statusCode?: unknown;
  type?: unknown;
};

const hasBodyParserFailure = (
  error: unknown,
  type: "entity.parse.failed" | "entity.too.large",
  statusCode: 400 | 413,
): boolean => {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as ExpressBodyParserError;
  return (
    candidate.type === type &&
    (candidate.status === statusCode || candidate.statusCode === statusCode)
  );
};

const projectedRequestId = (input: {
  path: string | null | undefined;
  value: string | undefined;
}): string | null => {
  const bindingId = inferPublicRoomSourceBindingId(input.path);
  const normalized = input.value?.trim() ?? "";
  if (
    !bindingId ||
    !/^[a-zA-Z0-9:_-]{8,128}$/.test(normalized)
  ) {
    return null;
  }
  return projectRoomSourceRequestId({
    bindingId,
    requestId: normalized,
  });
};

const parserErrorReceipt = (input: {
  kind: HelixRoomSourceIngressKind;
  bodyTooLarge: boolean;
  requestId: string | null;
}): HelixRoomSourceIngressReceipt =>
  redactProtectedRoomSourceSecrets({
    schema: HELIX_ROOM_SOURCE_INGRESS_RECEIPT_SCHEMA,
    ok: false,
    error: input.bodyTooLarge
      ? "room_source_payload_too_large"
      : "room_source_payload_invalid",
    message: input.bodyTooLarge
      ? "Room source ingress payload exceeds the server body limit."
      : "Room source ingress payload contains malformed JSON.",
    binding_id: null,
    room_id: null,
    source_id: null,
    world_id: null,
    request_id: input.requestId,
    kind: input.kind,
    accepted: false,
    replayed: false,
    content_role: "source_observation_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });

export const publicRoomSourceIngressParserErrorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next,
): void => {
  const kind = inferPublicRoomSourceIngressKind(req.originalUrl);
  if (!kind) {
    next(error);
    return;
  }

  const malformedJson = hasBodyParserFailure(error, "entity.parse.failed", 400);
  const bodyTooLarge = hasBodyParserFailure(error, "entity.too.large", 413);
  if (!malformedJson && !bodyTooLarge) {
    next(error);
    return;
  }

  const receipt = parserErrorReceipt({
    kind,
    bodyTooLarge,
    requestId: projectedRequestId({
      path: req.originalUrl,
      value: req.get("x-helix-request-id"),
    }),
  });

  res.status(bodyTooLarge ? 413 : 400).json(receipt);
};
