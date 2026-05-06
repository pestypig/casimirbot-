export const SCIENTIFIC_FIGURE_CAPTIONS: Record<string, { caption: string; literatureRefs: string[] }> = {
  "01_clean_ricci4_geometry": {
    caption: "Solve-derived ricci4 curvature shell from the NHM2 3+1 metric brick.",
    literatureRefs: ["natario_2002_zero_expansion", "bobrick_martire_2021_physical_warp_drives"],
  },
  "02_nested_region_envelopes": {
    caption: "Nested whole-hull regions derived from hull_sdf: hull, wall, exterior shell.",
    literatureRefs: [],
  },
  "03_lapse_shift_grid_slice": {
    caption: "Lapse/shift slice in body-fixed 3+1 coordinates.",
    literatureRefs: ["alcubierre_1994_warp_metric", "natario_2002_zero_expansion"],
  },
  "04_theta_signed_diagnostic": {
    caption: "Signed theta diagnostic slice; color encodes signed scalar value.",
    literatureRefs: ["natario_2002_zero_expansion"],
  },
  "05_tile_sector_architecture": {
    caption: "Distributed tile-sector shell architecture from the cavity contract.",
    literatureRefs: ["lamoreaux_1997_casimir_measurement", "klimchitskaya_2009_real_materials_casimir"],
  },
  "06_sector_schedule_timeline": {
    caption: "Distributed tile-sector schedule: 80 sectors, 2 active per schedule window.",
    literatureRefs: [],
  },
  "07_representative_tile_layout": {
    caption: "Representative Casimir tile-sector layout at fabrication scale; colors encode layout/process layers, not spacetime field intensity.",
    literatureRefs: ["lamoreaux_1997_casimir_measurement", "klimchitskaya_2009_real_materials_casimir"],
  },
  "08_tensor_counterpart_matrix": {
    caption: "Metric-required tensor components compared with available tile-effective counterparts.",
    literatureRefs: [],
  },
  "09_source_closure_regional_residuals": {
    caption: "Regional source-closure residuals by hull, wall, and exterior shell.",
    literatureRefs: [],
  },
  "10_observer_qei_worldline_plot": {
    caption: "Observer/QEI sampling schematic; dossier status remains pending unless promoted by ledger evidence.",
    literatureRefs: ["pfenning_ford_1997_quantum_inequality_warp", "fewster_2005_energy_inequalities"],
  },
  "11_energy_condition_diagnostics": {
    caption: "NEC/WEC diagnostic chart from available repo-normalized closure evidence.",
    literatureRefs: ["santiago_schuster_visser_2022_nec", "pfenning_ford_1997_quantum_inequality_warp"],
  },
  "12_validation_chain_dag": {
    caption: "Frozen-run validation DAG with artifact references.",
    literatureRefs: [],
  },
  "13_provenance_artifact_map": {
    caption: "Provenance artifact map; edges indicate feeds-into relationships only.",
    literatureRefs: [],
  },
  "14_claim_boundary_ledger_strip": {
    caption: "Claim boundary: validation, physical-mechanism, and promotion claims remain locked.",
    literatureRefs: [],
  },
  "15_literature_context_map": {
    caption: "Literature map: context and constraint sources only; no external paper is validation evidence for this NHM2 run.",
    literatureRefs: [
      "alcubierre_1994_warp_metric",
      "natario_2002_zero_expansion",
      "pfenning_ford_1997_quantum_inequality_warp",
      "fewster_2005_energy_inequalities",
      "lamoreaux_1997_casimir_measurement",
      "klimchitskaya_2009_real_materials_casimir",
      "bobrick_martire_2021_physical_warp_drives",
      "santiago_schuster_visser_2022_nec",
    ],
  },
};
