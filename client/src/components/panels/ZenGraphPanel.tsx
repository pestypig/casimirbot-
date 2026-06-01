import React, { useMemo, useState } from "react";
import type {
  HelixRecommendedActionAdmissionEntryV1,
  HelixRecommendedActionAdmissionV1,
} from "@shared/contracts/helix-recommended-action-admission.v1";
import { canAgentAutomateAdmissionAction } from "@shared/helix-recommended-action-admission";
import type { IdeologyContextReflectionV1, IdeologyNodeMatchV1 } from "@shared/ideology-context-reflection";
import { Badge } from "@/components/ui/badge";
import { useZenGraphReflection } from "@/hooks/useZenGraphReflection";

type ZenBadgeTone = "lens" | "safeguard" | "boundary" | "action";

type ZenBadge = {
  id: string;
  title: string;
  subtitle: string;
  group: string;
  tone: ZenBadgeTone;
  confidence?: number;
  tags?: string[];
  pathToRoot?: string[];
};

function formatToken(value: string): string {
  return value.replace(/_/g, " ");
}

function toneClasses(tone: ZenBadgeTone, selected = false): string {
  const selectedRing = selected ? " ring-1 ring-cyan-300" : "";
  switch (tone) {
    case "lens":
      return `border-cyan-700 bg-cyan-950/35 text-cyan-50${selectedRing}`;
    case "safeguard":
      return `border-amber-700 bg-amber-950/35 text-amber-50${selectedRing}`;
    case "boundary":
      return `border-rose-800 bg-rose-950/35 text-rose-50${selectedRing}`;
    case "action":
      return `border-violet-700 bg-violet-950/30 text-violet-50${selectedRing}`;
    default:
      return `border-slate-800 bg-slate-950/70 text-slate-100${selectedRing}`;
  }
}

function bindingBoxClasses(tone: "cyan" | "emerald" | "amber" | "rose" | "violet" | "slate"): string {
  switch (tone) {
    case "cyan":
      return "border-cyan-700 bg-cyan-950/35 text-cyan-50";
    case "emerald":
      return "border-emerald-700 bg-emerald-950/35 text-emerald-50";
    case "amber":
      return "border-amber-700 bg-amber-950/35 text-amber-50";
    case "rose":
      return "border-rose-800 bg-rose-950/35 text-rose-50";
    case "violet":
      return "border-violet-700 bg-violet-950/30 text-violet-50";
    default:
      return "border-slate-800 bg-slate-950/70 text-slate-100";
  }
}

function confidenceLabel(value?: number): string {
  return typeof value === "number" ? `confidence ${value.toFixed(2)}` : "diagnostic";
}

function canShowExecutionControl(admission: HelixRecommendedActionAdmissionV1, action: HelixRecommendedActionAdmissionEntryV1) {
  return canAgentAutomateAdmissionAction(admission, action);
}

function matchToBadge(match: IdeologyNodeMatchV1, group: string, tone: ZenBadgeTone): ZenBadge {
  return {
    id: match.nodeId,
    title: match.label,
    subtitle: `${group} / ${confidenceLabel(match.score)}`,
    group,
    tone,
    confidence: match.score,
    tags: match.tags,
    pathToRoot: match.pathToRoot,
  };
}

function buildBadges(reflection: IdeologyContextReflectionV1, admission: HelixRecommendedActionAdmissionV1): ZenBadge[] {
  const badges: ZenBadge[] = [
    ...reflection.matches.exact.map((match) => matchToBadge(match, "Exact lens matches", "lens")),
    ...reflection.matches.likely.map((match) => matchToBadge(match, "Likely lens matches", "lens")),
    ...reflection.matches.inferred_lenses.map((match) => matchToBadge(match, "Inferred outer-edge lenses", "lens")),
    ...reflection.activated_traits.map((trait) => ({
      id: trait.nodeId,
      title: trait.label,
      subtitle: `Activated lens / ${confidenceLabel(trait.confidence)}`,
      group: "Activated traits",
      tone: "lens" as const,
      confidence: trait.confidence,
      tags: trait.tags,
      pathToRoot: trait.pathToRoot,
    })),
    ...(reflection.action_gate_warnings ?? []).map((warning) => ({
      id: warning.gateId,
      title: warning.label,
      subtitle: `Requires ${warning.requiredCheck ?? warning.warning}`,
      group: "Safeguards",
      tone: "safeguard" as const,
      tags: warning.requiredCheck ? [warning.requiredCheck] : [],
    })),
    ...(reflection.claim_boundaries.missing_evidence ?? []).map((missing) => ({
      id: `missing:${missing}`,
      title: `Boundary: ${formatToken(missing)}`,
      subtitle: "Claim boundary",
      group: "Claim boundaries",
      tone: "boundary" as const,
      tags: ["missing_evidence"],
    })),
    ...admission.actions.map((action) => ({
      id: action.actionId,
      title: action.label,
      subtitle: `${formatToken(action.admission)} / ${formatToken(action.risk)}`,
      group: "Recommended next steps",
      tone: action.admission === "blocked" ? ("boundary" as const) : ("action" as const),
      tags: action.reasonCodes,
    })),
  ];

  const seen = new Set<string>();
  return badges.filter((badge) => {
    const key = `${badge.group}:${badge.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function BadgeButton({
  badge,
  selected,
  onSelect,
}: {
  badge: ZenBadge;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border p-3 text-left transition hover:border-slate-500 ${toneClasses(badge.tone, selected)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{badge.title}</div>
          <div className="mt-1 line-clamp-2 text-xs opacity-80">{badge.subtitle}</div>
        </div>
        {typeof badge.confidence === "number" ? (
          <span className="rounded border border-current/30 px-1.5 py-0.5 text-[10px] opacity-80">
            {badge.confidence.toFixed(2)}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="outline" className="border-current/30 text-[10px] text-current">
          {formatToken(badge.tone)}
        </Badge>
        {(badge.tags ?? []).slice(0, 2).map((tag) => (
          <Badge key={tag} variant="outline" className="border-current/25 text-[10px] text-current opacity-75">
            {formatToken(tag)}
          </Badge>
        ))}
      </div>
    </button>
  );
}

function BindingBox({
  title,
  label,
  children,
  tone,
}: {
  title: string;
  label?: string;
  children: React.ReactNode;
  tone: "cyan" | "emerald" | "amber" | "rose" | "violet" | "slate";
}) {
  return (
    <section className={`rounded-md border p-3 ${bindingBoxClasses(tone)}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide opacity-80">{title}</h3>
        {label ? (
          <span className="rounded border border-current/25 px-2 py-0.5 text-[10px] uppercase tracking-wide opacity-75">
            {label}
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export function ZenGraphPanel({
  reflection,
  admission,
}: {
  reflection: IdeologyContextReflectionV1;
  admission: HelixRecommendedActionAdmissionV1;
}) {
  const state = useZenGraphReflection({ reflection, admission });
  const badges = useMemo(() => buildBadges(reflection, admission), [admission, reflection]);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>(badges[0]?.id ?? "");
  const selectedBadge = badges.find((badge) => badge.id === selectedBadgeId) ?? badges[0] ?? null;
  const activeLenses =
    reflection.activated_traits.length > 0
      ? reflection.activated_traits
      : reflection.matches.inferred_lenses.map((match) => ({
          nodeId: match.nodeId,
          label: match.label,
          confidence: match.score,
          pathToRoot: match.pathToRoot ?? [],
          tags: match.tags,
        }));
  const primaryPath = selectedBadge?.pathToRoot?.length
    ? selectedBadge.pathToRoot
    : activeLenses[0]?.pathToRoot ?? [];
  const missingChecks = reflection.claim_boundaries.missing_evidence ?? [];
  const groupedBadges = useMemo(() => {
    const groups = new Map<string, ZenBadge[]>();
    for (const badge of badges) {
      groups.set(badge.group, [...(groups.get(badge.group) ?? []), badge]);
    }
    return [...groups.entries()];
  }, [badges]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-slate-100" data-testid="zen-graph-panel">
      <header className="border-b border-slate-800 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">ZenGraph</div>
            <h2 className="text-xl font-semibold leading-tight">Diagnostic compass</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">{reflection.input.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <Badge variant="outline" className="border-slate-700">Diagnostic only</Badge>
            <Badge variant="outline" className="border-slate-700">Evidence only</Badge>
            <Badge variant="outline" className="border-slate-700">{badges.length} badges</Badge>
            <Badge variant="outline" className="border-slate-700">{state.admissionCount} admissions</Badge>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="min-h-0 overflow-y-auto pr-1">
          <div className="space-y-4">
            {groupedBadges.map(([group, items]) => (
              <section key={group}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</div>
                <div className="space-y-2">
                  {items.map((badge) => (
                    <BadgeButton
                      key={`${badge.group}:${badge.id}`}
                      badge={badge}
                      selected={badge.id === selectedBadge?.id && badge.group === selectedBadge.group}
                      onSelect={() => setSelectedBadgeId(badge.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <div className="rounded-md border border-slate-800 bg-slate-950/80">
            <div className="border-b border-slate-800 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-50">{selectedBadge?.title ?? "ZenGraph Objective Bindings"}</h3>
                  <div className="mt-1 text-xs text-slate-400">{selectedBadge?.id ?? reflection.reflectionId}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge className="bg-cyan-900/80 text-cyan-50">{selectedBadge ? formatToken(selectedBadge.tone) : "lens"}</Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">Evidence only</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <BindingBox title="Objective binding" label="activated lens" tone="cyan">
                <div className="font-semibold">{selectedBadge?.title ?? activeLenses[0]?.label ?? "No activated lens"}</div>
                <div className="mt-1 text-xs opacity-80">
                  {selectedBadge?.subtitle ?? "No deterministic ideology lens was selected."}
                </div>
              </BindingBox>

              <BindingBox title="Path to root" label="graph ancestry" tone="emerald">
                {primaryPath.length > 0 ? (
                  <ol className="space-y-2" aria-label="Path to root">
                    {primaryPath.map((nodeId, index) => (
                      <li key={`${nodeId}-${index}`} className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded border border-current/25 text-xs">
                          {index + 1}
                        </span>
                        <span className="rounded border border-current/20 bg-black/20 px-2 py-1 font-mono text-xs">
                          {nodeId}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <span className="text-sm opacity-75">No path to root available.</span>
                )}
              </BindingBox>

              <BindingBox title="Safeguards" label="missing checks" tone="amber">
                {reflection.action_gate_warnings && reflection.action_gate_warnings.length > 0 ? (
                  <div className="space-y-2">
                    {reflection.action_gate_warnings.map((warning) => (
                      <div key={warning.gateId} className="rounded border border-current/20 bg-black/20 p-2">
                        <div className="font-semibold">{warning.label}</div>
                        <div className="mt-1 text-xs opacity-80">Missing check: {warning.requiredCheck ?? warning.warning}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm opacity-75">No nearby safeguard warning found.</span>
                )}
              </BindingBox>

              <BindingBox title="Possible tensions" label="lens conflict" tone="violet">
                {reflection.tensions && reflection.tensions.length > 0 ? (
                  <div className="space-y-2">
                    {reflection.tensions.map((tension, index) => (
                      <div key={`${tension.description}-${index}`} className="rounded border border-current/20 bg-black/20 p-2">
                        <div className="font-semibold">Possible tension</div>
                        <p className="mt-1 text-xs opacity-80">{tension.description}</p>
                        <div className="mt-2 text-xs opacity-80">Severity: {tension.severity}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm opacity-75">No possible tension flagged.</span>
                )}
              </BindingBox>

              <BindingBox title="Claim boundaries" label="diagnostic only" tone="rose">
                <div className="space-y-2">
                  {missingChecks.length > 0 ? (
                    missingChecks.map((item) => (
                      <div key={item} className="rounded border border-current/20 bg-black/20 px-2 py-1">
                        Missing check: {formatToken(item)}
                      </div>
                    ))
                  ) : (
                    <div className="opacity-75">No missing check listed.</div>
                  )}
                  <div className="grid gap-1 text-xs opacity-80">
                    <span>Diagnostic only: {reflection.claim_boundaries.diagnostic_only ? "true" : "false"}</span>
                    <span>Evidence only: {reflection.authority.ask_context_policy === "evidence_only" ? "true" : "false"}</span>
                  </div>
                </div>
              </BindingBox>

              <BindingBox title="Recommended next steps" label="admission contract" tone="slate">
                <div className="space-y-2">
                  {admission.actions.map((action) => (
                    <div key={action.actionId} className="rounded border border-slate-800 bg-slate-900/70 p-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-100">Recommended next step: {action.label}</div>
                        <span className="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                          {action.admission === "ask_user" ? "Ask user" : action.admission === "blocked" ? "Blocked" : "Auto"}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-xs text-slate-400">
                        <span>Risk: {formatToken(action.risk)}</span>
                        <span>Display policy: {formatToken(action.display_policy ?? "actionable")}</span>
                        <span>Reason: {action.reason}</span>
                      </div>
                      {canShowExecutionControl(admission, action) ? (
                        <button type="button" className="mt-2 rounded border border-cyan-500 px-2 py-1 text-xs text-cyan-100">
                          Execute
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </BindingBox>

              <BindingBox title="Admission/debug details" label="source refs" tone="slate">
                <div className="space-y-2 text-xs text-slate-400">
                  <div>Admission state: {admission.summary.autoCount} auto / {admission.summary.askUserCount} ask user / {admission.summary.blockedCount} blocked</div>
                  <div>Artifact: {admission.source?.artifact_id ?? admission.sourceReceiptId ?? "none"}</div>
                  <div>Authority: Evidence only</div>
                  <div>Evidence refs: {(admission.evidenceRefs ?? []).length > 0 ? admission.evidenceRefs?.join(", ") : "none"}</div>
                </div>
              </BindingBox>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ZenGraphPanel;
