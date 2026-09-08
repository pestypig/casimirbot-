[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$Project = 'dark-stratum-455714-h4'
$Zone = 'us-east1-b'
$SourceVm = 'nhm2-h2-p8p-r32-e2-4-20260904'
$SourceVmId = '1893159507643031574'
$Helper = 'nhm2-h2-p8p-r39-rescue-e2-small-20260904'
$HelperId = '7129462452423922626'
$Clone = 'nhm2-h2-p8p-r39-evidence-clone-20260904'
$RemoteArchive = '/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz'
$ShortRoot = 'C:\NHM2-R41'
$ShortArchive = 'C:\NHM2-R41\r40.tgz'
$Root = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot'
$R40Evidence = Join-Path $Root 'artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r40-stopped-disk-fixture-evidence-v1-20260904'
$PreservedArchive = Join-Path $R40Evidence 'nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz'
$Evidence = Join-Path $Root 'artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r41-short-path-retrieval-v1-20260904'
$Gcloud = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd'
$Config = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config'
$helperStarted = $false
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
    if (Test-Path -LiteralPath $Evidence) { throw 'R41 evidence root already exists' }
    if (Test-Path -LiteralPath $ShortRoot) { throw 'R41 short root already exists' }
    if (Test-Path -LiteralPath $PreservedArchive) { throw 'R40 preserved archive already exists' }
    New-Item -ItemType Directory -Path $Evidence | Out-Null
    New-Item -ItemType Directory -Path $ShortRoot | Out-Null
    Save-Text (Join-Path $Evidence 'start.utc.txt') ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
    if (-not (Test-Path -LiteralPath $Gcloud -PathType Leaf)) { throw 'gcloud absent' }
    $r40Receipt = Join-Path $R40Evidence 'rescue.stdout.txt'
    if (-not (Test-Path -LiteralPath $r40Receipt -PathType Leaf)) { throw 'R40 rescue receipt absent' }
    if ((Get-FileHash -LiteralPath $r40Receipt -Algorithm SHA256).Hash.ToLowerInvariant() -ne '6c61247fe3422324d832d9006ae2e084c3340286cc7435054045b4d99f4d4c18') { throw 'R40 rescue receipt drift' }

    $account = (Invoke-Gcloud @('auth','list','--filter=status:ACTIVE','--format=value(account)')).Trim()
    $projectValue = (Invoke-Gcloud @('config','get-value','core/project')).Trim()
    if ($account -ne 'pestypig@gmail.com' -or $projectValue -ne $Project) { throw 'account/project mismatch' }
    $sourceJson = Invoke-Gcloud @('compute','instances','describe',$SourceVm,"--project=$Project","--zone=$Zone",'--format=json')
    Save-Text (Join-Path $Evidence 'source-vm.before.json') $sourceJson
    $source = $sourceJson | ConvertFrom-Json
    if ([string]$source.id -ne $SourceVmId -or $source.status -ne 'TERMINATED') { throw 'source VM identity/status mismatch' }
    $helperJson = Invoke-Gcloud @('compute','instances','describe',$Helper,"--project=$Project","--zone=$Zone",'--format=json')
    Save-Text (Join-Path $Evidence 'helper.before.json') $helperJson
    $helperObject = $helperJson | ConvertFrom-Json
    if ([string]$helperObject.id -ne $HelperId -or $helperObject.status -ne 'TERMINATED') { throw 'helper identity/status mismatch' }
    if (-not $helperObject.machineType.EndsWith('/machineTypes/e2-small') -or @($helperObject.disks).Count -ne 2) { throw 'helper machine/disk count mismatch' }
    $cloneDisk = @($helperObject.disks | Where-Object { $_.deviceName -eq 'nhm2-h2-p8p-r39-evidence-clone' })
    if ($cloneDisk.Count -ne 1 -or $cloneDisk[0].mode -ne 'READ_ONLY' -or -not $cloneDisk[0].source.EndsWith("/disks/$Clone")) { throw 'read-only clone attachment mismatch' }

    $start = Invoke-Gcloud @('compute','instances','start',$Helper,"--project=$Project","--zone=$Zone",'--quiet')
    $helperStarted = $true
    Save-Text (Join-Path $Evidence 'helper-start.txt') $start
    Start-Sleep -Seconds 120
    $scp = Invoke-Gcloud @('compute','scp',"pestypig@${Helper}:$RemoteArchive",$ShortArchive,"--project=$Project","--zone=$Zone",'--quiet')
    Save-Text (Join-Path $Evidence 'archive.scp.txt') $scp
    if (-not (Test-Path -LiteralPath $ShortArchive -PathType Leaf)) { throw 'short-path archive absent' }
    if ((Get-Item -LiteralPath $ShortArchive).Length -ne 12122) { throw 'short-path archive byte mismatch' }
    if ((Get-FileHash -LiteralPath $ShortArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne '73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922') { throw 'short-path archive hash mismatch' }
    Copy-Item -LiteralPath $ShortArchive -Destination $PreservedArchive
    if ((Get-Item -LiteralPath $PreservedArchive).Length -ne 12122) { throw 'preserved archive byte mismatch' }
    if ((Get-FileHash -LiteralPath $PreservedArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne '73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922') { throw 'preserved archive hash mismatch' }
    Save-Text (Join-Path $Evidence 'archive.bytes.txt') '12122'
    Save-Text (Join-Path $Evidence 'archive.sha256.txt') '73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922'
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
    if ($helperStarted) {
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
