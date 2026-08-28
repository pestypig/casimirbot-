import crypto from "node:crypto";
import { z } from "zod";

export const HELIX_ENVIRONMENT_MONITOR_LEASE_SCHEMA =
  "helix.environment_monitor_lease.v1" as const;
export const HELIX_ENVIRONMENT_MONITOR_DELIVERY_SCHEMA =
  "helix.environment_monitor_delivery.v1" as const;
export const HELIX_ENVIRONMENT_MONITOR_SNAPSHOT_SCHEMA =
  "helix.environment_monitor_fresh_snapshot.v1" as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .regex(/^[a-zA-Z0-9:._/-]+$/);
const timestampSchema = z.string().datetime({ offset: true });
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left, _leftValue]: [string, unknown], [right, _rightValue]: [string, unknown]) =>
        left.localeCompare(right),
      )
      .map(([key, entry]: [string, unknown]) => [key, stableValue(entry)]),
  );
};

export const helixEnvironmentMonitorSha256 = (value: unknown): string =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(stableValue(value)), "utf8")
    .digest("hex")}`;

export const HELIX_ENVIRONMENT_MONITOR_EVENT_FAMILIES = [
  "actor",
  "inventory",
  "hazard",
  "focus",
  "workflow",
  "authority",
  "durable_goal",
  "market",
  "portfolio",
  "orders",
  "risk_control",
  "paper_simulation",
] as const;

export const helixEnvironmentMonitorIdentitySchema = z
  .object({
    owner_profile_id: identifierSchema,
    mcp_client_id: identifierSchema,
    client_continuation_ref: identifierSchema,
    run_id: identifierSchema,
    goal_id: identifierSchema,
    room_id: identifierSchema.nullable(),
    participant_id: identifierSchema,
    environment_binding_id: identifierSchema,
    source_id: identifierSchema,
    world_id: identifierSchema,
    subject_ref: identifierSchema,
    producer_epoch_ref: identifierSchema,
    policy_revision: z.number().int().nonnegative(),
  })
  .strict();

export type HelixEnvironmentMonitorIdentity = z.infer<
  typeof helixEnvironmentMonitorIdentitySchema
>;

export const helixEnvironmentMonitorLeaseSchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_MONITOR_LEASE_SCHEMA),
    monitor_id: identifierSchema,
    identity: helixEnvironmentMonitorIdentitySchema,
    event_families: z
      .array(z.enum(HELIX_ENVIRONMENT_MONITOR_EVENT_FAMILIES))
      .min(1)
      .max(HELIX_ENVIRONMENT_MONITOR_EVENT_FAMILIES.length),
    max_event_age_ms: z.number().int().min(100).max(300_000),
    wake_budget_total: z.number().int().min(1).max(10_000),
    wakes_delivered: z.number().int().nonnegative(),
    delivered_cursor: z.number().int().nonnegative(),
    acknowledged_cursor: z.number().int().nonnegative(),
    fresh_snapshot_required: z.boolean(),
    gap_after_cursor: z.number().int().nonnegative().nullable(),
    recovery_snapshot_evidence_ref: identifierSchema.nullable(),
    recovery_snapshot_observed_at: timestampSchema.nullable(),
    status: z.enum(["active", "revoked", "expired"]),
    created_at: timestampSchema,
    updated_at: timestampSchema,
    expires_at: timestampSchema,
    revoked_at: timestampSchema.nullable(),
    credential_included: z.literal(false),
    raw_events_included: z.literal(false),
    content_role: z.literal(
      "environment_monitor_lease_control_not_assistant_answer",
    ),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((lease: any, context: z.RefinementCtx) => {
    if (new Set(lease.event_families).size !== lease.event_families.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["event_families"],
        message: "Monitor event families must be unique.",
      });
    }
    if (lease.acknowledged_cursor > lease.delivered_cursor) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["acknowledged_cursor"],
        message: "A monitor cannot acknowledge evidence it has not delivered.",
      });
    }
    if (lease.wakes_delivered > lease.wake_budget_total) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wakes_delivered"],
        message: "A monitor cannot exceed its admitted wake budget.",
      });
    }
    if (Date.parse(lease.expires_at) <= Date.parse(lease.created_at)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expires_at"],
        message: "A monitor lease must expire after it is created.",
      });
    }
    if ((lease.status === "revoked") !== Boolean(lease.revoked_at)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["revoked_at"],
        message: "Only a revoked monitor carries a revocation time.",
      });
    }
    if (lease.fresh_snapshot_required !== (lease.gap_after_cursor !== null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fresh_snapshot_required"],
        message: "A retention gap must require a fresh snapshot.",
      });
    }
    if (
      Boolean(lease.recovery_snapshot_evidence_ref) !==
      Boolean(lease.recovery_snapshot_observed_at)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recovery_snapshot_evidence_ref"],
        message: "A monitor recovery snapshot must retain both evidence and observation time.",
      });
    }
  });

export type HelixEnvironmentMonitorLease = z.infer<
  typeof helixEnvironmentMonitorLeaseSchema
>;

export const helixEnvironmentMonitorItemSchema = z
  .object({
    evidence_ref: identifierSchema,
    digest_id: identifierSchema,
    digest_hash: sha256Schema,
    observation_revision: z.number().int().nonnegative(),
    event_families: z
      .array(z.enum(HELIX_ENVIRONMENT_MONITOR_EVENT_FAMILIES))
      .min(1),
    source_id: identifierSchema,
    world_id: identifierSchema,
    subject_ref: identifierSchema,
    producer_epoch_ref: identifierSchema,
    observed_at: timestampSchema,
    provenance_valid: z.literal(true),
    raw_events_included: z.literal(false),
    content_role: z.literal(
      "environment_monitor_item_not_assistant_answer",
    ),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
  })
  .strict();

export type HelixEnvironmentMonitorItem = z.infer<
  typeof helixEnvironmentMonitorItemSchema
>;

export const helixEnvironmentMonitorDeliverySchema = z
  .object({
    schema: z.literal(HELIX_ENVIRONMENT_MONITOR_DELIVERY_SCHEMA),
    delivery_id: identifierSchema,
    monitor_id: identifierSchema,
    disposition: z.enum([
      "delivered",
      "timeout",
      "retention_gap",
      "lease_inactive",
      "wake_budget_exhausted",
    ]),
    cursor_before: z.number().int().nonnegative(),
    cursor_after: z.number().int().nonnegative(),
    items: z.array(helixEnvironmentMonitorItemSchema).max(20),
    fresh_snapshot_required: z.boolean(),
    gap_after_cursor: z.number().int().nonnegative().nullable(),
    client_wake_transport: z.enum(["active_wait", "native_continuation"]),
    wake_requested: z.boolean(),
    delivered_at: timestampSchema,
    credential_included: z.literal(false),
    raw_events_included: z.literal(false),
    reentry_required: z.literal(true),
    content_role: z.literal(
      "environment_monitor_delivery_not_assistant_answer",
    ),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict()
  .superRefine((delivery: any, context: z.RefinementCtx) => {
    if (delivery.cursor_after < delivery.cursor_before) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cursor_after"],
        message: "A monitor delivery cursor cannot regress.",
      });
    }
    const hasItems = delivery.items.length > 0;
    if ((delivery.disposition === "delivered") !== hasItems) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Only a delivered monitor result carries semantic items.",
      });
    }
    if (hasItems && delivery.cursor_after === delivery.cursor_before) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cursor_after"],
        message: "A semantic delivery must advance its monitor cursor.",
      });
    }
    if (
      delivery.disposition === "retention_gap" !==
      delivery.fresh_snapshot_required
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fresh_snapshot_required"],
        message: "Only a retention gap forces snapshot recovery.",
      });
    }
    if (
      delivery.fresh_snapshot_required !==
      (delivery.gap_after_cursor !== null)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gap_after_cursor"],
        message: "Snapshot recovery must identify the cursor after the gap.",
      });
    }
    if (delivery.wake_requested !== hasItems) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wake_requested"],
        message: "Only a semantic item delivery may request one client wake.",
      });
    }
  });

export type HelixEnvironmentMonitorDelivery = z.infer<
  typeof helixEnvironmentMonitorDeliverySchema
>;

export class HelixEnvironmentMonitorContractError extends Error {
  constructor(
    readonly code:
      | "monitor_inactive"
      | "monitor_expired"
      | "monitor_identity_mismatch"
      | "monitor_event_family_forbidden"
      | "monitor_event_stale"
      | "monitor_wake_budget_exhausted"
      | "monitor_cursor_regression"
      | "monitor_cursor_not_delivered"
      | "monitor_snapshot_required",
    message: string,
  ) {
    super(message);
    this.name = "HelixEnvironmentMonitorContractError";
  }
}

const uniqueSorted = <T extends string>(values: T[]): T[] =>
  [...new Set(values)].sort() as T[];

export const createHelixEnvironmentMonitorLease = (input: {
  monitorId: string;
  identity: HelixEnvironmentMonitorIdentity;
  eventFamilies: HelixEnvironmentMonitorLease["event_families"];
  maxEventAgeMs: number;
  wakeBudgetTotal: number;
  createdAt?: string;
  expiresAt: string;
}): HelixEnvironmentMonitorLease => {
  const createdAt = input.createdAt ?? new Date().toISOString();
  return helixEnvironmentMonitorLeaseSchema.parse({
    schema: HELIX_ENVIRONMENT_MONITOR_LEASE_SCHEMA,
    monitor_id: input.monitorId,
    identity: input.identity,
    event_families: uniqueSorted(input.eventFamilies),
    max_event_age_ms: input.maxEventAgeMs,
    wake_budget_total: input.wakeBudgetTotal,
    wakes_delivered: 0,
    delivered_cursor: 0,
    acknowledged_cursor: 0,
    fresh_snapshot_required: false,
    gap_after_cursor: null,
    recovery_snapshot_evidence_ref: null,
    recovery_snapshot_observed_at: null,
    status: "active",
    created_at: createdAt,
    updated_at: createdAt,
    expires_at: input.expiresAt,
    revoked_at: null,
    credential_included: false,
    raw_events_included: false,
    content_role: "environment_monitor_lease_control_not_assistant_answer",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};

const requireActive = (
  lease: HelixEnvironmentMonitorLease,
  now: string,
): void => {
  if (lease.status !== "active") {
    throw new HelixEnvironmentMonitorContractError(
      "monitor_inactive",
      "The environment monitor lease is not active.",
    );
  }
  if (Date.parse(lease.expires_at) <= Date.parse(now)) {
    throw new HelixEnvironmentMonitorContractError(
      "monitor_expired",
      "The environment monitor lease expired.",
    );
  }
};

const requireItem = (
  lease: HelixEnvironmentMonitorLease,
  item: HelixEnvironmentMonitorItem,
  now: string,
): void => {
  if (
    item.source_id !== lease.identity.source_id ||
    item.world_id !== lease.identity.world_id ||
    item.subject_ref !== lease.identity.subject_ref ||
    item.producer_epoch_ref !== lease.identity.producer_epoch_ref
  ) {
    throw new HelixEnvironmentMonitorContractError(
      "monitor_identity_mismatch",
      "Semantic monitor evidence belongs to a different source, world, subject, or producer epoch.",
    );
  }
  if (item.event_families.some(
    (family: (typeof HELIX_ENVIRONMENT_MONITOR_EVENT_FAMILIES)[number]) =>
      !lease.event_families.includes(family),
  )) {
    throw new HelixEnvironmentMonitorContractError(
      "monitor_event_family_forbidden",
      "Semantic monitor evidence exceeds the admitted event families.",
    );
  }
  if (Date.parse(now) - Date.parse(item.observed_at) > lease.max_event_age_ms) {
    throw new HelixEnvironmentMonitorContractError(
      "monitor_event_stale",
      "Semantic monitor evidence is older than the lease permits.",
    );
  }
};

const deliveryId = (
  monitorId: string,
  cursorBefore: number,
  disposition: string,
  evidenceRefs: string[],
): string =>
  `environment_monitor_delivery:${helixEnvironmentMonitorSha256([
    monitorId,
    cursorBefore,
    disposition,
    evidenceRefs,
  ]).slice("sha256:".length)}`;

export const deliverHelixEnvironmentMonitorItems = (input: {
  lease: HelixEnvironmentMonitorLease;
  items: HelixEnvironmentMonitorItem[];
  now?: string;
  clientWakeTransport?: "active_wait" | "native_continuation";
}): { lease: HelixEnvironmentMonitorLease; delivery: HelixEnvironmentMonitorDelivery } => {
  const now = input.now ?? new Date().toISOString();
  requireActive(input.lease, now);
  if (input.lease.fresh_snapshot_required) {
    throw new HelixEnvironmentMonitorContractError(
      "monitor_snapshot_required",
      "A fresh snapshot must repair the monitor retention gap before delivery continues.",
    );
  }
  if (input.lease.wakes_delivered >= input.lease.wake_budget_total) {
    throw new HelixEnvironmentMonitorContractError(
      "monitor_wake_budget_exhausted",
      "The environment monitor wake budget is exhausted.",
    );
  }
  const items: HelixEnvironmentMonitorItem[] = input.items.map(
    (item: HelixEnvironmentMonitorItem) =>
      helixEnvironmentMonitorItemSchema.parse(item) as HelixEnvironmentMonitorItem,
  );
  items.forEach((item: HelixEnvironmentMonitorItem) =>
    requireItem(input.lease, item, now),
  );
  const uniqueItems = items.filter(
    (item: HelixEnvironmentMonitorItem, index: number) =>
      items.findIndex(
        (candidate: HelixEnvironmentMonitorItem) =>
          candidate.evidence_ref === item.evidence_ref,
      ) ===
      index,
  );
  if (uniqueItems.length === 0) {
    throw new HelixEnvironmentMonitorContractError(
      "monitor_event_family_forbidden",
      "A semantic monitor delivery requires at least one admitted evidence item.",
    );
  }
  const cursorAfter = input.lease.delivered_cursor + 1;
  const lease = helixEnvironmentMonitorLeaseSchema.parse({
    ...input.lease,
    delivered_cursor: cursorAfter,
    wakes_delivered: input.lease.wakes_delivered + 1,
    updated_at: now,
  });
  const delivery = helixEnvironmentMonitorDeliverySchema.parse({
    schema: HELIX_ENVIRONMENT_MONITOR_DELIVERY_SCHEMA,
    delivery_id: deliveryId(
      lease.monitor_id,
      input.lease.delivered_cursor,
      "delivered",
      uniqueItems.map((item: HelixEnvironmentMonitorItem) => item.evidence_ref),
    ),
    monitor_id: lease.monitor_id,
    disposition: "delivered",
    cursor_before: input.lease.delivered_cursor,
    cursor_after: cursorAfter,
    items: uniqueItems,
    fresh_snapshot_required: false,
    gap_after_cursor: null,
    client_wake_transport: input.clientWakeTransport ?? "active_wait",
    wake_requested: true,
    delivered_at: now,
    credential_included: false,
    raw_events_included: false,
    reentry_required: true,
    content_role: "environment_monitor_delivery_not_assistant_answer",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
  return { lease, delivery };
};

export const markHelixEnvironmentMonitorRetentionGap = (input: {
  lease: HelixEnvironmentMonitorLease;
  now?: string;
}): { lease: HelixEnvironmentMonitorLease; delivery: HelixEnvironmentMonitorDelivery } => {
  const now = input.now ?? new Date().toISOString();
  requireActive(input.lease, now);
  const lease = helixEnvironmentMonitorLeaseSchema.parse({
    ...input.lease,
    fresh_snapshot_required: true,
    gap_after_cursor: input.lease.delivered_cursor,
    updated_at: now,
  });
  return {
    lease,
    delivery: helixEnvironmentMonitorDeliverySchema.parse({
      schema: HELIX_ENVIRONMENT_MONITOR_DELIVERY_SCHEMA,
      delivery_id: deliveryId(
        lease.monitor_id,
        lease.delivered_cursor,
        "retention_gap",
        [],
      ),
      monitor_id: lease.monitor_id,
      disposition: "retention_gap",
      cursor_before: lease.delivered_cursor,
      cursor_after: lease.delivered_cursor,
      items: [],
      fresh_snapshot_required: true,
      gap_after_cursor: lease.delivered_cursor,
      client_wake_transport: "active_wait",
      wake_requested: false,
      delivered_at: now,
      credential_included: false,
      raw_events_included: false,
      reentry_required: true,
      content_role: "environment_monitor_delivery_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    }),
  };
};

export const acknowledgeHelixEnvironmentMonitor = (input: {
  lease: HelixEnvironmentMonitorLease;
  cursor: number;
  now?: string;
}): HelixEnvironmentMonitorLease => {
  const now = input.now ?? new Date().toISOString();
  requireActive(input.lease, now);
  if (input.cursor < input.lease.acknowledged_cursor) {
    throw new HelixEnvironmentMonitorContractError(
      "monitor_cursor_regression",
      "An environment monitor acknowledgement cannot regress.",
    );
  }
  if (input.cursor > input.lease.delivered_cursor) {
    throw new HelixEnvironmentMonitorContractError(
      "monitor_cursor_not_delivered",
      "An environment monitor cannot acknowledge an undelivered cursor.",
    );
  }
  return helixEnvironmentMonitorLeaseSchema.parse({
    ...input.lease,
    acknowledged_cursor: input.cursor,
    updated_at: now,
  });
};

export const buildHelixEnvironmentMonitorIdleDelivery = (input: {
  lease: HelixEnvironmentMonitorLease;
  now?: string;
}): HelixEnvironmentMonitorDelivery => {
  const now = input.now ?? new Date().toISOString();
  const disposition =
    input.lease.status !== "active" ||
    Date.parse(input.lease.expires_at) <= Date.parse(now)
      ? "lease_inactive"
      : input.lease.fresh_snapshot_required
        ? "retention_gap"
      : input.lease.wakes_delivered >= input.lease.wake_budget_total
        ? "wake_budget_exhausted"
        : "timeout";
  return helixEnvironmentMonitorDeliverySchema.parse({
    schema: HELIX_ENVIRONMENT_MONITOR_DELIVERY_SCHEMA,
    delivery_id: deliveryId(
      input.lease.monitor_id,
      input.lease.delivered_cursor,
      disposition,
      [],
    ),
    monitor_id: input.lease.monitor_id,
    disposition,
    cursor_before: input.lease.delivered_cursor,
    cursor_after: input.lease.delivered_cursor,
    items: [],
    fresh_snapshot_required: input.lease.fresh_snapshot_required,
    gap_after_cursor: input.lease.gap_after_cursor,
    client_wake_transport: "active_wait",
    wake_requested: false,
    delivered_at: now,
    credential_included: false,
    raw_events_included: false,
    reentry_required: true,
    content_role: "environment_monitor_delivery_not_assistant_answer",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};

export const repairHelixEnvironmentMonitorWithFreshSnapshot = (input: {
  lease: HelixEnvironmentMonitorLease;
  snapshotEvidenceRef: string;
  observedAt: string;
  now?: string;
}): HelixEnvironmentMonitorLease => {
  const now = input.now ?? new Date().toISOString();
  requireActive(input.lease, now);
  identifierSchema.parse(input.snapshotEvidenceRef);
  timestampSchema.parse(input.observedAt);
  if (!input.lease.fresh_snapshot_required) return input.lease;
  if (Date.parse(input.observedAt) < Date.parse(input.lease.updated_at)) {
    throw new HelixEnvironmentMonitorContractError(
      "monitor_snapshot_required",
      "The snapshot predates the monitor retention gap.",
    );
  }
  return helixEnvironmentMonitorLeaseSchema.parse({
    ...input.lease,
    fresh_snapshot_required: false,
    gap_after_cursor: null,
    recovery_snapshot_evidence_ref: input.snapshotEvidenceRef,
    recovery_snapshot_observed_at: input.observedAt,
    updated_at: now,
  });
};

export const revokeHelixEnvironmentMonitor = (input: {
  lease: HelixEnvironmentMonitorLease;
  now?: string;
}): HelixEnvironmentMonitorLease => {
  const now = input.now ?? new Date().toISOString();
  requireActive(input.lease, now);
  return helixEnvironmentMonitorLeaseSchema.parse({
    ...input.lease,
    status: "revoked",
    revoked_at: now,
    updated_at: now,
  });
};
