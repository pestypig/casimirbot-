import { useState } from "react";
import { ExternalLink, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePanelHashFocus } from "@/lib/whispers/usePanelHashFocus";

const WARP_LEDGER_URL = "/km-scale-warp-ledger";

export default function WarpLedgerPanel() {
  const [reloadKey, setReloadKey] = useState<number>(() => Date.now());
  const panelRef = usePanelHashFocus("#ledger", () => ({
    panel: "warp-ledger",
    url: WARP_LEDGER_URL,
    lastReload: reloadKey
  }));

  const handleReload = () => {
    setReloadKey(Date.now());
  };

  const handlePopOut = () => {
    if (typeof window === "undefined") return;
    window.open(WARP_LEDGER_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      ref={panelRef}
      data-panel-hash="#ledger"
      className="flex h-full flex-col bg-[#040a17] p-4 text-slate-100"
    >
      <header className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
            Curvature Ledger
          </p>
          <h2 className="text-lg font-semibold text-slate-50">KM-Scale Warp Ledger</h2>
          <p className="text-sm text-slate-400">
            Potato-threshold band notes and ledger proof fragments from the warp narrative site.
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleReload}
            className="h-9 w-9 border-cyan-400/50 bg-slate-900/60 text-cyan-100 hover:bg-slate-900/80"
            aria-label="Reload warp ledger"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handlePopOut}
            className="h-9 w-9 bg-cyan-500/80 text-slate-950 hover:bg-cyan-500"
            aria-label="Open warp ledger in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <div className="flex flex-1 min-h-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
        <iframe
          key={reloadKey}
          title="KM-scale warp ledger microsite"
          src={WARP_LEDGER_URL}
          className="h-full w-full"
          loading="lazy"
        />
      </div>
    </section>
  );
}
