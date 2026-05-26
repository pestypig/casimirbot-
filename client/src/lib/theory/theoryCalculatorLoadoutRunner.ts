import { buildTheoryCalculatorLoadoutV1, type TheoryCalculatorLoadoutV1 } from "@shared/contracts/theory-calculator-loadout.v1";
import { runScientificSolve } from "@/lib/scientific-calculator/solver";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";

export function solveTheoryCalculatorLoadoutNow(loadout: TheoryCalculatorLoadoutV1): TheoryCalculatorLoadoutV1 {
  const scientificState = useScientificCalculatorStore.getState();
  const solvedItems = loadout.items.map((item) => {
    if (item.kind !== "calculator_payload" || !item.solveExpression) return item;
    scientificState.ingestLatex(item.solveExpression, {
      sourcePath: item.sourcePath,
      anchor: item.payloadId,
      source: "workstation_action",
      calculatorSetup: item.setupContext,
      compoundRunId: loadout.loadoutId,
      compoundSubgoalId: item.id,
    });
    const result = runScientificSolve(item.solveExpression, true);
    scientificState.setSolveResult(result, {
      actionId: "solve_with_steps",
      source: "workstation_action",
      calculatorSetup: item.setupContext,
      compoundRunId: loadout.loadoutId,
      compoundSubgoalId: item.id,
    });
    return {
      ...item,
      resultText: result.result_text,
      resultLatex: result.result_latex ?? null,
      resultKind: result.artifact_v1?.result.kind ?? null,
      confidence: result.artifact_v1?.quality.confidence ?? null,
      fallbackReason: result.artifact_v1?.quality.fallbackReason ?? null,
      calculatorArtifactV1: result.artifact_v1 ?? null,
      warnings: result.ok ? item.warnings : [...item.warnings, result.error ?? "calculator solve failed"],
    };
  });

  const solvedLoadout = buildTheoryCalculatorLoadoutV1({
    loadoutId: loadout.loadoutId,
    graphId: loadout.graphId,
    source: loadout.source,
    mode: loadout.mode,
    targetBadgeIds: loadout.targetBadgeIds,
    objectContext: loadout.objectContext,
    items: solvedItems,
    claimBoundaryNotes: loadout.claimBoundaryNotes,
    generatedAt: loadout.generatedAt,
  });
  scientificState.updateTheoryLoadout(solvedLoadout);
  return solvedLoadout;
}
