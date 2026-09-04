[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$Project = 'dark-stratum-455714-h4'
$Region = 'us-east1'
$Vm = 'nhm2-h2-p8p-r26-c2d-32-20260903'
$Archive = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r16-regional-bulk-ingress-v1-20260902\h2-p8p-r16-regional-bulk-upload-v1.tar'
$Evidence = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r26-local-gcloud-execution-v1-20260903'
$Gcloud = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd'
$Config = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config'
$Auditor = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\scripts\nhm2_g2h_e_s5_c08_h2_p8p_turnaround_result_audit.py'
$ArchiveBytes = 236640768
$ArchiveSha = '3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5'
$BaseSha = 'fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978'
$OverlaySha = '4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e'
$LedgerSha = 'd7f98f542ee776eec9f6d24173031f2b671bb54e59fd74d44d5b637990f536a6'
$NestedOrchestratorSha = '74d2b8ffe2f4501d22fbdb6a88449c5f00a127215e1b8e17aa7da2938c8e2938'
$RuntimeCeilingSeconds = 18000
$vmCreated = $false
$zone = $null

$env:CLOUDSDK_CONFIG = $Config
$env:CLOUDSDK_CORE_DISABLE_USAGE_REPORTING = 'true'

function Invoke-Gcloud {
    param([Parameter(Mandatory)][string[]]$Arguments)
    $lines = & $Gcloud @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "gcloud failed ($LASTEXITCODE): $($Arguments -join ' ')`n$($lines -join "`n")"
    }
    return ($lines -join "`n")
}

function Save-Text {
    param([Parameter(Mandatory)][string]$Path, [AllowEmptyString()][string]$Text)
    [System.IO.File]::WriteAllText($Path, $Text + "`n", [System.Text.UTF8Encoding]::new($false))
}

try {
    if (-not (Test-Path -LiteralPath $Gcloud -PathType Leaf)) { throw 'gcloud executable absent' }
    if (-not (Test-Path -LiteralPath $Archive -PathType Leaf)) { throw 'outer archive absent' }
    if ((Get-Item -LiteralPath $Archive).Length -ne $ArchiveBytes) { throw 'outer archive byte mismatch' }
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $Archive).Hash.ToLowerInvariant() -ne $ArchiveSha) { throw 'outer archive hash mismatch' }
    if (Test-Path -LiteralPath $Evidence) { throw 'R26 evidence root already exists' }
    New-Item -ItemType Directory -Path $Evidence | Out-Null
    Save-Text -Path (Join-Path $Evidence 'start.utc.txt') -Text ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))

    $account = (Invoke-Gcloud -Arguments @('auth','list','--filter=status:ACTIVE','--format=value(account)')).Trim()
    $projectValue = (Invoke-Gcloud -Arguments @('config','get-value','core/project')).Trim()
    if ($account -ne 'pestypig@gmail.com') { throw 'active account mismatch' }
    if ($projectValue -ne $Project) { throw 'dedicated project mismatch' }
    Save-Text -Path (Join-Path $Evidence 'account.txt') -Text $account
    Save-Text -Path (Join-Path $Evidence 'project.txt') -Text $projectValue

    $preJson = Invoke-Gcloud -Arguments @('compute','instances','list',"--project=$Project",'--format=json')
    Save-Text -Path (Join-Path $Evidence 'instances.pre.json') -Text $preJson
    $pre = $preJson | ConvertFrom-Json
    if (@($pre | Where-Object { $_.name -eq $Vm }).Count -ne 0) { throw 'exact R26 VM already exists' }
    if (@($pre | Where-Object { $_.name -like 'nhm2-h2-*' -and $_.status -ne 'TERMINATED' }).Count -ne 0) { throw 'non-terminated NHM2 VM exists' }

    $regionJson = Invoke-Gcloud -Arguments @('compute','regions','describe',$Region,"--project=$Project",'--format=json')
    Save-Text -Path (Join-Path $Evidence 'region.pre.json') -Text $regionJson
    $regionObject = $regionJson | ConvertFrom-Json
    $quota = @($regionObject.quotas | Where-Object { $_.metric -eq 'C2D_CPUS' })
    if ($quota.Count -ne 1 -or ([double]$quota[0].limit - [double]$quota[0].usage) -lt 32) { throw 'regional C2D quota below 32' }
    Save-Text -Path (Join-Path $Evidence 'preexecution.pass.txt') -Text 'R26_PREEXECUTION_PASS'

    $bulkJson = Invoke-Gcloud -Arguments @(
        'compute','instances','bulk','create',
        "--project=$Project", "--region=$Region", "--predefined-names=$Vm",
        '--count=1', '--min-count=1', '--target-distribution-shape=ANY_SINGLE_ZONE',
        '--location-policy=us-east1-b=allow,us-east1-c=allow,us-east1-d=allow',
        '--machine-type=c2d-standard-32', '--provisioning-model=STANDARD',
        '--image=projects/debian-cloud/global/images/debian-12-bookworm-v20260817',
        '--boot-disk-size=30GB', '--boot-disk-type=pd-standard',
        '--max-run-duration=5h', '--instance-termination-action=STOP',
        '--no-restart-on-failure', '--format=json'
    )
    $vmCreated = $true
    Save-Text -Path (Join-Path $Evidence 'bulk-create.json') -Text $bulkJson

    $postJson = Invoke-Gcloud -Arguments @('compute','instances','list',"--project=$Project","--filter=name=($Vm)",'--format=json')
    Save-Text -Path (Join-Path $Evidence 'instance.post.json') -Text $postJson
    $rows = @($postJson | ConvertFrom-Json)
    if ($rows.Count -ne 1) { throw 'regional request did not yield exactly one VM' }
    $row = $rows[0]
    $zone = ($row.zone -split '/')[-1]
    if ($row.name -ne $Vm -or $row.status -ne 'RUNNING') { throw 'exact VM is not running' }
    if (-not $row.machineType.EndsWith('/machineTypes/c2d-standard-32')) { throw 'machine mismatch' }
    if ($zone -notin @('us-east1-b','us-east1-c','us-east1-d')) { throw 'selected zone outside allow set' }
    if (@($row.disks).Count -ne 1) { throw 'disk count mismatch' }
    Save-Text -Path (Join-Path $Evidence 'selected-zone.txt') -Text $zone

    $disk = ($row.disks[0].source -split '/')[-1]
    $diskJson = Invoke-Gcloud -Arguments @('compute','disks','describe',$disk,"--project=$Project","--zone=$zone",'--format=json')
    Save-Text -Path (Join-Path $Evidence 'disk.post.json') -Text $diskJson
    $diskObject = $diskJson | ConvertFrom-Json
    if ([int]$diskObject.sizeGb -ne 30) { throw 'disk size mismatch' }
    if (-not $diskObject.type.EndsWith('/diskTypes/pd-standard')) { throw 'disk type mismatch' }
    if (-not $diskObject.sourceImage.EndsWith('/images/debian-12-bookworm-v20260817')) { throw 'source image mismatch' }

    Start-Sleep -Seconds 180
    $scp = Invoke-Gcloud -Arguments @('compute','scp',$Archive,"${Vm}:/home/pestypig/","--project=$Project","--zone=$zone",'--quiet')
    Save-Text -Path (Join-Path $Evidence 'scp.txt') -Text $scp

    $remoteSetup = @'
set -Eeuo pipefail
ARCHIVE=/home/pestypig/h2-p8p-r16-regional-bulk-upload-v1.tar
STAGE=/home/pestypig/nhm2-h2-p8p-r26-ingress-v1
[[ "$(id -un)" == pestypig ]]
[[ -f "$ARCHIVE" && ! -L "$ARCHIVE" && "$(stat -c %s "$ARCHIVE")" == "236640768" ]]
[[ "$(sha256sum "$ARCHIVE" | awk '{print $1}')" == "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5" ]]
[[ ! -e "$STAGE" ]]
mkdir "$STAGE"
tar -xf "$ARCHIVE" -C "$STAGE"
[[ "$(find "$STAGE" -maxdepth 1 -type f -printf '%f\n' | LC_ALL=C sort | tr '\n' ' ')" == 'h2-p8f-c2-r1-cloud-upload-v1.tar h2-p8p-overlay-upload-v1.tar h2_p8p_r16_cloudshell_orchestrator_v1.sh h2_p8p_r2_browser_guest_sequence_v1.sh ' ]]
[[ "$(sha256sum "$STAGE/h2-p8f-c2-r1-cloud-upload-v1.tar" | awk '{print $1}')" == "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978" ]]
[[ "$(sha256sum "$STAGE/h2-p8p-overlay-upload-v1.tar" | awk '{print $1}')" == "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e" ]]
[[ "$(sha256sum "$STAGE/h2_p8p_r2_browser_guest_sequence_v1.sh" | awk '{print $1}')" == "d7f98f542ee776eec9f6d24173031f2b671bb54e59fd74d44d5b637990f536a6" ]]
[[ "$(sha256sum "$STAGE/h2_p8p_r16_cloudshell_orchestrator_v1.sh" | awk '{print $1}')" == "74d2b8ffe2f4501d22fbdb6a88449c5f00a127215e1b8e17aa7da2938c8e2938" ]]
mv "$STAGE/h2-p8f-c2-r1-cloud-upload-v1.tar" /home/pestypig/
mv "$STAGE/h2-p8p-overlay-upload-v1.tar" /home/pestypig/
mv "$STAGE/h2_p8p_r2_browser_guest_sequence_v1.sh" /home/pestypig/
sudo tee /etc/systemd/system/nhm2-h2-p8p-r26.service >/dev/null <<'UNIT'
[Unit]
Description=NHM2 candidate-neutral H2 P8P R26 turnaround calibration
After=network-online.target

[Service]
Type=oneshot
User=pestypig
ExecStart=/bin/bash /home/pestypig/h2_p8p_r2_browser_guest_sequence_v1.sh
StandardOutput=journal+console
StandardError=journal+console
TimeoutStartSec=15000

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl start --no-block nhm2-h2-p8p-r26.service
sleep 5
sudo systemctl is-active --quiet nhm2-h2-p8p-r26.service
printf 'R26_REMOTE_CONTROLLER_ACTIVE\n'
'@
    $ssh = Invoke-Gcloud -Arguments @('compute','ssh',$Vm,"--project=$Project","--zone=$zone",'--quiet',"--command=$remoteSetup")
    if ($ssh -notmatch 'R26_REMOTE_CONTROLLER_ACTIVE') { throw 'remote controller active marker absent' }
    Save-Text -Path (Join-Path $Evidence 'ssh-handoff.txt') -Text $ssh

    $deadline = [DateTime]::UtcNow.AddSeconds($RuntimeCeilingSeconds)
    do {
        Start-Sleep -Seconds 60
        $status = (Invoke-Gcloud -Arguments @('compute','instances','describe',$Vm,"--project=$Project","--zone=$zone",'--format=value(status)')).Trim()
        Save-Text -Path (Join-Path $Evidence 'last-status.txt') -Text $status
    } while ($status -ne 'TERMINATED' -and [DateTime]::UtcNow -lt $deadline)
    if ($status -ne 'TERMINATED') {
        $stopText = Invoke-Gcloud -Arguments @('compute','instances','stop',$Vm,"--project=$Project","--zone=$zone",'--quiet')
        Save-Text -Path (Join-Path $Evidence 'ceiling-stop.txt') -Text $stopText
        throw 'aggregate runtime ceiling reached before automatic stop'
    }

    $serial = Invoke-Gcloud -Arguments @('compute','instances','get-serial-port-output',$Vm,"--project=$Project","--zone=$zone",'--port=1','--start=0')
    Save-Text -Path (Join-Path $Evidence 'serial-port-1.txt') -Text $serial
    $marker = [regex]::Match($serial, 'P8P_EVIDENCE bytes=(?<bytes>[0-9]+) sha256=(?<sha>[0-9a-f]{64})')
    $payload = [regex]::Match($serial, 'P8P_EVIDENCE_BASE64_BEGIN\s*(?<b64>[A-Za-z0-9+/=]+)\s*P8P_EVIDENCE_BASE64_END', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if (-not $marker.Success -or -not $payload.Success) { throw 'complete serial evidence markers absent' }
    $archiveOut = Join-Path $Evidence 'nhm2-h2-p8p-evidence-export-v1.tgz'
    [System.IO.File]::WriteAllBytes($archiveOut, [Convert]::FromBase64String($payload.Groups['b64'].Value))
    if ((Get-Item -LiteralPath $archiveOut).Length -ne [int64]$marker.Groups['bytes'].Value) { throw 'recovered evidence byte mismatch' }
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $archiveOut).Hash.ToLowerInvariant() -ne $marker.Groups['sha'].Value) { throw 'recovered evidence hash mismatch' }

    $auditOut = Join-Path $Evidence 'p8q-audit.v1.json'
    $auditLines = & python $Auditor --archive $archiveOut --output $auditOut 2>&1
    if ($LASTEXITCODE -ne 0) { throw "frozen P8Q audit failed`n$($auditLines -join "`n")" }
    Save-Text -Path (Join-Path $Evidence 'audit.stdout.txt') -Text ($auditLines -join "`n")
    Save-Text -Path (Join-Path $Evidence 'finish.utc.txt') -Text ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
    Save-Text -Path (Join-Path $Evidence 'procedure.exit.txt') -Text '0'
}
catch {
    if (Test-Path -LiteralPath $Evidence) {
        Save-Text -Path (Join-Path $Evidence 'failure.txt') -Text $_.Exception.ToString()
        Save-Text -Path (Join-Path $Evidence 'procedure.exit.txt') -Text '1'
        Save-Text -Path (Join-Path $Evidence 'finish.utc.txt') -Text ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
    }
    if ($vmCreated -and -not $zone) {
        try {
            $cleanupRowsJson = Invoke-Gcloud -Arguments @('compute','instances','list',"--project=$Project","--filter=name=($Vm)",'--format=json')
            if (Test-Path -LiteralPath $Evidence) { Save-Text -Path (Join-Path $Evidence 'failure-cleanup-discovery.json') -Text $cleanupRowsJson }
            $cleanupRows = @($cleanupRowsJson | ConvertFrom-Json)
            if ($cleanupRows.Count -eq 1 -and $cleanupRows[0].name -eq $Vm) {
                $zone = ($cleanupRows[0].zone -split '/')[-1]
                if ($zone -notin @('us-east1-b','us-east1-c','us-east1-d')) { $zone = $null }
            }
        }
        catch {
            if (Test-Path -LiteralPath $Evidence) { Save-Text -Path (Join-Path $Evidence 'failure-cleanup-discovery-error.txt') -Text $_.Exception.ToString() }
        }
    }
    if ($vmCreated -and $zone) {
        try {
            $cleanup = Invoke-Gcloud -Arguments @('compute','instances','stop',$Vm,"--project=$Project","--zone=$zone",'--quiet')
            if (Test-Path -LiteralPath $Evidence) { Save-Text -Path (Join-Path $Evidence 'failure-stop.txt') -Text $cleanup }
        }
        catch {
            if (Test-Path -LiteralPath $Evidence) { Save-Text -Path (Join-Path $Evidence 'failure-stop-error.txt') -Text $_.Exception.ToString() }
        }
    }
    throw
}
