export const HELIX_WORKSPACE_OS_STATUS_CAPABILITY = "workspace_os.status" as const;

const workspaceOsSurfacePattern =
  /\b(?:workspace\s+os|(?:workspace|workstation)\s+status|workspace\s+capabilit(?:y|ies)|status\s+plane|capability\s+(?:status|health)|browser\s+(?:tab\s+)?capture|visual\s+capture|screen\s+capture|clipboard\s+(?:read|write|health|status)|source\s+bindings?|runtime\s+memory|client\s+adoption|fallback\s+routes?|device\s+drivers?|peripherals?|workspace\s+surfaces?)\b/i;

const workspaceOsDiagnosticPattern =
  /\b(?:status|health|healthy|available|availability|bound|binding|stale|missing|blocked|permission(?:s)?|required|diagnos(?:e|is|tic)?|inspect|check|why|failed|failure|fallback|connected|capable|surface|surfaces)\b/i;

const clipboardMutationPattern =
  /\b(?:write|copy)\b[\s\S]{0,80}\b(?:to|into)\s+(?:the\s+)?clipboard\b/i;

const diagnosticQualifierPattern =
  /\b(?:status|health|available|availability|capabilit(?:y|ies)|diagnos(?:e|is|tic)?|why|failed|failure|blocked|permission|fallback|bound|binding|stale|missing)\b/i;

export const isWorkspaceOsStatusPrompt = (promptText: string | null | undefined): boolean => {
  const prompt = String(promptText ?? "").trim();
  if (!prompt) return false;
  if (!workspaceOsSurfacePattern.test(prompt)) return false;
  if (!workspaceOsDiagnosticPattern.test(prompt)) return false;
  if (clipboardMutationPattern.test(prompt) && !diagnosticQualifierPattern.test(prompt)) return false;
  return true;
};

export const workspaceOsStatusReasonCodes = (promptText: string | null | undefined): string[] => {
  const prompt = String(promptText ?? "");
  const reasons = new Set<string>();
  if (/\bworkspace\s+os\b/i.test(prompt)) reasons.add("workspace_os_phrase");
  if (/\b(?:workspace|workstation)\s+(?:status|capabilit(?:y|ies)|surfaces?)\b/i.test(prompt)) reasons.add("workspace_status_phrase");
  if (/\bbrowser\b[\s\S]{0,50}\b(?:capture|tab|status|health|binding|bound|stale|missing)\b/i.test(prompt)) reasons.add("browser_capability_status");
  if (/\b(?:clipboard|copy|paste)\b[\s\S]{0,50}\b(?:status|health|available|failed|blocked|permission|capability|write|read)\b/i.test(prompt)) reasons.add("clipboard_capability_status");
  if (/\b(?:source\s+bindings?|bound|binding|stale|missing|client\s+adoption)\b/i.test(prompt)) reasons.add("source_binding_status");
  if (/\bruntime\s+memory|memory\s+pressure\b/i.test(prompt)) reasons.add("runtime_memory_status");
  if (/\bfallback\b/i.test(prompt)) reasons.add("fallback_metadata_requested");
  if (/\b(?:device\s+drivers?|peripherals?)\b/i.test(prompt)) reasons.add("device_driver_analogy_status");
  return reasons.size > 0 ? [...reasons] : ["workspace_os_status_prompt"];
};
