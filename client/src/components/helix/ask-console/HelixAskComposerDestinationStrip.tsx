import React from "react";
import type {
  HelixAskComposerDestinationKind,
  HelixAskComposerDestinationModel,
} from "./HelixAskComposerDestination";

export type HelixAskComposerDestinationStripProps = {
  model: HelixAskComposerDestinationModel;
  onDestinationChange: (kind: HelixAskComposerDestinationKind) => void;
};

export function HelixAskComposerDestinationStrip({
  model,
  onDestinationChange,
}: HelixAskComposerDestinationStripProps) {
  return (
    <div
      className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 py-2 text-[11px]"
      data-provider-delivery-claimed={String(model.providerDeliveryClaimed)}
    >
      <label className="min-w-44 flex-1 text-slate-400">
        Destination
        <select
          aria-label="Composer destination"
          name="helix-composer-destination"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
          value={model.kind}
          onChange={(event) => onDestinationChange(
            event.currentTarget.value as HelixAskComposerDestinationKind,
          )}
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
      <div className="min-w-24" role="status" aria-live="polite">
        <div className="text-slate-500">Delivery</div>
        <div className="mt-1 text-slate-200">{model.deliveryState.replaceAll("_", " ")}</div>
      </div>
    </div>
  );
}
