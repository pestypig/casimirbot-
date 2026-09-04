import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import {
  HELIX_VISUAL_SEQUENCE_MANIFEST_SCHEMA,
  VISUAL_SEQUENCE_LIMITS,
  type VisualSequenceCaptureMetadata,
  type VisualSequenceErrorResponse,
} from "@shared/helix-visual-sequence";
import { getAccountSessionById } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import {
  FirstPartyCookieBoundary,
  FirstPartyCookieBoundaryError,
} from "../middleware/first-party-cookie-boundary";
import {
  VisualSequenceService,
  VisualSequenceServiceError,
  visualSequenceService,
} from "../services/visual-sequence/visual-sequence-service";

type Session = Awaited<ReturnType<typeof getAccountSessionById>>;

export type VisualSequenceRouterDependencies = {
  service: VisualSequenceService;
  getSession: (request: Request) => Promise<Session>;
};

const defaultDependencies: VisualSequenceRouterDependencies = {
  service: visualSequenceService,
  getSession: (request) => getAccountSessionById(readHelixSessionCookie(request.headers.cookie)),
};

type DeveloperRequest = Request & {
  visualSequenceDeveloper?: { profileId: string };
};

const errorResponse = (
  response: Response,
  status: number,
  error: VisualSequenceErrorResponse["error"],
  message: string,
) => response.status(status).json({
  ok: false,
  schema: HELIX_VISUAL_SEQUENCE_MANIFEST_SCHEMA,
  error,
  message,
} satisfies VisualSequenceErrorResponse);

const routeError = (response: Response, error: unknown) => {
  if (error instanceof VisualSequenceServiceError) {
    return errorResponse(response, error.status, error.code, error.message);
  }
  return errorResponse(response, 500, "decode_failed", "The offline visual-sequence operation failed.");
};

export function createVisualSequenceRouter(
  dependencies: VisualSequenceRouterDependencies = defaultDependencies,
): Router {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: VISUAL_SEQUENCE_LIMITS.maxUploadBytes, files: 1, fields: 5 },
  });
  const boundary = new FirstPartyCookieBoundary({
    codePrefix: "visual_sequence",
    ipMax: 30,
    accountMax: 20,
  });

  const requireDeveloper = async (request: DeveloperRequest, response: Response, next: NextFunction) => {
    try {
      const session = await dependencies.getSession(request);
      if (!session || session.account_policy.account_type !== "developer") {
        return errorResponse(
          response,
          403,
          "developer_account_required",
          "Offline visual-sequence extraction is restricted to signed-in developer accounts.",
        );
      }
      request.visualSequenceDeveloper = { profileId: session.profile.profile_id };
      return next();
    } catch {
      return errorResponse(response, 403, "developer_account_required", "A signed-in developer account is required.");
    }
  };

  router.use(boundary.noStore);
  router.use(boundary.enforceIpRateLimit);
  router.use(requireDeveloper);

  router.post("/", boundary.enforceSameOrigin, (request: DeveloperRequest, response: Response) => {
    upload.single("video")(request, response, async (uploadError) => {
      if (uploadError) {
        if (uploadError instanceof multer.MulterError && uploadError.code === "LIMIT_FILE_SIZE") {
          return errorResponse(response, 413, "upload_too_large", "The clip exceeds the 64 MiB VSE-0A upload limit.");
        }
        return errorResponse(response, 400, "video_required", "Exactly one local video clip is required.");
      }
      const file = request.file;
      if (!file?.buffer) return errorResponse(response, 400, "video_required", "Choose a local video clip.");
      const threadId = typeof request.body?.thread_id === "string"
        ? request.body.thread_id.trim().slice(0, 160)
        : "motorcycle-hud-lab";
      const cadence = typeof request.body?.cadence_ms === "string"
        ? Number(request.body.cadence_ms)
        : undefined;
      let capture: VisualSequenceCaptureMetadata | undefined;
      if (typeof request.body?.capture_metadata === "string") {
        try {
          capture = JSON.parse(request.body.capture_metadata) as VisualSequenceCaptureMetadata;
        } catch {
          return errorResponse(response, 400, "invalid_capture_metadata", "The bounded-capture metadata is not valid JSON.");
        }
      }
      try {
        const result = await dependencies.service.ingest({
          ownerProfileId: request.visualSequenceDeveloper!.profileId,
          threadId: threadId || "motorcycle-hud-lab",
          originalName: file.originalname,
          mimeType: file.mimetype,
          bytes: file.buffer,
          requestedCadenceMs: cadence,
          capture,
        });
        response.setHeader("Cache-Control", "private, no-store");
        return response.status(201).json(result);
      } catch (error) {
        return routeError(response, error);
      }
    });
  });

  router.get("/:sequenceId", async (request: DeveloperRequest, response: Response) => {
    try {
      const [manifest, receipt] = await Promise.all([
        dependencies.service.getManifest(request.params.sequenceId),
        dependencies.service.getReceipt(request.params.sequenceId),
      ]);
      if (manifest.owner_profile_id !== request.visualSequenceDeveloper!.profileId) {
        return errorResponse(response, 404, "sequence_not_found", "The visual sequence is unavailable or expired.");
      }
      response.setHeader("Cache-Control", "private, no-store");
      return response.json({ ok: true, manifest, receipt });
    } catch (error) {
      return routeError(response, error);
    }
  });

  router.get("/:sequenceId/artifacts/:artifactPath(*)", async (request: DeveloperRequest, response: Response) => {
    try {
      const manifest = await dependencies.service.getManifest(request.params.sequenceId);
      if (manifest.owner_profile_id !== request.visualSequenceDeveloper!.profileId) {
        return errorResponse(response, 404, "sequence_not_found", "The visual sequence is unavailable or expired.");
      }
      const artifactPath = request.params.artifactPath ?? "";
      const artifact = await dependencies.service.resolveArtifact(request.params.sequenceId, artifactPath);
      response.setHeader("Cache-Control", "private, no-store");
      response.type(artifact.mimeType);
      return response.sendFile(artifact.path);
    } catch (error) {
      return routeError(response, error);
    }
  });

  router.post("/maintenance/cleanup-expired", boundary.enforceSameOrigin, async (_request, response) => {
    try {
      const removed = await dependencies.service.cleanupExpired();
      response.setHeader("Cache-Control", "private, no-store");
      return response.json({
        ok: true,
        schema: "helix.visual_sequence_cleanup_receipt.v1",
        removed,
        model_invoked: false,
        environment_action: false,
      });
    } catch (error) {
      return routeError(response, error);
    }
  });

  router.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (!(error instanceof FirstPartyCookieBoundaryError)) return next(error);
    if (error.retryAfterMs !== null) {
      response.setHeader("Retry-After", String(Math.max(1, Math.ceil(error.retryAfterMs / 1_000))));
    }
    const code = error.code.endsWith("_rate_limited") ? "rate_limited" : "cross_origin_forbidden";
    return errorResponse(response, error.statusCode, code, error.message);
  });

  return router;
}

export const visualSequenceRouter = createVisualSequenceRouter();
