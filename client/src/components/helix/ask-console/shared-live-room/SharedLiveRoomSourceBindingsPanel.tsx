import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, RefreshCw, Trash2, X } from "lucide-react";
import type {
  HelixRoomSourceBinding,
  HelixRoomSourceBindingReceipt,
  HelixRoomSourcePluginConfig,
} from "@shared/helix-room-source-ingress";

const sourceBindingsPath = (roomId: string): string =>
  `/api/agi/realtime/rooms/${encodeURIComponent(roomId)}/source-bindings`;
const credentialClaimPath =
  "/api/agi/realtime/room-source-credential-deliveries/claim";

type SafeCredentialDelivery = {
  claim_handle: string;
  claim_url: string;
  expires_at: string;
  delivery_status: "pending_claim";
  bearer_included: false;
  plugin_config_included: false;
};

type SafeSourceBindingReceipt = Partial<HelixRoomSourceBindingReceipt> & {
  ok: boolean;
  error?: string | null;
  message?: string | null;
  bindings?: HelixRoomSourceBinding[];
  credential_delivery?: SafeCredentialDelivery;
};

const MINECRAFT_SOURCE_ADAPTERS = [
  {
    id: "minecraft.fabric_mod.v1",
    label: "Minecraft Fabric mod",
    sourceLabel: "Minecraft Fabric source",
  },
  {
    id: "minecraft.paper_plugin.v1",
    label: "Minecraft Paper plugin",
    sourceLabel: "Minecraft Paper source",
  },
] as const;

type MinecraftSourceAdapterId = (typeof MINECRAFT_SOURCE_ADAPTERS)[number]["id"];

const readReceipt = async (
  response: Response,
): Promise<SafeSourceBindingReceipt> => {
  const body = (await response
    .json()
    .catch(() => null)) as SafeSourceBindingReceipt | null;
  if (!response.ok || !body?.ok) {
    throw Object.assign(
      new Error(body?.message || "Room source binding request failed."),
      { status: response.status },
    );
  }
  return body;
};

const configYaml = (config: HelixRoomSourcePluginConfig): string =>
  [
    "helix:",
    `  endpoint: "${config.endpoint}"`,
    `  bearer_token: "${config.bearer_token}"`,
    `  source_id: "${config.source_id}"`,
    `  room_id: "${config.room_id}"`,
    `  world_id: "${config.world_id}"`,
    `  domain_adapter: "${config.domain_adapter}"`,
    "  execution_enabled: false",
  ].join("\n");

export function SharedLiveRoomSourceBindingsPanel({
  roomId,
  roomClosed,
  isOwner,
}: {
  roomId: string;
  roomClosed: boolean;
  isOwner: boolean;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [bindings, setBindings] = useState<HelixRoomSourceBinding[]>([]);
  const [setupConfig, setSetupConfig] =
    useState<HelixRoomSourcePluginConfig | null>(null);
  const [pendingDelivery, setPendingDelivery] =
    useState<SafeCredentialDelivery | null>(null);
  const [sourceAdapterId, setSourceAdapterId] =
    useState<MinecraftSourceAdapterId>("minecraft.fabric_mod.v1");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const basePath = useMemo(() => sourceBindingsPath(roomId), [roomId]);

  const load = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      if (!isOwner || roomClosed) {
        setAvailable(false);
        return;
      }
      try {
        const response = await fetch(basePath, { signal });
        if (response.status === 403) {
          setAvailable(false);
          return;
        }
        const receipt = await readReceipt(response);
        setBindings(receipt.bindings ?? []);
        setAvailable(true);
        setMessage(null);
      } catch (error) {
        if (signal?.aborted) return;
        setAvailable(true);
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load room source links.",
        );
      }
    },
    [basePath, isOwner, roomClosed],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    setSetupConfig(null);
    setPendingDelivery(null);
    setCopyState("idle");
  }, [roomId]);

  const claimDelivery = async (
    delivery: SafeCredentialDelivery,
  ): Promise<SafeSourceBindingReceipt> => {
    const claimed = await readReceipt(
      await fetch(credentialClaimPath, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_handle: delivery.claim_handle }),
      }),
    );
    setPendingDelivery(null);
    return claimed;
  };

  const run = async (
    action: string,
    operation: () => Promise<SafeSourceBindingReceipt>,
  ): Promise<void> => {
    setBusy(action);
    setMessage(null);
    setCopyState("idle");
    try {
      const receipt = await operation();
      const delivery = receipt.credential_delivery;
      if (delivery) setPendingDelivery(delivery);
      const next = delivery ? await claimDelivery(delivery) : receipt;
      setSetupConfig(next.plugin_config ?? null);
      setMessage(next.message ?? "Room source binding updated.");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Room source binding request failed.",
      );
    } finally {
      setBusy(null);
    }
  };

  const create = (): Promise<void> => {
    const sourceAdapter = MINECRAFT_SOURCE_ADAPTERS.find(
      (adapter) => adapter.id === sourceAdapterId,
    ) ?? MINECRAFT_SOURCE_ADAPTERS[0];
    return run("create", async () =>
      readReceipt(
        await fetch(basePath, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `browser-source-create:${crypto.randomUUID()}`,
          },
          body: JSON.stringify({
            domain_adapter: sourceAdapter.id,
            source_label: sourceAdapter.sourceLabel,
          }),
        }),
      ),
    );
  };

  const rotate = (binding: HelixRoomSourceBinding): Promise<void> => {
    if (
      !window.confirm(
        `Rotate the credential for ${binding.source_label}? The currently installed token will stop working immediately.`,
      )
    ) {
      return Promise.resolve();
    }
    return run(`rotate:${binding.binding_id}`, async () =>
      readReceipt(
        await fetch(
          `${basePath}/${encodeURIComponent(binding.binding_id)}/rotate`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          },
        ),
      ),
    );
  };

  const retryPendingClaim = (): Promise<void> => {
    if (!pendingDelivery) return Promise.resolve();
    return run("claim", () => claimDelivery(pendingDelivery));
  };

  const revoke = (binding: HelixRoomSourceBinding): Promise<void> => {
    if (
      !window.confirm(
        `Revoke ${binding.source_label}? This source link cannot be restored.`,
      )
    ) {
      return Promise.resolve();
    }
    return run(`revoke:${binding.binding_id}`, async () =>
      readReceipt(
        await fetch(`${basePath}/${encodeURIComponent(binding.binding_id)}`, {
          method: "DELETE",
        }),
      ),
    );
  };

  const copySetup = async (): Promise<void> => {
    if (!setupConfig) return;
    try {
      await navigator.clipboard.writeText(configYaml(setupConfig));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  if (!isOwner || roomClosed || available === false) return null;

  return (
    <div className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-400/5 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold text-cyan-100">
            Minecraft environment source link
          </p>
          <p className="mt-0.5 text-[10px] text-cyan-100/60">
            Creates a first-party, read-only HTTPS ingress bound to this exact
            room.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`minecraft-source-adapter-${roomId}`}>
            Minecraft environment adapter
          </label>
          <select
            id={`minecraft-source-adapter-${roomId}`}
            value={sourceAdapterId}
            disabled={busy !== null || available === null}
            className="rounded border border-cyan-300/30 bg-slate-950 px-2 py-1 text-[10px] text-cyan-100 disabled:opacity-50"
            onChange={(event) =>
              setSourceAdapterId(event.target.value as MinecraftSourceAdapterId)
            }
          >
            {MINECRAFT_SOURCE_ADAPTERS.map((adapter) => (
              <option key={adapter.id} value={adapter.id}>
                {adapter.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy !== null || available === null}
            className="inline-flex items-center gap-1 rounded border border-cyan-300/30 px-2 py-1 text-[10px] font-semibold text-cyan-100 disabled:opacity-50"
            onClick={() => void create()}
          >
            <KeyRound className="h-3 w-3" />
            Generate link
          </button>
        </div>
      </div>

      {setupConfig ? (
        <div className="mt-2 rounded border border-amber-300/25 bg-amber-400/10 p-2">
          <div className="flex items-start gap-2">
            <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-all text-[10px] text-amber-50">
              {configYaml(setupConfig)}
            </pre>
            <button
              type="button"
              aria-label="Copy Minecraft room source configuration"
              className="inline-flex shrink-0 items-center gap-1 rounded border border-amber-200/30 px-2 py-1 text-[10px] text-amber-50"
              onClick={() => void copySetup()}
            >
              <Copy className="h-3 w-3" />
              {copyState === "copied"
                ? "Copied"
                : copyState === "failed"
                  ? "Select"
                  : "Copy"}
            </button>
            <button
              type="button"
              aria-label="Hide Minecraft room source configuration"
              className="inline-flex shrink-0 items-center rounded border border-amber-200/30 p-1 text-amber-50"
              onClick={() => {
                setSetupConfig(null);
                setCopyState("idle");
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-1 text-[10px] text-amber-100/70">
            The bearer token is returned once and only its hash is stored by the
            server. Copy it, then hide this display.
          </p>
        </div>
      ) : null}

      {pendingDelivery && !setupConfig ? (
        <div className="mt-2 rounded border border-amber-300/25 bg-amber-400/10 p-2">
          <p className="text-[10px] text-amber-100/80">
            The source binding exists, but its one-time browser credential
            claim has not completed.
          </p>
          <button
            type="button"
            disabled={busy !== null}
            className="mt-1 rounded border border-amber-200/30 px-2 py-1 text-[10px] text-amber-50 disabled:opacity-50"
            onClick={() => void retryPendingClaim()}
          >
            Retry secure claim
          </button>
        </div>
      ) : null}

      {bindings.length > 0 ? (
        <div className="mt-2 space-y-1.5">
          {bindings.map((binding) => (
            <div
              key={binding.binding_id}
              className="flex flex-wrap items-center gap-2 rounded border border-white/10 bg-slate-950/70 p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold text-slate-200">
                  {binding.source_label} - {binding.status}
                </p>
                <p className="mt-0.5 break-all text-[9px] text-slate-500">
                  {binding.public_ingress_base_url}
                </p>
                <p className="mt-0.5 break-all text-[9px] text-slate-500">
                  {binding.source_id} · token {binding.token_prefix ?? "none"} ·
                  expires{" "}
                  {binding.expires_at
                    ? new Date(binding.expires_at).toLocaleString()
                    : "n/a"}
                  {binding.last_used_at
                    ? ` · last used ${new Date(binding.last_used_at).toLocaleString()}`
                    : " · never used"}
                </p>
              </div>
              {binding.status === "active" || binding.status === "expired" ? (
                <>
                  <button
                    type="button"
                    disabled={busy !== null}
                    className="inline-flex items-center gap-1 rounded border border-white/15 px-1.5 py-1 text-[9px] text-slate-300 disabled:opacity-50"
                    onClick={() => void rotate(binding)}
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    Rotate
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    className="inline-flex items-center gap-1 rounded border border-rose-300/25 px-1.5 py-1 text-[9px] text-rose-200 disabled:opacity-50"
                    onClick={() => void revoke(binding)}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                    Revoke
                  </button>
                </>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {message ? (
        <p className="mt-2 text-[10px] text-cyan-100/70">{message}</p>
      ) : null}
    </div>
  );
}
