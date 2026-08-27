import { describe, expect, it } from "vitest";
import {
  buildHelixLocalSupervisorStatus,
  createHelixLocalSupervisorIdentity,
  helixWorkspaceRefFor,
  resolveHelixLocalSupervisorMode,
} from "../local-supervisor-identity";
import { decideHelixLocalSupervisorAttachment } from
  "../local-supervisor-attachment";

describe("local supervisor identity", () => {
  it("canonicalizes equivalent Windows workspace paths without exposing them", () => {
    const upper = helixWorkspaceRefFor("C:\\Work\\CasimirBot");
    const lower = helixWorkspaceRefFor("c:/work/casimirbot");
    expect(upper).toBe(lower);
    expect(upper).toMatch(/^workspace:[a-f0-9]{64}$/u);
    expect(upper).not.toContain("casimirbot");
  });

  it("keeps one process identity stable while separating another boot", () => {
    const common = {
      workspacePath: "C:\\Work\\CasimirBot",
      environment: {},
      startedAt: "2026-08-26T12:00:00.000Z",
    };
    const first = createHelixLocalSupervisorIdentity({
      ...common,
      entropy: "first",
    });
    const same = createHelixLocalSupervisorIdentity({
      ...common,
      entropy: "first",
    });
    const second = createHelixLocalSupervisorIdentity({
      ...common,
      entropy: "second",
    });
    expect(first).toEqual(same);
    expect(first.serviceInstanceRef).not.toBe(second.serviceInstanceRef);
    expect(first.workspaceRef).toBe(second.workspaceRef);
  });

  it("claims one-instance enforcement only for an enforcing supervisor", () => {
    expect(resolveHelixLocalSupervisorMode({ CASIMIR_DESKTOP_HOST: "1" })).toBe(
      "desktop_single_instance",
    );
    expect(
      resolveHelixLocalSupervisorMode({
        CASIMIR_KEYED_LAUNCHER_SUPERVISED: "1",
      }),
    ).toBe("external_keyed_launcher");
    expect(resolveHelixLocalSupervisorMode({})).toBe("external_process");

    const status = buildHelixLocalSupervisorStatus({
      identity: createHelixLocalSupervisorIdentity({
        workspacePath: "C:\\Work\\CasimirBot",
        environment: {},
        startedAt: "2026-08-26T12:00:00.000Z",
        entropy: "unmanaged",
      }),
      ready: true,
    });
    expect(status.one_instance_enforced).toBe(false);
    expect(status.attach_supported).toBe(true);
    expect(status.concurrent_read_admission).toBe("grant_scoped");
    expect(status.mutation_admission).toBe("serialized_execution_lease");
    expect(status.credential_included).toBe(false);
    expect(status.private_endpoint_included).toBe(false);
    expect(status.workspace_path_included).toBe(false);
    expect(status.process_identity_included).toBe(false);
    expect(status.account_identity_included).toBe(false);
    expect(status.answer_authority).toBe(false);
    expect(status.terminal_eligible).toBe(false);
  });

  it("attaches only to the exact ready enforcing workspace", () => {
    const identity = createHelixLocalSupervisorIdentity({
      workspacePath: "C:\\Work\\CasimirBot",
      environment: { CASIMIR_DESKTOP_HOST: "1" },
      startedAt: "2026-08-26T12:00:00.000Z",
      entropy: "desktop",
    });
    const status = buildHelixLocalSupervisorStatus({ identity, ready: true });
    expect(decideHelixLocalSupervisorAttachment({
      expectedWorkspaceRef: identity.workspaceRef,
      status,
      listenerPresent: true,
    })).toEqual({
      decision: "attach",
      reason: "compatible_workspace_service",
    });
    expect(decideHelixLocalSupervisorAttachment({
      expectedWorkspaceRef: helixWorkspaceRefFor("C:\\Work\\Other"),
      status,
      listenerPresent: true,
    })).toEqual({ decision: "fail_closed", reason: "workspace_mismatch" });
  });

  it("starts only when no listener exists and never replaces an unknown listener", () => {
    const expectedWorkspaceRef = helixWorkspaceRefFor("C:\\Work\\CasimirBot");
    expect(decideHelixLocalSupervisorAttachment({
      expectedWorkspaceRef,
      status: null,
      listenerPresent: false,
    })).toEqual({ decision: "start", reason: "no_listener" });
    expect(decideHelixLocalSupervisorAttachment({
      expectedWorkspaceRef,
      status: null,
      listenerPresent: true,
    })).toEqual({ decision: "fail_closed", reason: "invalid_status" });
  });

  it("may attach to a matching external service without claiming supervisor enforcement", () => {
    const identity = createHelixLocalSupervisorIdentity({
      workspacePath: "C:\\Work\\CasimirBot",
      environment: {},
      startedAt: "2026-08-26T12:00:00.000Z",
      entropy: "plain",
    });
    const status = buildHelixLocalSupervisorStatus({ identity, ready: true });
    expect(decideHelixLocalSupervisorAttachment({
      expectedWorkspaceRef: identity.workspaceRef,
      status,
      listenerPresent: true,
    })).toEqual({
      decision: "attach",
      reason: "compatible_workspace_service",
    });
    expect(status.one_instance_enforced).toBe(false);
    expect(status.content_role).toBe("local_supervisor_status_not_authority");
  });
});
