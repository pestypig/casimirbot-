import React from "react";
import { requestWorkstationGuidance } from "@/lib/workstation/workstationGuidance";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import type {
  HelixAskComposerDestinationKind,
  HelixAskComposerDestinationModel,
} from "./HelixAskComposerDestination";

export type HelixAskComposerDestinationStripProps = {
  model: HelixAskComposerDestinationModel;
  onDestinationChange: (kind: HelixAskComposerDestinationKind) => void;
  onOpenConnectionSetup?: () => void;
  externalBindingUnavailable?: boolean;
};

export function HelixAskComposerDestinationStrip({
  model,
  onDestinationChange,
  onOpenConnectionSetup,
  externalBindingUnavailable = false,
}: HelixAskComposerDestinationStripProps) {
  const [setupOpen, setSetupOpen] = React.useState(false);
  const bindingNeeded = model.kind === "bound_agent" && model.deliveryState === "unavailable";
  return (
    <>
    <details
      className="rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 py-2 text-[11px]"
      data-provider-delivery-claimed={String(model.providerDeliveryClaimed)}
    >
      <summary className="cursor-pointer text-slate-200">
        {model.destinationLabel} · <span role="status" aria-live="polite">{bindingNeeded ? "Task binding needed" : model.deliveryState.replaceAll("_", " ")}</span>
      </summary>
      <div className="mt-2 flex flex-wrap items-end gap-2">
      <label className="min-w-44 flex-1 text-slate-400">
        Destination
        <select
          aria-label="Composer destination"
          name="helix-composer-destination"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
          value={model.kind}
          onChange={(event) => {
            onDestinationChange(event.currentTarget.value as HelixAskComposerDestinationKind);
            if (event.currentTarget.value === "bound_agent" && externalBindingUnavailable && onOpenConnectionSetup) setSetupOpen(true);
          }}
        >
          <option value="helix_ask">{model.kind === "helix_ask" ? model.destinationLabel : "Configured agent through Helix Ask"}</option>
          <option value="bound_agent">Bound external AI task</option>
          <option value="operator_note">Save in this Helix workspace</option>
        </select>
      </label>
      <div className="min-w-36 flex-1">
        <div className="text-slate-500">Transport</div>
        <div className="mt-1 text-slate-200">{model.transportLabel}</div>
      </div>
      <div className="min-w-28">
        <div className="text-slate-500">Action</div>
        <div className="mt-1 font-semibold text-cyan-100">{model.actionLabel}</div>
      </div>
      </div>
      {onOpenConnectionSetup && model.kind !== "operator_note" && (
        <div className="mt-2 border-t border-slate-700 pt-2">
          <p className="text-slate-400">{bindingNeeded ? "No active exact-task binding. Open Agent Access to check the connection and bind this chat." : "Want to connect this chat to an external AI task?"}</p>
          <button type="button" className="mt-2 rounded border border-cyan-700 px-3 py-1 text-cyan-100" onClick={() => setSetupOpen(true)}>Set up connection</button>
        </div>
      )}
    </details>
    <AlertDialog open={setupOpen} onOpenChange={setSetupOpen}>
      <AlertDialogContent>
        <AlertDialogTitle>Set up external AI connection?</AlertDialogTitle>
        <AlertDialogDescription>Open Agent Access in this workspace to review your current connection and the remaining setup steps. Your chat stays open. This does not sign you in, authorize a task, or grant environment access.</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            requestWorkstationGuidance({ kind: "user_attention", panelId: "agent-access", targetId: "external-ai-connection-setup", label: "Check the connection, then review the exact-task binding.", durationMs: 12000 });
            onOpenConnectionSetup?.();
          }}>Open Agent Access</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
