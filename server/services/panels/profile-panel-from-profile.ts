import type { EssenceProfile, EssenceProfileSummaryResult } from "@shared/inferenceProfile";

const labelMap: Record<string, string> = {
  learning: "Learning",
  health: "Health",
  creative_work: "Creative work",
  relationships: "Relationships",
  execution_ops: "Execution & ops",
  craftsmanship: "Craftsmanship",
  autonomy: "Autonomy",
  stability: "Stability",
  exploration: "Exploration",
};

const toEntries = (source: unknown): Array<{ key: string; value?: number }> => {
  if (!source || typeof source !== "object") {
    return [];
  }
  return Object.entries(source as Record<string, number | undefined>).map(([key, value]) => ({ key, value }));
};

export function buildProfileHelixPanelCode(
  personaId: string,
  profile: EssenceProfile,
  summary: EssenceProfileSummaryResult,
): string {
  const focus = toEntries(summary.focus_areas ?? profile.focus_areas);
  const aspirations = toEntries(summary.aspiration_signals ?? profile.aspiration_signals);
  const rhythms = summary.rhythms ?? profile.rhythms ?? {};
  const sustainability = summary.sustainability ?? profile.sustainability ?? {};
  const interaction = summary.interaction_style ?? profile.interaction_style ?? {};
  const longevity = summary.longevity ?? profile.longevity ?? {};
  const updatedAt = summary.updated_at ?? new Date().toISOString();

  const focusJson = JSON.stringify(focus, null, 2);
  const aspirationJson = JSON.stringify(aspirations, null, 2);
  const rhythmsJson = JSON.stringify(rhythms, null, 2);
  const sustainabilityJson = JSON.stringify(sustainability, null, 2);
  const interactionJson = JSON.stringify(interaction, null, 2);
  const longevityJson = JSON.stringify(longevity, null, 2);

  return `import * as React from "react";

type GaugeProps = { label: string; value?: number };
const clamp01 = (v?: number) => (Number.isFinite(v as number) ? Math.min(1, Math.max(0, Number(v))) : undefined);

const Gauge: React.FC<GaugeProps> = ({ label, value }) => {
  const pct = clamp01(value);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300"
            style={{ width: pct === undefined ? "12%" : \`\${(pct * 100).toFixed(0)}%\` }}
          />
        </div>
        <span className="text-sm text-slate-200">{pct === undefined ? "N/A" : (pct * 100).toFixed(0) + "%"}</span>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow-lg shadow-cyan-900/20">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">{title}</h2>
      {subtitle ? <span className="text-[11px] text-slate-400">{subtitle}</span> : null}
    </div>
    <div className="mt-3 space-y-3">{children}</div>
  </section>
);

const personaLabel = ${JSON.stringify(personaId)};
const focusAreas = ${focusJson};
const aspirationSignals = ${aspirationJson};
const rhythms = ${rhythmsJson};
const sustainability = ${sustainabilityJson};
const interaction = ${interactionJson};
const longevity = ${longevityJson};

const labelMap: Record<string, string> = ${JSON.stringify(labelMap, null, 2)};

const friendlyLabel = (key: string) => labelMap[key] ?? key.replace(/_/g, " ");

const Pill: React.FC<{ text: string }> = ({ text }) => (
  <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">{text}</span>
);

export default function ProfileHelixPanel() {
  return (
    <div className="flex h-full flex-col gap-4 bg-gradient-to-b from-[#050915] via-[#060b1b] to-[#050915] p-5 text-slate-100">
      <header className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 shadow-lg shadow-cyan-900/30">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-200/80">Helix start: Persona</p>
          <h1 className="text-xl font-semibold text-white">Resonance & cycles for {personaLabel}</h1>
          <p className="text-xs text-slate-400">Updated {new Date("${updatedAt}").toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
          {interaction.prefers_bullets && <Pill text="prefers bullets" />}
          {interaction.prefers_code && <Pill text="prefers code" />}
          {interaction.detail_level && <Pill text={\`detail: \${interaction.detail_level}\`} />}
          {interaction.tone_preference && <Pill text={interaction.tone_preference} />}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Cycles" subtitle="periodicity + cadence">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Gauge label="Short sessions" value={rhythms.likes_short_sessions ? 0.72 : undefined} />
            <Gauge
              label="Batching preference"
              value={
                rhythms.batching_preference === "high"
                  ? 0.9
                  : rhythms.batching_preference === "medium"
                    ? 0.55
                    : rhythms.batching_preference === "low"
                      ? 0.25
                      : undefined
              }
            />
          </div>
          <p className="text-xs text-slate-400">
            Use this band to plan small bursts or wider batches depending on their rhythm signals. Keep cycles visible at a glance.
          </p>
        </Section>

        <Section title="Energy budget" subtitle="sustainability signals">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Gauge label="Prefers small steps" value={sustainability.prefers_small_steps ? 0.8 : undefined} />
            <Gauge label="Follow-through" value={sustainability.follow_through_rate} />
          </div>
          <p className="text-xs text-slate-400">
            Highlight constraints before suggesting plans. Lower friction, keep experiments reversible, and respect recovery windows.
          </p>
        </Section>

        <Section title="Signals" subtitle="telemetry + hints">
          <div className="flex flex-wrap gap-2">
            {focusAreas.length === 0 && <p className="text-xs text-slate-400">No focus signals yet.</p>}
            {focusAreas.map((entry) => (
              <Pill
                key={entry.key}
                text={\`\${friendlyLabel(entry.key)}: \${entry.value === undefined ? "N/A" : (entry.value * 100).toFixed(0) + "%"}\`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {aspirationSignals.map((entry) => (
              <Pill key={entry.key} text={\`Aspires: \${friendlyLabel(entry.key)}\`} />
            ))}
          </div>
        </Section>

        <Section title="Experiments" subtitle="premise + test + reflect">
          <ul className="space-y-2 text-sm text-slate-200">
            <li>Pick one focus and one sustainability constraint.</li>
            <li>Craft a 3-step micro-experiment with a clear stop condition.</li>
            <li>Reflect using a single metric: effort, mood, or outcome.</li>
          </ul>
        </Section>

        <Section title="Resonance" subtitle="contexts that amplify">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Array.isArray(longevity.recurring_themes) && longevity.recurring_themes.length > 0 ? (
              longevity.recurring_themes.map((theme) => <Pill key={theme} text={theme} />)
            ) : (
              <p className="text-xs text-slate-400">No recurring themes recorded yet.</p>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Track which environments, collaborators, or tools increase throughput or ease. Keep cues visible in the start window.
          </p>
        </Section>

        <Section title="Interaction style" subtitle="format + tone">
          <div className="space-y-2 text-sm text-slate-200">
            <p>Detail level: {interaction.detail_level ?? "not set"}</p>
            <p>Prefers bullets: {interaction.prefers_bullets ? "yes" : "not emphasized"}</p>
            <p>Prefers code: {interaction.prefers_code ? "yes" : "not emphasized"}</p>
            <p>Tone: {interaction.tone_preference ?? "neutral"}</p>
          </div>
        </Section>
      </div>
    </div>
  );
}
`;
}
