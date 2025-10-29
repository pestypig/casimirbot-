import { useMemo, useRef } from "react";
import type { TermDef } from "@/lib/first-read-terms";
import { FIRST_READ_TERM_MAP } from "@/lib/first-read-terms";

type DefinitionChipProps = {
  term: TermDef;
  showDefinition: boolean;
  className?: string;
};

const baseChipClasses =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-none";

export function DefinitionChip({ term, showDefinition, className }: DefinitionChipProps) {
  const chipText = showDefinition ? term.label : term.symbol ?? term.label;
  const titleParts = [
    `${term.label}${term.unit ? ` (${term.unit})` : ""}: ${term.define}`,
    `Why: ${term.why}`,
  ];
  if (term.sourceField) titleParts.push(`Source: ${term.sourceField}`);
  if (term.cite) titleParts.push(`See: ${term.cite}`);
  return (
    <span
      className={`${baseChipClasses} ${showDefinition ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-200" : "border-slate-600 bg-slate-800/80 text-slate-200"} ${
        className ?? ""
      }`}
      title={titleParts.join("\n")}
    >
      {term.symbol ? <span className="font-mono text-[10px]">{term.symbol}</span> : null}
      <span className={showDefinition ? "text-[11px]" : "text-[10px] uppercase tracking-wide"}>
        {chipText}
      </span>
    </span>
  );
}

export function useTermRegistry() {
  const seenRef = useRef(new Set<string>());
  const lookup = useMemo(() => FIRST_READ_TERM_MAP, []);
  return (termId: string) => {
    const term = lookup[termId];
    if (!term) return { term: undefined, showDefinition: false };
    const firstTime = !seenRef.current.has(termId);
    if (firstTime) {
      seenRef.current.add(termId);
    }
    return { term, showDefinition: firstTime };
  };
}
