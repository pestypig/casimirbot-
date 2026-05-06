import fs from "node:fs";

export interface CitationBoundaryRef {
  id: string;
  allowedUse: string[];
  forbiddenUse: string[];
  doesValidateNHM2?: false;
}

export interface CitationBoundary {
  schemaVersion: "v1";
  globalRule: string;
  requiredRefs: CitationBoundaryRef[];
}

export function loadCitationBoundary(pathname: string): CitationBoundary {
  return JSON.parse(fs.readFileSync(pathname, "utf8")) as CitationBoundary;
}

export function validateCitationBoundary(boundary: CitationBoundary): string[] {
  const issues: string[] = [];
  if (boundary.schemaVersion !== "v1") issues.push("citation boundary schemaVersion must be v1");
  if (!/does not validate NHM2/i.test(boundary.globalRule)) issues.push("globalRule must state that literature does not validate NHM2");
  for (const ref of boundary.requiredRefs ?? []) {
    if (ref.doesValidateNHM2 !== false) issues.push(`literature ref ${ref.id} must have doesValidateNHM2=false`);
    if (!Array.isArray(ref.allowedUse) || ref.allowedUse.length === 0) issues.push(`literature ref ${ref.id} needs allowedUse entries`);
    if (!Array.isArray(ref.forbiddenUse) || ref.forbiddenUse.length === 0) issues.push(`literature ref ${ref.id} needs forbiddenUse entries`);
  }
  return issues;
}
