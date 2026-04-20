import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  evaluateSolarFlareObservableGuardrails,
  normalizeValidMask,
  solarFlareSpectralObservableSchema,
} from "../shared/solar-flare-observable";

function makeValidSolarFlareObservable() {
  return {
    schema_version: "solar_flare_spectral_observable/v1",
    observable_id: "dkist_visp_c6p7_decay_ribbon_center",
    lane_id: "stellar_radiation",
    modality: "spectrum",
    axes: [
      { name: "wavelength", unit: "nm", physical_type: "em.wavelength", monotonic: true },
      { name: "slit_position", unit: "pix", physical_type: "detector.position" },
    ],
    data_ref: "artifacts/solar/dkist/visp/c6p7-decay-ribbon-center.fits",
    value_unit: "arb_intensity_units",
    valid_mask: [true, true, true, false, true, true],
    raw_mask_semantics: "native",
    min_valid_fraction: 0.7,
    error: {
      uncertainty_ref: "artifacts/solar/dkist/visp/c6p7-decay-ribbon-center-uncertainty.fits",
      quality_label: "seeing_and_calibration_quality",
    },
    response_model_ref: {
      id: "dkist_visp_lsf_psf_v1",
      kind: "instrument_response",
      model_ref: "artifacts/solar/dkist/visp/lsf-psf.json",
    },
    baseline_ref: "dkist_visp_preflare_ribbon_center",
    provenance_ref: {
      source_id: "dkist_visp_2022-08-19_20-42-00_c6p7",
      source_family: "DKIST",
      source_url: "https://link.springer.com/article/10.1007/s11207-026-02633-1",
      citation_refs: [
        "https://link.springer.com/article/10.1007/s11207-026-02633-1",
        "https://nso.edu/blog/new-solar-flare-observations-challenge-leading-theories/",
      ],
    },
    claim_tier: "diagnostic",
    provenance_class: "observed",
    intended_observables: [
      "line_residual",
      "continuum_fit",
      "angular_residual",
      "band_flux_closure",
    ],
    instrument: "DKIST_ViSP",
    line_window: [
      {
        line_id: "Ca_II_H_396.85nm",
        wavelength_min_nm: 396.65,
        wavelength_max_nm: 396.95,
      },
      {
        line_id: "H_epsilon_397.01nm",
        wavelength_min_nm: 396.95,
        wavelength_max_nm: 397.08,
      },
    ],
    optical_depth_regime: "optically_thick",
    flare_phase: "decay",
    stokes_mode: "I",
    spatial_context: {
      frame: "Helioprojective",
      longitude_arcsec: 522.3,
      latitude_arcsec: -274.2,
      ribbon_segment: "center",
      context_image_refs: ["artifacts/solar/context/aia-1600-ribbon.png"],
      coalignment_ref: "artifacts/solar/context/visp-vbi-aia-coalignment.json",
      unresolved_mixing_flag: true,
      unresolved_mixing_note: "Ribbon-center slit sample still includes sub-pixel structure under seeing variability.",
    },
    subtraction: {
      method: "nonflare_subtraction",
      reference_observation_id: "dkist_visp_preflare_ribbon_center",
      note: "Subtract non-flare profile before comparing line asymmetry and width.",
    },
    descriptors: {
      peak_count: 1,
      central_reversal: false,
      red_wing_width_pm: 62,
      blue_wing_width_pm: 39,
      bisector_ref: "artifacts/solar/dkist/visp/c6p7-decay-bisector.csv",
      gaussian_components_ref: "artifacts/solar/dkist/visp/c6p7-decay-double-gaussian.json",
    },
    forward_model_comparisons: [
      {
        model_family: "RADYN_RH",
        heating_family: "electron_beam",
        model_state_ref: "artifacts/solar/models/radyn-rh-decay-500s.json",
        psf_ref: "artifacts/solar/dkist/visp/empirical-gaussian-psf.json",
        residual_summary_ref: "artifacts/solar/models/radyn-rh-decay-500s-residual.json",
      },
    ],
    origin_hypotheses: [
      {
        mechanism: "chromospheric_relaxation_with_multilayer_contribution",
        layer_support: ["upper_chromosphere", "lower_chromosphere", "preflare_coupled"],
        evidence_refs: [
          "artifacts/solar/dkist/visp/c6p7-decay-ribbon-center.fits",
          "artifacts/solar/models/radyn-rh-decay-500s-residual.json",
        ],
        confidence: 0.63,
        interpretation_status: "suggestive",
      },
    ],
  } as const;
}

describe("solar flare observable contract", () => {
  it("accepts a baseline-aware DKIST ViSP flare observable record", () => {
    const parsed = solarFlareSpectralObservableSchema.parse(
      makeValidSolarFlareObservable(),
    );
    expect(parsed.instrument).toBe("DKIST_ViSP");
    expect(parsed.line_window).toHaveLength(2);
    expect(parsed.optical_depth_regime).toBe("optically_thick");
    expect(parsed.subtraction?.method).toBe("nonflare_subtraction");
    expect(parsed.origin_hypotheses?.[0]?.interpretation_status).toBe("suggestive");
  });

  it("rejects optically thick records that omit baseline-aware subtraction", () => {
    const invalid = {
      ...makeValidSolarFlareObservable(),
      subtraction: {
        method: "none",
      },
    };
    const result = solarFlareSpectralObservableSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("normalizes Astropy and IMAS mask conventions into canonical valid-mask semantics", () => {
    const astropyRawMask = [true, false, true, false];
    const astropyValid = normalizeValidMask(astropyRawMask, "astropy_true_invalid");
    expect(astropyValid).toEqual([false, true, false, true]);

    const imasRawValidity = [1, 0, -1, -2, 1];
    const imasValid = normalizeValidMask(imasRawValidity, "imas_validity_code");
    expect(imasValid).toEqual([true, true, false, false, true]);
  });

  it("rejects unresolved-mixing and missing-response metadata combinations at schema level", () => {
    const invalid = {
      ...makeValidSolarFlareObservable(),
      spatial_context: {
        ...makeValidSolarFlareObservable().spatial_context,
        unresolved_mixing_note: undefined,
      },
      forward_model_comparisons: [
        {
          ...makeValidSolarFlareObservable().forward_model_comparisons[0],
          psf_ref: undefined,
        },
      ],
      response_model_ref: undefined,
    };
    const result = solarFlareSpectralObservableSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("raises runtime findings when valid coverage falls below the declared threshold", () => {
    const observable = {
      ...makeValidSolarFlareObservable(),
      valid_mask: [true, false, false, false, false, true],
      min_valid_fraction: 0.6,
    };
    const parsed = solarFlareSpectralObservableSchema.parse(observable);
    const findings = evaluateSolarFlareObservableGuardrails(parsed);
    expect(findings.some((entry) => entry.includes("valid-mask fraction"))).toBe(true);
  });

  it("pins the flare-observable docs to explicit research references", () => {
    const repoRoot = process.cwd();
    const docPaths = [
      "docs/knowledge/physics/solar-flare-line-origin.md",
      "docs/knowledge/physics/solar-radiative-transfer-closure.md",
      "docs/knowledge/physics/dkist-visp-observable-contract.md",
      "docs/knowledge/physics/solar-flare-phase-definition.md",
      "docs/knowledge/physics/solar-ribbon-geometry-definition.md",
      "docs/knowledge/physics/solar-radiative-observables-tree.json",
    ];
    for (const docPath of docPaths) {
      expect(fs.existsSync(path.join(repoRoot, docPath))).toBe(true);
    }

    const contractDoc = fs.readFileSync(
      path.join(repoRoot, "docs/knowledge/physics/dkist-visp-observable-contract.md"),
      "utf8",
    );
    expect(contractDoc).toContain(
      "https://docs.astropy.org/en/stable/nddata/nddata.html",
    );
    expect(contractDoc).toContain(
      "https://imas-data-dictionary.readthedocs.io/en/4.1.1/generated/ids/magnetics.html",
    );
    expect(contractDoc).toContain(
      "https://docs.dkist.nso.edu/projects/spectral-lines/en/latest/index.html",
    );

    const lineOriginDoc = fs.readFileSync(
      path.join(repoRoot, "docs/knowledge/physics/solar-flare-line-origin.md"),
      "utf8",
    );
    expect(lineOriginDoc).toContain(
      "https://link.springer.com/article/10.1007/s11207-026-02633-1",
    );
  });
});
