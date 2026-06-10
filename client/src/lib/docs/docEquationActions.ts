import {
  isDocEquationActionManifestV1,
  type DocEquationActionEntryV1,
  type DocEquationActionManifestV1,
  type DocEquationActionV1,
} from "@shared/contracts/doc-equation-action-manifest.v1";
import { isTheoryCompoundRunV1, type TheoryCompoundRunV1 } from "@shared/contracts/theory-compound-run.v1";
import { dispatchScientificCalculatorMathPicked } from "@/lib/scientific-calculator/events";
import { useTheoryBadgeGraphPanelStore } from "@/store/useTheoryBadgeGraphPanelStore";
import { useTheoryCompoundRunStore } from "@/store/useTheoryCompoundRunStore";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";

type ManifestModule = DocEquationActionManifestV1 | { default?: DocEquationActionManifestV1 };

const sidecarModules = import.meta.glob("../../../../docs/**/*.equation-actions.json", {
  eager: true,
  import: "default",
}) as Record<string, ManifestModule>;

const DOC_PATH_PATTERN = /docs[\\/]/i;

const manifests = Object.values(sidecarModules)
  .map((module) => ("default" in module && module.default ? module.default : module))
  .filter(isDocEquationActionManifestV1);

const manifestByDocPath = new Map<string, DocEquationActionManifestV1>(
  manifests.map((manifest) => [normalizeDocPath(manifest.docPath), manifest]),
);

export type ExecuteDocEquationActionArgs = {
  currentPath?: string | null;
  anchor?: string | null;
  actionId: string;
  latex: string;
  fetchImpl?: typeof fetch;
};

export function getDocEquationActionManifest(docPath?: string | null): DocEquationActionManifestV1 | null {
  if (!docPath) return null;
  return manifestByDocPath.get(normalizeDocPath(docPath)) ?? null;
}

export function getDocEquationActionEntryForLatex(
  docPath: string | null | undefined,
  latex: string,
): DocEquationActionEntryV1 | null {
  const manifest = getDocEquationActionManifest(docPath);
  if (!manifest) return null;
  const normalized = normalizeLatexForDocAction(latex);
  if (!normalized) return null;
  return (
    manifest.entries.find((entry) => {
      const candidates = [entry.latex, ...(entry.aliases ?? [])];
      return candidates.some((candidate) => normalizeLatexForDocAction(candidate) === normalized);
    }) ?? null
  );
}

export function getDocEquationTheoryActions(entry: DocEquationActionEntryV1 | null): DocEquationActionV1[] {
  return entry?.actions.filter((action) => action.kind === "artifact_backed_theory_run") ?? [];
}

export async function executeDocEquationAction(args: ExecuteDocEquationActionArgs): Promise<void> {
  const entry = getDocEquationActionEntryForLatex(args.currentPath, args.latex);
  const action = entry?.actions.find((candidate) => candidate.actionId === args.actionId) ?? null;
  if (!entry || !action) return;

  if (action.kind === "calculator_ingest") {
    dispatchScientificCalculatorMathPicked({
      latex: args.latex,
      sourcePath: args.currentPath ?? null,
      anchor: args.anchor ?? entry.equationId,
    });
    openDocEquationPanels(action.openPanels ?? ["scientific-calculator"]);
    return;
  }

  if (action.alsoIngestLatex !== false) {
    dispatchScientificCalculatorMathPicked({
      latex: args.latex,
      sourcePath: args.currentPath ?? null,
      anchor: args.anchor ?? entry.equationId,
    });
  }

  openDocEquationPanels(action.openPanels ?? ["theory-badge-graph", "scientific-calculator"]);
  applyTheoryGraphOrientation(action);

  const badgeIds = action.badgeIds ?? [];
  if (badgeIds.length === 0) return;

  await loadStaticTheoryRun({
    badgeIds,
    mode: action.compoundRunMode ?? "dependency_path",
    preferredBadgeId: action.preferredBadgeId,
  });

  await loadArtifactBackedTheoryRun({
    badgeIds,
    mode: action.compoundRunMode ?? "dependency_path",
    preferredBadgeId: action.preferredBadgeId,
    fetchImpl: args.fetchImpl ?? fetch,
  });
}

export function normalizeLatexForDocAction(value: string): string {
  return value
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\,/g, "")
    .replace(/\\;/g, "")
    .replace(/\\!/g, "")
    .replace(/\s+/g, "")
    .replace(/[.;]+$/g, "")
    .trim();
}

function normalizeDocPath(raw: string): string {
  const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "");
  const matchIndex = normalized.search(DOC_PATH_PATTERN);
  const fromDocs = matchIndex === -1 ? normalized : normalized.slice(matchIndex);
  return fromDocs.replace(/^docs\/?/, "docs/").replace(/\/{2,}/g, "/");
}

function openDocEquationPanels(panelIds: string[]): void {
  const layout = useWorkstationLayoutStore.getState();
  Array.from(new Set(panelIds.filter(Boolean))).forEach((panelId) => {
    layout.openPanelInActiveGroup(panelId);
  });
}

function applyTheoryGraphOrientation(action: DocEquationActionV1): void {
  const graphStore = useTheoryBadgeGraphPanelStore.getState();
  if (action.atlasLensId) {
    graphStore.setActiveAtlasLensId(action.atlasLensId as Parameters<typeof graphStore.setActiveAtlasLensId>[0]);
  }
  if (action.badgeIds?.length) {
    graphStore.setSelectedBadgeIds(action.badgeIds);
    graphStore.setSelectedBadgeId(action.preferredBadgeId ?? action.badgeIds[0] ?? null);
  }
  if (!action.atlasGroupId) return;
  if (action.atlasLensId === "warp_gr_nhm2") {
    graphStore.setSelectedWarpGrNhm2GroupId(
      action.atlasGroupId as Parameters<typeof graphStore.setSelectedWarpGrNhm2GroupId>[0],
    );
  } else if (action.atlasLensId === "qei_stress_energy") {
    graphStore.setSelectedQeiStressEnergyGroupId(
      action.atlasGroupId as Parameters<typeof graphStore.setSelectedQeiStressEnergyGroupId>[0],
    );
  } else if (action.atlasLensId === "casimir_cavity_modes") {
    graphStore.setSelectedCasimirCavityGroupId(
      action.atlasGroupId as Parameters<typeof graphStore.setSelectedCasimirCavityGroupId>[0],
    );
  }
}

function selectEvidenceRunRow(run: TheoryCompoundRunV1, preferredBadgeId?: string): void {
  const runStore = useTheoryCompoundRunStore.getState();
  const preferredRow = preferredBadgeId
    ? run.rows.find(
        (row) =>
          row.badgeId === preferredBadgeId &&
          (row.runtimeReceiptV1 || row.runtimeMathTraceV1 || row.kind === "gate" || row.kind === "evidence"),
      )
    : null;
  const row =
    preferredRow ??
    run.rows.find((candidate) => candidate.runtimeReceiptV1) ??
    run.rows.find((candidate) => candidate.runtimeMathTraceV1) ??
    run.rows.find((candidate) => candidate.kind === "gate" || candidate.kind === "evidence") ??
    run.rows[0];
  if (row) runStore.selectTheoryRunRow(row.id);
}

async function loadStaticTheoryRun(args: {
  badgeIds: string[];
  mode: "selected_badges" | "dependency_path" | "locator_matches";
  preferredBadgeId?: string;
}): Promise<void> {
  const [{ buildNhm2TheoryBadgeGraphV1 }, { buildTheoryCompoundRun }] = await Promise.all([
    import("@shared/theory/nhm2-theory-badges"),
    import("@shared/theory/theory-compound-run-builder"),
  ]);
  const graph = buildNhm2TheoryBadgeGraphV1();
  const run = buildTheoryCompoundRun({
    graph,
    badgeIds: args.badgeIds,
    mode: args.mode,
    source: "workstation_action",
    includeScalar: true,
    includeRuntime: true,
    includeEvidence: true,
    includeBoundaries: true,
  });
  useTheoryCompoundRunStore.getState().loadTheoryRun(run);
  selectEvidenceRunRow(run, args.preferredBadgeId);
}

async function loadArtifactBackedTheoryRun(args: {
  badgeIds: string[];
  mode: "selected_badges" | "dependency_path" | "locator_matches";
  preferredBadgeId?: string;
  fetchImpl: typeof fetch;
}): Promise<void> {
  try {
    const response = await args.fetchImpl("/api/helix/theory/compound-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        badgeIds: args.badgeIds,
        mode: args.mode,
        source: "workstation_action",
        includeScalar: true,
        includeRuntime: true,
        includeEvidence: true,
        includeBoundaries: true,
        runQuick: false,
      }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { artifact_v1?: unknown };
    if (!isTheoryCompoundRunV1(payload.artifact_v1)) return;
    useTheoryCompoundRunStore.getState().loadTheoryRun(payload.artifact_v1);
    selectEvidenceRunRow(payload.artifact_v1, args.preferredBadgeId);
  } catch {
    // The static run remains loaded when artifact enrichment is unavailable.
  }
}
