# CFP-1 tunnel-client redistribution evidence — 2026-09-19

Status: read-only source/vendor/runtime inspection at HEAD `256554ca2637b2978a83616d9f9670069fdfd8c4`, with uncommitted documentation changes. This is a dated evidence snapshot for R-NOTICE-01 and R-BIN-01, not a license interpretation, shipped SBOM, rights clearance, installer acceptance or change to release packaging. The [CFP-1 rights delta](2026-09-19-rights-distribution-delta-09.md) and [canonical contract](../../../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md) retain their respective evidence/specification roles.

## Pinned vendor bytes and current selection

`apps/desktop/tunnel-client.v1.json` pins v0.0.13, the upstream Windows amd64 archive hash, and hashes for the executable and LICENSE only. The following five files in the expanded local vendor directory are relevant to this tunnel-client review; these hashes identify inspected local bytes, not the contents of a future signed installer. The same directory also contains `cloudflared.exe` and `cloudflared-manifest.json`; neither is selected by the current tunnel staging or builder configuration.

| Vendor file under `apps/desktop/vendor/tunnel-client/v0.0.13/windows-amd64/expanded/` | SHA-256 | Current staging/installer selection |
| --- | --- | --- |
| `tunnel-client.exe` | `83f08fb39b1c154747debd31b81b65dd4ee834cacf5a073b6301b2688699bc76` | Staged as `bin/tunnel-client.exe`; selected by builder. |
| `LICENSE` | `f4c1d7ba32ef5bcf5cf03e2eefec5825ebafedf50fa330a36700a49c605c1ef4` | Staged as `licenses/openai-tunnel-client-LICENSE`; selected by builder. |
| `NOTICE` | `1364c020d86ecf948b78b7c655175032068203d13aece70fb0bfe112d7802dc2` | Present in vendor archive; omitted by current staging and builder selections. |
| `tunnel-client-v0.0.13-windows-amd64-licenses.txt` | `ef3c7083e248bb7ccc1a8d2757afbc6e53a1d22ec686ee461b677c4e43699ae4` | Present in vendor archive; omitted by current staging and builder selections. |
| `tunnel-client-v0.0.13-windows-amd64.spdx.json` | `f1be4d3ce80ea276900f3bb93cfa1daa3b0f16aac57b50dbc95680ca12f6da21` | Present in vendor archive; omitted by current staging and builder selections. |

The local SPDX document identifies itself as SPDX-2.3 `tunnel-client` and contains 120 package entries, six file entries and 354 relationships. The accompanying report lists Apache-2.0, BSD-2-Clause, BSD-3-Clause and MIT in its license summary. Those source-provided inventories are review inputs; their presence does not establish exact notice fulfillment, completeness of the final CasimirBot dependency closure or permission for every proposed distribution path.

`apps/desktop/scripts/stage-runtime.mjs` copies and hash-checks only the executable and LICENSE and writes `runtime-manifest.json` tunnel metadata with version, executable hash and license identifier. `apps/desktop/electron-builder.config.cjs` selects only those two staged tunnel paths for `extraResources`. The inspected local `apps/desktop/runtime/licenses/` directory contains only `openai-tunnel-client-LICENSE`. The current standard unpacked ASAR belongs to an older source/artifact cohort, so no final-installer inclusion conclusion is drawn from it.

## Required closure before a customer artifact

1. The qualified rights reviewer maps the pinned executable, its NOTICE, third-party report and SPDX data to the exact redistribution/attribution obligations and records which files must accompany the selected customer artifact or remain available through an approved notice channel. The reviewer also identifies any missing dependency/license evidence beyond the vendor report.
2. CFP-3.DISTRIBUTION proposes an explicit hash-pinned staging and builder selection for the reviewed files, with the exact user-accessible notice location. CFP-3.SIGNING binds those bytes to one source revision, runtime manifest, ASAR, installer and signing identity. Neither a source file nor a staged runtime directory substitutes for extraction from the final installer.
3. Verification compares the reviewed file hashes and notice index against the selected **signed installed artifact** and its update/repair path. A missing required file, mismatched hash, inaccessible notice, or mixed artifact cohort fails the affected distribution acceptance. Preserve the distinction between vendor SPDX input and a product-level SBOM.

No runtime, packaging, vendor, repository, feed or production setting was changed for this inspection. R-NOTICE-01 and R-BIN-01 remain open pending reviewer disposition and later artifact evidence.
