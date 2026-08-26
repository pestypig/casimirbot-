import type { HelixRobinhoodReadOnlyUpstreamTool } from "@shared/helix-brokerage-environment";

export type BrokerageEnvironmentReadIntent = {
  provider: "robinhood";
  upstream_tool: HelixRobinhoodReadOnlyUpstreamTool;
  upstream_arguments: Record<string, unknown>;
  evidence_kind:
    | "equity_quote"
    | "portfolio"
    | "positions"
    | "watchlists"
    | "orders";
};

const unquote = (value: string): string =>
  value.replace(/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`|“[^”\n]*”/gu, " ");

const clauses = (value: string): string[] =>
  unquote(value)
    .split(/[.!?;\n]+/u)
    .map((clause) => clause.trim())
    .filter(Boolean);

const domainCue = /\b(?:robinhood|brokerage(?:\s+environment)?|trading\s+environment)\b/i;
const readAction = /\b(?:read|check|fetch|get|show|report|inspect|look\s*up|lookup|query)\b/i;
const readSubject = /\b(?:quote|price|bid|ask|market\s+data|portfolio|positions?|holdings?|watchlists?|orders?)\b/i;
const contextualPrefix = /\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|if|when|before|after|would|could|might|hypothetically|eventually|later|earlier|previously|historically|screen|page|button|label|text|phrase|debug)\b/i;
const mutationAction = /\b(?:buy|sell|place|submit|cancel|replace|modify|approve|review)\b/i;

const hasAffirmativeAction = (clause: string, action: RegExp): boolean => {
  const match = action.exec(clause);
  if (!match) return false;
  return !contextualPrefix.test(clause.slice(0, match.index));
};

export const hasAffirmativeBrokerageMutationIntent = (prompt: string): boolean =>
  clauses(prompt).some((clause) =>
    mutationAction.test(clause) && hasAffirmativeAction(clause, mutationAction),
  );

const extractSymbols = (prompt: string): string[] => {
  const candidates = [
    ...Array.from(prompt.matchAll(/\$([A-Za-z]{1,5})\b/g), (match) => match[1]),
    ...Array.from(
      prompt.matchAll(/\b([A-Z]{1,5})\s+(?:stock\s+)?(?:quote|price|bid|ask)\b/g),
      (match) => match[1],
    ),
    ...Array.from(
      prompt.matchAll(/\b(?:quote|price|bid|ask)(?:\s+(?:for|of))?\s+([A-Z]{1,5})\b/g),
      (match) => match[1],
    ),
  ];
  return Array.from(new Set(candidates.map((symbol) => symbol.toUpperCase())));
};

export const classifyBrokerageEnvironmentReadIntent = (
  prompt: string,
): BrokerageEnvironmentReadIntent | null => {
  if (!domainCue.test(unquote(prompt))) return null;
  if (hasAffirmativeBrokerageMutationIntent(prompt)) return null;
  const readClause = clauses(prompt).find(
    (clause) =>
      (domainCue.test(clause) || domainCue.test(unquote(prompt))) &&
      readSubject.test(clause) &&
      hasAffirmativeAction(clause, readAction),
  );
  if (!readClause) return null;

  if (/\b(?:quote|price|bid|ask|market\s+data)\b/i.test(readClause)) {
    const symbols = extractSymbols(readClause);
    if (symbols.length === 0) return null;
    return {
      provider: "robinhood",
      upstream_tool: "get_equity_quotes",
      upstream_arguments: { symbols },
      evidence_kind: "equity_quote",
    };
  }
  if (/\b(?:positions?|holdings?)\b/i.test(readClause)) {
    return {
      provider: "robinhood",
      upstream_tool: "get_equity_positions",
      upstream_arguments: {},
      evidence_kind: "positions",
    };
  }
  if (/\bwatchlists?\b/i.test(readClause)) {
    return {
      provider: "robinhood",
      upstream_tool: "get_watchlists",
      upstream_arguments: {},
      evidence_kind: "watchlists",
    };
  }
  if (/\borders?\b/i.test(readClause)) {
    return {
      provider: "robinhood",
      upstream_tool: "get_equity_orders",
      upstream_arguments: {},
      evidence_kind: "orders",
    };
  }
  return {
    provider: "robinhood",
    upstream_tool: "get_portfolio",
    upstream_arguments: {},
    evidence_kind: "portfolio",
  };
};

export const isAffirmativeBrokerageEnvironmentReadPrompt = (
  prompt: string,
): boolean => classifyBrokerageEnvironmentReadIntent(prompt) !== null;
