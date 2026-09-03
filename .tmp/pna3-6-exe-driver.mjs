import { _electron as electron } from "playwright";
import { createInterface } from "node:readline";
import path from "node:path";

const root = process.cwd();
const executablePath = path.join(root, "apps", "desktop", "release", "win-unpacked", "CasimirBot.exe");
const application = await electron.launch({ executablePath, args: ["--disable-gpu"], timeout: 100_000 });
await application.firstWindow({ timeout: 100_000 });

const deadline = Date.now() + 60_000;
let page;
while (!page && Date.now() < deadline) {
  page = application.windows().find((candidate) => {
    try {
      return new URL(candidate.url()).pathname === "/desktop";
    } catch {
      return false;
    }
  });
  if (!page) await new Promise((resolve) => setTimeout(resolve, 250));
}
if (!page) throw new Error("packaged_desktop_renderer_missing");
await page.waitForLoadState("domcontentloaded");

const emit = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);
emit({ event: "ready", url: page.url(), title: await page.title() });

const callMcpTool = async (name, args) => page.evaluate(async ({ name, args }) => {
  const accountResponse = await fetch("/api/account/session", {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const account = await accountResponse.json();
  const accountSessionId = account?.session?.session_id;
  if (!accountSessionId) throw new Error("desktop_account_session_missing");
  const response = await fetch("/mcp", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "x-casimir-desktop-account-session": accountSessionId,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `acceptance-${Date.now()}`,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`mcp_http_${response.status}:${raw.slice(0, 500)}`);
  }
  const payloadText = raw.startsWith("event:")
    ? raw.split(/\r?\n/).find((line) => line.startsWith("data:"))?.slice(5).trim()
    : raw;
  if (!payloadText) throw new Error("mcp_response_payload_missing");
  const envelope = JSON.parse(payloadText);
  if (envelope.error) throw new Error(`mcp_rpc_${envelope.error.code}:${envelope.error.message}`);
  return envelope.result;
}, { name, args });

const locatorFor = (command) => {
  if (command.testId) return page.getByTestId(command.testId);
  if (command.role) {
    return page.getByRole(command.role, {
      name: command.name,
      exact: command.exact ?? true,
    });
  }
  if (command.text !== undefined) return page.getByText(command.text, { exact: command.exact ?? true });
  if (command.css) return page.locator(command.css);
  throw new Error("locator_required");
};

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of rl) {
  if (!line.trim()) continue;
  try {
    const command = JSON.parse(line);
    if (command.operation === "snapshot") {
      emit({
        ok: true,
        operation: command.operation,
        url: page.url(),
        title: await page.title(),
        body: (await page.locator("body").innerText()).slice(0, command.maxChars ?? 30_000),
        buttons: await page.getByRole("button").allTextContents(),
      });
      continue;
    }
    if (command.operation === "count") {
      emit({ ok: true, operation: command.operation, count: await locatorFor(command).count() });
      continue;
    }
    if (command.operation === "click") {
      const locator = locatorFor(command).nth(command.index ?? 0);
      await locator.waitFor({ state: "visible", timeout: command.timeoutMs ?? 30_000 });
      await locator.click();
      emit({ ok: true, operation: command.operation });
      continue;
    }
    if (command.operation === "domClick") {
      const clicked = await page.evaluate(({ text, exact }) => {
        const normalize = (value) => (value ?? "").replace(/\s+/g, " ").trim();
        const target = normalize(text);
        const candidates = [...document.querySelectorAll("button, [role='button'], [role='menuitem']")];
        const element = candidates.find((entry) => {
          const actual = normalize(entry.textContent) || normalize(entry.getAttribute("aria-label"));
          return exact ? actual === target : actual.includes(target);
        });
        if (!(element instanceof HTMLElement)) return false;
        element.click();
        return true;
      }, { text: command.text, exact: command.exact ?? true });
      emit({ ok: clicked, operation: command.operation, text: command.text });
      continue;
    }
    if (command.operation === "fill") {
      const locator = locatorFor(command).nth(command.index ?? 0);
      await locator.waitFor({ state: "visible", timeout: command.timeoutMs ?? 30_000 });
      await locator.fill(command.value ?? "");
      emit({ ok: true, operation: command.operation });
      continue;
    }
    if (command.operation === "press") {
      const locator = locatorFor(command).nth(command.index ?? 0);
      await locator.press(command.key);
      emit({ ok: true, operation: command.operation });
      continue;
    }
    if (command.operation === "text") {
      const locator = locatorFor(command).nth(command.index ?? 0);
      emit({ ok: true, operation: command.operation, value: await locator.innerText() });
      continue;
    }
    if (command.operation === "value") {
      const locator = locatorFor(command).nth(command.index ?? 0);
      emit({ ok: true, operation: command.operation, value: await locator.inputValue() });
      continue;
    }
    if (command.operation === "safeFields") {
      const fields = await page.locator("input, textarea").evaluateAll((entries) => entries
        .filter((entry) => {
          const type = (entry.getAttribute("type") ?? "text").toLowerCase();
          const marker = `${entry.getAttribute("name") ?? ""} ${entry.getAttribute("aria-label") ?? ""}`.toLowerCase();
          return type !== "password" && !/(token|secret|credential|authorization)/.test(marker);
        })
        .map((entry) => ({
          tag: entry.tagName.toLowerCase(),
          type: entry.getAttribute("type") ?? "text",
          name: entry.getAttribute("name"),
          ariaLabel: entry.getAttribute("aria-label"),
          placeholder: entry.getAttribute("placeholder"),
          value: entry.value,
        })));
      emit({ ok: true, operation: command.operation, fields });
      continue;
    }
    if (command.operation === "nativeTunnelState") {
      const state = await page.evaluate(() => window.casimirDesktop?.getMcpTunnelState());
      emit({ ok: true, operation: command.operation, state });
      continue;
    }
    if (command.operation === "mcpToolNames") {
      const result = await page.evaluate(async () => {
        const accountResponse = await fetch("/api/account/session", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const account = await accountResponse.json();
        const accountSessionId = account?.session?.session_id;
        if (!accountSessionId) throw new Error("desktop_account_session_missing");
        const response = await fetch("/mcp", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json, text/event-stream",
            "Content-Type": "application/json",
            "x-casimir-desktop-account-session": accountSessionId,
          },
          body: JSON.stringify({ jsonrpc: "2.0", id: "acceptance-list", method: "tools/list", params: {} }),
        });
        const raw = await response.text();
        if (!response.ok) throw new Error(`mcp_http_${response.status}`);
        const payloadText = raw.startsWith("event:")
          ? raw.split(/\r?\n/).find((line) => line.startsWith("data:"))?.slice(5).trim()
          : raw;
        const envelope = JSON.parse(payloadText);
        return (envelope.result?.tools ?? []).map((tool) => tool.name);
      });
      emit({ ok: true, operation: command.operation, names: result });
      continue;
    }
    if (command.operation === "mcpCall") {
      const result = await callMcpTool(command.name, command.arguments ?? {});
      emit({ ok: true, operation: command.operation, name: command.name, result });
      continue;
    }
    if (command.operation === "bindCurrentReasoningTask") {
      const continuationRef = command.clientContinuationRef;
      const button = page.getByRole("button", { name: /^(Bind current Helix chat|Replace binding)$/ }).first();
      await button.waitFor({ state: "visible", timeout: command.timeoutMs ?? 30_000 });
      await button.click();
      const handleInput = page.locator("#reasoning-claim-handle");
      await handleInput.waitFor({ state: "visible", timeout: command.timeoutMs ?? 30_000 });
      const claimHandle = await handleInput.inputValue();
      if (!claimHandle) throw new Error("reasoning_claim_handle_missing");
      const result = await callMcpTool("helix_reasoning_task_binding_claim", {
        client_continuation_ref: continuationRef,
        claim_handle: claimHandle,
      });
      emit({ ok: true, operation: command.operation, result });
      continue;
    }
    if (command.operation === "dispatchCurrentSteering") {
      const response = await page.evaluate(async (input) => {
        const request = await fetch(
          "/api/account/session/agent-connections/reasoning-bindings/steering/current",
          {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({
              ...(input.helixConversationId
                ? { helix_conversation_id: input.helixConversationId }
                : {}),
              client_event_ref: input.clientEventRef,
              origin: input.origin,
              instruction_text: input.instructionText,
              expires_in_seconds: input.expiresInSeconds ?? 300,
            }),
          },
        );
        const body = await request.json().catch(() => ({}));
        if (!request.ok) throw new Error(`steering_http_${request.status}:${body.error ?? "unknown"}`);
        return body;
      }, command);
      emit({ ok: true, operation: command.operation, response });
      continue;
    }
    if (command.operation === "inspectCurrentReasoningBinding") {
      const response = await page.evaluate(async (helixConversationId) => {
        const suffix = helixConversationId
          ? `?helix_conversation_id=${encodeURIComponent(helixConversationId)}`
          : "";
        const request = await fetch(
          `/api/account/session/agent-connections/reasoning-bindings/current${suffix}`,
          { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } },
        );
        const body = await request.json().catch(() => ({}));
        if (!request.ok) throw new Error(`binding_http_${request.status}:${body.error ?? "unknown"}`);
        return body;
      }, command.helixConversationId ?? null);
      emit({ ok: true, operation: command.operation, response });
      continue;
    }
    if (command.operation === "revokeReasoningBinding") {
      const response = await page.evaluate(async (bindingId) => {
        const request = await fetch(
          `/api/account/session/agent-connections/reasoning-bindings/${encodeURIComponent(bindingId)}/revoke`,
          { method: "POST", credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } },
        );
        const body = await request.json().catch(() => ({}));
        if (!request.ok) throw new Error(`binding_revoke_http_${request.status}:${body.error ?? "unknown"}`);
        return body;
      }, command.reasoningBindingId);
      emit({ ok: true, operation: command.operation, response });
      continue;
    }
    if (command.operation === "waitText") {
      await page.getByText(command.value, { exact: command.exact ?? false }).first()
        .waitFor({ state: "visible", timeout: command.timeoutMs ?? 30_000 });
      emit({ ok: true, operation: command.operation });
      continue;
    }
    if (command.operation === "screenshot") {
      await page.screenshot({ path: command.path, fullPage: false });
      emit({ ok: true, operation: command.operation, path: command.path });
      continue;
    }
    if (command.operation === "close") {
      emit({ ok: true, operation: command.operation });
      await application.close();
      process.exit(0);
    }
    throw new Error("unsupported_operation");
  } catch (error) {
    emit({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}

await application.close();
