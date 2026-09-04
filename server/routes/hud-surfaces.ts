import { Router, type NextFunction, type Request, type Response } from "express";
import {
  HELIX_SURFACE_REGISTRY_SCHEMA,
  PanelLaunchContextSchema,
  SurfaceCommandSchema,
  SurfaceControlLeaseRequestSchema,
  SurfaceCreateRequestSchema,
  SurfacePanelRouteRequestSchema,
} from "@shared/helix-surface-registry";
import { FirstPartyCookieBoundary, FirstPartyCookieBoundaryError } from "../middleware/first-party-cookie-boundary";
import { getAccountSessionById } from "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import { SurfaceRegistryError, SurfaceRegistryService, surfaceRegistryService } from "../services/hud-surface/surface-registry-service";

type Session = Awaited<ReturnType<typeof getAccountSessionById>>;
type DeveloperRequest = Request & { surfaceDeveloper?: { profileId: string; principalId: string } };
export type HudSurfaceRouterDependencies = { service: SurfaceRegistryService; getSession: (request: Request) => Promise<Session> };

const defaults: HudSurfaceRouterDependencies = {
  service: surfaceRegistryService,
  getSession: (request) => getAccountSessionById(readHelixSessionCookie(request.headers.cookie)),
};

const fail = (response: Response, status: number, code: string, message: string) => response.status(status).json({ ok: false, schema: HELIX_SURFACE_REGISTRY_SCHEMA, error: code, message });
const routeError = (response: Response, error: unknown) => {
  if (error instanceof SurfaceRegistryError) return fail(response, error.status, error.code, error.message);
  if (error && typeof error === "object" && "issues" in error) return fail(response, 400, "invalid_surface_request", "The surface request did not match the versioned contract.");
  return fail(response, 500, "surface_registry_failed", "The surface registry operation failed.");
};

export function createHudSurfaceRouter(dependencies: HudSurfaceRouterDependencies = defaults) {
  const router = Router();
  const boundary = new FirstPartyCookieBoundary({ codePrefix: "hud_surface", ipMax: 120, accountMax: 90 });
  const requireDeveloper = async (request: DeveloperRequest, response: Response, next: NextFunction) => {
    try {
      const session = await dependencies.getSession(request);
      if (!session || session.account_policy.account_type !== "developer") return fail(response, 403, "developer_account_required", "The shared Surface Registry is restricted to signed-in developer accounts.");
      request.surfaceDeveloper = { profileId: session.profile.profile_id, principalId: `profile:${session.profile.profile_id}:human-ui` };
      return next();
    } catch {
      return fail(response, 403, "developer_account_required", "A signed-in developer account is required.");
    }
  };
  const uiPrincipal = (request: DeveloperRequest) => ({ kind: "human_ui" as const, principal_id: request.surfaceDeveloper!.principalId, owner_profile_id: request.surfaceDeveloper!.profileId, thread_id: null, control_lease_id: null });

  router.use(boundary.noStore, boundary.enforceIpRateLimit, requireDeveloper);
  router.get("/", (request: DeveloperRequest, response) => response.json({ ok: true, schema: HELIX_SURFACE_REGISTRY_SCHEMA, surfaces: dependencies.service.list(request.surfaceDeveloper!.profileId) }));
  router.post("/", boundary.enforceSameOrigin, (request: DeveloperRequest, response) => {
    try {
      const input = SurfaceCreateRequestSchema.parse(request.body);
      return response.status(201).json({ ok: true, ...dependencies.service.create(request.surfaceDeveloper!.profileId, input.desired_state, input.surface_instance_id) });
    } catch (error) { return routeError(response, error); }
  });
  router.get("/:surfaceId", (request: DeveloperRequest, response) => {
    try { return response.json({ ok: true, ...dependencies.service.inspect(request.surfaceDeveloper!.profileId, request.params.surfaceId) }); }
    catch (error) { return routeError(response, error); }
  });
  router.post("/:surfaceId/commands", boundary.enforceSameOrigin, (request: DeveloperRequest, response) => {
    try {
      const command = SurfaceCommandSchema.parse(request.body);
      return response.json({ ok: true, ...dependencies.service.execute(request.surfaceDeveloper!.profileId, request.params.surfaceId, command, uiPrincipal(request)) });
    } catch (error) { return routeError(response, error); }
  });
  router.post("/:surfaceId/control-leases", boundary.enforceSameOrigin, (request: DeveloperRequest, response) => {
    try {
      const input = SurfaceControlLeaseRequestSchema.parse(request.body);
      return response.status(201).json({ ok: true, ...dependencies.service.issueControlLease(request.surfaceDeveloper!.profileId, request.params.surfaceId, input.thread_id, input.permitted_operations, input.duration_ms) });
    } catch (error) { return routeError(response, error); }
  });
  router.post("/:surfaceId/panel-routes", boundary.enforceSameOrigin, (request: DeveloperRequest, response) => {
    try {
      const input = SurfacePanelRouteRequestSchema.parse(request.body);
      return response.status(201).json({
        ok: true,
        ...dependencies.service.preparePanelRoute(
          request.surfaceDeveloper!.profileId,
          request.params.surfaceId,
          input,
          uiPrincipal(request),
        ),
      });
    } catch (error) { return routeError(response, error); }
  });
  router.post("/control-leases/:leaseId/revoke", boundary.enforceSameOrigin, (request: DeveloperRequest, response) => {
    try { return response.json({ ok: true, ...dependencies.service.revokeControlLease(request.surfaceDeveloper!.profileId, request.params.leaseId) }); }
    catch (error) { return routeError(response, error); }
  });
  router.post("/launch-context/validate", boundary.enforceSameOrigin, (request: DeveloperRequest, response) => {
    try {
      const context = PanelLaunchContextSchema.parse(request.body);
      return response.json({ ok: true, context, surface: dependencies.service.validateLaunchContext(request.surfaceDeveloper!.profileId, context) });
    } catch (error) { return routeError(response, error); }
  });
  router.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (!(error instanceof FirstPartyCookieBoundaryError)) return next(error);
    if (error.retryAfterMs !== null) response.setHeader("Retry-After", String(Math.max(1, Math.ceil(error.retryAfterMs / 1_000))));
    return fail(response, error.statusCode, error.code.endsWith("_rate_limited") ? "rate_limited" : "cross_origin_forbidden", error.message);
  });
  return router;
}

export const hudSurfaceRouter = createHudSurfaceRouter();
