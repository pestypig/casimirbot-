[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$Project = 'dark-stratum-455714-h4'
$Zone = 'us-east1-b'
$SourceVm = 'nhm2-h2-p8p-r32-e2-4-20260904'
$SourceVmId = '1893159507643031574'
$SourceDisk = 'nhm2-h2-p8p-r32-e2-4-20260904'
$SourceDiskId = '1129594698432208918'
$Snapshot = 'nhm2-h2-p8p-r39-evidence-snapshot-20260904'
$Clone = 'nhm2-h2-p8p-r39-evidence-clone-20260904'
$Helper = 'nhm2-h2-p8p-r39-rescue-e2-small-20260904'
$Device = 'nhm2-h2-p8p-r39-evidence-clone'
$Image = 'projects/debian-cloud/global/images/debian-12-bookworm-v20260817'
$Root = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot'
$Procedure = Join-Path $Root 'tools\nhm2-spherical-boson-star-v2-branch-proof\g2h\h2_p8p_r40_stopped_disk_fixture_evidence_v1.sh'
$RemoteProcedure = '/home/pestypig/h2_p8p_r40_stopped_disk_fixture_evidence_v1.sh'
$RemoteArchive = '/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz'
$Evidence = Join-Path $Root 'artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r40-stopped-disk-fixture-evidence-v1-20260904'
$LocalArchive = Join-Path $Evidence 'nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz'
$Gcloud = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd'
$Config = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config'
$helperCreated = $false
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

try {
    if (Test-Path -LiteralPath $Evidence) { throw 'R40 evidence root already exists' }
    New-Item -ItemType Directory -Path $Evidence | Out-Null
    Save-Text (Join-Path $Evidence 'start.utc.txt') ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
    if (-not (Test-Path -LiteralPath $Gcloud -PathType Leaf)) { throw 'gcloud absent' }
    if (-not (Test-Path -LiteralPath $Procedure -PathType Leaf)) { throw 'rescue procedure absent' }
    if ((Get-Item -LiteralPath $Procedure).Length -ne 3553) { throw 'rescue procedure byte mismatch' }
    if ((Get-FileHash -LiteralPath $Procedure -Algorithm SHA256).Hash.ToLowerInvariant() -ne '696a99570a4c213940f0580d3d654ca6414386e8daf7d780a24c97fc23d380ba') { throw 'rescue procedure hash mismatch' }
    if (Test-Path -LiteralPath $LocalArchive) { throw 'local archive already exists' }

    $account = (Invoke-Gcloud @('auth','list','--filter=status:ACTIVE','--format=value(account)')).Trim()
    $projectValue = (Invoke-Gcloud @('config','get-value','core/project')).Trim()
    if ($account -ne 'pestypig@gmail.com' -or $projectValue -ne $Project) { throw 'account/project mismatch' }
    $sourceVmJson = Invoke-Gcloud @('compute','instances','describe',$SourceVm,"--project=$Project","--zone=$Zone",'--format=json')
    Save-Text (Join-Path $Evidence 'source-vm.before.json') $sourceVmJson
    $sourceVmObject = $sourceVmJson | ConvertFrom-Json
    if ([string]$sourceVmObject.id -ne $SourceVmId -or $sourceVmObject.status -ne 'TERMINATED') { throw 'source VM identity/status mismatch' }
    $sourceDiskJson = Invoke-Gcloud @('compute','disks','describe',$SourceDisk,"--project=$Project","--zone=$Zone",'--format=json')
    Save-Text (Join-Path $Evidence 'source-disk.before.json') $sourceDiskJson
    $sourceDiskObject = $sourceDiskJson | ConvertFrom-Json
    if ([string]$sourceDiskObject.id -ne $SourceDiskId -or $sourceDiskObject.status -ne 'READY' -or [int]$sourceDiskObject.sizeGb -ne 30) { throw 'source disk identity/status mismatch' }
    if (-not $sourceDiskObject.type.EndsWith('/diskTypes/pd-standard') -or -not $sourceDiskObject.sourceImage.EndsWith('/images/debian-12-bookworm-v20260817')) { throw 'source disk type/image mismatch' }
    if (@($sourceDiskObject.users).Count -ne 1 -or -not $sourceDiskObject.users[0].EndsWith("/instances/$SourceVm")) { throw 'source disk attachment mismatch' }

    $existingSnapshot = (Invoke-Gcloud @('compute','snapshots','list',"--project=$Project","--filter=name=($Snapshot)",'--format=value(name)')).Trim()
    $existingClone = (Invoke-Gcloud @('compute','disks','list',"--project=$Project","--filter=name=($Clone)",'--format=value(name)')).Trim()
    $existingHelper = (Invoke-Gcloud @('compute','instances','list',"--project=$Project","--filter=name=($Helper)",'--format=value(name)')).Trim()
    if ($existingSnapshot -or $existingClone -or $existingHelper) { throw 'R40 derivative resource already exists' }

    $snapshotCreate = Invoke-Gcloud @('compute','snapshots','create',$Snapshot,"--project=$Project","--source-disk=$SourceDisk","--source-disk-zone=$Zone",'--snapshot-type=STANDARD','--quiet')
    Save-Text (Join-Path $Evidence 'snapshot-create.txt') $snapshotCreate
    $cloneCreate = Invoke-Gcloud @('compute','disks','create',$Clone,"--project=$Project","--zone=$Zone","--source-snapshot=$Snapshot",'--type=pd-standard','--size=30GB','--quiet')
    Save-Text (Join-Path $Evidence 'clone-create.txt') $cloneCreate
    $helperCreate = Invoke-Gcloud @('compute','instances','create',$Helper,"--project=$Project","--zone=$Zone",'--machine-type=e2-small',"--image=$Image",'--boot-disk-size=10GB','--boot-disk-type=pd-standard','--boot-disk-auto-delete','--quiet')
    $helperCreated = $true
    Save-Text (Join-Path $Evidence 'helper-create.txt') $helperCreate
    Start-Sleep -Seconds 120

    $procedureScp = Invoke-Gcloud @('compute','scp',$Procedure,"pestypig@${Helper}:$RemoteProcedure","--project=$Project","--zone=$Zone",'--quiet')
    Save-Text (Join-Path $Evidence 'procedure.scp.txt') $procedureScp
    $attach = Invoke-Gcloud @('compute','instances','attach-disk',$Helper,"--project=$Project","--zone=$Zone","--disk=$Clone","--device-name=$Device",'--mode=ro','--quiet')
    Save-Text (Join-Path $Evidence 'attach.txt') $attach
    Start-Sleep -Seconds 30
    $rescue = Invoke-Gcloud @('compute','ssh',"pestypig@$Helper","--project=$Project","--zone=$Zone",'--quiet',"--command=sudo bash $RemoteProcedure")
    Save-Text (Join-Path $Evidence 'rescue.stdout.txt') $rescue
    $match = [regex]::Match($rescue, 'P8P_R40_EVIDENCE_READY bytes=(?<bytes>[0-9]+) sha256=(?<sha>[0-9a-f]{64})')
    if (-not $match.Success) { throw 'R40 evidence marker absent' }
    $expectedBytes = [int64]$match.Groups['bytes'].Value
    $expectedHash = $match.Groups['sha'].Value
    $archiveScp = Invoke-Gcloud @('compute','scp',"pestypig@${Helper}:$RemoteArchive",$LocalArchive,"--project=$Project","--zone=$Zone",'--quiet')
    Save-Text (Join-Path $Evidence 'archive.scp.txt') $archiveScp
    if (-not (Test-Path -LiteralPath $LocalArchive -PathType Leaf)) { throw 'local evidence archive absent' }
    if ((Get-Item -LiteralPath $LocalArchive).Length -ne $expectedBytes) { throw 'local evidence archive byte mismatch' }
    if ((Get-FileHash -LiteralPath $LocalArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedHash) { throw 'local evidence archive hash mismatch' }
    Save-Text (Join-Path $Evidence 'archive.bytes.txt') ([string]$expectedBytes)
    Save-Text (Join-Path $Evidence 'archive.sha256.txt') $expectedHash
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
    if ($helperCreated) {
        try {
            $status = (Invoke-Gcloud @('compute','instances','describe',$Helper,"--project=$Project","--zone=$Zone",'--format=value(status)')).Trim()
            if ($status -ne 'TERMINATED') {
                $stop = Invoke-Gcloud @('compute','instances','stop',$Helper,"--project=$Project","--zone=$Zone",'--quiet')
                Save-Text (Join-Path $Evidence 'helper-stop.txt') $stop
            }
        }
        catch { Save-Text (Join-Path $Evidence 'helper-stop.failure.txt') $_.Exception.ToString() }
    }
    if (Test-Path -LiteralPath $Evidence) { Save-Text (Join-Path $Evidence 'finish.utc.txt') ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')) }
}
