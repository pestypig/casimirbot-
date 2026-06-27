type RecordLike = Record<string, unknown>;

export type HelixRuntimeCalculatorReceiptAnswerCoverage = {
  requirements: Array<{
    id: string;
    kind: string;
    satisfied: boolean;
  }>;
};

export type HelixRuntimeCalculatorReceiptAnswerDependencies = {
  readString: (value: unknown) => string | null;
  readReceiptExpression: (receipt: RecordLike) => string | null;
  readReceiptResultText: (receipt: RecordLike) => string | null;
  normalizeCoverageText: (value: string) => string;
  evaluateExpression: (expression: string) => number | null;
};

export const createHelixRuntimeCalculatorReceiptAnswer = (
  deps: HelixRuntimeCalculatorReceiptAnswerDependencies,
) => {
  const synthesizeCalculatorReceiptAnswer = (args: {
    prompt: string;
    receipts: Array<RecordLike>;
    coverage: HelixRuntimeCalculatorReceiptAnswerCoverage;
  }): string => {
    const lines = ["Calculator-backed answer:"];
    for (const receipt of args.receipts) {
      const setup = receipt.calculator_setup && typeof receipt.calculator_setup === "object" && !Array.isArray(receipt.calculator_setup)
        ? (receipt.calculator_setup as RecordLike)
        : {};
      const label = deps.readString(setup.subgoal) ?? deps.readString(receipt.subgoal_id) ?? "Calculator subgoal";
      const equation = deps.readString(setup.equation);
      const expression = deps.readReceiptExpression(receipt);
      const result = deps.readReceiptResultText(receipt);
      const unit = deps.readString(receipt.result_unit ?? setup.result_unit);
      const normalizedLabel = deps.normalizeCoverageText([label, receipt.subgoal_id].join(" "));
      if (result && normalizedLabel.includes("wavelength")) {
        lines.push(`Wavelength: ${result}${unit ? ` ${unit}` : ""}.`);
      } else if (result && normalizedLabel.includes("photon energy")) {
        lines.push(`Photon energy: ${result}${unit ? ` ${unit}` : ""}.`);
      }
      lines.push(`- ${label}`);
      if (equation) lines.push(`  Formula: ${equation}`);
      if (expression) lines.push(`  Calculator expression: ${expression}`);
      if (result) lines.push(`  Result: ${result}${unit ? ` ${unit}` : ""}`);
    }
    if (/\b(?:uncertainty|hbar|delta\s*x|dx|delta\s*p|dp)\b/i.test(args.prompt)) {
      lines.push("The equations conceptually connect localization to momentum spread and then translate that spread into an energy scale.");
      lines.push("Conceptually, Delta x Delta p >= hbar/2 says a wave state cannot be prepared with arbitrarily sharp position and momentum at the same time; this is a wave-packet bandwidth relation, not a mystical claim that observation or consciousness creates the result.");
      lines.push("In field and probability-amplitude language, tighter localization of the electron state requires a broader spread of momentum components, which is why the calculator receipts imply a minimum kinetic-energy scale.");
    }
    const missingNumericRequirements = args.coverage.requirements
      .filter((requirement) => requirement.kind === "numeric_result" && !requirement.satisfied)
      .map((requirement) => requirement.id);
    if (missingNumericRequirements.length > 0) {
      lines.push(`Missing requested numeric parts: ${missingNumericRequirements.join(", ")}.`);
    }
    lines.push("Interpretation: the numeric results above come from scientific-calculator receipts; the answer should not introduce unsupported numeric claims beyond those receipts.");
    return lines.join("\n");
  };

  const parseCalculatorAnswerNumber = (value: string): number | null => {
    const normalized = value.trim().replace(/\s+(?:null|undefined)\s*$/i, "");
    const match = normalized.match(/[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?/i);
    if (!match) return null;
    const number = Number(match[0]);
    return Number.isFinite(number) ? number : null;
  };

  const helixCalculatorAnswerConflictsWithExpressionResult = (text: string): boolean => {
    const resultPairs = Array.from(
      text.matchAll(/Calculator subgoal:\s*(?:evaluate\s+)?([^\r\n]+)[\r\n]+Result:\s*([^\r\n]+)/gi),
    );
    for (const match of resultPairs) {
      const expression = match[1]?.trim();
      const observed = parseCalculatorAnswerNumber(match[2] ?? "");
      if (!expression || observed === null) continue;
      const computed = deps.evaluateExpression(expression);
      if (computed === null) continue;
      const tolerance = Math.max(1e-9, Math.abs(computed) * 1e-9);
      if (Math.abs(observed - computed) > tolerance) return true;
    }
    return false;
  };

  const sanitizeHelixCalculatorAnswerAgainstReceiptResults = (args: {
    text: string;
    prompt: string;
    receipts: Array<RecordLike>;
    coverage: HelixRuntimeCalculatorReceiptAnswerCoverage;
  }): string =>
    helixCalculatorAnswerConflictsWithExpressionResult(args.text)
      ? synthesizeCalculatorReceiptAnswer({
          prompt: args.prompt,
          receipts: args.receipts,
          coverage: args.coverage,
        })
      : args.text;

  return {
    synthesizeCalculatorReceiptAnswer,
    helixCalculatorAnswerConflictsWithExpressionResult,
    sanitizeHelixCalculatorAnswerAgainstReceiptResults,
  };
};
