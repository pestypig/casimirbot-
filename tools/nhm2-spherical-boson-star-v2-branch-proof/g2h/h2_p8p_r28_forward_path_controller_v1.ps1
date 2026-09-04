[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

$Project = 'dark-stratum-455714-h4'
$Zone = 'us-east1-c'
$Vm = 'nhm2-h2-p8p-r26-c2d-32-20260903'
$VmId = '4290604153416687194'
$Archive = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r16-regional-bulk-ingress-v1-20260902\h2-p8p-r16-regional-bulk-upload-v1.tar'
$Evidence = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r28-native-openssh-execution-v1-20260903'
$Gcloud = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd'
$Config = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config'
$Ssh = 'C:\Windows\System32\OpenSSH\ssh.exe'
$Scp = 'C:\Windows\System32\OpenSSH\scp.exe'
$PrivateKey = 'C:\Users\dan\.ssh\google_compute_engine'
$PublicKey = 'C:\Users\dan\.ssh\google_compute_engine.pub'
$Auditor = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\scripts\nhm2_g2h_e_s5_c08_h2_p8p_turnaround_result_audit.py'
$ArchiveBytes = 236640768
$ArchiveSha = '3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5'
$PrivateKeySha = '37e1a9dab99f498aa6d01e335e5351088247cb307175b60ee71f9f37c88b2b95'
$PublicKeySha = 'd5035122b18833ab736834cc388af852317573913804a32d233326afd2bb5bc7'
$RuntimeCeilingSeconds = 18000
$vmStarted = $false

$env:CLOUDSDK_CONFIG = $Config
$env:CLOUDSDK_CORE_DISABLE_USAGE_REPORTING = 'true'

function Invoke-NativeChecked {
    param(
        [Parameter(Mandatory)][string]$Executable,
        [Parameter(Mandatory)][string[]]$Arguments,
        [AllowNull()][string]$InputText = $null
    )
    if ($null -eq $InputText) {
        $lines = & $Executable @Arguments 2>&1
    }
    else {
        $lines = $InputText | & $Executable @Arguments 2>&1
    }
    $code = $LASTEXITCODE
    $text = ($lines | ForEach-Object { $_.ToString() }) -join "`n"
    if ($code -ne 0) {
        throw "native command failed ($code): $Executable $($Arguments -join ' ')`n$text"
    }
    return $text
}

function Invoke-Gcloud {
    param([Parameter(Mandatory)][string[]]$Arguments)
    return Invoke-NativeChecked -Executable $Gcloud -Arguments $Arguments
}

function Save-Text {
    param([Parameter(Mandatory)][string]$Path, [AllowEmptyString()][string]$Text)
    [System.IO.File]::WriteAllText($Path, $Text + "`n", [System.Text.UTF8Encoding]::new($false))
}

try {
    foreach ($path in @($Gcloud, $Ssh, $Scp, $PrivateKey, $PublicKey, $Archive, $Auditor)) {
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "required file absent: $path" }
    }
    if ((Get-Item -LiteralPath $Archive).Length -ne $ArchiveBytes) { throw 'outer archive byte mismatch' }
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $Archive).Hash.ToLowerInvariant() -ne $ArchiveSha) { throw 'outer archive hash mismatch' }
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $PrivateKey).Hash.ToLowerInvariant() -ne $PrivateKeySha) { throw 'private key hash mismatch' }
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $PublicKey).Hash.ToLowerInvariant() -ne $PublicKeySha) { throw 'public key hash mismatch' }
    if (Test-Path -LiteralPath $Evidence) { throw 'R28 evidence root already exists' }
    New-Item -ItemType Directory -Path $Evidence | Out-Null
    $KnownHosts = Join-Path $Evidence 'known_hosts.r28'
    $KnownHostsOpenSsh = $KnownHosts.Replace('\', '/')
    if ($KnownHostsOpenSsh -notmatch '^[A-Za-z]:/') { throw 'forward-slash known_hosts path grammar mismatch' }
    if (Test-Path -LiteralPath $KnownHosts) { throw 'dedicated known_hosts already exists' }
    Save-Text -Path (Join-Path $Evidence 'start.utc.txt') -Text ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))

    $account = (Invoke-Gcloud -Arguments @('auth','list','--filter=status:ACTIVE','--format=value(account)')).Trim()
    $projectValue = (Invoke-Gcloud -Arguments @('config','get-value','core/project')).Trim()
    if ($account -ne 'pestypig@gmail.com') { throw 'active account mismatch' }
    if ($projectValue -ne $Project) { throw 'dedicated project mismatch' }
    Save-Text -Path (Join-Path $Evidence 'account.txt') -Text $account
    Save-Text -Path (Join-Path $Evidence 'project.txt') -Text $projectValue

    $projectJson = Invoke-Gcloud -Arguments @('compute','project-info','describe',"--project=$Project",'--format=json')
    Save-Text -Path (Join-Path $Evidence 'project.pre.json') -Text $projectJson
    $projectObject = $projectJson | ConvertFrom-Json
    $sshItems = @($projectObject.commonInstanceMetadata.items | Where-Object { $_.key -eq 'ssh-keys' })
    if ($sshItems.Count -ne 1) { throw 'project ssh-keys metadata cardinality mismatch' }
    $public = (Get-Content -LiteralPath $PublicKey -Raw).Trim()
    $keyMatches = @($sshItems[0].value -split "`n" | Where-Object { $_.StartsWith("dan:$public") })
    if ($keyMatches.Count -ne 1) { throw 'exact dan public key not bound once in project metadata' }

    $preJson = Invoke-Gcloud -Arguments @('compute','instances','describe',$Vm,"--project=$Project","--zone=$Zone",'--format=json')
    Save-Text -Path (Join-Path $Evidence 'instance.pre.json') -Text $preJson
    $pre = $preJson | ConvertFrom-Json
    if ([string]$pre.id -ne $VmId -or $pre.name -ne $Vm -or $pre.status -ne 'TERMINATED') { throw 'retained VM identity/status mismatch' }
    if (-not $pre.machineType.EndsWith('/machineTypes/c2d-standard-32')) { throw 'machine mismatch' }
    if (@($pre.disks).Count -ne 1) { throw 'disk count mismatch' }
    if ([string]$pre.scheduling.maxRunDuration.seconds -ne '18000' -or $pre.scheduling.instanceTerminationAction -ne 'STOP') { throw 'provider stop binding mismatch' }
    $disk = ($pre.disks[0].source -split '/')[-1]
    $diskJson = Invoke-Gcloud -Arguments @('compute','disks','describe',$disk,"--project=$Project","--zone=$Zone",'--format=json')
    Save-Text -Path (Join-Path $Evidence 'disk.pre.json') -Text $diskJson
    $diskObject = $diskJson | ConvertFrom-Json
    if ([int]$diskObject.sizeGb -ne 30 -or -not $diskObject.type.EndsWith('/diskTypes/pd-standard')) { throw 'disk binding mismatch' }
    if (-not $diskObject.sourceImage.EndsWith('/images/debian-12-bookworm-v20260817')) { throw 'image binding mismatch' }
    Save-Text -Path (Join-Path $Evidence 'preexecution.pass.txt') -Text 'R28_PREEXECUTION_PASS'

    $startText = Invoke-Gcloud -Arguments @('compute','instances','start',$Vm,"--project=$Project","--zone=$Zone",'--quiet')
    $vmStarted = $true
    Save-Text -Path (Join-Path $Evidence 'start-vm.txt') -Text $startText
    Start-Sleep -Seconds 180

    $runningJson = Invoke-Gcloud -Arguments @('compute','instances','describe',$Vm,"--project=$Project","--zone=$Zone",'--format=json')
    Save-Text -Path (Join-Path $Evidence 'instance.running.json') -Text $runningJson
    $running = $runningJson | ConvertFrom-Json
    if ([string]$running.id -ne $VmId -or $running.status -ne 'RUNNING') { throw 'exact retained VM not running' }
    $nat = @($running.networkInterfaces | ForEach-Object { $_.accessConfigs } | Where-Object { $_.natIP })
    if ($nat.Count -ne 1) { throw 'external IP cardinality mismatch' }
    $ip = [string]$nat[0].natIP
    if ($ip -notmatch '^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$') { throw 'external IP grammar mismatch' }
    Save-Text -Path (Join-Path $Evidence 'external-ip.txt') -Text $ip

    $sshCommon = @('-i',$PrivateKey,'-o','BatchMode=yes','-o','IdentitiesOnly=yes','-o',"UserKnownHostsFile=$KnownHostsOpenSsh",'-o','ConnectTimeout=30')
    $remoteArchive = '/home/dan/h2-p8p-r28-upload-v1.tar'
    $scpArgs = @('-i',$PrivateKey,'-o','BatchMode=yes','-o','IdentitiesOnly=yes','-o',"UserKnownHostsFile=$KnownHostsOpenSsh",'-o','StrictHostKeyChecking=accept-new','-o','ConnectTimeout=30',$Archive,"dan@${ip}:$remoteArchive")
    $scpText = Invoke-NativeChecked -Executable $Scp -Arguments $scpArgs
    Save-Text -Path (Join-Path $Evidence 'scp.txt') -Text $scpText
    if (-not (Test-Path -LiteralPath $KnownHosts -PathType Leaf)) { throw 'dedicated known_hosts was not created' }
    Save-Text -Path (Join-Path $Evidence 'known-hosts.sha256.txt') -Text ((Get-FileHash -Algorithm SHA256 -LiteralPath $KnownHosts).Hash.ToLowerInvariant())

    $remoteSetup = @'
set -Eeuo pipefail
ARCHIVE=/home/dan/h2-p8p-r28-upload-v1.tar
STAGE=/home/dan/nhm2-h2-p8p-r28-ingress-v1
[[ "$(id -un)" == dan ]]
getent passwd pestypig >/dev/null
PGROUP="$(id -gn pestypig)"
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
for target in h2-p8f-c2-r1-cloud-upload-v1.tar h2-p8p-overlay-upload-v1.tar h2_p8p_r2_browser_guest_sequence_v1.sh; do
  [[ ! -e "/home/pestypig/$target" ]]
done
sudo install -o pestypig -g "$PGROUP" -m 0600 "$STAGE/h2-p8f-c2-r1-cloud-upload-v1.tar" /home/pestypig/h2-p8f-c2-r1-cloud-upload-v1.tar
sudo install -o pestypig -g "$PGROUP" -m 0600 "$STAGE/h2-p8p-overlay-upload-v1.tar" /home/pestypig/h2-p8p-overlay-upload-v1.tar
sudo install -o pestypig -g "$PGROUP" -m 0700 "$STAGE/h2_p8p_r2_browser_guest_sequence_v1.sh" /home/pestypig/h2_p8p_r2_browser_guest_sequence_v1.sh
sudo tee /etc/systemd/system/nhm2-h2-p8p-r28.service >/dev/null <<'UNIT'
[Unit]
Description=NHM2 candidate-neutral H2 P8P R28 turnaround calibration
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
sudo systemctl start --no-block nhm2-h2-p8p-r28.service
sleep 5
sudo systemctl is-active --quiet nhm2-h2-p8p-r28.service
printf 'R28_REMOTE_CONTROLLER_ACTIVE\n'
'@
    $sshArgs = $sshCommon + @('-o','StrictHostKeyChecking=yes',"dan@$ip",'bash -s')
    $sshText = Invoke-NativeChecked -Executable $Ssh -Arguments $sshArgs -InputText $remoteSetup
    if ($sshText -notmatch 'R28_REMOTE_CONTROLLER_ACTIVE') { throw 'remote controller active marker absent' }
    Save-Text -Path (Join-Path $Evidence 'ssh-handoff.txt') -Text $sshText

    $deadline = [DateTime]::UtcNow.AddSeconds($RuntimeCeilingSeconds)
    do {
        Start-Sleep -Seconds 60
        $status = (Invoke-Gcloud -Arguments @('compute','instances','describe',$Vm,"--project=$Project","--zone=$Zone",'--format=value(status)')).Trim()
        Save-Text -Path (Join-Path $Evidence 'last-status.txt') -Text $status
    } while ($status -ne 'TERMINATED' -and [DateTime]::UtcNow -lt $deadline)
    if ($status -ne 'TERMINATED') {
        $stopText = Invoke-Gcloud -Arguments @('compute','instances','stop',$Vm,"--project=$Project","--zone=$Zone",'--quiet')
        Save-Text -Path (Join-Path $Evidence 'ceiling-stop.txt') -Text $stopText
        throw 'aggregate runtime ceiling reached before automatic stop'
    }

    $serial = Invoke-Gcloud -Arguments @('compute','instances','get-serial-port-output',$Vm,"--project=$Project","--zone=$Zone",'--port=1','--start=0')
    Save-Text -Path (Join-Path $Evidence 'serial-port-1.txt') -Text $serial
    $marker = [regex]::Match($serial, 'P8P_EVIDENCE bytes=(?<bytes>[0-9]+) sha256=(?<sha>[0-9a-f]{64})')
    $payload = [regex]::Match($serial, 'P8P_EVIDENCE_BASE64_BEGIN\s*(?<b64>[A-Za-z0-9+/=]+)\s*P8P_EVIDENCE_BASE64_END', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if (-not $marker.Success -or -not $payload.Success) { throw 'complete serial evidence markers absent' }
    $archiveOut = Join-Path $Evidence 'nhm2-h2-p8p-evidence-export-v1.tgz'
    [System.IO.File]::WriteAllBytes($archiveOut, [Convert]::FromBase64String($payload.Groups['b64'].Value))
    if ((Get-Item -LiteralPath $archiveOut).Length -ne [int64]$marker.Groups['bytes'].Value) { throw 'recovered evidence byte mismatch' }
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $archiveOut).Hash.ToLowerInvariant() -ne $marker.Groups['sha'].Value) { throw 'recovered evidence hash mismatch' }

    $auditOut = Join-Path $Evidence 'p8q-audit.v1.json'
    $auditText = Invoke-NativeChecked -Executable 'python' -Arguments @($Auditor,'--archive',$archiveOut,'--output',$auditOut)
    Save-Text -Path (Join-Path $Evidence 'audit.stdout.txt') -Text $auditText
    Save-Text -Path (Join-Path $Evidence 'finish.utc.txt') -Text ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
    Save-Text -Path (Join-Path $Evidence 'procedure.exit.txt') -Text '0'
}
catch {
    if (Test-Path -LiteralPath $Evidence) {
        Save-Text -Path (Join-Path $Evidence 'failure.txt') -Text $_.Exception.ToString()
        Save-Text -Path (Join-Path $Evidence 'procedure.exit.txt') -Text '1'
        Save-Text -Path (Join-Path $Evidence 'finish.utc.txt') -Text ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
    }
    if ($vmStarted) {
        try {
            $cleanup = Invoke-Gcloud -Arguments @('compute','instances','stop',$Vm,"--project=$Project","--zone=$Zone",'--quiet')
            if (Test-Path -LiteralPath $Evidence) { Save-Text -Path (Join-Path $Evidence 'failure-stop.txt') -Text $cleanup }
        }
        catch {
            if (Test-Path -LiteralPath $Evidence) { Save-Text -Path (Join-Path $Evidence 'failure-stop-error.txt') -Text $_.Exception.ToString() }
        }
    }
    throw
}
