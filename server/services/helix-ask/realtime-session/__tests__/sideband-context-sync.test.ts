import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  recordStagePlayLiveSourceConversationEvent,
  resetStagePlayLiveSourceConversationStoreForTest,
} from "../../../stage-play/stage-play-live-source-conversation-store";
import {
  admitRealtimeSession,
  readAdmittedRealtimeSession,
  resetRealtimeSessionRegistryForTests,
} from "../session-registry";
import {
  recordRealtimeStagePlayActivity,
  requestRealtimeStagePlayContextSync,
  resetRealtimeStagePlaySidebandForTests,
  setRealtimeStagePlaySidebandConnectorForTests,
  startRealtimeStagePlaySideband,
} from "../sideband-context-sync";

class FakeSidebandSocket {
  readyState = 0;
  sent: string[] = [];
  sendError: Error | null = null;
  private listeners = new Map<string, Array<(...args: any[]) => void>>();

  on(event: string, listener: (...args: any[]) => void) {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
    return this;
  }

  emit(event: string, ...args: any[]) {
    for (const listener of this.listeners.get(event) ?? []) listener(...args);
  }

  send(data: string, callback?: (error?: Error) => void) {
    this.sent.push(data);
    callback?.(this.sendError ?? undefined);
  }

  close() {
    this.readyState = 3;
    this.emit("close");
  }
}

describe("Realtime Stage Play sideband context sync", () => {
  beforeEach(() => {
    resetRealtimeStagePlaySidebandForTests();
    resetRealtimeSessionRegistryForTests();
    resetStagePlayLiveSourceConversationStoreForTest();
  });

  it("sends only deduped session.update context and queues while speech is active", () => {
    const socket = new FakeSidebandSocket();
    const connect = vi.fn(() => socket as any);
    setRealtimeStagePlaySidebandConnectorForTests(connect);
    admitRealtimeSession({
      realtimeSessionId: "realtime:test",
      requesterRef: "requester:test",
      visibleUserConsentReceipt: "receipt:consent",
      model: "gpt-realtime-2.1",
      threadId: "helix-ask:desktop",
      sourceBinding: {
        panel_id: "docs-viewer",
        api_key: "must-not-leak",
      },
    });

    const connecting = startRealtimeStagePlaySideband({
      realtimeSessionId: "realtime:test",
      requesterRef: "requester:test",
      providerCallId: "rtc_private_test",
      providerCallRef: "openai-realtime:call:public-hash",
      apiKey: "server-key-must-not-leak",
    });
    expect(connecting?.status).toBe("connecting");
    expect(connect).toHaveBeenCalledWith({
      providerCallId: "rtc_private_test",
      apiKey: "server-key-must-not-leak",
    });

    socket.readyState = 1;
    socket.emit("open");
    expect(socket.sent).toHaveLength(1);
    const first = JSON.parse(socket.sent[0]);
    expect(first).toMatchObject({
      type: "session.update",
      session: { tools: [], tool_choice: "none" },
    });
    expect(socket.sent[0]).toContain("helix.realtime_stage_play.context_pack.v1");
    expect(socket.sent[0]).not.toContain("response.create");
    expect(socket.sent[0]).not.toContain("must-not-leak");
    expect(socket.sent[0]).not.toContain("rtc_private_test");

    recordRealtimeStagePlayActivity({
      realtimeSessionId: "realtime:test",
      activity: "vad_speech_started",
    });
    recordStagePlayLiveSourceConversationEvent({
      threadId: "helix-ask:desktop",
      source: "user_voice",
      text: "What changed in the docs panel?",
      now: "2026-07-16T12:00:00.000Z",
    });
    expect(socket.sent).toHaveLength(1);
    expect(readAdmittedRealtimeSession({
      realtimeSessionId: "realtime:test",
      requesterRef: "requester:test",
    })?.latestContextSync?.status).toBe("queued_busy");

    recordRealtimeStagePlayActivity({
      realtimeSessionId: "realtime:test",
      activity: "vad_speech_stopped",
    });
    expect(socket.sent).toHaveLength(2);
    expect(JSON.parse(socket.sent[1]).type).toBe("session.update");
    const deduped = requestRealtimeStagePlayContextSync({
      realtimeSessionId: "realtime:test",
      reason: "stage_play_update",
    });
    expect(deduped?.status).toBe("deduped");
    expect(socket.sent).toHaveLength(2);
  });

  it("records a synchronous provider send failure and permits a retry", () => {
    const socket = new FakeSidebandSocket();
    socket.sendError = new Error("provider send failed");
    setRealtimeStagePlaySidebandConnectorForTests(() => socket as any);
    admitRealtimeSession({
      realtimeSessionId: "realtime:send-failure",
      requesterRef: "requester:test",
      visibleUserConsentReceipt: "receipt:consent",
      model: "gpt-realtime-2.1",
      threadId: "helix-ask:desktop",
    });
    startRealtimeStagePlaySideband({
      realtimeSessionId: "realtime:send-failure",
      requesterRef: "requester:test",
      providerCallId: "rtc_private_test",
      providerCallRef: "openai-realtime:call:public-hash",
      apiKey: "server-key-must-not-leak",
    });

    socket.readyState = 1;
    socket.emit("open");
    expect(readAdmittedRealtimeSession({
      realtimeSessionId: "realtime:send-failure",
      requesterRef: "requester:test",
    })?.latestContextSync).toMatchObject({
      status: "failed",
      failure_code: "openai_realtime_sideband_send_failed",
    });

    socket.sendError = null;
    expect(requestRealtimeStagePlayContextSync({
      realtimeSessionId: "realtime:send-failure",
      reason: "stage_play_update",
    })?.status).toBe("sent");
    expect(socket.sent).toHaveLength(2);
  });
});
