import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { createServer, type Server } from "node:http";
import path from "node:path";
let server: Server;
let origin: string;
test.beforeAll(async () => {
  const bundle = await build({ entryPoints: [path.resolve("client/e2e/onboarding-isolated/durable-entry.tsx")],
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic",
    define: { "process.env.NODE_ENV": '"test"' } });
  server = createServer((req, res) => {
    if (req.url === "/fixture.js") { res.setHeader("Content-Type", "text/javascript"); res.end(bundle.outputFiles[0].text); }
    else if (req.url === "/") { res.setHeader("Content-Type", "text/html"); res.end('<div id="root"></div><script src="/fixture.js"></script>'); }
    else { res.writeHead(404); res.end(); }
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture_listener_missing");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => { if (server) await new Promise<void>(resolve => server.close(() => resolve())); });
for (const input of ["pointer", "keyboard"] as const) {
 for (const width of [375, 1280]) {
  test(`O4 ${input} consent at ${width}px survives idle and reload`, async ({ page }) => {
    await page.setViewportSize({ width, height: 640 });
    const writes: unknown[] = [];
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort("blockedbyclient");
      if (!url.pathname.startsWith("/api/")) return route.continue();
      if (url.pathname.includes("/reasoning-invitations/")) return route.fulfill({ json: {
        ok: true, pairing: null, execution_authority: false, answer_authority: false,
      } });
      if (url.pathname.endsWith("/reasoning-destinations")) return route.fulfill({ json: {
        ok: true, execution_authority: false, answer_authority: false, destinations: [{
          registrationId: "fixture-registration", expiresAt: "2026-09-09T12:00:00.000Z",
          destinationDigest: "a".repeat(64),
          proofBasis: "authenticated_client_declaration", currentPresence: false,
          pairingAuthority: false, executionAuthority: false,
          destination: { issuer: "fixture-issuer", profileId: "fixture-owner", installationId: "fixture-installation", clientId: "fixture-client", taskId: "fixture-task" },
        }],
      } });
      if (url.pathname.endsWith("/reasoning-invitations")) {
        writes.push(route.request().postDataJSON());
        return route.fulfill({ status: 503, json: { ok: false } });
      }
      return route.abort("blockedbyclient");
    });
    await page.goto(origin);
    const picker = page.getByLabel("Registered AI task");
    await expect(picker.locator("option")).toHaveCount(2);
    if (input === "pointer") await picker.selectOption("fixture-registration");
    else { await picker.focus(); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); }
    const run = page.getByLabel(/Include environment run/);
    const consent = page.getByLabel(/I approve pairing/);
    if (input === "pointer") {
      await consent.scrollIntoViewIfNeeded();
      const bounds = await consent.boundingBox();
      if (!bounds) throw new Error("fixture_consent_bounds_missing");
      // Deliberately occlude the fixture. A native pointer click must hit the
      // overlay, not approve through it. No forced clicks or production UI.
      await page.evaluate(() => {
        const overlay = document.createElement("div");
        overlay.id = "fixture-overlay";
        overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.2)";
        const close = document.createElement("button");
        close.textContent = "Close fixture overlay";
        close.onclick = () => overlay.remove();
        overlay.append(close); document.body.append(overlay);
      });
      await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await expect(consent).not.toBeChecked();
      expect(writes).toHaveLength(0);
      await page.getByRole("button", { name: "Close fixture overlay" }).click();
    }
    for (const control of [run, consent]) {
      if (input === "pointer") await control.click();
      else { await control.focus(); await page.keyboard.press("Space"); }
      await expect(control).toBeChecked();
    }
    const approve = page.getByRole("button", { name: "Approve pairing and create invitation" });
    if (input === "pointer") await approve.click();
    else { await approve.focus(); await page.keyboard.press("Enter"); }
    await expect(page.getByRole("alert")).toBeVisible();
    expect(writes).toHaveLength(1);
    await page.reload();
    const reconcile = page.getByRole("button", { name: "Reconcile invitation" });
    await expect(reconcile).toBeEnabled();
    await reconcile.click();
    await expect(page.getByRole("alert")).toBeVisible();
    expect(writes).toHaveLength(2);
    expect(writes[1]).toEqual(writes[0]);
    expect(writes[0]).toMatchObject({ chatId: "fixture-chat", environment: { roomId: "fixture-room", runId: "fixture-run" } });
  });
 }
}
