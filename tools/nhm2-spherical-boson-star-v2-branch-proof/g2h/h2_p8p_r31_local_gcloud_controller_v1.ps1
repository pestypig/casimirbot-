[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$Project = 'dark-stratum-455714-h4'
$Zone = 'us-east1-c'
$Vm = 'nhm2-h2-p8p-r26-c2d-32-20260903'
$VmId = '4290604153416687194'
$Disk = 'nhm2-h2-p8p-r26-c2d-32-20260903'
$DiskId = '8031354852430290522'
$Root = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot'
$Packet = Join-Path $Root 'docs\research\nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r31-local-image-binding-fixture.md'
$Fixture = Join-Path $Root 'tools\nhm2-spherical-boson-star-v2-branch-proof\g2h\h2_p8p_r31_local_image_binding_fixture_v1.sh'
$Guest = Join-Path $Root 'tools\nhm2-spherical-boson-star-v2-branch-proof\g2h\h2_p8p_r31_clean_daemon_guest_v1.sh'
$Evidence = Join-Path $Root 'artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r31-cloud-fixture-execution-v1-20260904'
$Gcloud = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd'
$Config = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config'
$started = $false

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

function Require-Hash {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$Expected)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "required file absent: $Path" }
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
    if ($actual -ne $Expected) { throw "hash mismatch: $Path" }
}

try {
    if (Test-Path -LiteralPath $Evidence) { throw 'R31 local evidence root already exists' }
    New-Item -ItemType Directory -Path $Evidence | Out-Null
    Save-Text (Join-Path $Evidence 'start.utc.txt') ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
    Require-Hash $Packet '37f84cc86837d2e1aa346587d8a744629479d388cce7be6bb1f74454fc55da9d'
    Require-Hash $Fixture '97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79'
    Require-Hash $Guest 'cbb2b99cc3242861dbc3e4eec1caaa81c64a640b89a5ed8f4d95b2293cbe8441'
    if ((Get-Item -LiteralPath $Fixture).Length -ne 4024) { throw 'fixture byte mismatch' }
    if ((Get-Item -LiteralPath $Guest).Length -ne 2905) { throw 'guest byte mismatch' }

    $account = (Invoke-Gcloud @('auth','list','--filter=status:ACTIVE','--format=value(account)')).Trim()
    $projectValue = (Invoke-Gcloud @('config','get-value','core/project')).Trim()
    if ($account -ne 'pestypig@gmail.com' -or $projectValue -ne $Project) { throw 'account/project mismatch' }

    $instanceJson = Invoke-Gcloud @('compute','instances','describe',$Vm,"--project=$Project","--zone=$Zone",'--format=json')
    Save-Text (Join-Path $Evidence 'instance.pre.json') $instanceJson
    $instance = $instanceJson | ConvertFrom-Json
    if ([string]$instance.id -ne $VmId -or $instance.status -ne 'TERMINATED') { throw 'instance identity/status mismatch' }
    if (-not $instance.machineType.EndsWith('/machineTypes/c2d-standard-32')) { throw 'machine type mismatch' }
    if (@($instance.disks).Count -ne 1 -or -not $instance.disks[0].source.EndsWith("/disks/$Disk")) { throw 'attached disk mismatch' }
    if ($instance.disks[0].mode -ne 'READ_WRITE' -or [int]$instance.disks[0].diskSizeGb -ne 30) { throw 'attached disk mode/size mismatch' }

    $diskJson = Invoke-Gcloud @('compute','disks','describe',$Disk,"--project=$Project","--zone=$Zone",'--format=json')
    Save-Text (Join-Path $Evidence 'disk.pre.json') $diskJson
    $diskObject = $diskJson | ConvertFrom-Json
    if ([string]$diskObject.id -ne $DiskId -or $diskObject.status -ne 'READY') { throw 'disk identity/status mismatch' }
    if ([int]$diskObject.sizeGb -ne 30 -or -not $diskObject.type.EndsWith('/diskTypes/pd-standard')) { throw 'disk shape mismatch' }
    Save-Text (Join-Path $Evidence 'preexecution.pass.txt') 'R31_PREEXECUTION_PASS'

    $startText = Invoke-Gcloud @('compute','instances','start',$Vm,"--project=$Project","--zone=$Zone",'--quiet')
    $started = $true
    Save-Text (Join-Path $Evidence 'start.txt') $startText
    Start-Sleep -Seconds 180

    $running = (Invoke-Gcloud @('compute','instances','describe',$Vm,"--project=$Project","--zone=$Zone",'--format=value(status)')).Trim()
    if ($running -ne 'RUNNING') { throw 'instance did not reach RUNNING' }

    $scpUpload = Invoke-Gcloud @('compute','scp',$Fixture,$Guest,"dan@${Vm}:/home/dan/","--project=$Project","--zone=$Zone",'--quiet')
    Save-Text (Join-Path $Evidence 'upload.scp.txt') $scpUpload

    $remote = "set +e; bash /home/dan/h2_p8p_r31_clean_daemon_guest_v1.sh; rc=`$?; printf 'R31_REMOTE_EXIT=%s\n' `"`$rc`"; exit 0"
    $sshText = Invoke-Gcloud @('compute','ssh',"dan@$Vm","--project=$Project","--zone=$Zone",'--quiet',"--command=$remote")
    Save-Text (Join-Path $Evidence 'guest.stdout.txt') $sshText
    $match = [regex]::Match($sshText, 'R31_REMOTE_EXIT=(?<exit>[0-9]+)')
    if (-not $match.Success) { throw 'remote exit marker absent' }

    $remoteExit = [int]$match.Groups['exit'].Value
    $archive = Join-Path $Evidence 'nhm2-h2-p8p-r31-evidence-export-v1.tgz'
    if ($sshText -match 'R31_EVIDENCE bytes=[0-9]+ sha256=[0-9a-f]{64}') {
        $scpDownload = Invoke-Gcloud @('compute','scp',"dan@${Vm}:/home/dan/nhm2-h2-p8p-r31-evidence-export-v1.tgz",$archive,"--project=$Project","--zone=$Zone",'--quiet')
        Save-Text (Join-Path $Evidence 'download.scp.txt') $scpDownload
        $evidenceMatch = [regex]::Match($sshText, 'R31_EVIDENCE bytes=(?<bytes>[0-9]+) sha256=(?<sha>[0-9a-f]{64})')
        if ((Get-Item -LiteralPath $archive).Length -ne [int64]$evidenceMatch.Groups['bytes'].Value) { throw 'evidence byte mismatch' }
        if ((Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant() -ne $evidenceMatch.Groups['sha'].Value) { throw 'evidence hash mismatch' }
    }
    Save-Text (Join-Path $Evidence 'remote.exit.txt') ([string]$remoteExit)
    if ($remoteExit -ne 0) { throw "R31 fixture terminal failure exit=$remoteExit" }
    if ($sshText -notmatch 'R31_GUEST_PASS') { throw 'R31 guest PASS marker absent' }
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
            $stopText = Invoke-Gcloud @('compute','instances','stop',$Vm,"--project=$Project","--zone=$Zone",'--quiet')
            Save-Text (Join-Path $Evidence 'stop.txt') $stopText
        }
        catch {
            Save-Text (Join-Path $Evidence 'stop.failure.txt') $_.Exception.ToString()
        }
    }
    if (Test-Path -LiteralPath $Evidence) {
        Save-Text (Join-Path $Evidence 'finish.utc.txt') ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
    }
}
