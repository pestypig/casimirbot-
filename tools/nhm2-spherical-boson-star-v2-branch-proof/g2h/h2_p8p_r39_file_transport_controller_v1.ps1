[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$Project = 'dark-stratum-455714-h4'
$Zone = 'us-east1-b'
$Vm = 'nhm2-h2-p8p-r32-e2-4-20260904'
$InstanceId = '1893159507643031574'
$Archive = 'C:\NHM2-R35\p8p.tar'
$Guard = 'C:\NHM2-R39\h2_p8p_r39_remote_guard_v1.sh'
$Launcher = 'C:\NHM2-R39\h2_p8p_r39_remote_launcher_v1.sh'
$RemoteGuard = '/home/pestypig/h2_p8p_r39_remote_guard_v1.sh'
$RemoteArchive = '/home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar'
$RemoteLauncher = '/home/pestypig/h2_p8p_r39_remote_launcher_v1.sh'
$Root = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot'
$Evidence = Join-Path $Root 'artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r39-file-transport-cloud-fixture-v1-20260904'
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

try {
    if (Test-Path -LiteralPath $Evidence) { throw 'R39 evidence root already exists' }
    New-Item -ItemType Directory -Path $Evidence | Out-Null
    Save-Text (Join-Path $Evidence 'start.utc.txt') ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
    if (-not (Test-Path -LiteralPath $Gcloud -PathType Leaf)) { throw 'gcloud absent' }
    $localFiles = @(
        @{ Path = $Archive; Bytes = 236640768; Hash = '3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5' },
        @{ Path = $Guard; Bytes = 770; Hash = 'cbd1cc51d9108f07f8741a175929a2742039aeb61c6f9997d69d293a836c9861' },
        @{ Path = $Launcher; Bytes = 590; Hash = '802055c139ef32d462457f3576d0911272a496d7a27be7a972f961eb0899e3bb' }
    )
    foreach ($item in $localFiles) {
        if (-not (Test-Path -LiteralPath $item.Path -PathType Leaf)) { throw "local input absent: $($item.Path)" }
        if ((Get-Item -LiteralPath $item.Path).Length -ne $item.Bytes) { throw "local byte mismatch: $($item.Path)" }
        if ((Get-FileHash -LiteralPath $item.Path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $item.Hash) { throw "local hash mismatch: $($item.Path)" }
    }
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

    $absence = Invoke-GcloudObserved @('compute','ssh',"pestypig@$Vm","--project=$Project","--zone=$Zone",'--quiet',"--command=test -e $RemoteGuard")
    Save-Text (Join-Path $Evidence 'guard-absence.stdout.txt') $absence.Text
    Save-Text (Join-Path $Evidence 'guard-absence.exit.txt') ([string]$absence.ExitCode)
    if ($absence.ExitCode -ne 1) { throw 'remote guard path was present or absence probe failed unexpectedly' }

    $guardScp = Invoke-Gcloud @('compute','scp',$Guard,"pestypig@${Vm}:$RemoteGuard","--project=$Project","--zone=$Zone",'--quiet')
    Save-Text (Join-Path $Evidence 'guard.scp.txt') $guardScp
    $guardResult = Invoke-GcloudObserved @('compute','ssh',"pestypig@$Vm","--project=$Project","--zone=$Zone",'--quiet',"--command=bash $RemoteGuard")
    Save-Text (Join-Path $Evidence 'guard.stdout.txt') $guardResult.Text
    Save-Text (Join-Path $Evidence 'guard.exit.txt') ([string]$guardResult.ExitCode)
    if ($guardResult.ExitCode -ne 0 -or $guardResult.Text -notmatch 'R39_REMOTE_GUARD_PASS') { throw 'file-based remote guard failed' }

    $archiveScp = Invoke-Gcloud @('compute','scp',$Archive,"pestypig@${Vm}:$RemoteArchive","--project=$Project","--zone=$Zone",'--quiet')
    Save-Text (Join-Path $Evidence 'archive.scp.txt') $archiveScp
    $launcherScp = Invoke-Gcloud @('compute','scp',$Launcher,"pestypig@${Vm}:$RemoteLauncher","--project=$Project","--zone=$Zone",'--quiet')
    Save-Text (Join-Path $Evidence 'launcher.scp.txt') $launcherScp
    $handoffResult = Invoke-GcloudObserved @('compute','ssh',"pestypig@$Vm","--project=$Project","--zone=$Zone",'--quiet',"--command=bash $RemoteLauncher")
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
