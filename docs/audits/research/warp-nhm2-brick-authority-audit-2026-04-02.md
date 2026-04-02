# NHM2 Brick Authority Audit (2026-04-02)

"This brick-authority artifact audits contract-to-brick handoff policy/readiness; it does not retune physics."

## Source Paths
- sourceAuditArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- sourceToYorkArtifact: `artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json`

## Brick Policy
| field | value |
|---|---|
| authoritativeBrickRequestId | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e |
| contractToBrickDirectFields | metricT00Source,gammaVdB,requireCongruentSolve,requireNhm2CongruentFullSolve |
| contractToBrickDerivedFields | metricT00Ref,dutyFR,q,gammaGeo,zeta,dims |
| allowedBrickOverrideFields | dutyFR,q,gammaGeo,zeta,dims |
| auditHarnessOverridesBlockReadiness | false |
| missingDerivationBlocksReadiness | true |
| derivedTransformRequiresFormula | true |
| requiredBrickFieldsForReadiness | metricT00Ref,metricT00Source,dutyFR,q,gammaGeo,gammaVdB,zeta,dims,requireCongruentSolve,requireNhm2CongruentFullSolve |

## Upstream Inputs (Contract)
| field | value |
|---|---|
| metricT00RefDerivedFromWarpFieldType | natario_sdf |
| metricT00Source | metric |
| dutyFRDerivedFromDutyShip | 0.12 |
| qDerivedFromQSpoilingFactor | 3 |
| gammaGeo | 1 |
| gammaVdB | 500 |
| zeta | 5 |
| dimsDerivedFromFullHull | 1007x264x173 |
| requireCongruentSolve | true |
| requireNhm2CongruentFullSolve | true |

## Reduced-Order Payload
```json
{
  "wave": "A",
  "proposalLabel": "wave-a-promoted-profile-NHM2-2026-03-01-iter-1",
  "params": {
    "concurrentSectors": 2,
    "dutyCycle": 0.12,
    "dutyEffective_FR": 0.12,
    "dutyShip": 0.12,
    "dynamicConfig": {
      "cavityQ": 100000,
      "concurrentSectors": 2,
      "dutyCycle": 0.12,
      "sectorCount": 80,
      "warpFieldType": "natario_sdf"
    },
    "gammaGeo": 1,
    "gammaVanDenBroeck": 500,
    "gap_nm": 8,
    "modulationFreq_GHz": 15,
    "qCavity": 100000,
    "qSpoilingFactor": 3,
    "qi": {
      "fieldType": "em",
      "sampler": "hann",
      "tau_s_ms": 0.02
    },
    "sectorCount": 80,
    "shipRadius_m": 2,
    "tauLC_ms": 3.34,
    "warpFieldType": "natario_sdf"
  },
  "grRequest": {
    "N_tiles": 1966954176,
    "P_avg_W": 1702.6173539290805,
    "TS_ratio": 50,
    "dutyEffectiveFR": 0.0015,
    "gammaGeo": 1,
    "gammaVdB": 500,
    "hull": {
      "Lx_m": 1007,
      "Ly_m": 264,
      "Lz_m": 173,
      "wallThickness_m": 0.019986163866666667
    },
    "hullArea_m2": 558793.8017464621,
    "qSpoil": 3,
    "tilesPerSector": 24586927,
    "warp": {
      "metricAdapter": {
        "chart": {
          "label": "comoving_cartesian"
        }
      },
      "metricT00Contract": {
        "normalization": "si_stress",
        "observer": "eulerian_n",
        "unitSystem": "SI"
      }
    }
  }
}
```

## Brick Request
```json
{
  "metricT00Ref": "warp.metric.T00.natario_sdf.shift",
  "metricT00Source": "metric",
  "dutyFR": 0.0015,
  "q": 3,
  "gammaGeo": 26,
  "gammaVdB": 500,
  "zeta": 0.84,
  "dims": "48x48x48",
  "requireCongruentSolve": true,
  "requireNhm2CongruentFullSolve": true,
  "brickUrl": "http://127.0.0.1:5050/api/helix/gr-evolve-brick?dims=48x48x48&time_s=0&dt_s=0.01&steps=1&includeExtra=1&includeKij=1&includeMatter=1&dutyFR=0.0015&q=3&gammaGeo=26&gammaVdB=500&zeta=0.84&phase01=0&metricT00Source=metric&metricT00Ref=warp.metric.T00.natario_sdf.shift&format=raw&requireCongruentSolve=1&requireNhm2CongruentFullSolve=1"
}
```

## Brick Field Ownership
| field | upstream_value | brick_value | authority_owner | mapping_type | mapping_formula_or_note | status |
|---|---|---|---|---|---|---|
| metricT00Ref | "natario_sdf" | "warp.metric.T00.natario_sdf.shift" | contract_authority | derived_transform | metricT00Ref selects reduced-order stress family: warp.metric.T00.<family>.shift | closed |
| metricT00Source | "metric" | "metric" | contract_authority | direct_copy | synthetic_direct_copy_policy | closed |
| dutyFR | 0.12 | 0.0015 | audit_harness_authority | audit_harness_override | Proof-pack harness intentionally sets dutyFR=0.0015 for control comparability. | advisory |
| q | 3 | 3 | policy_authority | policy_override | reduced-order q selector = qSpoilingFactor policy lane | advisory |
| gammaGeo | 1 | 26 | audit_harness_authority | audit_harness_override | Proof-pack brick request currently pins gammaGeo=26 as harness setting. | advisory |
| gammaVdB | 500 | 500 | reduced_order_payload_authority | direct_copy | gammaVdB = gammaVanDenBroeck | closed |
| zeta | 5 | 0.84 | audit_harness_authority | audit_harness_override | Proof-pack brick request pins zeta=0.84 for reduced-order York audit lane. | advisory |
| dims | "1007x264x173" | "48x48x48" | audit_harness_authority | audit_harness_override | Proof-pack brick request uses fixed reduced-order grid dims=48x48x48. | advisory |
| requireCongruentSolve | true | true | contract_authority | direct_copy | synthetic_direct_copy_policy | closed |
| requireNhm2CongruentFullSolve | true | true | contract_authority | direct_copy | synthetic_direct_copy_policy | closed |

## Brick Parameter Mappings
| field | source_value | target_value | mapping_type | mapping_formula | status |
|---|---|---|---|---|---|
| metricT00Ref | "natario_sdf" | "warp.metric.T00.natario_sdf.shift" | derived_transform | metricT00Ref selects reduced-order stress family: warp.metric.T00.<family>.shift | closed |
| metricT00Source | "metric" | "metric" | direct_copy | synthetic_direct_copy_policy | closed |
| dutyFR | 0.12 | 0.0015 | audit_harness_override | Proof-pack harness intentionally sets dutyFR=0.0015 for control comparability. | closed |
| q | 3 | 3 | policy_override | reduced-order q selector = qSpoilingFactor policy lane | closed |
| gammaGeo | 1 | 26 | audit_harness_override | Proof-pack brick request currently pins gammaGeo=26 as harness setting. | closed |
| gammaVdB | 500 | 500 | direct_copy | gammaVdB = gammaVanDenBroeck | closed |
| zeta | 5 | 0.84 | audit_harness_override | Proof-pack brick request pins zeta=0.84 for reduced-order York audit lane. | closed |
| dims | "1007x264x173" | "48x48x48" | audit_harness_override | Proof-pack brick request uses fixed reduced-order grid dims=48x48x48. | closed |
| requireCongruentSolve | true | true | direct_copy | synthetic_direct_copy_policy | closed |
| requireNhm2CongruentFullSolve | true | true | direct_copy | synthetic_direct_copy_policy | closed |

## Brick Readiness
| field | value |
|---|---|
| brickAuthorityClosed | true |
| activeBrickRequestId | 2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e |
| blockingFindings | none |
| advisoryFindings | brick_audit_harness_override_active,brick_payload_to_request_mismatch,brick_authority_closed |

## Blocking Findings
- none

## Advisory Findings
- brick_audit_harness_override_active
- brick_payload_to_request_mismatch
- brick_authority_closed

## Notes
- brick_policy authoritative_request=2d33efc5b648a2a4c0a694a9883979088faaabd94f7f6406b289492390f7436e required=metricT00Ref,metricT00Source,dutyFR,q,gammaGeo,gammaVdB,zeta,dims,requireCongruentSolve,requireNhm2CongruentFullSolve allowed_overrides=dutyFR,q,gammaGeo,zeta,dims.
- brick_authority_closed blocking=none advisory=brick_audit_harness_override_active,brick_payload_to_request_mismatch,brick_authority_closed.

