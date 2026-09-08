# CFP-1.RIGHTS proposed component and distribution matrix

Status: draft evidence review; ownership, Minecraft commercial classification,
and release-notice fulfillment remain unresolved. This is not legal clearance,
a shipped SBOM, a license change, or permission to publish.

Captured on 2026-09-06 America/New_York / 2026-09-07 UTC by the delegated
`distribution_audit` rights workstream. Source HEAD is
`1db9f34661ffc95d29c5250a6c0a61cbdac0f15d`; the shared working tree and staging
are changing. Current authority remains the environment work program and CFP-1.
The user's bounded Minecraft technical-pilot selection does not settle the
commercial rights questions identified here.

## Inspected scope and evidence

- `rights-source-inspection.json`: selected source/license hashes, the standard
  unpacked ASAR's 27 package manifests, archive notice paths, physical native
  library/font/license records, map dependency metadata, and public asset counts.
- `jar-source-inspection.json`: three local companion/core build JAR hashes,
  embedded JAR paths, notice-path results, and Baritone-named bridge entries.
- `primary-source-review.json`: official/upstream sources accessed for this
  review, qualified interpretations, and failed fetches.
- Prior inventory retained as input:
  `../../cfp-0/2026-09-06-audit-01/licensing-inventory.json` and
  `../../cfp-0/2026-09-06-audit-01/distribution-inspection.json`.

The standard unpacked `app.asar` inspected has SHA-256
`d1eff4c58e158b6ca8f086c9f6a5ca60c0ed7468007bf3517f29a2fa2813494d`.
Its runtime-manifest hash is
`bd1a8fa5ff8f97a0310a0b54fbe7c93c5d9ac7c03e817d8fba361bc18a096aad`.
The later staged manifest differs. During an earlier read the staged manifest
was absent and later reappeared; this was treated as a moving-build observation,
not a product failure. This audit neither installs nor starts any component.

The ASAR package inventory is not the complete dependency closure: the bundled
server and renderer/vendor files also contain third-party code. The inspected
public tree includes Plotly, 59 font files, five WASM files, five WAV files,
three GLB files, and image assets. Actual release selection and build attribution
must establish which versions and notices belong to every shipped byte.

## Proposed dispositions

These are proposals for the owner and rights reviewer. `Retain existing license`
means preserve the component's established terms and attribution; it does not
mean the entire CasimirBot application must use that component's license.
`Private candidate` applies only to material for which the necessary rights are
established. No row retroactively withdraws rights from published copies.

| Component / source | Inspected evidence and actual delivery boundary | Proposed publish/private/retain/exclude disposition | Required reviewer outcome / assigned work |
| --- | --- | --- | --- |
| Root first-party product (`client/`, `server/`, native host and related shared implementation) | Root package metadata declares MIT; prior inventory records MIT at three available historical snapshots. Root LICENSE/COPYING/NOTICE history query is empty in available local refs. Desktop package and archived root manifest have `private: true` and no license field. | **Private candidate for future owned implementation; retain prior licensed material/rights.** Do not label the whole existing tree proprietary merely by changing metadata or repository visibility. | Owner supplies ownership/contribution/publication record; rights reviewer selects exact boundary and permissible treatment per component. CFP-1.RIGHTS -> CFP-3.DISTRIBUTION. |
| SDK and CLI | `sdk/package.json` and `cli/package.json` declare MIT; no separate license file found in their inspected path inventory. These are not automatically included as standalone packages in the standard EXE. | **Proposed publish + retain MIT**, if selected as public integration surfaces; add accurate notices only through an admitted change after ownership review. | Identify public versions, external contributions, source origin, and exact notice text. Distinguish SDK/API promises from product implementation. |
| Public protocol/schema/examples | Shared contracts and example clients currently sit within the broader repository boundary; no independent blanket protocol license was established by this audit. | **Proposed publish selected interfaces/examples**, with explicit file list and reviewed terms; keep unrelated internal policy implementation a private candidate. | CFP-1 architecture author selects exact interoperability surface; owner/reviewer establishes origin and publishing rights. No silent relicense of inherited files. |
| `packages/create-casimir-verifier` | Actual MIT license says Copyright 2026 CasimirBot; independent verifier scaffolding package. | **Retain MIT; proposed public**, outside the paid harness implementation boundary unless selected explicitly. | Preserve license and existing scientific/verifier authority. Owner decides packaging/public scope separately. |
| Research, imported datasets and proof artifacts | Selected research directories contain separate CC0 and third-party MIT texts (including a Bradley J. Kavanagh attribution). This audit did not map all research bytes or author agreements. | **Retain component-specific terms; out of proprietary-product migration scope by default.** Exclude unneeded research assets from a proposed narrow release through later reviewed packaging work. | No blanket closure of research. Per-dataset provenance and selected release inclusion require the research owner and rights reviewer. |
| External Codex desktop / model access | Base packaging guard excludes Codex executable/npm runtime; external application is user supplied. Root development dependency does not prove shipping. | **Exclude from redistribution/resale in this offer; retain supported external integration.** | Verify actual final tree and supported-client/branding claims; no claim of OpenAI endorsement or included model subscription. |
| CasimirBot Device Check plugin / marketplace metadata | Plugin manifest identifies CasimirBot; source and staged plugin payload are explicit allowlist items. No standalone license text found in the inspected plugin directory. | **Proposed public adapter metadata/source where desired; private candidate otherwise, pending origin review.** | Set an explicit reviewed plugin license/distribution boundary. Listing in an OpenAI-compatible marketplace does not establish source ownership or permission to redistribute the Codex app. |
| Electron / Chromium / embedded Node | Standard unpacked root includes `LICENSE.electron.txt` with MIT terms and `LICENSES.chromium.html`; archive contains updater and runtime dependencies. | **Retain upstream terms and notices; distribute selected binaries conditionally.** | CFP-3 must bind exact framework/runtime versions to supplied notices and source obligations, including components consolidated into Chromium's report. License-file presence alone is not a compatibility verdict. |
| `electron-updater` and ASAR npm dependency set | 26 library manifests plus first-party package were read from actual ASAR. Most declare MIT/ISC; argparse declares Python-2.0, sax BlueOak-1.0.0, sharp Apache-2.0. Notice paths recorded. | **Retain each existing license; distribute as dependencies only after closure mapping.** | Produce final component-to-license mapping, including bundled service dependencies beyond these 26 libraries. Do not use only the root lockfile as shipped evidence. |
| OpenAI tunnel-client | Source pin now selects v0.0.13. Vendor archive contains `LICENSE`, `NOTICE`, and a versioned third-party license report. `stage-runtime.mjs` currently copies only executable and LICENSE. Standard unpacked runtime has only the tunnel LICENSE in its inspected license directory. | **Retain Apache-2.0 and all applicable dependency terms; proposed redistribute only after notice completeness is established.** | Map the selected exact binary to required attribution/third-party texts. Inspect source archive report coverage and stage required notices through CFP-3.DISTRIBUTION; v0.0.13 must not inherit an older artifact's acceptance. Apache section 4 is the primary redistribution reference. |
| sharp JS/native wrapper | Standard unpacked package sharp 0.34.3 includes Apache LICENSE and wrapper/source files. | **Retain Apache-2.0; conditional dependency inclusion.** | Keep copyright/change notices and verify the exact wrapper/native build chain. |
| Windows sharp/libvips binary closure | Actual `@img/sharp-win32-x64` 0.34.3 declares `Apache-2.0 AND LGPL-3.0-or-later`, ships `libvips-42.dll` and `libvips-cpp-8.17.1.dll`; versions.json lists 27 other library entries plus vips. Selected package LICENSE contains Apache text only. | **Retain exact binary component terms; conditional inclusion after LGPL and transitive-library fulfillment review.** | Reviewer must determine corresponding license texts, source availability/offer, modifications, replacement/relink and installation obligations for this actual build. Generic libvips website metadata (`LGPL-2.1-or-later`) does not override the shipped package's combined declaration. Other global notices may contain relevant text, but no exact fulfillment map was established. |
| Plotly / Mapbox v1 / MapLibre | Packaged `vendor/plotly/plotly.min.js` identifies Plotly 3.0.3 and MIT; map identifiers occur inside it. Root lockfile lists Mapbox 1.13.3, @plotly/mapbox-gl 1.13.4 and MapLibre 4.7.1. Installed local license texts are BSD-style with additional attributions. Exact embedded map versions were not proven. | **Retain exact upstream terms; exclude unused optional map payloads only by later reviewed build change.** | Bind bundled component versions to license notices. Review any enabled map data, tiles, styles or hosted API terms separately from rendering-library licensing. Do not impose current Mapbox release terms on an unverified older embedded version or assume no maps ship because no direct client import was found. |
| Fonts / parser WASM | Public tree includes KaTeX-named fonts and Tree-sitter WASM. Installed source packages declare MIT and have license files; exact bundled/source correspondence remains open. | **Retain upstream terms; conditional inclusion with asset provenance.** | Match artifact hashes to build inputs and complete notices. Packages inspected: KaTeX 0.16.45; web-tree-sitter 0.25.10; JavaScript grammar 0.25.0; TypeScript grammar 0.23.2. These are source package versions, not verified bundled versions. |
| Images, audio, models and sample media | Actual public tree includes Butler/needle GLBs, default vocal/instrumental WAVs, impulse-response WAVs, PNG/SVG assets; galaxy-map README requests a user image but is not a rights grant. Media content was not played or visually evaluated. | **Exclude unneeded media from narrow commercial package; retain only after item-level rights/provenance review.** This is a proposed packaging disposition, not an edit. | Owner supplies creator/source, license or commissioning permission, redistribution/use scope, and any attribution for each selected asset. Absence of nearby license text is unresolved provenance, not a finding of infringement. |
| CasimirBot Fabric player, sensor and connector-core | Local player 0.4.12 and sensor 0.3.0 JARs each embed connector-core 0.2.0. Three inspected JARs contain no named LICENSE/COPYING/NOTICE entry; Fabric manifests omit a license field. These JARs were inspected in build outputs, not found as JARs in the standard EXE resource tree. | **Ownership review + Minecraft commercial-classification hold for paid distribution.** Technical pilot remains under its existing scope; public/free/private connector decisions do not settle monetization terms. | Establish exact separate provisioning/shipping graph and source origin; choose component terms only after review. Complete the Minecraft closure packet below before admitting dependent commercial licensing/distribution. |
| Minecraft game, Fabric Loader/API, Java and mappings | Gradle declares Minecraft 1.21.8, Loader 0.18.4, Fabric API 0.136.1+1.21.8, official mappings and Java 21. Loader/API upstream license sources are Apache-2.0; actual game/JRE provisioning was not inspected. | **Do not redistribute game/modded game; retain upstream terms for separately selected loader/API/runtime.** No unreviewed game/runtime bundle. | Map approved download origins and user-owned game/account assumptions. Pin actual runtime and loader/API artifacts with full notices; check mappings and Java distribution terms for selected method. Minecraft-specific commercial classification is separate from Fabric's open-source licenses. |
| Baritone | Existing packet requires evaluation-only/non-shipping treatment. Player JAR contains CasimirBot `BaritoneFacade` reflection bridge classes, not identified upstream `baritone/` implementation entries; source reflects into `baritone.api`. No Baritone JAR found in standard EXE tree. | **Exclude upstream engine and product capability; retain isolated evaluation evidence.** Bridge names alone neither prove copied upstream code nor accept a shipping profile. | CFP-3 final profile scan must exclude runtime engine/dependency/catalog capability; owner/reviewer verifies independent navigation provenance. Do not transfer evaluation acceptance to the commercial planner. |

## Minecraft commercial classification: exact closure evidence

The current official [Minecraft EULA](https://www.minecraft.net/en-us/eula),
Using mods section, includes tools/plugins in its mod definition and restricts
selling or monetizing original Java mods. The current
[Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines), Extended
functionality and modifications section, also addresses direct or indirect
checks of outside-product access affecting in-game features. These are material
questions for the proposed paid harness/connector relationship. They do not
establish this product's final legal classification by themselves.

Do not assume a free connector with a paid external harness is automatically
permitted. Do not restructure payments or labeling merely to evade these terms.
The owner/rights reviewer must close **R-MC-01** with:

1. A frozen offer and monetization map: what is purchased, which entity receives
   payment, trial/subscription/version-license boundaries, bundled services,
   refund/expiry effects, and all advertised Minecraft-dependent capabilities.
2. A package and interaction map: EXE, companion/core JARs, loader/API, game and
   Java provisioning, source/binary ownership, and the exact signals exchanged
   between the software-entitlement service, action admission and in-game code.
3. A paywall map for licensed/unlicensed/expired/offline states: every direct or
   indirect condition that changes in-game functions, including continued
   operation, local controls, remote requests and paid feature discovery.
4. A dated applicable-terms record and reviewer analysis of the exact offer,
   distribution and marketing claims, identifying the specific permission basis
   for each relevant activity. Server-hosting permissions must not be presumed
   to authorize a local mod/harness offering.
5. Where the applicable terms do not clearly permit the intended conduct, written
   permission or a documented authorized arrangement covering that exact scope;
   otherwise retain the dependent commercial hold. Record the issuer, covered
   entities/products, conditions, term/version and evidence reference.
6. An explicit owner/reviewer decision and allowed commercial boundary, linked
   to CFP-1.SCOPE/POLICY/ENTITLEMENTS and downstream distribution acceptance.

The technical pilot is not a rights clearance or permission to start charging.
No Minecraft terms were accepted or commercial permissions requested by this
audit. User selection of the technical pilot is retained; this finding does not
redesign the offer or stop independent specification work.

## Concrete remaining owner and reviewer questions

| ID | Needed evidence / decision | Owner and affected work |
| --- | --- | --- |
| R-OWN-01 | Identify first-party rights holders, outside/employment/commissioned contributions, applicable contributor agreements and prior published versions/terms. Map six recorded author identities to evidence without treating aliases or AI attribution as independent ownership assignments. | Product owner + rights reviewer; proprietary boundary and commercial distribution. |
| R-MC-01 | Complete the six-item classification packet above for the selected bounded Minecraft pilot's proposed paid offer. | Product owner + rights reviewer; dependent Minecraft commercial scope, paid capability admission and distribution. |
| R-BIN-01 | Which exact source revision plus dirty patch set and artifact hashes is the intended first Windows distribution? Which companion/JRE assets are separately provisioned? | Release engineer; final SBOM and notice completion. |
| R-NOTICE-01 | For the selected tunnel-client binary, how will NOTICE and third-party notices be reproduced and bound to the release manifest? | Release engineer + rights reviewer; CFP-3.DISTRIBUTION. |
| R-LGPL-01 | Establish exact Windows libvips/transitive license obligations and the concrete source/replacement/relink/install compliance mechanism for that build. | Release engineer + rights reviewer; native dependency inclusion. |
| R-ASSET-01 | Provide provenance/redistribution permissions for every shipped sound/model/image/font/parser asset; remove unneeded items only through an admitted packaging patch. | Asset owner + release engineer; narrow release contents. |
| R-PUBLIC-01 | Select public SDK/protocol/plugin/verifier paths and terms individually; determine which first-party future implementation can be kept private while preserving existing licenses. | Product/architecture + rights reviewer; source publication boundary. |
| R-MAP-01 | Identify embedded Plotly/map versions and enabled data/style/tile services; establish notices and service terms only for the selected shipped/used components. | Client/release owner + rights reviewer; renderer dependency closure. |

## Audit outcome and limits

Outcome: the draft component matrix and concrete questions are complete for
this bounded inspection; **rights clearance is not complete**. R-OWN-01 and
R-MC-01 remain owner/reviewer decisions. R-BIN-01/R-NOTICE-01/R-LGPL-01/R-ASSET-01/
R-PUBLIC-01/R-MAP-01 define artifact-specific follow-up evidence. CFP-1 remains
active; this audit opens no implementation stage or commercial operation.

The reproducible inspection script writes only this draft evidence directory.
Its initial run hit a URL-encoded local output-path bug and the first archive
read used the wrong Windows path separator; both audit-tool issues were fixed
before the final inventory and are not product findings. No dependency install,
runtime test, signature verification, secret read, license edit, source
visibility change, external message, or publication was performed.
