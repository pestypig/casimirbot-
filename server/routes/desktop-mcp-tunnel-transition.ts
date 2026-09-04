import express, { Router, type Request, type Response } from "express";
import { ZodError, z } from "zod";
import {
  DesktopMcpTunnelTransitionError,
  type DesktopMcpTunnelTransitionStore,
} from "../services/local-supervisor/desktop-mcp-tunnel-transition-store";
import { getAccountSessionById } from
  "../services/helix-account/account-session-store";
import { readHelixSessionCookie } from
  "../services/helix-account/session-cookie";
import type {
  InstalledDeviceFullHarnessTrust,
  InstalledSecurityStore,
} from "../services/helix-account/installed-security-store";

const flags = {
  credential_included: false as const,
  private_endpoint_included: false as const,
  hidden_reasoning_included: false as const,
  authority_limited_to_tunnel_transport: true as const,
  environment_authority_granted: false as const,
  trading_authority_granted: false as const,
  answer_authority: false as const,
  assistant_answer: false as const,
  terminal_eligible: false as const,
};

export const isDesktopMcpTransitionSameOrigin = (input: {
  fetchSite: string | null | undefined;
  origin: string | null | undefined;
  host: string | null | undefined;
  protocol: string;
}): boolean => {
  if (input.fetchSite?.trim().toLowerCase() === "cross-site") return false;
  const origin = input.origin?.trim() ?? "";
  if (!origin) return false;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  return parsed.host === input.host &&
    parsed.protocol === `${input.protocol}:` &&
    ["http:", "https:"].includes(parsed.protocol) &&
    !parsed.username &&
    !parsed.password &&
    parsed.pathname === "/" &&
    !parsed.search &&
    !parsed.hash;
};

const requireSameOrigin = (req: Request): void => {
  if (!isDesktopMcpTransitionSameOrigin({
    fetchSite: req.get("sec-fetch-site"),
    origin: req.get("origin"),
    host: req.get("host"),
    protocol: req.protocol,
  })) {
    throw new DesktopMcpTunnelTransitionError("transition_same_origin_required", 403);
  }
};

const account = async (req: Request) => {
  const sessionId = readHelixSessionCookie(req.headers.cookie);
  const session = await getAccountSessionById(sessionId);
  if (!session || session.status !== "active") {
    throw new DesktopMcpTunnelTransitionError("transition_account_session_required", 401);
  }
  if (session.account_policy.account_type !== "developer") {
    throw new DesktopMcpTunnelTransitionError("transition_developer_account_required", 403);
  }
  return session;
};

const respondError = (res: Response, error: unknown): void => {
  if (error instanceof DesktopMcpTunnelTransitionError) {
    res.status(error.status).json({ ok: false, error: error.code, ...flags });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ ok: false, error: "transition_request_invalid", ...flags });
    return;
  }
  console.warn(
    "[desktop-mcp-tunnel-transition] request failed",
    error instanceof Error ? error.message : "unknown",
  );
  res.status(503).json({ ok: false, error: "transition_service_unavailable", ...flags });
};

const route = (handler: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response): void => {
    Promise.resolve(handler(req, res)).catch((error) => respondError(res, error));
  };

const decisionSchema = z.object({
  lease_seconds: z.number().int().min(30).max(300).optional(),
}).strict();

const trustDecisionSchema = z.object({ trusted: z.boolean() }).strict();
const trustedRenewalSchema = z.object({
  previous_transition_request_ref: z.string().trim().min(1).max(180),
}).strict();

const publicTrust = (trust: InstalledDeviceFullHarnessTrust) => ({
  schema: trust.schema,
  trusted: trust.trusted,
  device_ref: trust.device_ref,
  policy_revision: trust.policy_revision,
  trusted_at: trust.trusted_at,
  revoked_at: trust.revoked_at,
  authority_limited_to_tunnel_transport:
    trust.authority_limited_to_tunnel_transport,
  environment_authority_granted: trust.environment_authority_granted,
  trading_authority_granted: trust.trading_authority_granted,
  answer_authority: trust.answer_authority,
  terminal_eligible: trust.terminal_eligible,
});

export const createDesktopMcpTunnelTransitionRouter = (input: {
  store: DesktopMcpTunnelTransitionStore;
  installedSecurityStore?: Pick<
    InstalledSecurityStore,
    "inspectFullHarnessTrust" | "setFullHarnessTrust"
  >;
  desktopDeviceId?: string | null;
  desktopHostEnabled?: boolean;
  onRevoked?: (input: {
    transitionRequestRef: string;
    delegationRef: string;
    delegationExpiresAt: string;
    accountSessionId: string;
  }) => Promise<void>;
  onTrustedRenewal?: (input: {
    transitionRequestRef: string;
    delegationRef: string;
    delegationExpiresAt: string;
    accountSessionId: string;
  }) => Promise<{ accepted: boolean; nativeReceiptRef: string }>;
}): Router => {
  const router = Router();
  router.use(express.json({ limit: "16kb" }));

  const requireNativeTrustStore = () => {
    const deviceId = input.desktopDeviceId?.trim() ?? "";
    if (!input.desktopHostEnabled || !deviceId || !input.installedSecurityStore) {
      throw new DesktopMcpTunnelTransitionError(
        "transition_native_trust_unavailable",
        404,
      );
    }
    return { deviceId, security: input.installedSecurityStore };
  };

  router.get("/full-harness-trust", route(async (req, res) => {
    const session = await account(req);
    const { deviceId, security } = requireNativeTrustStore();
    const trust = await security.inspectFullHarnessTrust({
      profileId: session.profile.profile_id,
      deviceId,
    });
    res.json({ ok: true, trust: publicTrust(trust), ...flags });
  }));

  router.put("/full-harness-trust", route(async (req, res) => {
    requireSameOrigin(req);
    const session = await account(req);
    const body = trustDecisionSchema.parse(req.body);
    const { deviceId, security } = requireNativeTrustStore();
    const trust = await security.setFullHarnessTrust({
      session: {
        sessionId: session.session_id,
        profileId: session.profile.profile_id,
      },
      deviceId,
      trusted: body.trusted,
    });
    const delegatedRequestRefs: string[] = [];
    if (trust.trusted && trust.delegated_account_session_id) {
      for (const request of input.store.listForAccount({
        authenticatedProfileRef: session.profile.profile_id,
        accountSessionId: session.session_id,
      })) {
        if (request.status !== "pending_user_delegation") continue;
        const granted = input.store.grant({
          requestRef: request.transition_request_ref,
          authenticatedProfileRef: session.profile.profile_id,
          accountSessionId: session.session_id,
          accountType: session.account_policy.account_type,
          leaseSeconds: request.requested_lease_seconds,
        });
        delegatedRequestRefs.push(granted.request.transition_request_ref);
      }
    }
    res.json({
      ok: true,
      trust: publicTrust(trust),
      delegated_request_refs: delegatedRequestRefs,
      ...flags,
    });
  }));

  router.post("/full-harness-trust/renew", route(async (req, res) => {
    requireSameOrigin(req);
    const session = await account(req);
    const body = trustedRenewalSchema.parse(req.body);
    const { deviceId, security } = requireNativeTrustStore();
    if (!input.onTrustedRenewal) {
      throw new DesktopMcpTunnelTransitionError(
        "transition_native_broker_unavailable",
        503,
      );
    }
    const trust = await security.inspectFullHarnessTrust({
      profileId: session.profile.profile_id,
      deviceId,
    });
    if (
      !trust.trusted ||
      trust.delegated_account_session_id !== session.session_id
    ) {
      throw new DesktopMcpTunnelTransitionError(
        "transition_trusted_renewal_forbidden",
        403,
      );
    }
    const renewed = input.store.renewTrustedDeviceLease({
      previousRequestRef: body.previous_transition_request_ref,
      authenticatedProfileRef: session.profile.profile_id,
      accountSessionId: session.session_id,
      accountType: session.account_policy.account_type,
    });
    const delegationRef = renewed.request.delegation_ref;
    const delegationExpiresAt = renewed.request.delegation_expires_at;
    if (!delegationRef || !delegationExpiresAt) {
      throw new DesktopMcpTunnelTransitionError(
        "transition_delegation_not_active",
        409,
      );
    }
    try {
      const native = await input.onTrustedRenewal({
        transitionRequestRef: renewed.request.transition_request_ref,
        delegationRef,
        delegationExpiresAt,
        accountSessionId: session.session_id,
      });
      if (!native.accepted) {
        throw new Error("transition_native_broker_rejected");
      }
      res.json({
        ok: true,
        renewed: true,
        request: renewed.request,
        receipt: renewed.authorization.receipt,
        native_receipt_ref: native.nativeReceiptRef,
        trust: publicTrust(trust),
        ...flags,
      });
    } catch (error) {
      input.store.settle({
        requestRef: renewed.request.transition_request_ref,
        eventType: "failed",
        reasonCode: "trusted_renewal_native_transition_rejected",
      });
      throw error;
    }
  }));

  router.get("/requests", route(async (req, res) => {
    const session = await account(req);
    const requests = input.store.listForAccount({
      authenticatedProfileRef: session.profile.profile_id,
      accountSessionId: session.session_id,
    });
    res.json({ ok: true, requests, ...flags });
  }));

  router.post("/requests/:requestRef/delegate", route(async (req, res) => {
    requireSameOrigin(req);
    const session = await account(req);
    const body = decisionSchema.parse(req.body);
    const result = input.store.grant({
      requestRef: req.params.requestRef,
      authenticatedProfileRef: session.profile.profile_id,
      accountSessionId: session.session_id,
      accountType: session.account_policy.account_type,
      leaseSeconds: body.lease_seconds,
    });
    res.json({ ok: true, ...result, ...flags });
  }));

  router.post("/requests/:requestRef/revoke", route(async (req, res) => {
    requireSameOrigin(req);
    const session = await account(req);
    decisionSchema.parse(req.body);
    const existing = input.store.listForAccount({
      authenticatedProfileRef: session.profile.profile_id,
      accountSessionId: session.session_id,
    }).find((request) => request.transition_request_ref === req.params.requestRef);
    const receipt = input.store.revoke({
      requestRef: req.params.requestRef,
      authenticatedProfileRef: session.profile.profile_id,
      accountSessionId: session.session_id,
    });
    const canRequestReadOnly = Boolean(
      input.onRevoked &&
      existing?.delegation_ref &&
      existing.delegation_expires_at,
    );
    if (
      canRequestReadOnly &&
      input.onRevoked &&
      existing?.delegation_ref &&
      existing.delegation_expires_at
    ) {
      await input.onRevoked({
        transitionRequestRef: req.params.requestRef,
        delegationRef: existing.delegation_ref,
        delegationExpiresAt: existing.delegation_expires_at,
        accountSessionId: session.session_id,
      });
    }
    res.json({
      ok: true,
      receipt,
      read_only_return_requested: canRequestReadOnly,
      ...flags,
    });
  }));

  return router;
};
