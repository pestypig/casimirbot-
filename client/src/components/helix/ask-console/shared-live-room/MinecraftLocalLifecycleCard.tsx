import React, { useState } from "react";
import { Gamepad2, Loader2 } from "lucide-react";

const ENDPOINT =
  "/api/agi/environment-connectors/local/minecraft/fabric-loopback/launch";

type LifecycleResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  receipt?: {
    launcher_action?: string;
    connection_action?: string;
    server_address?: string;
  };
};

export type MinecraftLocalLifecycleResult = Readonly<{
  launcherAction: string;
  connectionAction: string;
  serverAddress: string;
}>;

export const launchMinecraftLocalLifecycle = async (): Promise<MinecraftLocalLifecycleResult> => {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: "localhost:25565",
      operator_confirmation: true,
    }),
  });
  const body = (await response.json().catch(() => null)) as
    | LifecycleResponse
    | null;
  if (!response.ok || body?.ok !== true) {
    throw new Error(
      body?.message ?? body?.error ?? "Minecraft lifecycle request failed.",
    );
  }
  return {
    launcherAction: body.receipt?.launcher_action ?? "client ready",
    connectionAction: body.receipt?.connection_action ?? "joined",
    serverAddress: body.receipt?.server_address ?? "localhost:25565",
  };
};

export function MinecraftLocalLifecycleCard() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const launchAndJoin = async (): Promise<void> => {
    setBusy(true);
    setMessage(null);
    setOk(false);
    try {
      const receipt = await launchMinecraftLocalLifecycle();
      setOk(true);
      setMessage(
        `Connected to ${receipt.serverAddress} (${receipt.launcherAction}, ${receipt.connectionAction}).`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Minecraft lifecycle request failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded border border-cyan-300/20 bg-cyan-400/5 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1 text-[10px] font-semibold text-cyan-100">
            <Gamepad2 className="h-3 w-3" />
            Local Minecraft client
          </p>
          <p className="mt-0.5 text-[9px] text-cyan-100/60">
            The browser and desktop app call the same loopback-only Fabric lifecycle adapter.
          </p>
        </div>
        <button data-helix-interaction-kind="act" data-helix-authority-state="blocked_pending_contract" data-helix-control-id="helix.ask.shared_live_room.minecraft-local-lifecycle-card.void-launch-and-join"
          type="button"
          disabled={busy}
          onClick={() => void launchAndJoin()}
          className="rounded border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-100 hover:bg-cyan-400/20 disabled:cursor-wait disabled:opacity-50"
        >
          {busy ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Starting…
            </span>
          ) : (
            "Start or join localhost"
          )}
        </button>
      </div>
      {message ? (
        <p className={`mt-1.5 text-[9px] ${ok ? "text-emerald-200" : "text-rose-200"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
