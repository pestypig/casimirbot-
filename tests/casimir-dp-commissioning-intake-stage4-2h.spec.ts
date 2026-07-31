import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildSyntheticCommissioningDryRunStage4_2H,
  compileStage4GPacketFromCommissioningDossierStage4_2H,
  evaluateCasimirDpCommissioningIntakeStage4_2H,
} from "../shared/casimir-dp-commissioning-intake-stage4-2h";
import {
  CASIMIR_DP_STAGE4_2H_INSTRUMENT_ROLES,
  CASIMIR_DP_STAGE4_2H_PARTITION_ORDER,
  CASIMIR_DP_STAGE4_2H_RAW_COLUMNS,
  CasimirDpCommissioningDossierStage4_2H,
  type CasimirDpCommissioningIntakeStage4_2HConfig,
} from "../shared/contracts/casimir-dp-commissioning-intake-stage4-2h.v1";
import {
  CASIMIR_DP_STAGE4_2G_PRODUCT_IDS,
  CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig,
  CasimirDpEmpiricalPilotPacketStage4_2G,
} from "../shared/contracts/casimir-dp-empirical-feasibility-pilot-stage4-2g.v1";

const root = process.cwd();
const readJson = (relativePath: string) =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const blank = CasimirDpCommissioningDossierStage4_2H.parse(
  readJson(
    "configs/research/fixtures/casimir-dp-stage4-2h-commissioning-blank.v1.json",
  ),
);
const syntheticPacket = CasimirDpEmpiricalPilotPacketStage4_2G.parse(
  readJson(
    "configs/research/fixtures/casimir-dp-stage4-2g-pilot-synthetic-validation.v1.json",
  ),
);
const unacquiredPacket = CasimirDpEmpiricalPilotPacketStage4_2G.parse(
  readJson(
    "configs/research/fixtures/casimir-dp-stage4-2g-pilot-unacquired.v1.json",
  ),
);

describe("Casimir-DP Stage-4.2H commissioning intake", () => {
  it("parses the blank dossier and preserves all frozen orders", () => {
    expect(blank.instrument_registry.map((row) => row.role)).toEqual(
      CASIMIR_DP_STAGE4_2H_INSTRUMENT_ROLES,
    );
    expect(blank.product_slots.map((row) => row.product_id)).toEqual(
      CASIMIR_DP_STAGE4_2G_PRODUCT_IDS,
    );
    expect(blank.partition_plan.map((row) => row.partition_id)).toEqual(
      CASIMIR_DP_STAGE4_2H_PARTITION_ORDER,
    );
    expect(blank.raw_columns).toEqual(CASIMIR_DP_STAGE4_2H_RAW_COLUMNS);
  });

  it("builds a synthetic dry run that cannot acquire empirical authority", () => {
    const dryRun = buildSyntheticCommissioningDryRunStage4_2H({
      blankDossier: blank,
      stage4gSyntheticPacket: syntheticPacket,
    });
    const compiled =
      compileStage4GPacketFromCommissioningDossierStage4_2H(
        dryRun,
        unacquiredPacket,
      );
    expect(dryRun.evidence_class).toBe("synthetic_dry_run");
    expect(compiled?.evidence_class).toBe("synthetic_validation");
    expect(compiled?.products.every(
      (row) => row.authority_class === "synthetic_validation",
    )).toBe(true);
    expect(compiled?.transfer_kernel_registered).toBe(false);
  });

  it("rejects a synthetic artifact masquerading as measured evidence", () => {
    const dryRun = buildSyntheticCommissioningDryRunStage4_2H({
      blankDossier: blank,
      stage4gSyntheticPacket: syntheticPacket,
    });
    const spoof = structuredClone(dryRun);
    spoof.evidence_class = "measured_commissioning_dossier";
    spoof.instrument_registry = spoof.instrument_registry.map((row) => ({
      ...row,
      authority_class: "commissioned_measured",
    }));
    spoof.product_slots = spoof.product_slots.map((row) => ({
      ...row,
      authority_class: "measured_empirical",
    }));
    expect(
      CasimirDpCommissioningDossierStage4_2H.safeParse(spoof).success,
    ).toBe(false);
  });

  it("keeps confirmatory scoring frozen away from fitting", () => {
    const confirmatory = blank.partition_plan.find(
      (row) => row.partition_id === "confirmatory",
    );
    expect(confirmatory).toMatchObject({
      response_fitting_allowed: false,
      covariance_fitting_allowed: false,
      confirmatory_scoring_allowed: true,
      blind_mapping_available_to_analysis: false,
    });
  });

  it("evaluates the dry run as software-only when campaign config is supplied", () => {
    const configPath =
      "configs/research/casimir-dp-commissioning-intake-stage4-2h.v1.json";
    if (!fs.existsSync(path.join(root, configPath))) return;
    const config = readJson(configPath) as
      CasimirDpCommissioningIntakeStage4_2HConfig;
    const stage4gConfig =
      CasimirDpEmpiricalFeasibilityPilotStage4_2GConfig.parse(
        readJson(
          "configs/research/casimir-dp-empirical-feasibility-pilot-stage4-2g.v1.json",
        ),
      );
    const dryRun = buildSyntheticCommissioningDryRunStage4_2H({
      blankDossier: blank,
      stage4gSyntheticPacket: syntheticPacket,
    });
    const result = evaluateCasimirDpCommissioningIntakeStage4_2H({
      config,
      dossier: dryRun,
      stage4gConfig,
      stage4gUnacquiredPacket: unacquiredPacket,
      artifactIntegrityPass: true,
    });
    expect(result.bounded_status.synthetic_dry_run).toBe("pass");
    expect(result.bounded_status.measured_evidence).toBe("not_ready");
    expect(result.bounded_status.collapse_identification).toBe("blocked");
    expect(result.hypothesis_separation.observable_bridge_edges_added).toBe(0);
  });
});
