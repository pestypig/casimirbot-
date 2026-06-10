import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  executeDocEquationAction,
  getDocEquationActionEntryForLatex,
  getDocEquationTheoryActions,
  normalizeLatexForDocAction,
} from "../docEquationActions";
import { useTheoryBadgeGraphPanelStore } from "@/store/useTheoryBadgeGraphPanelStore";
import { selectActiveTheoryRunRow, useTheoryCompoundRunStore } from "@/store/useTheoryCompoundRunStore";

const NHM2_WHITEPAPER = "docs/research/nhm2-current-status-whitepaper-2026-05-02.md";

describe("doc equation actions", () => {
  beforeEach(() => {
    useTheoryBadgeGraphPanelStore.getState().resetPanelMemory();
    useTheoryCompoundRunStore.getState().clearTheoryRun();
  });

  it("normalizes equivalent LaTeX action keys", () => {
    expect(normalizeLatexForDocAction("\\left(\\frac{d\\tau}{dt}\\right)^2 = \\alpha^2.")).toBe(
      normalizeLatexForDocAction("(\\frac{d\\tau}{dt})^2=\\alpha^2"),
    );
  });

  it("locates NHM2 whitepaper runtime-backed equation entries", () => {
    const entry = getDocEquationActionEntryForLatex(
      `/${NHM2_WHITEPAPER}`,
      "\\mathcal{T}^{\\rm same-chart}_{\\rm full}=\\{T_{00},T_{0i},T_{ii},T_{ij,\\ i\\ne j}\\}",
    );

    expect(entry?.equationId).toBe("nhm2-same-chart-full-tensor-ledger");
    expect(getDocEquationTheoryActions(entry)[0]?.preferredBadgeId).toBe("nhm2.tensor.same_chart_full_tensor");
  });

  it("opens an artifact-backed theory orientation from a whitepaper equation action", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false }) as Response);

    await executeDocEquationAction({
      currentPath: NHM2_WHITEPAPER,
      actionId: "open-same-chart-full-tensor-artifact",
      latex: "\\mathcal{T}^{\\rm same-chart}_{\\rm full}=\\{T_{00},T_{0i},T_{ii},T_{ij,\\ i\\ne j}\\}",
      fetchImpl,
    });

    const graphState = useTheoryBadgeGraphPanelStore.getState();
    const runState = useTheoryCompoundRunStore.getState();
    const selectedRow = selectActiveTheoryRunRow(runState);

    expect(graphState.activeAtlasLensId).toBe("warp_gr_nhm2");
    expect(graphState.selectedWarpGrNhm2GroupId).toBe("warp.nhm2.diagnostic_path");
    expect(runState.activeTheoryRun?.targetBadgeIds).toContain("nhm2.tensor.same_chart_full_tensor");
    expect(selectedRow?.badgeId).toBe("nhm2.tensor.same_chart_full_tensor");
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/helix/theory/compound-run",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
