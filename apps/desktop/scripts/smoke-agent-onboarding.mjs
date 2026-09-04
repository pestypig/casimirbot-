import { _electron as electron } from "playwright";
import { mkdtemp, rm } from "node:fs/promises";
import { freemem, tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const minimumFreePhysicalGiB = 4;
const freePhysicalGiB = freemem() / 1024 ** 3;
if (freePhysicalGiB < minimumFreePhysicalGiB) {
  throw new Error("Packaged onboarding smoke requires at least 4 GiB physical headroom.");
}

const desktopRoot = path.resolve(import.meta.dirname, "..");
const executablePath = path.join(desktopRoot, "release", "win-unpacked", "CasimirBot.exe");
const tempBase = path.resolve(tmpdir());
const testRoot = await mkdtemp(path.join(tempBase, "casimir-desktop-onboarding-"));
const startedAt = Date.now();
let application;

try {
  application = await electron.launch({
    executablePath,
    args: [`--user-data-dir=${testRoot}`, "--disable-gpu"],
    timeout: 100_000,
  });
  await application.firstWindow({ timeout: 100_000 });
  const windowDeadline = Date.now() + 30_000;
  let page;
  do {
    page = application.windows().find((candidate) => {
      try {
        return new URL(candidate.url()).pathname === "/desktop";
      } catch {
        return false;
      }
    });
    if (!page) await new Promise((resolve) => setTimeout(resolve, 250));
  } while (!page && Date.now() < windowDeadline);
  if (!page) throw new Error("Packaged application did not expose a stable desktop renderer.");
  await page.waitForLoadState("domcontentloaded");
  const origin = new URL(page.url()).origin;

  const nativeBridgeAvailable = await page.evaluate(
    () => typeof window.casimirDesktop?.startMcpTunnel === "function"
      && typeof window.casimirDesktop?.getMcpTunnelState === "function",
  );
  if (!nativeBridgeAvailable) throw new Error("Packaged renderer did not expose the native harness bridge.");

  const button = page.getByRole("button", { name: "Start Harness", exact: true });
  if (await button.count() === 0) {
    const panelPicker = page.getByRole("button", { name: "Open panel picker", exact: true }).first();
    await panelPicker.waitFor({ state: "visible", timeout: 30_000 });
    await panelPicker.click();
    const agentAccess = page.getByRole("button", { name: "Agent Access", exact: true }).first();
    await agentAccess.waitFor({ state: "visible", timeout: 10_000 });
    await agentAccess.click();
  }
  const trustControl = page.getByRole("checkbox", {
    name: "Trust this device for Full Harness",
    exact: false,
  });
  await trustControl.waitFor({ state: "visible", timeout: 30_000 });
  if (await trustControl.isChecked()) {
    throw new Error("Fresh packaged profile enabled trusted-device tunnel approval by default.");
  }
  await trustControl.click();
  await page.getByText(
    "CasimirBot could not change trusted-device approval. Sign in with a developer account and verify this installed device.",
    { exact: true },
  ).waitFor({ state: "visible", timeout: 10_000 });
  if (await trustControl.isChecked()) {
    throw new Error("Unauthenticated packaged profile retained trusted-device tunnel approval.");
  }
  await button.waitFor({ state: "visible", timeout: 30_000 });
  await button.click();
  await page.waitForFunction(() => {
    const labels = [...document.querySelectorAll("button")].map((entry) => entry.textContent?.trim());
    return labels.includes("Start Harness");
  }, undefined, { timeout: 30_000 });

  const tunnel = await page.evaluate(() => window.casimirDesktop?.getMcpTunnelState());
  if (!tunnel || typeof tunnel !== "object") {
    throw new Error("Packaged native harness state was unavailable after activation.");
  }

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin });
  const diagnostics = page.getByRole("button", { name: "Copy diagnostics", exact: true });
  await diagnostics.waitFor({ state: "visible", timeout: 30_000 });
  await diagnostics.click();
  await page.getByText("Sanitized onboarding diagnostics copied.", { exact: true })
    .waitFor({ state: "visible", timeout: 10_000 });
  const diagnosticText = await page.evaluate(() => navigator.clipboard.readText());
  const diagnostic = JSON.parse(diagnosticText);
  if (
    diagnostic.schema !== "helix.agent_harness_onboarding_diagnostic.v1"
    || diagnostic.native_desktop_available !== true
    || diagnostic.provider_task_created !== false
    || diagnostic.codex_ui_automation_used !== false
    || diagnostic.credential_included !== false
    || diagnostic.hidden_reasoning_included !== false
    || diagnostic.answer_authority !== false
    || diagnostic.terminal_eligible !== false
  ) {
    throw new Error("Packaged onboarding diagnostic violated its authority boundary.");
  }
  const serialized = JSON.stringify(diagnostic);
  for (const forbidden of [
    "authenticated_profile_ref",
    "authenticated_mcp_client_ref",
    "conversation_thread_ref",
    "reasoning_binding_id",
    "helix_conversation_id",
  ]) {
    if (serialized.includes(forbidden)) {
      throw new Error(`Packaged onboarding diagnostic exposed ${forbidden}.`);
    }
  }

  process.stdout.write(`${JSON.stringify({
    Verdict: "PASS",
    NativeBridge: "PASS",
    TrustedDeviceDefaultOff: "PASS",
    UnauthenticatedTrustRejected: "PASS",
    StartHarnessSettled: "PASS",
    DiagnosticSanitization: "PASS",
    TunnelStatus: tunnel.status ?? "unknown",
    TunnelScope: tunnel.scope ?? "unknown",
    ElapsedMs: Date.now() - startedAt,
  })}\n`);
} finally {
  await application?.close().catch(() => undefined);
  const validatedRoot = path.resolve(testRoot);
  if (
    path.dirname(validatedRoot) !== tempBase
    || !path.basename(validatedRoot).startsWith("casimir-desktop-onboarding-")
  ) {
    throw new Error("Refused to remove an unvalidated packaged onboarding root.");
  }
  await rm(validatedRoot, { recursive: true, force: true });
}
