import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildZenGraphLaunchReflectionArtifacts } from "@/lib/zen-graph/fruitionLaunchArtifact";
import { useFruitionCalculatorStore } from "@/store/useFruitionCalculatorStore";
import type {
  FruitionProcedureExpressionV1,
  FruitionProcedureOperatorV1,
  FruitionProcedureTermV1,
} from "@shared/fruition-procedure-expression";

function labelize(value: string): string {
  return value.replace(/[_-]/g, " ");
}

function termTone(term: FruitionProcedureTermV1): string {
  if (term.polarity === "blocks") return "border-rose-800/70 bg-rose-950/30 text-rose-100";
  if (term.polarity === "requires") return "border-amber-800/70 bg-amber-950/30 text-amber-100";
  if (term.kind === "lens" || term.kind === "trait") return "border-cyan-800/70 bg-cyan-950/30 text-cyan-100";
  return "border-slate-800 bg-slate-950/70 text-slate-200";
}

function operatorTone(operator: FruitionProcedureOperatorV1): string {
  if (operator.kind === "blocks") return "border-rose-800/70 bg-rose-950/20";
  if (operator.kind === "requires" || operator.kind === "asks_for") return "border-amber-800/70 bg-amber-950/20";
  if (operator.kind === "supports") return "border-emerald-800/70 bg-emerald-950/20";
  return "border-slate-800 bg-slate-950/60";
}

function TermCard({ term }: { term: FruitionProcedureTermV1 }) {
  return (
    <div className={`rounded-md border p-3 ${termTone(term)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{term.label}</div>
          <div className="mt-1 font-mono text-[10px] opacity-75">{term.id}</div>
        </div>
        <Badge variant="outline" className="border-current/30 text-[10px] text-current">
          {term.confidence.toFixed(2)}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="outline" className="border-current/30 text-[10px] text-current">
          {labelize(term.kind)}
        </Badge>
        <Badge variant="outline" className="border-current/30 text-[10px] text-current">
          {labelize(term.polarity)}
        </Badge>
        {term.proceduralRole ? (
          <Badge variant="outline" className="border-current/30 text-[10px] text-current">
            {labelize(term.proceduralRole)}
          </Badge>
        ) : null}
        {term.procedureOperator ? (
          <Badge variant="outline" className="border-current/30 text-[10px] text-current">
            {labelize(term.procedureOperator)}
          </Badge>
        ) : null}
        {(term.sourceNodeIds ?? []).slice(0, 2).map((nodeId) => (
          <Badge key={nodeId} variant="outline" className="border-current/25 text-[10px] text-current opacity-75">
            {labelize(nodeId)}
          </Badge>
        ))}
      </div>
      {term.actionEffect ? <p className="mt-2 text-xs opacity-85">{term.actionEffect}</p> : null}
      {term.evidenceNeeds?.length || term.refusesAuthority?.length ? (
        <div className="mt-2 space-y-1 font-mono text-[10px] opacity-75">
          {term.evidenceNeeds?.length ? <div>needs: {term.evidenceNeeds.map(labelize).join(", ")}</div> : null}
          {term.refusesAuthority?.length ? <div>refuses: {term.refusesAuthority.map(labelize).join(", ")}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function OperatorCard({ operator }: { operator: FruitionProcedureOperatorV1 }) {
  return (
    <div className={`rounded-md border p-3 ${operatorTone(operator)}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-100">{operator.label}</div>
        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
          {labelize(operator.kind)}
        </Badge>
      </div>
      <div className="mt-2 grid gap-1 font-mono text-[10px] text-slate-400">
        <span>from: {operator.fromTermIds.join(" + ")}</span>
        <span>to: {operator.toTermIds.join(" + ")}</span>
      </div>
      <p className="mt-2 text-xs text-slate-400">{operator.rationale}</p>
    </div>
  );
}

function ExpressionView({ expression }: { expression: FruitionProcedureExpressionV1 }) {
  return (
    <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-h-0 overflow-y-auto pr-1">
        <div className="rounded-md border border-violet-900/70 bg-violet-950/20 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-violet-300">Procedural expression</div>
          <div className="mt-3 rounded border border-violet-800/70 bg-black/30 p-3 font-mono text-xs leading-relaxed text-violet-100">
            {expression.expression}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
            <Badge variant="outline" className="border-slate-700">calculator: {expression.calculator.name}</Badge>
            <Badge variant="outline" className="border-slate-700">model calls: {expression.calculator.modelCalls}</Badge>
            <Badge variant="outline" className="border-slate-700">schema: {expression.schemaVersion}</Badge>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Terms</h3>
            <div className="mt-2 space-y-2">
              {expression.terms.map((term) => (
                <TermCard key={term.id} term={term} />
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operators</h3>
            <div className="mt-2 space-y-2">
              {expression.operators.map((operator) => (
                <OperatorCard key={operator.id} operator={operator} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <aside className="min-h-0 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/80 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Result posture</div>
        <div className="mt-2 text-lg font-semibold text-slate-50">{expression.result.label}</div>
        <div className="mt-1 font-mono text-xs text-slate-500">{labelize(expression.result.posture)}</div>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          <div>Recommended actions: {expression.result.recommendedActionIds.length}</div>
          <div>Missing checks: {expression.result.missingEvidence.length ? expression.result.missingEvidence.map(labelize).join(", ") : "none"}</div>
          <div>Admission state: {expression.result.admission.summary.autoCount} auto / {expression.result.admission.summary.askUserCount} ask user / {expression.result.admission.summary.blockedCount} blocked</div>
          <div>Agent executable: {expression.result.agentExecutable ? "true" : "false"}</div>
        </div>
        <div className="mt-4 rounded border border-cyan-900/70 bg-cyan-950/20 p-3 text-xs text-cyan-100">
          Evidence only / diagnostic authority / terminal ineligible.
        </div>
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inputs</div>
          <div className="mt-2 space-y-1 text-xs text-slate-400">
            <div>Kind: {labelize(expression.inputs.inputKind)}</div>
            <div>Summary: {expression.inputs.summary}</div>
            <div>Refs: {(expression.inputs.refs ?? []).join(", ") || "none"}</div>
            <div>Reflection: {expression.sourceReflectionId}</div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function FruitionCalculatorPanel() {
  const { currentExpression, history, loadExpression, clear } = useFruitionCalculatorStore();
  const demoExpression = useMemo(() => buildZenGraphLaunchReflectionArtifacts().fruition, []);
  const expression = currentExpression ?? demoExpression;

  return (
    <div className="flex h-full min-h-[520px] flex-col bg-slate-950 text-slate-100" data-testid="fruition-calculator-panel">
      <header className="border-b border-slate-800 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Fruition Calculator</h2>
            <p className="mt-1 text-sm text-slate-400">
              Deterministic procedure expression from Zen Badge Graph reflection.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!currentExpression ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-violet-700 text-violet-100"
                onClick={() => loadExpression(demoExpression, { source: "launch_demo" })}
              >
                Load Demo Expression
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" className="border-slate-700 text-slate-200" onClick={clear}>
              Clear
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
          <Badge variant="outline" className="border-slate-700">{expression.terms.length} terms</Badge>
          <Badge variant="outline" className="border-slate-700">{expression.operators.length} operators</Badge>
          <Badge variant="outline" className="border-slate-700">{history.length} history entries</Badge>
        </div>
      </header>
      <ExpressionView expression={expression} />
    </div>
  );
}
