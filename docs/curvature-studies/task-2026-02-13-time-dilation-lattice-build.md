# Curvature Build Task

Status: in_progress  
Owner: dan  
Date: 2026-02-13  
Scope: Continue next iteration of build+capture+verification with targeted Natário/debugging workflow until artifacts are strict-pass ready for research handoff.

Current known context:
- Diagnostics source for headless launches is `time-dilation-headless` (not `time_dilation_activate_ok`).
- Latest fresh run at `tmp/curvature-check-cycle/20260212T235900` leaves two FAILs:
  - `invariantAvailability` → no curvature invariants detected
  - `fieldProvenance.curvature` → missing provenance entry for `kretschmann`
- Earlier `gttResidual` is now PASS in that run (`beta_repr=packed_nx3`, `gamma_mode=diag3`, `p98=0`, `timelike_frac=1`), so mismatch is now metadata/invariant coverage.

## Inputs
- `docs/curvature-studies/decision-2026-02-13.md`
- `docs/time-dilation-curvature-visualization.md`
- `scripts/time-dilation-activate.ts`
- `scripts/time-dilation-debug-fetch.ts`
- `scripts/curvature-congruence-check.ts`
- `shared/time-dilation-diagnostics.ts`
- `client/src/components/TimeDilationLatticePanel.tsx`
- `server/routes/helix/time-dilation.ts`
- `server/helix-core.ts`

## Repo paths (full)
- Repo root: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot`
- Task file: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\docs\curvature-studies\task-2026-02-13-time-dilation-lattice-build.md`
- Run root: `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tmp\curvature-check-cycle\`

## Current priority
1) Produce a new run with curvature invariants and provenance metadata populated.
2) Re-run strict checker and triage failing fields only.
3) Capture panel debug payload from the same bundle and validate visual-to-math consistency.
4) Only after passing strict checks (or documenting approved exceptions) proceed to research interpretation.

## Build/run -> capture -> verify
1) Ensure server is running on target port.
```powershell
$env:PORT="5173"
Set-Location "C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot"
npm run build
node dist/index.js
```

2) Start a run folder.
```powershell
$RUN = (Get-Date).ToString('yyyyMMddTHHmmss')
$ROOT = "C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot"
$OUT = Join-Path $ROOT ("tmp\\curvature-check-cycle\\$RUN")
New-Item -ItemType Directory -Force $OUT | Out-Null
Write-Output $OUT
```

3) Activate strict Natário target with timeouts tuned for full pipeline.
```powershell
$BASE = "http://127.0.0.1:5173"
npx tsx scripts/time-dilation-activate.ts `
  --url $BASE `
  --warpFieldType natario `
  --strictCongruence true `
  --grEnabled true `
  --applyCanonicalHull true `
  --gridScale 1 `
  --grTargetDx 5 `
  --includeExtra 0 `
  --includeMatter 0 `
  --includeKij 0 `
  --async false `
  --publish true `
  --kickGrBrick false `
  --diagnosticsTimeoutMs 240000 `
  --timeoutMs 240000
```

Suggested fallback if this still stalls:
```powershell
npx tsx scripts/time-dilation-activate.ts --url $BASE --warpFieldType natario --strictCongruence true --grEnabled true --applyCanonicalHull true --gridScale 1 --grTargetDx 30 --includeExtra 0 --includeMatter 0 --includeKij 0 --async false --publish true --kickGrBrick false --diagnosticsTimeoutMs 120000 --timeoutMs 120000
```

4) Poll diagnostics and persist current payload snapshot.
```powershell
for ($i = 0; $i -lt 90; $i += 1) {
  Start-Sleep -Seconds 2
  $payload = try { (Invoke-WebRequest -Uri "$BASE/api/helix/time-dilation/diagnostics?raw=1" -UseBasicParsing -TimeoutSec 45).Content } catch { "" }
  if (-not $payload) { continue }
  $payload | Out-File -FilePath (Join-Path $OUT "time-dilation-diagnostics.json") -Encoding utf8
  if ($payload -match '"source"\s*:\s*"time-dilation-headless"' -or $payload -match '"source"\s*:\s*"time_dilation_activate_ok"') { break }
  if ($payload -match '"source"\s*:\s*"time_dilation_activate_error"') { Write-Output "Activation reported error source; capture payload and stop for triage."; break }
}
```

5) Capture required artifacts.
```powershell
(New-Object System.Net.WebClient).DownloadFile("$BASE/api/helix/time-dilation/diagnostics?raw=1", (Join-Path $OUT "time-dilation-diagnostics.json"))
(New-Object System.Net.WebClient).DownloadFile("$BASE/api/helix/pipeline/proofs", (Join-Path $OUT "pipeline-proofs.json"))
(New-Object System.Net.WebClient).DownloadFile("$BASE/api/helix/gr-evolve-brick?format=json&includeExtra=1&includeMatter=1&includeKij=1", (Join-Path $OUT "gr-evolve-brick.json"))
```

6) Run checker in strict mode on bundle.
```powershell
npx tsx scripts/curvature-congruence-check.ts --bundle $OUT --out artifacts/curvature-congruence-report.json
```

7) Quick triage script for required fields.
```powershell
$artifact = "artifacts/curvature-congruence-report.json"
npx tsx -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); const f=j?.results?.fieldProvenance || {}; const inv=j?.results?.invariantAvailability; const g=j?.results?.gttResidual || {}; console.log('overall:',j.overall); console.log('invariantAvailability:',inv?.status, inv?.details); console.log('curvature provenance:', f.curvature); console.log('gtt residual:',g.status, g.beta_repr, g.gamma_mode);" -- $artifact

npx tsx -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log('provenance channels sample:', Object.keys((d.provenance||{}) ).slice(0,12)); console.log('gtt defs:', d?.fieldProvenance?.gtt); console.log('kretschmann def:', d?.fieldProvenance?.curvature?.kretschmann);" -- (Join-Path $OUT "pipeline-proofs.json")
```

7) Gate decision for this run.
- PASS: proceed to panel parity and final notes.
- WARN: fix first warning only if it is material to the chosen strict-mode contract.
- FAIL: patch and rerun step 6 before any research interpretation pass.

## Targeted Natario debug for this build
1) Validate payload shape clues.
```powershell
$diag = Join-Path $OUT "time-dilation-diagnostics.json"
$proofs = Join-Path $OUT "pipeline-proofs.json"
$brick = Join-Path $OUT "gr-evolve-brick.json"
Get-FileHash $diag, $proofs, $brick
```
```powershell
npx tsx -e "const fs=require('fs'); const b=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); const want=['alpha','beta_x','beta_y','beta_z','gamma_xx','gamma_yy','gamma_zz','g_tt','gtt']; const have=Object.keys((b.channels||{})); const present=have.filter(k=>want.includes(k)); const missing=want.filter(k=>!have.includes(k)); console.log('present:',present.join(',')); console.log('missing:',missing.join(',')||'(none)'); console.log('channel count', have.length); console.log('provenance keys', Object.keys(b.provenance||{}).length);" -- $brick
```

2) Confirm required fields in brick payload (quick shell check).
```powershell
npx tsx -e "const fs=require('fs'); const b=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); const want=['alpha','beta_x','beta_y','beta_z','gamma_xx','gamma_yy','gamma_zz']; const inv=['kretschmann','ricciScalar','ricci4']; const have=Object.keys((b.channels||{})); const c = x => want.filter(k=>have.includes(k)); console.log('truth channels', c(want).join(',')); console.log('missing truth', want.filter(k=>!have.includes(k)).join(',')); console.log('invariant samples', inv.map(i=>[i,have.includes(i)]));" -- $brick
```

3) Capture diagnostic snapshot for panel parity.
```powershell
npx tsx scripts/time-dilation-debug-fetch.ts --url "$BASE/api/helix/time-dilation/diagnostics?raw=1" --out (Join-Path $OUT "time-dilation-lattice-debug.json")
```

4) Open panel and align controls:
- Route: `/helix-core`
- open Time Dilation Lattice panel
- verify internal flags: `strictCongruence=true`, `latticeMetricOnly=true`, `anyProxy=false`, `grCertified=true`, `mode=natario`
- capture UI notes for `sourceFor*`, `gttResidual`, and debug values if available

5) Compare against checker output.
- `artifacts/curvature-congruence-report.json`
- `$OUT\time-dilation-lattice-debug.json`
- `$OUT\gr-evolve-brick.json`
- `$OUT\pipeline-proofs.json`

### Required provenance checks before research handoff
- `fieldProvenance.curvature.kretschmann` must exist and resolve to a source channel.
- `pipeline-proofs.json` should include explicit curvature definition metadata for at least one invariant.
- `artifacts/curvature-congruence-report.json` must not have FAIL for:
  - `invariantAvailability`
  - `fieldProvenance.curvature`
- If present, WARNs must be documented with an engineering note in `docs/curvature-studies/decision-2026-02-13.md`.

## Completion criteria before new research round
1) New folder exists under `tmp\curvature-check-cycle` with all 3 files.
2) `artifacts/curvature-congruence-report.json` has no FAIL.
3) Any WARN is either justified in `docs/curvature-studies/decision-2026-02-13.md` or patched.
4) Panel parity checks are tied to the same run bundle.
5) Then schedule focused interpretation/research review only.

## Required checks after code changes
- `npm run math:validate`
- Required GR suite listed in `WARP_AGENTS.md`
- `curl -sS $BASE/api/agi/adapter/run` (report PASS + certificate integrity)
- `curl -sS $BASE/api/agi/training-trace/export` (JSONL)

## Latest completed bundle (reference)
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\\tmp\\curvature-check-cycle\\20260212T235900`
- Artifacts:
  - `time-dilation-diagnostics.json`
  - `pipeline-proofs.json`
  - `gr-evolve-brick.json`

## Research block handoff
- Use `docs/curvature-studies/2026-02-13-research-block-20260213T000954.md` for the remaining interpretation block.

## New completed bundle (latest strict PASS)
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tmp\curvature-check-cycle\20260213T000954`
- Artifacts:
  - `time-dilation-activate-response.json`
  - `time-dilation-diagnostics.json`
  - `pipeline-proofs.json`
  - `gr-evolve-brick.json`
  - `time-dilation-lattice-debug.json`
- Checker summary:
  - `artifacts/curvature-congruence-report.json`
  - `overall: PASS`
  - `strictCongruence / latticeMetricOnly / proxyBlocked / grCertified / thetaK: PASS`
  - `gttResidual: PASS (p98=0, timelike_frac=1)`
  - `thetaK: PASS`
  - `invariantAvailability: PASS (14 invariants)`
  - `fieldProvenance.*: PASS`
- Note:
  - `time-dilation-activate-response.json` reports `activation.accepted = false`, while strict checker on persisted diagnostics is PASS. Keep this for pipeline interpretation notes before research write-up.

## Panel parity status (from this run)
- Run the parity check script:
```powershell
npx tsx -e "const fs=require('fs'); const rep=JSON.parse(fs.readFileSync('artifacts/curvature-congruence-report.json','utf8')); const diag=JSON.parse(fs.readFileSync('tmp\\curvature-check-cycle\\20260213T000954\\time-dilation-diagnostics.json','utf8')); const checks=Object.fromEntries((rep.primary?.checks||[]).map(c=>[c.name,c.status])); const issues=[]; if((rep.primary?.status)!=='PASS') issues.push('checker-not-pass'); if(diag.strict?.strictCongruence!==true) issues.push('strictCongruence mismatch'); if(diag.strict?.latticeMetricOnly!==true) issues.push('latticeMetricOnly mismatch'); if(diag.strict?.anyProxy!==false) issues.push('anyProxy mismatch'); if(diag.strict?.grCertified!==true) issues.push('grCertified mismatch'); if(diag.render_plan?.mode!=='natario') issues.push('mode mismatch'); if(diag.render_plan?.banner!=='CERTIFIED') issues.push('banner mismatch'); if(diag.render_plan?.sourceForAlpha!=='gr-brick'||diag.render_plan?.sourceForBeta!=='gr-brick'||diag.render_plan?.sourceForTheta!=='gr-brick'||diag.render_plan?.sourceForClockRate!=='gr-brick') issues.push('sourceFor mismatch'); console.log('checker', rep.primary?.status); console.log('strict', diag.strict); console.log('mode/banner', diag.render_plan?.mode, diag.render_plan?.banner); console.log('sources', diag.render_plan?.sourceForAlpha, diag.render_plan?.sourceForBeta, diag.render_plan?.sourceForTheta, diag.render_plan?.sourceForClockRate); console.log('wall', diag.wall?.source, diag.wall?.detected, diag.wall?.p98); console.log('result', issues.length===0 ? 'PASS' : 'FAIL'); if(issues.length) console.log('issues', issues);" 
```
- Latest outcome:
  - `checker: PASS`
  - `parity issues: 0`
  - `mode: natario`
  - `banner: CERTIFIED`
  - `strict=true, latticeMetricOnly=true, anyProxy=false, grCertified=true`
  - `sourceForAlpha/Beta/Theta/ClockRate: gr-brick`
  - `wall source: ricci4`

## Research handoff gate
- This run is ready for interpretation/research handoff if manual UI verification confirms the lattice panel displays the same `banner`, `sourceFor*`, and wall visualization settings.
- If panel diverges, collect:
  - `/helix-core` panel notes at the same timestamp
  - `time-dilation-lattice-debug.json`
  - `artifacts/curvature-congruence-report.json`
  and rerun only the targeted parity script.
