import {
  Router,
  json,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { z, ZodError } from "zod";
import { readHelixSessionCookie } from "../services/helix-account/session-cookie";
import {
  resolveWorkstationGatewayAccountContext,
  type HelixWorkstationGatewayAccountContext,
} from "../services/helix-ask/workstation-tool-gateway/account-policy";
import {
  SharedLiveRoomBindingStore,
  SharedLiveRoomBindingStoreError,
  type SharedLiveRoomAuthorizedTerminalMessage,
  type SharedLiveRoomChatContextSnapshot,
  type SharedLiveRoomObserverEventPage,
  type SharedLiveRoomRunChatBinding,
} from "../services/shared-live-room-control/binding-store";
import { getSharedLiveRoomBindingStore } from "../services/shared-live-room-control/default-service";
import { redactSharedLiveRoomSensitiveText } from "../services/shared-live-room-control/sensitive-text";
import {
  FirstPartyCookieBoundary,
  FirstPartyCookieBoundaryError,
  type FirstPartyCookieBoundaryOptions,
} from "../middleware/first-party-cookie-boundary";

const OBSERVER_BINDING_RECEIPT_SCHEMA =
  "helix.agent_run_observer.binding_receipt.v1" as const;
const OBSERVER_EVENTS_PAGE_SCHEMA =
  "helix.agent_run_observer.events_page.v1" as const;
const OBSERVER_TERMINAL_PROJECTION_SCHEMA =
  "helix.agent_run_observer.terminal_projection.v1" as const;
const OBSERVER_ERROR_SCHEMA = "helix.agent_run_observer.error.v1" as const;

type AccountResolver = (
  sessionId: string | null,
) => Promise<HelixWorkstationGatewayAccountContext>;

type ObserverStore = Pick<
  SharedLiveRoomBindingStore,
  | "createPendingChatBinding"
  | "getObserverBinding"
  | "listObserverEvents"
  | "projectAuthorizedTerminalMessage"
  | "revokeObserverBinding"
>;

type ObserverContextMessageInput = {
  role: "user" | "assistant";
  content: string;
  at?: string;
};

type ObserverContextInput = {
  messages: ObserverContextMessageInput[];
};

export type AgentRunObserverRouterDependencies = {
  store?: ObserverStore;
  resolveAccount?: AccountResolver;
  now?: () => Date;
  security?: Omit<FirstPartyCookieBoundaryOptions, "codePrefix">;
};

class AgentRunObserverRouteError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AgentRunObserverRouteError";
  }
}

const contextMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(2_000),
    at: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

const contextSchema = z
  .object({
    messages: z.array(contextMessageSchema).min(1).max(12),
  })
  .strict()
  .superRefine((context: ObserverContextInput, refinement: z.RefinementCtx) => {
    const charCount = context.messages.reduce(
      (total: number, message: ObserverContextMessageInput) =>
        total + message.content.length,
      0,
    );
    if (charCount > 12_000) {
      refinement.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Context must contain at most 12,000 characters.",
        path: ["messages"],
      });
    }
  });

const createBindingSchema = z
  .object({
    chat_session_id: z.string().trim().min(1).max(240),
    context: contextSchema.optional(),
  })
  .strict();

const eventsQuerySchema = z
  .object({
    after_seq: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(200).default(100),
  })
  .strict();

const bindingRefSchema = z.string().trim().min(1).max(240);

const nonAuthorityFlags = {
  answer_authority: false as const,
  assistant_answer: false as const,
  terminal_eligible: false as const,
  raw_content_included: false as const,
};

const projectBinding = (binding: SharedLiveRoomRunChatBinding) => ({
  binding_ref: binding.bindingId,
  status: binding.status,
  claim_expires_at: binding.claimExpiresAt,
  context_snapshot_ref: binding.contextSnapshotRef,
  context_message_count: binding.contextMessageCount,
  created_at: binding.createdAt,
  updated_at: binding.updatedAt,
});

const projectTerminalMessage = (
  terminal: SharedLiveRoomAuthorizedTerminalMessage,
) => ({
  message_id: terminal.messageId,
  role: terminal.role,
  content: terminal.content,
  at: terminal.at,
  traceId: terminal.authorityRef,
  helixAsk: {
    schema: OBSERVER_TERMINAL_PROJECTION_SCHEMA,
    binding_ref: terminal.bindingRef,
    authority_ref: terminal.authorityRef,
    terminal_text_hash: terminal.terminalTextHash,
  },
});

const buildContextSnapshot = (
  parsed: ObserverContextInput | undefined,
  capturedAt: string,
): SharedLiveRoomChatContextSnapshot | null => {
  if (!parsed) return null;
  return {
    schema: "helix.agent_run_chat_context_snapshot.v1",
    messages: parsed.messages.map((message: ObserverContextMessageInput) => ({
      role: message.role,
      content: redactSharedLiveRoomSensitiveText(message.content).text,
      at: message.at ? new Date(message.at).toISOString() : null,
    })),
    captured_at: capturedAt,
    context_role: "non_authoritative_conversation_context",
    ...nonAuthorityFlags,
  };
};

const requireBrowserProfile = async (
  req: Request,
  resolveAccount: AccountResolver,
  options: { requireFeature?: boolean } = {},
): Promise<string> => {
  const context = await resolveAccount(
    readHelixSessionCookie(req.headers.cookie),
  );
  if (
    !context.trusted_account_session ||
    !context.session_id ||
    !context.profile_id ||
    !context.account_session ||
    context.account_session.profile.auth_mode === "guest"
  ) {
    throw new AgentRunObserverRouteError(
      "observer_auth_required",
      401,
      "A signed-in non-guest browser session is required.",
    );
  }
  if (
    options.requireFeature !== false &&
    (!context.account_policy.feature_flags.includes("shared_realtime_rooms") ||
      context.account_policy.locked_features.includes("shared_realtime_rooms"))
  ) {
    throw new AgentRunObserverRouteError(
      "observer_account_policy_blocked",
      403,
      "The shared live room observer is outside this account policy.",
    );
  }
  return context.profile_id;
};

const sendError = (res: Response, error: unknown): void => {
  if (error instanceof ZodError) {
    res.status(400).json({
      schema: OBSERVER_ERROR_SCHEMA,
      ok: false,
      error: "binding_invalid",
      message: "The observer binding request is invalid.",
      ...nonAuthorityFlags,
    });
    return;
  }
  if (error instanceof FirstPartyCookieBoundaryError) {
    res.status(error.statusCode).json({
      schema: OBSERVER_ERROR_SCHEMA,
      ok: false,
      error: error.code,
      message: error.message,
      ...(error.retryAfterMs !== null
        ? { retry_after_ms: error.retryAfterMs }
        : {}),
      ...nonAuthorityFlags,
    });
    return;
  }
  if (
    error instanceof AgentRunObserverRouteError ||
    error instanceof SharedLiveRoomBindingStoreError
  ) {
    res.status(error.statusCode).json({
      schema: OBSERVER_ERROR_SCHEMA,
      ok: false,
      error: error.code,
      message: error.message,
      ...nonAuthorityFlags,
    });
    return;
  }
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error.status === 400 || error.status === 413)
  ) {
    res.status(error.status).json({
      schema: OBSERVER_ERROR_SCHEMA,
      ok: false,
      error:
        error.status === 413 ? "observer_payload_too_large" : "binding_invalid",
      message:
        error.status === 413
          ? "The observer binding payload exceeds 64kb."
          : "The observer binding JSON is invalid.",
      ...nonAuthorityFlags,
    });
    return;
  }
  const safeMessage = redactSharedLiveRoomSensitiveText(
    error instanceof Error ? error.message : "unknown",
  ).text;
  console.warn("[agent-run-observer] request failed", safeMessage);
  res.status(503).json({
    schema: OBSERVER_ERROR_SCHEMA,
    ok: false,
    error: "observer_unavailable",
    message: "The agent run observer is temporarily unavailable.",
    ...nonAuthorityFlags,
  });
};

const asyncRoute =
  (handler: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, _next: NextFunction): void => {
    void handler(req, res).catch((error: unknown) => sendError(res, error));
  };

const eventsResponse = (
  page: SharedLiveRoomObserverEventPage,
  terminal: SharedLiveRoomAuthorizedTerminalMessage | null,
) => ({
  schema: OBSERVER_EVENTS_PAGE_SCHEMA,
  binding_ref: page.binding.bindingId,
  events: page.events,
  next_after_seq: page.nextAfterSeq,
  has_more: page.hasMore,
  terminal_message: terminal ? projectTerminalMessage(terminal) : null,
  ...nonAuthorityFlags,
});

export const createAgentRunObserverRouter = (
  dependencies: AgentRunObserverRouterDependencies = {},
): Router => {
  const router = Router();
  const store = dependencies.store ?? getSharedLiveRoomBindingStore();
  const resolveAccount =
    dependencies.resolveAccount ?? resolveWorkstationGatewayAccountContext;
  const now = dependencies.now ?? (() => new Date());
  const boundary = new FirstPartyCookieBoundary({
    codePrefix: "observer",
    ipMax: Number(process.env.HELIX_AGENT_RUN_OBSERVER_IP_RATE_LIMIT ?? "300"),
    accountMax: Number(
      process.env.HELIX_AGENT_RUN_OBSERVER_ACCOUNT_RATE_LIMIT ?? "240",
    ),
    ...dependencies.security,
  });

  router.use(
    "/agent-run-observer",
    boundary.noStore,
    boundary.enforceIpRateLimit,
    boundary.enforceSameOrigin,
    json({ limit: "64kb" }),
  );

  const requireRateLimitedBrowserProfile = async (
    req: Request,
    res: Response,
    options: { requireFeature?: boolean } = {},
  ): Promise<string> => {
    const profileId = await requireBrowserProfile(req, resolveAccount, options);
    boundary.enforceAccountRateLimit(res, profileId);
    return profileId;
  };

  router.post(
    "/agent-run-observer/bindings",
    asyncRoute(async (req: Request, res: Response) => {
      const profileId = await requireRateLimitedBrowserProfile(req, res);
      const parsed = createBindingSchema.parse(req.body);
      const capturedAt = now().toISOString();
      const created = await store.createPendingChatBinding({
        browserProfileId: profileId,
        chatSessionId: parsed.chat_session_id,
        contextSnapshot: buildContextSnapshot(parsed.context, capturedAt),
        now: capturedAt,
      });
      res.status(201).json({
        schema: OBSERVER_BINDING_RECEIPT_SCHEMA,
        ok: true,
        error: null,
        message: "Observer binding created.",
        binding: projectBinding(created.binding),
        claim_handle: created.claimHandle,
        claim_handle_shown_once: true,
        ...nonAuthorityFlags,
      });
    }),
  );

  router.get(
    "/agent-run-observer/bindings/:bindingRef",
    asyncRoute(async (req: Request, res: Response) => {
      const profileId = await requireRateLimitedBrowserProfile(req, res);
      const bindingRef = bindingRefSchema.parse(req.params.bindingRef);
      const binding = await store.getObserverBinding({
        browserProfileId: profileId,
        bindingRef,
      });
      if (!binding) {
        throw new SharedLiveRoomBindingStoreError(
          "chat_binding_not_found",
          404,
          "Observer binding not found.",
        );
      }
      res.status(200).json({
        schema: OBSERVER_BINDING_RECEIPT_SCHEMA,
        ok: true,
        error: null,
        message: "Observer binding inspected.",
        binding: projectBinding(binding),
        ...nonAuthorityFlags,
      });
    }),
  );

  router.delete(
    "/agent-run-observer/bindings/:bindingRef",
    asyncRoute(async (req: Request, res: Response) => {
      const profileId = await requireRateLimitedBrowserProfile(req, res, {
        requireFeature: false,
      });
      const bindingRef = bindingRefSchema.parse(req.params.bindingRef);
      const revoked = await store.revokeObserverBinding({
        browserProfileId: profileId,
        bindingRef,
        now: now().toISOString(),
      });
      res.status(200).json({
        schema: OBSERVER_BINDING_RECEIPT_SCHEMA,
        ok: true,
        error: null,
        message: "Observer binding disconnected.",
        binding: projectBinding(revoked),
        claim_handle: null,
        claim_handle_shown_once: false,
        ...nonAuthorityFlags,
      });
    }),
  );

  router.get(
    "/agent-run-observer/bindings/:bindingRef/events",
    asyncRoute(async (req: Request, res: Response) => {
      const profileId = await requireRateLimitedBrowserProfile(req, res);
      const bindingRef = bindingRefSchema.parse(req.params.bindingRef);
      const query = eventsQuerySchema.parse(req.query);
      const terminal = await store.projectAuthorizedTerminalMessage({
        browserProfileId: profileId,
        bindingRef,
        now: now().toISOString(),
      });
      const page = await store.listObserverEvents({
        browserProfileId: profileId,
        bindingRef,
        afterSeq: query.after_seq,
        limit: query.limit,
      });
      res.status(200).json(eventsResponse(page, terminal));
    }),
  );

  router.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction,
    ): void => {
      sendError(res, error);
    },
  );
  return router;
};

export const agentRunObserverRouter = createAgentRunObserverRouter();
