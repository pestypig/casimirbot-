import { describe, expect, it } from "vitest";
import { resolveHelixCodexAuthSelection } from "../auth-mode";

describe("Helix Codex authentication selection", () => {
  it("prefers a signed-in ChatGPT session in user-friendly auto mode", () => {
    expect(
      resolveHelixCodexAuthSelection({
        requestedMode: "auto",
        apiKeyAvailable: true,
        chatGptLoginStatus: "available",
      }),
    ).toMatchObject({
      selected_mode: "chatgpt_session",
      status: "available",
      credential_source: "codex_cached_chatgpt_session",
      codex_home_strategy: "operator_default",
      credential_material_exposed: false,
    });
  });

  it("falls back to API-key mode when auto mode has no ChatGPT session", () => {
    expect(
      resolveHelixCodexAuthSelection({
        requestedMode: "auto",
        apiKeyAvailable: true,
        chatGptLoginStatus: "not_logged_in",
      }),
    ).toMatchObject({
      selected_mode: "api_key",
      status: "available",
      credential_source: "openai_api_key_environment",
      codex_home_strategy: "helix_isolated",
    });
  });

  it("uses the cached ChatGPT session when auto mode has no API key", () => {
    expect(
      resolveHelixCodexAuthSelection({
        requestedMode: "auto",
        apiKeyAvailable: false,
        chatGptLoginStatus: "available",
      }),
    ).toMatchObject({
      selected_mode: "chatgpt_session",
      status: "available",
      credential_source: "codex_cached_chatgpt_session",
      codex_home_strategy: "operator_default",
      preflight: "codex_login_status",
      credential_material_exposed: false,
    });
  });

  it("fails explicitly when API-key mode is requested without a key", () => {
    expect(
      resolveHelixCodexAuthSelection({
        requestedMode: "api_key",
        apiKeyAvailable: false,
        chatGptLoginStatus: "available",
      }),
    ).toMatchObject({
      selected_mode: null,
      status: "unavailable",
      reason: "openai_api_key_missing",
    });
  });

  it("does not silently relabel an absent ChatGPT login as API-key auth", () => {
    expect(
      resolveHelixCodexAuthSelection({
        requestedMode: "chatgpt_session",
        apiKeyAvailable: true,
        chatGptLoginStatus: "not_logged_in",
      }),
    ).toMatchObject({
      selected_mode: null,
      status: "unavailable",
      reason: "codex_chatgpt_session_not_logged_in",
    });
  });
});
