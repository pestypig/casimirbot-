import { appendSourcesLine, hasSourcesLine, sanitizeSourcesLine } from "./sources-policy";

export const repairTerminalVisibleSources = (args: {
  text: string;
  allowlist: string[];
  lineCandidates: string[];
}): {
  text: string;
  applied: boolean;
} => {
  if (!args.text.trim() || args.allowlist.length === 0 || args.lineCandidates.length === 0) {
    return {
      text: args.text,
      applied: false,
    };
  }
  let repaired = sanitizeSourcesLine(args.text, args.allowlist, args.allowlist);
  if (!hasSourcesLine(repaired)) {
    repaired = appendSourcesLine(repaired, args.lineCandidates);
  }
  return {
    text: repaired,
    applied: repaired !== args.text,
  };
};

export const repairGlobalTerminalSources = (args: {
  text: string;
  visibleSourcesRequired: boolean;
  sourcesMissingReasonPresent: boolean;
  allowedSources: string[];
}): {
  text: string;
  applied: boolean;
} => {
  if (
    !args.visibleSourcesRequired ||
    !args.sourcesMissingReasonPresent ||
    args.allowedSources.length === 0
  ) {
    return {
      text: args.text,
      applied: false,
    };
  }
  return repairTerminalVisibleSources({
    text: args.text,
    allowlist: args.allowedSources,
    lineCandidates: args.allowedSources,
  });
};
