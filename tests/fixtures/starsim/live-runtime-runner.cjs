const fs = require("node:fs");

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});

process.stdin.on("end", () => {
  const payload = raw.trim() ? JSON.parse(raw) : {};
  if (payload.probe) {
    process.stdout.write(JSON.stringify({ ok: true }) + "\n");
    return;
  }

  const benchmarkCaseId = payload.benchmark_case_id || "unknown";
  const physicsFlags = payload.physics_flags || {};
  const forceValidationFail = physicsFlags.force_validation_fail === true;
  const liveSolverMetadata = {
    runner: "tests/fixtures/starsim/live-runtime-runner.cjs",
    benchmark_case_id: benchmarkCaseId,
  };

  if (payload.lane_id === "structure_mesa") {
    const structure = forceValidationFail
      ? {
          mass_Msun: 1.18,
          radius_Rsun: 1.11,
          age_Gyr: 4.57,
        }
      : {
          mass_Msun: 1.002,
          radius_Rsun: 0.998,
          age_Gyr: 4.57,
        };
    const synthetic = forceValidationFail
      ? {
          teff_K: 5905,
          logg_cgs: 4.34,
          luminosity_Lsun: 1.12,
        }
      : {
          teff_K: 5774,
          logg_cgs: 4.438,
          luminosity_Lsun: 1.0,
        };

    const response = {
      schema_version: "star-sim-runtime-result/1",
      execution_mode: "live_benchmark",
      live_solver: true,
      solver_version: "mesa.live-benchmark/1",
      benchmark_case_id: benchmarkCaseId,
      used_seismic_constraints: benchmarkCaseId === "astero_gyre_solar_like",
      evidence_fit: forceValidationFail ? 0.61 : 0.97,
      structure_summary: structure,
      synthetic_observables: synthetic,
      inferred_params: {
        mixing_length_alpha: 1.92,
        initial_helium_fraction: 0.27,
      },
      residuals_sigma: {
        teff_K: forceValidationFail ? 3.2 : 0.18,
        radius_Rsun: forceValidationFail ? 2.7 : 0.09,
      },
      domain_validity: {
        benchmark_scope_only: true,
        runner_mode: "live_fixture_protocol",
      },
      artifact_payloads: [
        {
          kind: "solver_metadata",
          file_name: "mesa-live-metadata.json",
          content_encoding: "utf8",
          content: JSON.stringify(liveSolverMetadata, null, 2) + "\n",
          media_type: "application/json",
        },
        {
          kind: "model_artifact",
          file_name: "model.gsm.h5.manifest.json",
          content_encoding: "utf8",
          content:
            JSON.stringify(
              {
                kind: "gsm_hdf5_manifest",
                benchmark_case_id: benchmarkCaseId,
                cache_key: payload.cache_key,
              },
              null,
              2,
            ) + "\n",
          media_type: "application/json",
        },
      ],
      live_solver_metadata: liveSolverMetadata,
    };
    process.stdout.write(JSON.stringify(response) + "\n");
    return;
  }

  const modeSummary = forceValidationFail
    ? {
        numax_uHz: 3330,
        deltanu_uHz: 126.5,
        mode_count: 6,
      }
    : {
        numax_uHz: 3091.2,
        deltanu_uHz: 135.2,
        mode_count: 3,
      };

  const response = {
    schema_version: "star-sim-runtime-result/1",
    execution_mode: "live_benchmark",
    live_solver: true,
    solver_version: "gyre.live-benchmark/1",
    benchmark_case_id: benchmarkCaseId,
    evidence_fit: forceValidationFail ? 0.58 : 0.96,
    mode_summary: modeSummary,
    inferred_params: {
      dominant_l: 0,
      dominant_n: 18,
    },
    residuals_sigma: {
      mode_frequency_uHz: forceValidationFail ? 5.7 : 0.14,
    },
    domain_validity: {
      benchmark_scope_only: true,
      runner_mode: "live_fixture_protocol",
    },
    artifact_payloads: [
      {
        kind: "solver_metadata",
        file_name: "gyre-live-metadata.json",
        content_encoding: "utf8",
        content: JSON.stringify(liveSolverMetadata, null, 2) + "\n",
        media_type: "application/json",
      },
      {
        kind: "mode_table",
        file_name: "mode-table.json",
        content_encoding: "utf8",
        content:
          JSON.stringify(
            {
              benchmark_case_id: benchmarkCaseId,
              modes: forceValidationFail ? [3330.1, 3400.4] : [3090.0, 3160.4, 3232.1],
            },
            null,
            2,
          ) + "\n",
        media_type: "application/json",
      },
    ],
    live_solver_metadata: liveSolverMetadata,
  };
  process.stdout.write(JSON.stringify(response) + "\n");
});
