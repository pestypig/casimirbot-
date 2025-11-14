import * as React from "react";
import type { TEssenceThemeDeck, TThemePanelRecord } from "@shared/essence-themes";

type ThemeInstrumentDeckProps = {
  deck?: TEssenceThemeDeck | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
};

export function ThemeInstrumentDeck({ deck, loading, error, onRefresh }: ThemeInstrumentDeckProps) {
  const themes = deck?.themes ?? [];

  return (
    <section className="mt-10 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Personal Physics</p>
          <h2 className="text-lg font-semibold text-white">Inner Universe Instruments</h2>
          <p className="text-sm text-slate-300/80 max-w-2xl">
            Essence mapped your most visited envelopes into themes. Each panel shows the forces, constraints, state
            space, and gentle reframes so you can see your own pulse.
          </p>
        </div>
        {onRefresh && (
          <button
            className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:bg-white/10"
            onClick={() => onRefresh()}
          >
            Refresh
          </button>
        )}
      </div>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-300">
          Scanning envelopes for themes…
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-500/60 bg-rose-500/5 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}
      {!loading && !error && !themes.length && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-300">
          Drop a few envelopes into Essence and this dashboard will light up with your personal physics.
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {themes.map((theme, idx) => (
          <ThemeCard theme={theme} key={theme.id} index={idx} />
        ))}
      </div>
    </section>
  );
}

type ThemeCardProps = {
  theme: TThemePanelRecord;
  index: number;
};

function ThemeCard({ theme, index }: ThemeCardProps) {
  const gradient = theme.color ?? "#0f172a";
  const lastTouched =
    theme.recencyDays === 0 ? "today" : theme.recencyDays < 2 ? "yesterday" : `${Math.round(theme.recencyDays)}d ago`;

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 text-slate-100 shadow-xl shadow-black/20">
      <header
        className="rounded-t-3xl px-5 py-4"
        style={{
          background:
            index % 2 === 0
              ? `linear-gradient(120deg, ${gradient}, rgba(15,23,42,0.8))`
              : `linear-gradient(120deg, rgba(15,23,42,0.9), ${gradient})`,
        }}
      >
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">Theme {index + 1}</p>
        <h3 className="text-xl font-semibold tracking-tight text-white">{theme.label}</h3>
        <p className="mt-1 text-sm text-white/80">{theme.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-white/70">
          <span>{theme.corpusSize} envelopes</span>
          <span className="h-px w-6 bg-white/30" />
          <span>{lastTouched}</span>
          {!!theme.topKeywords.length && (
            <>
              <span className="h-px w-6 bg-white/30" />
              <span>{theme.topKeywords.slice(0, 3).join(" • ")}</span>
            </>
          )}
        </div>
      </header>
      <div className="space-y-6 px-5 py-6">
        <FieldPanel theme={theme} />
        <StatePanel theme={theme} />
        <DualityPanel theme={theme} />
        <ReframePanel theme={theme} />
        <EvidencePanel theme={theme} />
      </div>
    </article>
  );
}

function FieldPanel({ theme }: { theme: TThemePanelRecord }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-[0.3em] text-slate-400">Field</h4>
        <span className="text-[11px] text-slate-400">forces & constraints</span>
      </div>
      <div className="mt-2 flex flex-col gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Forces</p>
          <ul className="mt-1 space-y-1">
            {theme.field.forces.slice(0, 3).map((force) => (
              <li key={force.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{force.label}</span>
                <span className="text-slate-400">{Math.round(force.magnitude * 100)}%</span>
              </li>
            ))}
            {!theme.field.forces.length && <li className="text-sm text-slate-500">No clear drivers yet.</li>}
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Constraints</p>
          <ul className="mt-1 space-y-1">
            {theme.field.constraints.slice(0, 3).map((constraint) => (
              <li key={constraint.id} className="flex items-center justify-between text-sm">
                <span>{constraint.label}</span>
                <span className="text-slate-400">{Math.round(constraint.weight * 100)}%</span>
              </li>
            ))}
            {!theme.field.constraints.length && <li className="text-sm text-slate-500">No hard boundaries yet.</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}

function StatePanel({ theme }: { theme: TThemePanelRecord }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-[0.3em] text-slate-400">State Space</h4>
        {theme.stateSpace.stuckIn && (
          <span className="text-[11px] text-amber-300">
            lingering in {theme.stateSpace.stuckIn.replace(/-/g, " ")}
          </span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {theme.stateSpace.nodes.map((node) => (
          <div key={node.id} className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{node.label}</p>
            <div className="mt-2 h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-white/80"
                style={{ width: `${Math.max(6, node.emphasis * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-300">{node.count}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DualityPanel({ theme }: { theme: TThemePanelRecord }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-[0.3em] text-slate-400">Tensions</h4>
      </div>
      <div className="mt-2 space-y-3">
        {theme.dualities.slice(0, 3).map((axis) => (
          <div key={axis.id}>
            <p className="text-xs text-slate-300">{axis.label}</p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
              <span>{axis.negative}</span>
              <div className="relative h-1 flex-1 rounded-full bg-white/10">
                <div
                  className="absolute -top-1 h-3 w-3 rounded-full bg-white shadow"
                  style={{ left: `${((axis.leaning + 1) / 2) * 100}%`, transform: "translateX(-50%)" }}
                />
              </div>
              <span>{axis.positive}</span>
            </div>
          </div>
        ))}
        {!theme.dualities.length && <p className="text-sm text-slate-500">No clear tensions detected.</p>}
      </div>
    </section>
  );
}

function ReframePanel({ theme }: { theme: TThemePanelRecord }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-[0.3em] text-slate-400">Reintroductions</h4>
      </div>
      <ul className="mt-2 space-y-2">
        {theme.reframes.map((reframe) => (
          <li key={reframe.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
            <p>{reframe.prompt}</p>
            {reframe.emphasis && <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">{reframe.emphasis}</p>}
          </li>
        ))}
        {!theme.reframes.length && <li className="text-sm text-slate-500">Awaiting more signals.</li>}
      </ul>
    </section>
  );
}

function EvidencePanel({ theme }: { theme: TThemePanelRecord }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-[0.3em] text-slate-400">Show Your Work</h4>
      </div>
      <ul className="mt-2 space-y-2">
        {theme.evidence.slice(0, 2).map((item) => (
          <li key={`${item.envelopeId}-${item.excerpt ?? "excerpt"}`} className="rounded-xl bg-white/5 p-2">
            <p className="text-xs font-semibold text-slate-200">{item.label}</p>
            {item.excerpt && <p className="text-[13px] text-slate-400">{item.excerpt}</p>}
          </li>
        ))}
        {!theme.evidence.length && <li className="text-sm text-slate-500">Evidence pending.</li>}
      </ul>
    </section>
  );
}
