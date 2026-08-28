import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, KeyRound, Power, RefreshCw, ShieldCheck, X } from "lucide-react";
import type {
  HelixConnectorPairing,
  HelixConnectorPairingReceipt,
} from "@shared/helix-connector-pairing";
import type {
  HelixEnvironmentActionAuthority,
  HelixEnvironmentActionAuthorityReceipt,
  HelixEnvironmentActionAutonomyMode,
  HelixEnvironmentActionConnectorReadiness,
  HelixEnvironmentActionManualOverridePolicy,
} from "@shared/helix-environment-action";
import type { HelixRoomEnvironmentProjection } from "@shared/helix-environment-subject";
import {
  HELIX_MINECRAFT_PLAYER_ACTION_CAPABILITY_IDS,
  HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
} from "@shared/helix-minecraft-player-capabilities";
import type { HelixRoomSourceBinding } from "@shared/helix-room-source-ingress";
import { MinecraftLocalLifecycleCard } from "./MinecraftLocalLifecycleCard";

const PLAYER_ACTION_ADAPTER = "minecraft.fabric_client.v1";
const DEFAULT_LEASE_MS = 2 * 60 * 60_000;
const SEVEN_DAY_LEASE_MS = 7 * 24 * 60 * 60_000;
const THIRTY_DAY_LEASE_MS = 30 * 24 * 60 * 60_000;
const PLAYER_AUTHORITY_REFRESH_INTERVAL_MS = 10_000;

const actionAuthoritiesPath = (
  roomId: string,
  environmentBindingId: string,
): string =>
  `/api/agi/realtime/rooms/${encodeURIComponent(roomId)}/environments/${encodeURIComponent(environmentBindingId)}/action-authorities`;

const connectorPairingsPath = (roomId: string): string =>
  `/api/agi/realtime/rooms/${encodeURIComponent(roomId)}/connector-pairings`;

type SafeActionAuthorityReceipt =
  Partial<HelixEnvironmentActionAuthorityReceipt> & {
    ok: boolean;
    error?: string | null;
    message?: string | null;
    authority?: HelixEnvironmentActionAuthority | null;
    authorities?: HelixEnvironmentActionAuthority[];
  };

type SafePairingReceipt = Partial<HelixConnectorPairingReceipt> & {
  ok: boolean;
  error?: string | null;
  message?: string | null;
  pairing?: HelixConnectorPairing | null;
};

const CAPABILITY_OPTIONS: Array<{ id: string; label: string }> = [
  { id: HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY, label: "Navigate" },
  { id: HELIX_MINECRAFT_PLAYER_LOOK_CAPABILITY, label: "Look" },
  {
    id: HELIX_MINECRAFT_PLAYER_CAMERA_TRACK_CAPABILITY,
    label: "Camera tracking",
  },
  { id: HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY, label: "Walk" },
  { id: HELIX_MINECRAFT_PLAYER_JUMP_CAPABILITY, label: "Jump" },
  { id: HELIX_MINECRAFT_PLAYER_INTERACT_CAPABILITY, label: "Interact" },
  {
    id: HELIX_MINECRAFT_PLAYER_COMBAT_ATTACK_CAPABILITY,
    label: "Combat attack",
  },
  { id: HELIX_MINECRAFT_PLAYER_HOTBAR_SELECT_CAPABILITY, label: "Hotbar" },
  { id: HELIX_MINECRAFT_PLAYER_EQUIP_CAPABILITY, label: "Equip" },
  {
    id: HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
    label: "Fluid TAS sequence",
  },
  {
    id: HELIX_MINECRAFT_PLAYER_EXECUTE_REACTIVE_PROGRAM_CAPABILITY,
    label: "Reactive guardian program",
  },
  {
    id: HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY,
    label: "Arm viability guardian",
  },
  {
    id: HELIX_MINECRAFT_PLAYER_DISARM_VIABILITY_GUARDIAN_CAPABILITY,
    label: "Disarm viability guardian",
  },
  { id: HELIX_MINECRAFT_PLAYER_FOLLOW_CAPABILITY, label: "Follow" },
  { id: HELIX_MINECRAFT_PLAYER_COLLECT_CAPABILITY, label: "Collect" },
  { id: HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY, label: "Mine" },
  { id: HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY, label: "Place" },
  { id: HELIX_MINECRAFT_PLAYER_CRAFT_CAPABILITY, label: "Craft" },
  {
    id: HELIX_MINECRAFT_PLAYER_INVENTORY_TRANSFER_CAPABILITY,
    label: "Inventory transfer",
  },
];

const READINESS_LABELS: Record<
  HelixEnvironmentActionConnectorReadiness["state"],
  string
> = {
  authority_inactive: "authority inactive",
  awaiting_manifest: "waiting for client",
  awaiting_heartbeat: "waiting for heartbeat",
  ready: "client ready",
  degraded: "client degraded",
  paused: "client paused",
  stale: "heartbeat stale",
  error: "client error",
  emergency_stopped: "emergency stopped",
};

const readActionReceipt = async (
  response: Response,
): Promise<SafeActionAuthorityReceipt> => {
  const body = (await response.json().catch(() => null)) as
    | SafeActionAuthorityReceipt
    | null;
  if (!response.ok || !body?.ok) {
    throw new Error(body?.message || "Player-action authority request failed.");
  }
  return {
    ...body,
    authority: body.authority ?? body.authorities?.[0] ?? null,
    authorities: body.authorities ?? [],
  };
};

const readPairingReceipt = async (
  response: Response,
): Promise<SafePairingReceipt> => {
  const body = (await response.json().catch(() => null)) as
    | SafePairingReceipt
    | null;
  if (!response.ok || !body?.ok) {
    throw new Error(body?.message || "Player-action pairing request failed.");
  }
  return body;
};

export function SharedLiveRoomPlayerEmbodimentPanel({
  roomId,
  environment,
  selfParticipantId,
  sourceBinding,
  isOwner,
}: {
  roomId: string;
  environment: HelixRoomEnvironmentProjection;
  selfParticipantId: string;
  sourceBinding?: HelixRoomSourceBinding;
  isOwner: boolean;
}) {
  const authorityPath = useMemo(
    () => actionAuthoritiesPath(roomId, environment.environment_binding_id),
    [environment.environment_binding_id, roomId],
  );
  const pairingPath = useMemo(() => connectorPairingsPath(roomId), [roomId]);
  const [authority, setAuthority] =
    useState<HelixEnvironmentActionAuthority | null>(null);
  const [readiness, setReadiness] =
    useState<HelixEnvironmentActionConnectorReadiness | null>(null);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(
    [...HELIX_MINECRAFT_PLAYER_ACTION_CAPABILITY_IDS],
  );
  const [autonomyMode, setAutonomyMode] =
    useState<HelixEnvironmentActionAutonomyMode>("approved_capabilities");
  const [manualOverridePolicy, setManualOverridePolicy] =
    useState<HelixEnvironmentActionManualOverridePolicy>("cancel");
  const [leaseMs, setLeaseMs] = useState(DEFAULT_LEASE_MS);
  const [acknowledged, setAcknowledged] = useState(false);
  const authorityDraftDirtyRef = useRef(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pairingCommand, setPairingCommand] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpiresAt, setPairingExpiresAt] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [stopArmed, setStopArmed] = useState(false);

  const load = useCallback(async (signal?: AbortSignal): Promise<void> => {
    try {
      const receipt = await readActionReceipt(
        await fetch(authorityPath, { signal, credentials: "include" }),
      );
      const next = receipt.authority ?? null;
      setAuthority(next);
      setReadiness(
        next
          ? receipt.connector_readiness?.find(
            (entry) =>
              entry.action_authority_id === next.action_authority_id,
          ) ?? null
          : null,
      );
      if (next && !authorityDraftDirtyRef.current) {
        setSelectedCapabilities(next.allowed_capability_ids);
        setAutonomyMode(next.autonomy_mode);
        setManualOverridePolicy(next.manual_override_policy);
      }
    } catch (error) {
      if (signal?.aborted) return;
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load Player Embodiment authority.",
      );
    }
  }, [authorityPath]);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let refreshTimer: number | null = null;
    setAuthority(null);
    setReadiness(null);
    setPairingCommand(null);
    setPairingCode(null);
    setPairingExpiresAt(null);
    setCopyState("idle");
    setStopArmed(false);
    const refresh = async (): Promise<void> => {
      await load(controller.signal);
      if (disposed) return;
      refreshTimer = window.setTimeout(
        () => void refresh(),
        PLAYER_AUTHORITY_REFRESH_INTERVAL_MS,
      );
    };
    void refresh();
    return () => {
      disposed = true;
      controller.abort();
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
    };
  }, [load]);

  const mutationSelected = selectedCapabilities.some(
    (id) =>
      id === HELIX_MINECRAFT_PLAYER_MINE_CAPABILITY ||
      id === HELIX_MINECRAFT_PLAYER_PLACE_CAPABILITY ||
      id === HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  );
  const warningRequired = mutationSelected || autonomyMode === "autonomous";

  const saveAuthority = async (): Promise<void> => {
    if (selectedCapabilities.length === 0) {
      setMessage("Select at least one player capability.");
      return;
    }
    if (warningRequired && !acknowledged) {
      setMessage(
        "Acknowledge player control and world mutation before enabling this lease.",
      );
      return;
    }
    setBusy("save");
    setMessage(null);
    try {
      const receipt = await readActionReceipt(
        await fetch(authorityPath, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participant_id: selfParticipantId,
            domain_adapter: PLAYER_ACTION_ADAPTER,
            allowed_capability_ids: selectedCapabilities,
            autonomy_mode: autonomyMode,
            manual_override_policy: manualOverridePolicy,
            expires_at: new Date(Date.now() + leaseMs).toISOString(),
          }),
        }),
      );
      setAuthority(receipt.authority ?? null);
      authorityDraftDirtyRef.current = false;
      setAcknowledged(false);
      await load();
      setMessage(receipt.message ?? "Player Embodiment authority configured.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not configure Player Embodiment authority.",
      );
    } finally {
      setBusy(null);
    }
  };

  const createPairing = async (): Promise<void> => {
    if (!authority || !sourceBinding) return;
    setBusy("pair");
    setMessage(null);
    setPairingCommand(null);
    setPairingCode(null);
    setPairingExpiresAt(null);
    setCopyState("idle");
    try {
      const receipt = await readPairingReceipt(
        await fetch(pairingPath, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `browser-player-action-pairing:${crypto.randomUUID()}`,
          },
          body: JSON.stringify({
            purpose: "rotate",
            binding_id: sourceBinding.binding_id,
            domain_adapter: sourceBinding.domain_adapter,
            source_label: sourceBinding.source_label,
            action_credential_requested: true,
            action_authority_id: authority.action_authority_id,
            credential_ttl_ms: leaseMs,
          }),
        }),
      );
      setPairingCommand(receipt.pairing_command ?? null);
      setPairingCode(receipt.pairing_code ?? null);
      setPairingExpiresAt(receipt.pairing?.expires_at ?? null);
      setMessage(receipt.message ?? "Player-action pairing code created.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create Player Embodiment pairing.",
      );
    } finally {
      setBusy(null);
    }
  };

  const pairLocalPlayer = async (): Promise<void> => {
    if (!authority || !sourceBinding) return;
    setBusy("pair-local");
    setMessage(null);
    setPairingCommand(null);
    setPairingCode(null);
    setPairingExpiresAt(null);
    setCopyState("idle");
    try {
      const receipt = await readPairingReceipt(
        await fetch(`${pairingPath}/local-player-handoff`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `browser-local-player-action-pairing:${crypto.randomUUID()}`,
          },
          body: JSON.stringify({
            purpose: "rotate",
            binding_id: sourceBinding.binding_id,
            domain_adapter: sourceBinding.domain_adapter,
            source_label: sourceBinding.source_label,
            action_credential_requested: true,
            action_authority_id: authority.action_authority_id,
            credential_ttl_ms: leaseMs,
          }),
        }),
      );
      setMessage(
        receipt.message ??
          "Local player action access was staged without exposing the one-time code.",
      );
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not stage local Player Embodiment pairing.",
      );
    } finally {
      setBusy(null);
    }
  };

  const emergencyStop = async (): Promise<void> => {
    if (!authority) return;
    if (!stopArmed) {
      setStopArmed(true);
      setMessage(
        "Click Confirm player emergency stop to cancel workflows, release controls, and revoke this action lease.",
      );
      return;
    }
    setStopArmed(false);
    setBusy("stop");
    setMessage(null);
    try {
      const receipt = await readActionReceipt(
        await fetch(
          `${authorityPath}/${encodeURIComponent(authority.action_authority_id)}`,
          { method: "DELETE", credentials: "include" },
        ),
      );
      setAuthority(receipt.authority ?? null);
      setPairingCommand(null);
      setPairingCode(null);
      setMessage(receipt.message ?? "Player actions stopped.");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not stop Player Embodiment authority.",
      );
    } finally {
      setBusy(null);
    }
  };

  const copyPairingCommand = async (): Promise<void> => {
    if (!pairingCommand) return;
    try {
      await navigator.clipboard.writeText(pairingCommand);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <div className="mt-2 rounded border border-emerald-300/20 bg-emerald-400/5 p-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-100">
            <ShieldCheck className="h-3 w-3" />
            Minecraft Player Embodiment
          </p>
          <p className="mt-0.5 text-[9px] text-emerald-100/60">
            Separately paired Fabric client control for the selected player.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] ${
              authority?.status === "active"
                ? "bg-emerald-400/15 text-emerald-200"
                : "bg-slate-400/10 text-slate-400"
            }`}
          >
            authority {authority?.status ?? "off"}
          </span>
          {authority ? (
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] ${
                readiness?.ready_for_actions
                  ? "bg-cyan-400/15 text-cyan-100"
                  : readiness?.state === "error" ||
                      readiness?.state === "stale" ||
                      readiness?.state === "emergency_stopped"
                    ? "bg-red-400/15 text-red-200"
                    : "bg-amber-400/10 text-amber-100"
              }`}
            >
              {readiness
                ? READINESS_LABELS[readiness.state]
                : "checking client"}
            </span>
          ) : null}
          <button data-helix-interaction-kind="observe" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.refresh-player-embodiment-authority"
            type="button"
            aria-label="Refresh Player Embodiment authority"
            disabled={busy !== null}
            className="rounded border border-white/15 p-1 text-slate-300 disabled:opacity-50"
            onClick={() => void load()}
          >
            <RefreshCw className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      {isOwner ? (
        <div className="mt-2 space-y-2">
          <MinecraftLocalLifecycleCard />
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="text-[9px] text-emerald-100/70">
              Approval mode
              <select data-helix-interaction-kind="configure" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.select"
                aria-label={`Player action approval mode for ${environment.source_label}`}
                value={autonomyMode}
                disabled={busy !== null}
                className="mt-1 w-full rounded border border-emerald-300/25 bg-slate-950 px-2 py-1 text-[10px] text-emerald-50 disabled:opacity-50"
                onChange={(event) => {
                  authorityDraftDirtyRef.current = true;
                  setAutonomyMode(
                    event.target.value as HelixEnvironmentActionAutonomyMode,
                  );
                }}
              >
                <option value="approved_capabilities">Approved capabilities</option>
                <option value="autonomous">Autonomous for this lease</option>
              </select>
            </label>
            <label className="text-[9px] text-emerald-100/70">
              Manual input
              <select data-helix-interaction-kind="configure" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.select.2"
                aria-label={`Player manual override for ${environment.source_label}`}
                value={manualOverridePolicy}
                disabled={busy !== null}
                className="mt-1 w-full rounded border border-emerald-300/25 bg-slate-950 px-2 py-1 text-[10px] text-emerald-50 disabled:opacity-50"
                onChange={(event) => {
                  authorityDraftDirtyRef.current = true;
                  setManualOverridePolicy(
                    event.target.value as HelixEnvironmentActionManualOverridePolicy,
                  );
                }}
              >
                <option value="cancel">Cancel workflow</option>
                <option value="pause">Pause workflow</option>
              </select>
            </label>
            <label className="text-[9px] text-emerald-100/70">
              Lease duration
              <select data-helix-interaction-kind="configure" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.select.3"
                aria-label={`Player action lease duration for ${environment.source_label}`}
                value={leaseMs}
                disabled={busy !== null}
                className="mt-1 w-full rounded border border-emerald-300/25 bg-slate-950 px-2 py-1 text-[10px] text-emerald-50 disabled:opacity-50"
                onChange={(event) => setLeaseMs(Number(event.target.value))}
              >
                <option value={60 * 60_000}>1 hour</option>
                <option value={DEFAULT_LEASE_MS}>2 hours</option>
                <option value={8 * 60 * 60_000}>8 hours</option>
                <option value={24 * 60 * 60_000}>24 hours</option>
                <option value={SEVEN_DAY_LEASE_MS}>7 days</option>
                <option value={THIRTY_DAY_LEASE_MS}>30 days</option>
              </select>
            </label>
          </div>

          {leaseMs > 24 * 60 * 60_000 ? (
            <p className="rounded border border-amber-300/20 bg-amber-950/15 px-2 py-1.5 text-[9px] text-amber-100/80">
              Long-lived player authority remains limited to this exact room,
              environment, player, and checked capability set. Revoke it with
              Player emergency stop when the unattended test window ends.
            </p>
          ) : null}

          <fieldset className="rounded border border-white/10 p-2">
            <legend className="px-1 text-[9px] text-slate-400">
              Exact player capabilities
            </legend>
            <div className="grid gap-1 sm:grid-cols-3">
              {CAPABILITY_OPTIONS.map((capability) => (
                <label
                  key={capability.id}
                  className="flex items-center gap-1.5 text-[9px] text-slate-300"
                >
                  <input data-helix-interaction-kind="configure" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.input"
                    type="checkbox"
                    checked={selectedCapabilities.includes(capability.id)}
                    disabled={busy !== null}
                    onChange={(event) => {
                      authorityDraftDirtyRef.current = true;
                      setSelectedCapabilities((current) =>
                        event.target.checked
                          ? [...new Set([...current, capability.id])]
                          : current.filter((id) => id !== capability.id),
                      );
                    }}
                  />
                  {capability.label}
                </label>
              ))}
            </div>
          </fieldset>

          {warningRequired ? (
            <label className="flex items-start gap-2 rounded border border-amber-300/25 bg-amber-950/20 p-2 text-[9px] text-amber-100">
              <input data-helix-interaction-kind="configure" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.input.2"
                type="checkbox"
                aria-label={`Acknowledge Minecraft player control for ${environment.source_label}`}
                checked={acknowledged}
                disabled={busy !== null}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              <span>
                I understand that this finite lease can move the selected player,
                interact with the game, and use the checked mutation workflows.
                A fluid TAS sequence can combine the checked typed workflows under
                one bounded tick-local program, but cannot run commands or code.
                Manual input and Emergency stop remain available; this never grants
                host shell, files, processes, RCON, or credentials.
              </span>
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button data-helix-interaction-kind="act" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.save-player-authority"
              type="button"
              disabled={
                busy !== null ||
                selectedCapabilities.length === 0 ||
                (warningRequired && !acknowledged)
              }
              className="inline-flex items-center gap-1 rounded border border-emerald-300/30 px-2 py-1 text-[9px] font-semibold text-emerald-100 disabled:opacity-50"
              onClick={() => void saveAuthority()}
            >
              <ShieldCheck className="h-2.5 w-2.5" />
              Save player authority
            </button>
            {authority?.status === "active" ? (
              <button data-helix-interaction-kind="act" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.pair-player-client-in-game"
                type="button"
                disabled={busy !== null || !sourceBinding}
                className="inline-flex items-center gap-1 rounded border border-cyan-300/30 px-2 py-1 text-[9px] font-semibold text-cyan-100 disabled:opacity-50"
                onClick={() => void createPairing()}
              >
                <KeyRound className="h-2.5 w-2.5" />
                Pair player client in game
              </button>
            ) : null}
            {authority?.status === "active" ? (
              <button data-helix-interaction-kind="act" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.pair-local-player-privately"
                type="button"
                disabled={busy !== null || !sourceBinding}
                className="inline-flex items-center gap-1 rounded border border-emerald-300/30 px-2 py-1 text-[9px] font-semibold text-emerald-100 disabled:opacity-50"
                onClick={() => void pairLocalPlayer()}
              >
                <KeyRound className="h-2.5 w-2.5" />
                Pair local player privately
              </button>
            ) : null}
            {authority?.status === "active" ? (
              <button data-helix-interaction-kind="act" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.void-emergency-stop"
                type="button"
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded border border-red-300/30 px-2 py-1 text-[9px] font-semibold text-red-200 disabled:opacity-50"
                onClick={() => void emergencyStop()}
              >
                <Power className="h-2.5 w-2.5" />
                {stopArmed ? "Confirm player emergency stop" : "Player emergency stop"}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[9px] text-emerald-100/55">
          The room owner controls this separately paired player-action lease.
        </p>
      )}

      {authority ? (
        <div className="mt-2 space-y-1 text-[9px] text-emerald-100/55">
          <p>
            {authority.allowed_capability_ids.length} capabilities &middot; manual
            input {authority.manual_override_policy}s &middot; expires {authority.expires_at
              ? new Date(authority.expires_at).toLocaleString()
              : "when revoked"}
          </p>
          {readiness ? (
            <p
              className={
                readiness.ready_for_actions
                  ? "text-cyan-100/75"
                  : readiness.state === "stale" ||
                      readiness.state === "error" ||
                      readiness.state === "emergency_stopped"
                    ? "text-red-200/80"
                    : "text-amber-100/75"
              }
            >
              {readiness.state === "awaiting_manifest"
                ? "Waiting for the paired Fabric client to publish its admitted manifest. If the player-agent JAR was just installed, restart Minecraft completely, rejoin, then run /helix-player status before rotating another code."
                : readiness.state === "awaiting_heartbeat"
                  ? "Client manifest admitted; waiting for its first heartbeat."
                  : readiness.ready_for_actions
                    ? `Client ready: ${readiness.declared_capability_count} declared capabilities via ${readiness.available_control_engines.join(", ") || "its admitted engine"}.`
                    : readiness.blocking_reason === "event_stream_resync_required"
                      ? "Client controls were released because its evidence stream no longer matches the restarted server. Pair the player client again to establish a fresh evidence epoch."
                    : readiness.state === "stale"
                      ? "Client heartbeat is stale; Helix will not lease player actions."
                      : readiness.state === "emergency_stopped"
                        ? "Emergency stop is latched; client controls remain released."
                        : `Client reports ${READINESS_LABELS[readiness.state]}; player actions remain closed.`}
              {readiness.heartbeat_received_at
                ? ` Last heartbeat ${new Date(readiness.heartbeat_received_at).toLocaleTimeString()}.`
                : ""}
              {readiness.manual_input_detected
                ? " Manual player input was detected."
                : ""}
            </p>
          ) : (
            <p className="text-amber-100/75">
              Checking for an admitted client manifest and fresh heartbeat.
            </p>
          )}
        </div>
      ) : null}

      {pairingCommand && pairingCode ? (
        <div className="mt-2 rounded border border-cyan-300/25 bg-cyan-400/10 p-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold text-cyan-50">
                One-time Player Embodiment pairing
              </p>
              <code className="mt-1 block select-all text-sm font-bold tracking-wider text-cyan-100">
                {pairingCode}
              </code>
              <p className="mt-1 text-[10px] text-cyan-100/70">
                Run <code>{pairingCommand}</code> in the Fabric client chat. The
                code expires {pairingExpiresAt ? new Date(pairingExpiresAt).toLocaleTimeString() : "soon"}.
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button data-helix-interaction-kind="act" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.void-copy-pairing-command"
                type="button"
                className="inline-flex items-center gap-1 rounded border border-cyan-200/30 px-2 py-1 text-[10px] text-cyan-50"
                onClick={() => void copyPairingCommand()}
              >
                <Copy className="h-3 w-3" />
                {copyState === "copied"
                  ? "Copied"
                  : copyState === "failed"
                    ? "Select"
                    : "Copy player command"}
              </button>
              <button data-helix-interaction-kind="navigate" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.shared-live-room-player-embodiment-panel.hide-player-embodiment-pairing-code"
                type="button"
                aria-label="Hide Player Embodiment pairing code"
                className="rounded border border-cyan-200/30 p-1 text-cyan-50"
                onClick={() => {
                  setPairingCommand(null);
                  setPairingCode(null);
                  setPairingExpiresAt(null);
                  setCopyState("idle");
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
          <p className="mt-1 text-[9px] text-cyan-100/55">
            The separate action credential is delivered directly to the client
            companion and is excluded from chat, Codex context, MCP, and debug exports.
          </p>
        </div>
      ) : null}

      {message ? (
        <p className="mt-2 text-[9px] text-slate-300">{message}</p>
      ) : null}
    </div>
  );
}
