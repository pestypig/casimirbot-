import crypto from "node:crypto";
import {
  HELIX_PANEL_LAUNCH_CONTEXT_SCHEMA,
  HELIX_SURFACE_PANEL_ROUTE_RECEIPT_SCHEMA,
  SURFACE_PANEL_ROUTE_TARGETS,
  SurfaceCommandSchema,
  SurfaceControlLeaseSchema,
  SurfaceDesiredStateSchema,
  SurfaceInstanceSchema,
  SurfacePanelRouteReceiptSchema,
  SurfacePanelRouteRequestSchema,
  SurfacePrincipalSchema,
  SurfaceReceiptSchema,
  type SurfaceCommand,
  type SurfaceControlLease,
  type SurfaceDesiredState,
  type SurfaceInstance,
  type SurfaceOperation,
  type SurfacePanelRouteReceipt,
  type SurfacePanelRouteRequest,
  type SurfacePrincipal,
  type SurfaceReceipt,
} from "@shared/helix-surface-registry";

export type SurfaceRegistryErrorCode =
  | "surface_not_found"
  | "surface_conflict"
  | "surface_released"
  | "profile_mismatch"
  | "control_lease_required"
  | "control_lease_invalid"
  | "source_identity_mismatch"
  | "invalid_surface_request";

export class SurfaceRegistryError extends Error {
  constructor(public readonly status: number, public readonly code: SurfaceRegistryErrorCode, message: string) {
    super(message);
    this.name = "SurfaceRegistryError";
  }
}

type Clock = () => Date;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, canonicalize(entry)]));
  }
  return value;
};

const hash = (value: unknown) => crypto.createHash("sha256")
  .update(JSON.stringify(canonicalize(value)))
  .digest("hex");

const canonicalState = (surface: Omit<SurfaceInstance, "state_hash">) => ({
  schema: surface.schema,
  revision: surface.revision,
  status: surface.status,
  desired_state: surface.desired_state,
  output_lease: surface.output_lease ? {
    source_id: surface.output_lease.source_id,
    producer_epoch: surface.output_lease.producer_epoch,
    output_target: surface.output_lease.output_target,
    status: surface.output_lease.status,
    release_reason: surface.output_lease.release_reason,
  } : null,
  program_input_authority: false,
  reflex_authority: false,
  model_answer_authority: false,
});

const clone = <T>(value: T): T => structuredClone(value);

export class SurfaceRegistryService {
  private readonly surfaces = new Map<string, SurfaceInstance>();
  private readonly receipts = new Map<string, SurfaceReceipt[]>();
  private readonly routeReceipts = new Map<string, SurfacePanelRouteReceipt[]>();
  private readonly leases = new Map<string, SurfaceControlLease>();

  constructor(private readonly now: Clock = () => new Date()) {}

  create(ownerProfileId: string, desiredStateInput: SurfaceDesiredState, surfaceInstanceId = crypto.randomUUID()) {
    const desired_state = SurfaceDesiredStateSchema.parse(desiredStateInput);
    if (this.surfaces.has(surfaceInstanceId)) {
      throw new SurfaceRegistryError(409, "surface_conflict", "The surface instance already exists.");
    }
    const occurredAt = this.now().toISOString();
    const base: Omit<SurfaceInstance, "state_hash"> = {
      schema: "helix.surface_registry.v1",
      surface_instance_id: surfaceInstanceId,
      owner_profile_id: ownerProfileId,
      revision: 1,
      status: "active",
      desired_state,
      output_lease: this.issueOutputLease(surfaceInstanceId, ownerProfileId, desired_state, occurredAt),
      created_at: occurredAt,
      updated_at: occurredAt,
      program_input_authority: false,
      reflex_authority: false,
      model_answer_authority: false,
    };
    const surface = SurfaceInstanceSchema.parse({ ...base, state_hash: hash(canonicalState(base)) });
    this.surfaces.set(surfaceInstanceId, surface);
    const principal = this.systemPrincipal(ownerProfileId, "surface-registry-create");
    const receipt = this.record(surface, "create", principal, 0, null, true);
    return { surface: clone(surface), receipt };
  }

  list(ownerProfileId: string): SurfaceInstance[] {
    this.expireLeases();
    return [...this.surfaces.values()]
      .filter((surface) => surface.owner_profile_id === ownerProfileId)
      .map(clone);
  }

  inspect(ownerProfileId: string, surfaceInstanceId: string) {
    this.expireLeases();
    const surface = this.requireSurface(ownerProfileId, surfaceInstanceId);
    return {
      surface: clone(surface),
      receipts: clone(this.receipts.get(surfaceInstanceId) ?? []),
      route_receipts: clone(this.routeReceipts.get(surfaceInstanceId) ?? []),
    };
  }

  issueControlLease(ownerProfileId: string, surfaceInstanceId: string, threadId: string, permittedOperations: SurfaceOperation[], durationMs: number) {
    const surface = this.requireSurface(ownerProfileId, surfaceInstanceId);
    if (surface.status === "released") throw new SurfaceRegistryError(409, "surface_released", "Released surfaces cannot grant control leases.");
    const issued = this.now();
    const lease = SurfaceControlLeaseSchema.parse({
      schema: "helix.surface_control_lease.v1",
      control_lease_id: crypto.randomUUID(),
      surface_instance_id: surfaceInstanceId,
      owner_profile_id: ownerProfileId,
      thread_id: threadId,
      bound_profile_id: surface.desired_state.profile_id,
      bound_source_id: surface.desired_state.source.source_id,
      bound_producer_epoch: surface.desired_state.source.producer_epoch,
      permitted_operations: [...new Set(permittedOperations)],
      issued_at: issued.toISOString(),
      expires_at: new Date(issued.getTime() + Math.min(15 * 60_000, Math.max(1_000, durationMs))).toISOString(),
      status: "active",
      revoked_at: null,
    });
    this.leases.set(lease.control_lease_id, lease);
    const receipt = this.record(surface, "lease_issue", this.systemPrincipal(ownerProfileId, "user-consent"), surface.revision, surface.state_hash, false);
    return { lease: clone(lease), receipt };
  }

  revokeControlLease(ownerProfileId: string, controlLeaseId: string) {
    const lease = this.leases.get(controlLeaseId);
    if (!lease || lease.owner_profile_id !== ownerProfileId) throw new SurfaceRegistryError(404, "control_lease_invalid", "The control lease is unavailable.");
    const surface = this.requireSurface(ownerProfileId, lease.surface_instance_id);
    const updated = SurfaceControlLeaseSchema.parse({ ...lease, status: "revoked", revoked_at: this.now().toISOString() });
    this.leases.set(controlLeaseId, updated);
    return { lease: clone(updated), receipt: this.record(surface, "lease_revoke", this.systemPrincipal(ownerProfileId, "user-revoke"), surface.revision, surface.state_hash, false) };
  }

  execute(ownerProfileId: string, surfaceInstanceId: string, commandInput: SurfaceCommand, principalInput: SurfacePrincipal) {
    const command = SurfaceCommandSchema.parse(commandInput);
    const principal = SurfacePrincipalSchema.parse(principalInput);
    const surface = this.requireSurface(ownerProfileId, surfaceInstanceId);
    if (principal.owner_profile_id !== ownerProfileId) throw new SurfaceRegistryError(403, "profile_mismatch", "The principal and surface owner profiles do not match.");
    if (surface.revision !== command.expected_revision) throw new SurfaceRegistryError(409, "surface_conflict", `Expected revision ${command.expected_revision}, found ${surface.revision}.`);
    if (surface.status === "released") throw new SurfaceRegistryError(409, "surface_released", "The surface has already been released.");
    if (principal.kind === "mcp_codex") this.requireLease(surface, command, principal);

    const occurredAt = this.now().toISOString();
    const previous = clone(surface);
    let desired_state = surface.desired_state;
    let status: SurfaceInstance["status"] = surface.status;
    let output_lease = surface.output_lease;
    if (command.operation === "configure") {
      desired_state = command.desired_state;
      status = "active";
      output_lease = this.releaseOutputLease(output_lease, "reconfigured", occurredAt);
      output_lease = this.issueOutputLease(surfaceInstanceId, ownerProfileId, desired_state, occurredAt);
    } else if (command.operation === "blank") {
      status = "blanked";
      output_lease = this.releaseOutputLease(output_lease, "emergency_blank", occurredAt);
      this.revokeSurfaceLeases(surfaceInstanceId, occurredAt);
    } else {
      status = "released";
      output_lease = this.releaseOutputLease(output_lease, "manual_release", occurredAt);
      this.revokeSurfaceLeases(surfaceInstanceId, occurredAt);
    }
    const base: Omit<SurfaceInstance, "state_hash"> = {
      ...surface,
      revision: surface.revision + 1,
      status,
      desired_state,
      output_lease,
      updated_at: occurredAt,
    };
    const updated = SurfaceInstanceSchema.parse({ ...base, state_hash: hash(canonicalState(base)) });
    this.surfaces.set(surfaceInstanceId, updated);
    return { surface: clone(updated), receipt: this.record(updated, command.operation, principal, previous.revision, previous.state_hash, true) };
  }

  preparePanelRoute(
    ownerProfileId: string,
    surfaceInstanceId: string,
    requestInput: SurfacePanelRouteRequest,
    principalInput: SurfacePrincipal,
  ) {
    const request = SurfacePanelRouteRequestSchema.parse(requestInput);
    const principal = SurfacePrincipalSchema.parse(principalInput);
    const surface = this.requireSurface(ownerProfileId, surfaceInstanceId);
    if (principal.owner_profile_id !== ownerProfileId) {
      throw new SurfaceRegistryError(403, "profile_mismatch", "The principal and surface owner profiles do not match.");
    }
    if (surface.revision !== request.expected_revision) {
      throw new SurfaceRegistryError(409, "surface_conflict", `Expected revision ${request.expected_revision}, found ${surface.revision}.`);
    }
    if (principal.kind === "mcp_codex") {
      this.requireRouteLease(surface, principal);
    }

    const targetPanelId = SURFACE_PANEL_ROUTE_TARGETS[request.target];
    const context = {
      schema: HELIX_PANEL_LAUNCH_CONTEXT_SCHEMA,
      panel_id: targetPanelId,
      surface_instance_id: surface.surface_instance_id,
      surface_revision: surface.revision,
      profile_id: surface.desired_state.profile_id,
      run_id: surface.desired_state.run_id,
      source_id: surface.desired_state.source.source_id,
      producer_epoch: surface.desired_state.source.producer_epoch,
      sequence_id: request.sequence_id,
      output_lease_id: surface.output_lease?.status === "active"
        ? surface.output_lease.output_lease_id
        : null,
      requested_view: request.requested_view,
      focus_target: request.focus_target,
    };
    this.validateLaunchContext(ownerProfileId, context);
    const receipt = SurfacePanelRouteReceiptSchema.parse({
      schema: HELIX_SURFACE_PANEL_ROUTE_RECEIPT_SCHEMA,
      route_id: crypto.randomUUID(),
      surface_instance_id: surface.surface_instance_id,
      surface_revision: surface.revision,
      target: request.target,
      target_panel_id: targetPanelId,
      context,
      principal,
      occurred_at: this.now().toISOString(),
      content_role: "surface_panel_route_receipt_not_assistant_answer",
      assistant_answer: false,
      terminal_eligible: false,
      program_input_authority: false,
      reflex_authority: false,
      model_answer_authority: false,
    });
    this.routeReceipts.set(surfaceInstanceId, [
      ...(this.routeReceipts.get(surfaceInstanceId) ?? []),
      receipt,
    ]);
    return { surface: clone(surface), route: clone(receipt) };
  }

  revokeSource(ownerProfileId: string, sourceId: string, producerEpoch: string) {
    return this.cleanup(ownerProfileId, "source_revoke", "source_revoked", (surface) => surface.desired_state.source.source_id === sourceId && surface.desired_state.source.producer_epoch === producerEpoch);
  }

  rotateSource(ownerProfileId: string, sourceId: string, priorProducerEpoch: string) {
    return this.cleanup(ownerProfileId, "source_rotate", "source_rotated", (surface) => surface.desired_state.source.source_id === sourceId && surface.desired_state.source.producer_epoch === priorProducerEpoch);
  }

  signOut(ownerProfileId: string) {
    return this.cleanup(ownerProfileId, "sign_out", "sign_out", () => true, true);
  }

  validateLaunchContext(ownerProfileId: string, context: { surface_instance_id: string | null; surface_revision: number | null; profile_id: string | null; source_id: string | null; producer_epoch: string | null }) {
    if (!context.surface_instance_id) return null;
    const surface = this.requireSurface(ownerProfileId, context.surface_instance_id);
    const matches = context.surface_revision === surface.revision
      && context.profile_id === surface.desired_state.profile_id
      && context.source_id === surface.desired_state.source.source_id
      && context.producer_epoch === surface.desired_state.source.producer_epoch;
    if (!matches) throw new SurfaceRegistryError(409, "source_identity_mismatch", "The panel launch context does not match the canonical surface identity.");
    return clone(surface);
  }

  private requireLease(surface: SurfaceInstance, command: SurfaceCommand, principal: SurfacePrincipal) {
    if (!principal.control_lease_id || !principal.thread_id) throw new SurfaceRegistryError(403, "control_lease_required", "A scoped user-issued control lease is required.");
    this.expireLeases();
    const lease = this.leases.get(principal.control_lease_id);
    if (!lease || lease.status !== "active" || lease.surface_instance_id !== surface.surface_instance_id || lease.owner_profile_id !== surface.owner_profile_id || lease.thread_id !== principal.thread_id || !lease.permitted_operations.includes(command.operation)) {
      throw new SurfaceRegistryError(403, "control_lease_invalid", "The control lease is missing, expired, revoked, or outside its scope.");
    }
    const desired = command.operation === "configure" ? command.desired_state : surface.desired_state;
    if (lease.bound_profile_id !== surface.desired_state.profile_id || lease.bound_source_id !== surface.desired_state.source.source_id || lease.bound_producer_epoch !== surface.desired_state.source.producer_epoch || lease.bound_profile_id !== desired.profile_id || lease.bound_source_id !== desired.source.source_id || lease.bound_producer_epoch !== desired.source.producer_epoch) {
      throw new SurfaceRegistryError(409, "source_identity_mismatch", "The command is not bound to the leased profile, source, and producer epoch.");
    }
  }

  private requireRouteLease(surface: SurfaceInstance, principal: SurfacePrincipal) {
    if (!principal.control_lease_id || !principal.thread_id) {
      throw new SurfaceRegistryError(403, "control_lease_required", "A scoped user-issued control lease is required.");
    }
    this.expireLeases();
    const lease = this.leases.get(principal.control_lease_id);
    if (
      !lease ||
      lease.status !== "active" ||
      lease.surface_instance_id !== surface.surface_instance_id ||
      lease.owner_profile_id !== surface.owner_profile_id ||
      lease.thread_id !== principal.thread_id ||
      !lease.permitted_operations.includes("route")
    ) {
      throw new SurfaceRegistryError(403, "control_lease_invalid", "The control lease is missing, expired, revoked, or outside its scope.");
    }
    if (
      lease.bound_profile_id !== surface.desired_state.profile_id ||
      lease.bound_source_id !== surface.desired_state.source.source_id ||
      lease.bound_producer_epoch !== surface.desired_state.source.producer_epoch
    ) {
      throw new SurfaceRegistryError(409, "source_identity_mismatch", "The route is not bound to the leased profile, source, and producer epoch.");
    }
  }

  private requireSurface(ownerProfileId: string, id: string) {
    const surface = this.surfaces.get(id);
    if (!surface || surface.owner_profile_id !== ownerProfileId) throw new SurfaceRegistryError(404, "surface_not_found", "The surface instance is unavailable.");
    return surface;
  }

  private issueOutputLease(surfaceId: string, owner: string, desired: SurfaceDesiredState, occurredAt: string) {
    return {
      schema: "helix.surface_registry.v1" as const,
      output_lease_id: crypto.randomUUID(), surface_instance_id: surfaceId, owner_profile_id: owner,
      source_id: desired.source.source_id, producer_epoch: desired.source.producer_epoch,
      output_target: desired.output_target, status: "active" as const, issued_at: occurredAt,
      expires_at: new Date(new Date(occurredAt).getTime() + 15 * 60_000).toISOString(), released_at: null,
      release_reason: "none" as const,
    };
  }

  private releaseOutputLease(lease: SurfaceInstance["output_lease"], reason: Exclude<NonNullable<SurfaceInstance["output_lease"]>["release_reason"], "none" | "expired">, at: string) {
    return lease ? { ...lease, status: "released" as const, released_at: at, release_reason: reason } : null;
  }

  private revokeSurfaceLeases(surfaceId: string, at: string) {
    for (const [id, lease] of this.leases) if (lease.surface_instance_id === surfaceId && lease.status === "active") this.leases.set(id, { ...lease, status: "revoked", revoked_at: at });
  }

  private expireLeases() {
    const now = this.now().getTime();
    for (const [id, lease] of this.leases) if (lease.status === "active" && Date.parse(lease.expires_at) <= now) this.leases.set(id, { ...lease, status: "expired" });
  }

  private cleanup(owner: string, operation: "source_revoke" | "source_rotate" | "sign_out", reason: "source_revoked" | "source_rotated" | "sign_out", predicate: (surface: SurfaceInstance) => boolean, released = false) {
    const results: Array<{ surface: SurfaceInstance; receipt: SurfaceReceipt }> = [];
    for (const surface of this.surfaces.values()) {
      if (surface.owner_profile_id !== owner || surface.status === "released" || !predicate(surface)) continue;
      const at = this.now().toISOString();
      const base: Omit<SurfaceInstance, "state_hash"> = { ...surface, revision: surface.revision + 1, status: released ? "released" : "blanked", output_lease: this.releaseOutputLease(surface.output_lease, reason, at), updated_at: at };
      const updated = SurfaceInstanceSchema.parse({ ...base, state_hash: hash(canonicalState(base)) });
      this.surfaces.set(surface.surface_instance_id, updated);
      this.revokeSurfaceLeases(surface.surface_instance_id, at);
      results.push({ surface: clone(updated), receipt: this.record(updated, operation, this.systemPrincipal(owner, operation), surface.revision, surface.state_hash, true) });
    }
    return results;
  }

  private record(surface: SurfaceInstance, operation: SurfaceReceipt["operation"], principal: SurfacePrincipal, priorRevision: number, priorHash: string | null, changed: boolean) {
    const receipt = SurfaceReceiptSchema.parse({
      schema: "helix.surface_registry_receipt.v1", receipt_id: crypto.randomUUID(), surface_instance_id: surface.surface_instance_id,
      operation, principal, prior_revision: priorRevision, applied_revision: surface.revision, prior_state_hash: priorHash,
      applied_state_hash: surface.state_hash, changed, occurred_at: this.now().toISOString(),
      content_role: "surface_control_receipt_not_assistant_answer", assistant_answer: false, terminal_eligible: false,
      program_input_authority: false, reflex_authority: false, model_answer_authority: false,
    });
    this.receipts.set(surface.surface_instance_id, [...(this.receipts.get(surface.surface_instance_id) ?? []), receipt]);
    return clone(receipt);
  }

  private systemPrincipal(owner: string, id: string): SurfacePrincipal {
    return { kind: "system_cleanup", principal_id: id, owner_profile_id: owner, thread_id: null, control_lease_id: null };
  }
}

export const surfaceRegistryService = new SurfaceRegistryService();
