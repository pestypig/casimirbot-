import { describe, expect, it, vi } from "vitest";
import type { Session } from "electron";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { installDesktopSessionSecurity } from
  "../apps/desktop/src/security";

describe("desktop Electron session security", () => {
  it("denies browser permissions, device access, and renderer downloads", () => {
    let permissionCheck: ((...args: unknown[]) => boolean) | null = null;
    let permissionRequest:
      | ((webContents: unknown, permission: unknown, callback: (allowed: boolean) => void) => void)
      | null = null;
    let devicePermission: ((...args: unknown[]) => boolean) | null = null;
    let downloadListener: ((event: { preventDefault: () => void }) => void) | null = null;
    const targetSession = {
      setPermissionCheckHandler(handler: typeof permissionCheck) {
        permissionCheck = handler;
      },
      setPermissionRequestHandler(handler: typeof permissionRequest) {
        permissionRequest = handler;
      },
      setDevicePermissionHandler(handler: typeof devicePermission) {
        devicePermission = handler;
      },
      on(event: string, listener: typeof downloadListener) {
        if (event === "will-download") downloadListener = listener;
        return this;
      },
    } as unknown as Session;

    installDesktopSessionSecurity(targetSession);

    expect(permissionCheck?.()).toBe(false);
    const callback = vi.fn();
    permissionRequest?.(null, "media", callback);
    expect(callback).toHaveBeenCalledWith(false);
    expect(devicePermission?.()).toBe(false);
    const preventDefault = vi.fn();
    downloadListener?.({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it("keeps risky renderer features explicitly disabled", async () => {
    const mainSource = await readFile(
      path.resolve("apps/desktop/src/main.ts"),
      "utf8",
    );
    for (const declaration of [
      "webviewTag: false",
      "plugins: false",
      "safeDialogs: true",
      "spellcheck: false",
      "navigateOnDragDrop: false",
    ]) {
      expect(mainSource).toContain(declaration);
    }
  });

  it("rechecks the packaged Codex plugin before opening its consent surface", async () => {
    const mainSource = await readFile(
      path.resolve("apps/desktop/src/main.ts"),
      "utf8",
    );
    expect(mainSource).toContain("reinspectCodexPluginIntegration(");
    expect(mainSource).toContain("Codex plugin bundle changed after startup");
    expect(mainSource).toContain("shell.openExternal(");
    expect(mainSource).not.toContain("codex plugin marketplace add");
    expect(mainSource).not.toContain("codex plugin add");
  });

  it("bounds desktop service startup and requires full packaged readiness", async () => {
    const [mainSource, buildSource, smokeSource] = await Promise.all([
      readFile(path.resolve("apps/desktop/src/main.ts"), "utf8"),
      readFile(
        path.resolve("apps/desktop/scripts/build-host.mjs"),
        "utf8",
      ),
      readFile(
        path.resolve("apps/desktop/scripts/smoke-packaged-launch.ps1"),
        "utf8",
      ),
    ]);
    expect(mainSource).toContain("const SERVICE_HEAP_LIMIT_MB = 1_024");
    expect(mainSource).toContain("AbortSignal.timeout(");
    expect(mainSource).toContain("desktop-service-startup.log");
    expect(mainSource).toContain("desktop-service-ready.json");
    expect(mainSource).toContain("const childExited = new Promise<void>");
    expect(mainSource).toContain("child.kill()");
    expect(buildSource).toContain(
      '"data/starsim/solar-reference-pack.v1.json"',
    );
    expect(buildSource).toContain(
      '"data/starsim/solar-product-registry.v1.json"',
    );
    expect(buildSource).toContain("requiredDataAssets");
    expect(smokeSource).toContain("casimir_desktop_service_ready_receipt/1");
    expect(smokeSource).toContain("FullReadinessReceipt = \"PASS\"");
    expect(smokeSource).toContain(
      "$ids = @(Get-ProcessTreeIds ([uint32]$rootProcess.Id))",
    );
    expect(smokeSource).toContain(
      "$ids -contains [uint32]$_.OwningProcess",
    );
    expect(smokeSource).toContain("$listenerCount -eq 2");
    expect(smokeSource).toContain("ServiceListenerReceipt = \"PASS\"");
    expect(smokeSource).toContain(
      "The ready receipt did not identify exactly one service listener.",
    );
    expect(smokeSource).toContain(
      "The packaged application did not reach full API readiness.",
    );
  });

  it("routes subscription management through the exact sanitized Stripe portal projection", async () => {
    const [mainSource, billingSchema] = await Promise.all([
      readFile(path.resolve("apps/desktop/src/main.ts"), "utf8"),
      readFile(path.resolve("shared/helix-billing-entitlement.ts"), "utf8"),
    ]);
    expect(mainSource).toContain("targetRef === HELIX_BILLING_PORTAL_TARGET");
    expect(mainSource).toContain("helixBillingPortalOperationSchema.safeParse");
    expect(mainSource).toContain("await shell.openExternal(hosted.data.hosted_url)");
    expect(billingSchema).toContain('url.hostname === "billing.stripe.com"');
    expect(billingSchema).toContain("customer_reference_included: z.literal(false)");
  });
});
