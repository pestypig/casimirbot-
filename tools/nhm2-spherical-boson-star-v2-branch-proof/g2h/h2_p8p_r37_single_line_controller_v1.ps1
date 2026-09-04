[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$Project = 'dark-stratum-455714-h4'
$Zone = 'us-east1-b'
$Vm = 'nhm2-h2-p8p-r32-e2-4-20260904'
$InstanceId = '1893159507643031574'
$Archive = 'C:\NHM2-R35\p8p.tar'
$Root = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot'
$Evidence = Join-Path $Root 'artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r37-single-line-cloud-fixture-v1-20260904'
$Gcloud = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd'
$Config = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config'
$started = $false
$env:CLOUDSDK_CONFIG = $Config
$env:CLOUDSDK_CORE_DISABLE_USAGE_REPORTING = 'true'

function Save-Text {
    param([Parameter(Mandatory)][string]$Path, [AllowEmptyString()][string]$Text)
    [System.IO.File]::WriteAllText($Path, $Text + "`n", [System.Text.UTF8Encoding]::new($false))
}

function Invoke-Gcloud {
    param([Parameter(Mandatory)][string[]]$Arguments)
    $lines = & $Gcloud @Arguments 2>&1
    $code = $LASTEXITCODE
    if ($code -ne 0) { throw "gcloud failed ($code): $($Arguments -join ' ')`n$($lines -join "`n")" }
    return ($lines -join "`n")
}

function Invoke-GcloudObserved {
    param([Parameter(Mandatory)][string[]]$Arguments)
    $lines = & $Gcloud @Arguments 2>&1
    return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Text = ($lines -join "`n") }
}

$guard = 'set -eu; fixture=/home/pestypig/h2_p8p_r31_local_image_binding_fixture_v1.sh; wrapper=/home/pestypig/h2_p8p_r32_fresh_vm_binding_guest_v1.sh; archive=/home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar; test -f "$fixture"; test ! -L "$fixture"; test "$(stat -c %s "$fixture")" = 4024; test "$(sha256sum "$fixture" | cut -d " " -f 1)" = 97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79; test -f "$wrapper"; test ! -L "$wrapper"; test "$(stat -c %s "$wrapper")" = 3129; test "$(sha256sum "$wrapper" | cut -d " " -f 1)" = f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19; test ! -e "$archive"; printf "%s\n" R37_REMOTE_GUARD_PASS'
$handoff = 'set -eu; archive=/home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar; test -f "$archive"; test ! -L "$archive"; test "$(stat -c %s "$archive")" = 236640768; test "$(sha256sum "$archive" | cut -d " " -f 1)" = 3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5; exec bash /home/pestypig/h2_p8p_r32_fresh_vm_binding_guest_v1.sh'
if ($guard.Contains("`r") -or $guard.Contains("`n") -or $handoff.Contains("`r") -or $handoff.Contains("`n")) { throw 'remote command contains newline' }

try {
    if (Test-Path -LiteralPath $Evidence) { throw 'R37 evidence root already exists' }
    New-Item -ItemType Directory -Path $Evidence | Out-Null
    Save-Text (Join-Path $Evidence 'start.utc.txt') ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
    if (-not (Test-Path -LiteralPath $Gcloud -PathType Leaf)) { throw 'gcloud absent' }
    if (-not (Test-Path -LiteralPath $Archive -PathType Leaf)) { throw 'R35 hard link absent' }
    if ((Get-Item -LiteralPath $Archive).Length -ne 236640768) { throw 'archive byte mismatch' }
    if ((Get-FileHash -LiteralPath $Archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne '3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5') { throw 'archive hash mismatch' }
    $account = (Invoke-Gcloud @('auth','list','--filter=status:ACTIVE','--format=value(account)')).Trim()
    $projectValue = (Invoke-Gcloud @('config','get-value','core/project')).Trim()
    if ($account -ne 'pestypig@gmail.com' -or $projectValue -ne $Project) { throw 'account/project mismatch' }
    $beforeJson = Invoke-Gcloud @('compute','instances','describe',$Vm,"--project=$Project","--zone=$Zone",'--format=json')
    Save-Text (Join-Path $Evidence 'instance.before.json') $beforeJson
    $before = $beforeJson | ConvertFrom-Json
    if ([string]$before.id -ne $InstanceId -or $before.status -ne 'TERMINATED') { throw 'stopped VM identity mismatch' }
    if (-not $before.machineType.EndsWith('/machineTypes/e2-standard-4')) { throw 'machine mismatch' }
    if (@($before.disks).Count -ne 1 -or [int]$before.disks[0].diskSizeGb -ne 30) { throw 'disk mismatch' }
    $start = Invoke-Gcloud @('compute','instances','start',$Vm,"--project=$Project","--zone=$Zone",'--format=json')
    $started = $true
    Save-Text (Join-Path $Evidence 'start.json') $start
    Start-Sleep -Seconds 120
    $guardResult = Invoke-GcloudObserved @('compute','ssh',"pestypig@$Vm","--project=$Project","--zone=$Zone",'--quiet',"--command=$guard")
    Save-Text (Join-Path $Evidence 'guard.stdout.txt') $guardResult.Text
    Save-Text (Join-Path $Evidence 'guard.exit.txt') ([string]$guardResult.ExitCode)
    if ($guardResult.ExitCode -ne 0 -or $guardResult.Text -notmatch 'R37_REMOTE_GUARD_PASS') { throw 'read-only remote guard failed' }
    $scp = Invoke-Gcloud @('compute','scp',$Archive,"pestypig@${Vm}:/home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar","--project=$Project","--zone=$Zone",'--quiet')
    Save-Text (Join-Path $Evidence 'archive.scp.txt') $scp
    $handoffResult = Invoke-GcloudObserved @('compute','ssh',"pestypig@$Vm","--project=$Project","--zone=$Zone",'--quiet',"--command=$handoff")
    Save-Text (Join-Path $Evidence 'handoff.stdout.txt') $handoffResult.Text
    Save-Text (Join-Path $Evidence 'handoff.exit.txt') ([string]$handoffResult.ExitCode)
    $deadline = [DateTime]::UtcNow.AddSeconds(3600)
    do {
        Start-Sleep -Seconds 30
        $status = (Invoke-Gcloud @('compute','instances','describe',$Vm,"--project=$Project","--zone=$Zone",'--format=value(status)')).Trim()
        Save-Text (Join-Path $Evidence 'last-status.txt') $status
    } while ($status -ne 'TERMINATED' -and [DateTime]::UtcNow -lt $deadline)
    if ($status -ne 'TERMINATED') { throw 'runtime ceiling reached before stop' }
    $started = $false
    $serial = Invoke-Gcloud @('compute','instances','get-serial-port-output',$Vm,"--project=$Project","--zone=$Zone",'--port=1','--start=0')
    Save-Text (Join-Path $Evidence 'serial-port-1.txt') $serial
    if ($serial -notmatch 'R32_GUEST_TERMINAL phase=(?<phase>[a-z_]+) exit=(?<exit>[0-9]+)') { throw 'terminal marker absent' }
    $terminal = [regex]::Match($serial, 'R32_GUEST_TERMINAL phase=(?<phase>[a-z_]+) exit=(?<exit>[0-9]+)')
    Save-Text (Join-Path $Evidence 'terminal.phase.txt') $terminal.Groups['phase'].Value
    Save-Text (Join-Path $Evidence 'guest.exit.txt') $terminal.Groups['exit'].Value
    if ($terminal.Groups['phase'].Value -ne 'complete' -or $terminal.Groups['exit'].Value -ne '0') { throw 'fixture terminal failure' }
    Save-Text (Join-Path $Evidence 'procedure.exit.txt') '0'
}
catch {
    if (Test-Path -LiteralPath $Evidence) {
        Save-Text (Join-Path $Evidence 'failure.txt') $_.Exception.ToString()
        Save-Text (Join-Path $Evidence 'procedure.exit.txt') '1'
    }
    throw
}
finally {
    if ($started) {
        try {
            $status = (Invoke-Gcloud @('compute','instances','describe',$Vm,"--project=$Project","--zone=$Zone",'--format=value(status)')).Trim()
            if ($status -ne 'TERMINATED') {
                $stop = Invoke-Gcloud @('compute','instances','stop',$Vm,"--project=$Project","--zone=$Zone",'--quiet')
                Save-Text (Join-Path $Evidence 'cleanup-stop.txt') $stop
            }
        }
        catch { Save-Text (Join-Path $Evidence 'cleanup-stop.failure.txt') $_.Exception.ToString() }
    }
    if (Test-Path -LiteralPath $Evidence) { Save-Text (Join-Path $Evidence 'finish.utc.txt') ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')) }
}
