import React, { useEffect, useRef, useState } from "react";
import type { BrowserReasoningBinding } from "@/lib/agent-access/reasoningTaskBinding";
import { HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT } from "@/components/helix/ask-console/shared-live-room/SharedLiveRoomGuideProjection";

const recoveryMessages: Record<string, string> = {
  environment_session_goal_missing: "No unfinished environment goal is available for this run. Start its environment workflow before preparing it.",
  durable_goal_session_ambiguous: "More than one unfinished goal belongs to this run. Select the intended goal before continuing.",
  environment_session_subject_changed: "The selected player no longer matches this session. Review the environment's player selection.",
  subject_binding_stale: "Player identity is still stale. The environment must provide fresh player evidence before preparation can finish.",
  subject_binding_required: "This session needs a selected environment player.",
  durable_goal_revision_conflict: "The environment goal changed during preparation. Use Ready up again to check its current state.",
  durable_goal_authority_stale: "The goal's environment authority is not current. Review its state; preparation does not renew or restore revoked permission.",
  environment_session_observation_unavailable: "A fresh player snapshot could not be verified. Check the environment connection, then use Ready up again.",
  reasoning_binding_run_association_stale: "The bound run is not currently verified. Refresh its runtime presence from the same AI task; do not replace a valid chat binding.",
  reasoning_binding_target_inactive: "This AI task's presence is not current. Ask that same task to refresh its CasimirBot presence.",
};

export default function EnvironmentSessionReadyUp({ binding }: { binding: BrowserReasoningBinding }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  const [roomId, setRoomId] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (validUntil === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [validUntil]);
  const prepare = async () => {
    if (busy || !binding.run_id || binding.status !== "active") return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setValidUntil(null);
    setRoomId(null);
    setMessage("Checking this session and requesting a fresh observation…");
    try {
      const response = await fetch("/api/account/session/agent-connections/environment-session/ready-up", {
        method: "POST", credentials: "include", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasoning_binding_id: binding.reasoning_binding_id,
          binding_epoch: binding.binding_epoch, helix_conversation_id: binding.helix_conversation_id,
          mission_id: binding.mission_id ?? null, run_id: binding.run_id,
          request_id: crypto.randomUUID() }),
      });
      const body = await response.json();
      if (controller.signal.aborted) return;
      if (response.ok && body.ok === true && typeof body.selection?.room_id === "string") {
        setRoomId(body.selection.room_id);
      }
      if (!response.ok || body.ok !== true) {
        const code = typeof body.error === "string" ? body.error : "preparation unavailable";
        setMessage(`${recoveryMessages[code] ?? `Session is not ready: ${code}.`} Your binding was not replaced.`);
      } else if (body.readiness?.ready === true) {
        if (typeof body.readiness.valid_until_ms !== "number" || !Number.isFinite(body.readiness.valid_until_ms)) {
          setMessage("Preparation validity could not be confirmed. Retry Ready up; no permissions were changed.");
        } else {
          setNow(Date.now());
          setValidUntil(body.readiness.valid_until_ms);
          setMessage("Session prerequisites checked. Ready for the bound AI task to request admitted actions; no movement was started.");
        }
      } else {
        const checks = Array.isArray(body.readiness?.checks) ? body.readiness.checks : [];
        const blocked = checks.filter((check: { state?: string }) => check.state !== "verified")
          .map((check: { layer?: string }) => check.layer).filter((layer: unknown) => typeof layer === "string");
        setMessage(`Session still needs attention${blocked.length ? `: ${blocked.join(", ")}` : ""}. No new permissions were granted.`);
      }
    } catch {
      if (!controller.signal.aborted) setMessage("Preparation could not be confirmed. Retry Ready up; do not replace the binding.");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  return <div className="mt-3 border-t border-white/15 pt-3">
    <button type="button" onClick={() => void prepare()} disabled={busy || !binding.run_id}
      className="rounded border border-cyan-300/30 px-3 py-2 disabled:opacity-50">
      {busy ? "Preparing session…" : "Ready up"}
    </button>
    <p className="mt-1">Checks the bound environment session without replacing its binding or renewing permissions.</p>
    {!binding.run_id ? <p>Associate an environment run before preparing this session.</p> : null}
    {roomId ? <button type="button" className="mt-2 rounded border border-white/20 px-3 py-2" onClick={() => {
      const event = new CustomEvent(HELIX_SHARED_LIVE_ROOM_OPEN_DIALOG_EVENT, {
        detail: { roomId }, cancelable: true,
      });
      if (window.dispatchEvent(event)) {
        setMessage("The bound room's controls are not currently available in this workspace. No other room was opened and no permissions changed.");
        setValidUntil(null);
      }
    }}>Review environment settings</button> : null}
    {message ? <p role="status" className="mt-2">{validUntil !== null && now >= validUntil
      ? "The readiness check has aged out. Use Ready up to check again; your binding was not revoked."
      : message}</p> : null}
    {validUntil !== null && now < validUntil ? <p>
      Readiness evidence: {Math.ceil((validUntil - now) / 1000)} seconds remaining (local clock estimate).
      This is not your binding or permission lease duration.
    </p> : null}
  </div>;
}
