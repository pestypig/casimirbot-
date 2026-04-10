import { describe, expect, it } from "vitest";
import {
  getObservableUniverseAccordionDefaultActiveEtaCatalogEntry,
  getObservableUniverseAccordionEtaSelectableNearbyCatalog,
  getObservableUniverseAccordionVisibleNearbyCatalog,
} from "../shared/observable-universe-accordion-catalog.v1";

describe("observable universe accordion catalog contract", () => {
  it("keeps visible entries ordered, eta-selectable entries governed, and the active target present", () => {
    const visibleCatalog = getObservableUniverseAccordionVisibleNearbyCatalog();
    const etaSelectableCatalog = getObservableUniverseAccordionEtaSelectableNearbyCatalog();
    const defaultActiveEntry = getObservableUniverseAccordionDefaultActiveEtaCatalogEntry();

    expect(visibleCatalog.map((entry) => entry.displayOrder)).toEqual([10, 20, 30]);
    expect(etaSelectableCatalog.every((entry) => entry.visibleByDefault)).toBe(true);
    expect(
      etaSelectableCatalog.every((entry) =>
        visibleCatalog.some((visibleEntry) => visibleEntry.id === entry.id),
      ),
    ).toBe(true);
    expect(etaSelectableCatalog.every((entry) => entry.supportEvidence != null)).toBe(true);
    expect(
      etaSelectableCatalog.every(
        (entry) =>
          entry.etaSelectable &&
          entry.etaContractState === "explicit_nhm2_projection_contract",
      ),
    ).toBe(true);
    expect(defaultActiveEntry?.id).toBe("alpha-cen-a");
    expect(
      visibleCatalog.some((entry) => entry.id === defaultActiveEntry?.id),
    ).toBe(true);
  });
});
