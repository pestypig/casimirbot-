import React, { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw, RotateCcw, ShieldCheck } from "lucide-react";
import {
  parseDesktopUpdateState,
  type DesktopUpdateState,
} from "@shared/desktop-update";
import { useRuntimeSurface } from "@/lib/runtime/RuntimeSurfaceProvider";

const phaseLabel: Record<DesktopUpdateState["phase"], string> = {
  unavailable: "Native updates unavailable",
  idle: "Up to date",
  checking: "Checking for updates",
  available: "Update available",
  downloading: "Downloading signed update",
  downloaded: "Ready to install",
  error: "Update check failed",
};

export default function DesktopUpdatePanel() {
  const runtime = useRuntimeSurface();
  const [state, setState] = useState<DesktopUpdateState | null>(null);

  const acceptState = useCallback((candidate: unknown) => {
    const parsed = parseDesktopUpdateState(candidate);
    if (parsed) setState(parsed);
  }, []);

  useEffect(() => {
    const bridge = window.casimirDesktop;
    if (
      !runtime.capabilities.nativeBinaryUpdate ||
      !bridge?.getUpdateState ||
      !bridge.onUpdateState
    ) {
      setState(null);
      return;
    }
    let active = true;
    void bridge.getUpdateState().then((candidate) => {
      if (active) acceptState(candidate);
    });
    const unsubscribe = bridge.onUpdateState((candidate) => {
      if (active) acceptState(candidate);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [acceptState, runtime.capabilities.nativeBinaryUpdate]);

  const runAction = async (
    action: "checkForUpdates" | "downloadUpdate" | "installUpdate",
  ) => {
    const operation = window.casimirDesktop?.[action];
    if (!operation) return;
    acceptState(await operation());
  };

  if (!runtime.capabilities.nativeBinaryUpdate || !state) {
    return (
      <section className="flex h-full items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h1 className="mt-3 text-base font-semibold">Desktop Updates</h1>
          <p className="mt-2 text-sm text-slate-400">
            Signed native updates are available only in an installed CasimirBot desktop build.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col bg-slate-950 text-slate-100" data-testid="desktop-update-panel">
      <header className="border-b border-slate-800 px-5 py-4">
        <h1 className="text-base font-semibold">Desktop Updates</h1>
        <p className="mt-1 text-xs text-slate-400">
          User-controlled download and install with Windows signature verification
        </p>
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">{phaseLabel[state.phase]}</p>
              <p className="mt-1 text-xs text-slate-400">Installed version {state.currentVersion}</p>
              {state.availableVersion ? (
                <p className="mt-1 text-xs text-cyan-200">Available version {state.availableVersion}</p>
              ) : null}
            </div>
            <ShieldCheck className="h-6 w-6 text-emerald-300" aria-hidden="true" />
          </div>

          {state.progressPercent !== null ? (
            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>Download</span>
                <span>{state.progressPercent.toFixed(0)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-[width]"
                  style={{ width: `${state.progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          {state.errorCode ? (
            <p className="mt-4 rounded border border-rose-400/30 bg-rose-400/10 p-3 font-mono text-xs text-rose-100">
              {state.errorCode}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {state.canCheck ? (
              <button
                type="button"
                onClick={() => void runAction("checkForUpdates")}
                className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs hover:border-cyan-400/50"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Check for updates
              </button>
            ) : null}
            {state.canDownload ? (
              <button
                type="button"
                onClick={() => void runAction("downloadUpdate")}
                className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download update
              </button>
            ) : null}
            {state.canInstall ? (
              <button
                type="button"
                onClick={() => void runAction("installUpdate")}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Restart and install
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
