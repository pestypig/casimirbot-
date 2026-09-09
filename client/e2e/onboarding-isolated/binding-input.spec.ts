import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { buildHelixAgentClientReadiness } from "../../../shared/helix-agent-client-readiness";
import { helixAgentConnectionStatusSchema } from "../../../shared/helix-agent-client-profile";

let server: Server;
let origin: string;
test.beforeAll(async () => {
  const bundle = await build({
    entryPoints: [path.resolve("client/e2e/onboarding-isolated/entry.tsx")],
    bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic",
    alias: { "@": path.resolve("client/src"), "@shared": path.resolve("shared") },
    define: { "process.env.NODE_ENV": '"test"', "import.meta.env": "{}" },
  });
  server = createServer((req, res) => {
    if (req.url === "/fixture.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(bundle.outputFiles[0].text);
    } else if (req.url === "/") {
      res.setHeader("Content-Type", "text/html");
      res.end('<!doctype html><html><body><div id="root"></div><script src="/fixture.js"></script></body></html>');
    } else { res.writeHead(404); res.end(); }
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture_listener_missing");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

for (const input of ["pointer", "keyboard"] as const) {
 for (const clipboard of ["available", "denied", "missing", "hung"] as const) {
  test(`real ${input} binds once and copies with ${clipboard} clipboard`, async ({ page, context }) => {
    if (clipboard === "available") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
    } else {
      await page.addInitScript(mode => {
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: mode === "missing" ? undefined : {
          writeText: () => mode === "hung" ? new Promise(() => {}) : Promise.reject(new DOMException("Fixture denial", "NotAllowedError")),
        } });
      }, clipboard);
    }
    const submissions: unknown[] = [];
    const readiness = buildHelixAgentClientReadiness({ agentSelected: true,
      provider_application: "available", client_authorization: "active", client_presence: "online",
      catalog_sync: "current", thread_attachment: "attached", continuation_readiness: "polling",
      environment_readiness: "not_selected" });
    const status = {
      schema: "helix.agent_connection_status.v1", selected_client_profile: "codex_app",
      selected_profile_is_preference_only: true, client_kind_verified: false,
      authenticated_profile_ref: "fixture-owner", service_instance_ref: "fixture-service",
      oauth_binding_ref: "fixture-oauth", authenticated_mcp_client_ref: "fixture-client",
      client_session_ref: "fixture-session", conversation_thread_ref: "fixture-task",
      proof_basis: "authenticated_presence_tool", observed_at: new Date().toISOString(),
      heartbeat_expires_at: new Date(Date.now() + 180_000).toISOString(),
      authorization_changed_after_presence: false, catalog_reenumeration_required: false,
      catalog_recovery: "none", readiness, readiness_schema: readiness.schema,
      verified_run_association: { run_id: "fixture-run", run_version: 1,
        room_id: "fixture-room", verification_ref: "fixture-verification",
        room_binding_id: "fixture-room-binding", room_binding_version: 1 },
      thread_observability_bridge: { negotiated_level: "continuation_ready",
        declaration_basis: "authenticated_client_declaration", checkpoint_publication_status: "not_requested",
        checkpoint_freshness_window_seconds: null, checkpoint_retention: "none",
        checkpoint_revocation: "not_applicable", provider_thread_content_included: false,
        hidden_reasoning_included: false, activity_completeness_claimed: false },
      credential_included: false, oauth_subject_included: false, raw_claims_included: false,
      provider_thread_content_included: false, hidden_reasoning_included: false,
      environment_authority: false, mutation_authority: false, answer_authority: false, terminal_eligible: false,
    };
    helixAgentConnectionStatusSchema.parse(status);
    // Every API request is intercepted; no real consent or authority is created.
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort("blockedbyclient");
      if (!url.pathname.startsWith("/api/")) return route.continue();
      if (url.pathname.endsWith("/readiness")) return route.fulfill({ json: status });
      if (url.pathname.endsWith("/claims")) {
        submissions.push(route.request().postDataJSON());
        return route.fulfill({ status: 201, json: { claim_handle: "fixture-show-once-claim",
          binding: { reasoning_binding_id: "fixture-binding", helix_conversation_id: "fixture-chat",
            status: "pending_claim", continuation_transport: "polling", binding_epoch: 1,
            run_id: "fixture-run", service_instance_ref: "fixture-service",
            expires_at: new Date(Date.now() + 120_000).toISOString() } } });
      }
      return route.fulfill({ status: 404, json: { error: "fixture_not_found" } });
    });
    await page.goto(origin);
    const checkbox = page.getByRole("checkbox", { name: /Include this verified environment run/ });
    await expect(checkbox).toBeEnabled();
    if (input === "pointer") await checkbox.click();
    else { await checkbox.focus(); await page.keyboard.press("Space"); }
    await expect(checkbox).toBeChecked();
    await page.getByRole("button", { name: "Recheck connection", exact: true }).click();
    await expect(checkbox).toBeChecked();
    const bind = page.getByRole("button", { name: "Bind current Helix chat", exact: true });
    if (input === "pointer") await bind.click();
    else { await bind.focus(); await page.keyboard.press("Enter"); }
    await expect(page.getByLabel("Show-once claim handle", { exact: true })).toHaveValue("fixture-show-once-claim");
    expect(submissions).toEqual([{ client_session_ref: "fixture-session",
      helix_conversation_id: "fixture-chat", run_id: "fixture-run",
      run_verification_ref: "fixture-verification" }]);
    const copy = page.getByRole("button", { name: "Copy invitation", exact: true });
    if (input === "pointer") await copy.click();
    else { await copy.focus(); await page.keyboard.press("Enter"); }
    if (clipboard === "available") {
      await expect(page.getByText("Invitation copied.", { exact: false })).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("fixture-show-once-claim");
    } else {
      await expect(page.getByText("Automatic copy could not be confirmed.", { exact: false })).toBeVisible({ timeout: 7000 });
      const field = page.getByLabel("Show-once claim handle", { exact: true });
      await expect(field).toBeFocused();
      expect(await field.evaluate((node: HTMLInputElement) => node.value.slice(node.selectionStart!, node.selectionEnd!))).toBe("fixture-show-once-claim");
    }
    expect(submissions).toHaveLength(1);
  });
 }
}
