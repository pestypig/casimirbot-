# CFP-1 C02–C04 local notice-byte candidates — 2026-09-19

Read-only comparison at source HEAD `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93`
used local `apps/desktop/node_modules`, vendor archive, `runtime` and an older
`release/win-unpacked` candidate. The old output is **not** a reserved signed
customer cohort; these paths and hashes are reviewer leads, not an installed
SBOM, legal obligation or distribution permission. The [earlier dependency
gap](2026-09-19-desktop-dependency-rights-evidence-gap-61.md) covers the wider
49-entry production lockfile candidate, bundled JS/CSS and native closure that
this focused byte map cannot settle.
In the table, `vendor/...` abbreviates
`apps/desktop/vendor/tunnel-client/v0.0.13/windows-amd64/expanded/`.

| C row / local candidate | Byte source and SHA-256 | Current packaging observation and review question |
| --- | --- | --- |
| C02 `sharp@0.34.3` license | `apps/desktop/node_modules/sharp/LICENSE` — `73ba74dfaa520b49a401b5d21459a8523a146f3b7518a833eea5efa85130bf68`; same bytes in old `app.asar.unpacked/node_modules/sharp/LICENSE` | Desktop package pins `sharp@0.34.3`, and `asarUnpack` selects `sharp/**`; old local output contains this text. Reviewer must identify actual final package/version, applicable attribution and native closure rather than infer the whole signed tree from this match. |
| C02 `@img/sharp-win32-x64@0.34.3` license | `apps/desktop/node_modules/@img/sharp-win32-x64/LICENSE` — `dc1f5d2d43c5531dfe0acaf4e950ea5dbe3e61e1850cf0e983bda7efc10d6693`; same bytes in old unpacked output | Installed package metadata declares `Apache-2.0 AND LGPL-3.0-or-later` and the old output includes its native package. This is a mixed **metadata label**, not a determination of LGPL compliance, source-offer duty or which native components ship in a new build. Qualified review must map the actual `.node` and dependent binaries. |
| C02 `electron-updater@6.8.9` license | `apps/desktop/node_modules/electron-updater/LICENSE` — `bed8d0ab3e6031817f775a641ff37313b0f5591bc8ba0ed79b978dafbd4231ce` | The package manifest pins the updater and its local metadata declares MIT. It is not in the old `app.asar.unpacked` list of unpacked native folders; the bundled/updater package-origin graph and notice treatment still need the reserved build. |
| C02 Electron/Chromium texts in old output | `release/win-unpacked/LICENSE.electron.txt` — `5154e165bd6c2cc0cfbcd8916498c7abab0497923bafcd5cb07673fe8480087d`; `LICENSES.chromium.html` — `b911161e6594ec76b872498b423c54406168f2974e0d407a847f7de1e5ff94dd` | The old unpacked candidate has both files (1,096 and 20,313,957 bytes). Electron is a desktop build dependency at `43.4.0`; the old file presence cannot prove the final installer includes matching texts, correct credits or an accessible notice index. |
| C04 tunnel vendor LICENSE | `vendor/tunnel-client/v0.0.13/windows-amd64/expanded/LICENSE` — `f4c1d7ba32ef5bcf5cf03e2eefec5825ebafedf50fa330a36700a49c605c1ef4`; identical in `runtime/licenses/openai-tunnel-client-LICENSE` and old `release/win-unpacked/resources/runtime/licenses/` | Current `stage-runtime.mjs` and builder select the executable plus this LICENSE. The owner still decides whether the tunnel is required for the supported customer transport. |
| C04 vendor NOTICE | `vendor/.../NOTICE` — `1364c020d86ecf948b78b7c655175032068203d13aece70fb0bfe112d7802dc2` | Present in pinned local vendor archive (551 bytes), absent from current `tunnelPayloads` and `extraResources` filter. Reviewer determines whether/how it must be supplied; CFP-3 must then prove the selected notice route. |
| C04 third-party report and SPDX input | `vendor/.../tunnel-client-v0.0.13-windows-amd64-licenses.txt` — `ef3c7083e248bb7ccc1a8d2757afbc6e53a1d22ec686ee461b677c4e43699ae4`; `vendor/.../tunnel-client-v0.0.13-windows-amd64.spdx.json` — `f1be4d3ce80ea276900f3bb93cfa1daa3b0f16aac57b50dbc95680ca12f6da21` | Present in vendor archive (13,456 and 234,305 bytes), not selected by current staging/builder filters. The vendor SPDX input is not a CasimirBot product SBOM. Qualified review decides which reports/notices or equivalent accessible content accompany the selected executable. |

The final C02–C04 reviewer return must map each selected package/binary to
origin, exact version, license text and edition, any required notice or source
offer, accessible customer location, permitted treatment and change trigger.
CFP-3 must generate a complete module/package-origin graph and extract the
actual signed EXE, ASAR, unpacked native tree and `extraResources`; it then
compares those bytes against the qualified dispositions and rejects unexplained
or missing required material. A locally present license file is necessary
evidence for review, **not** proof that all obligations are satisfied. C03
bundled client and media rights remain separate.

CFP-1 stays active (`specified`); CFP-2/3 remain blocked under the
[work program](../../../helix-environment-harness-work-program-v1.md).
