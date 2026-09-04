[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

$Project = 'dark-stratum-455714-h4'
$Zone = 'us-east1-b'
$Vm = 'nhm2-h2-p8p-r32-e2-4-20260904'
$Root = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot'
$Packet = Join-Path $Root 'docs\research\nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r32-fresh-vm-binding-fixture-proposal.md'
$Archive = Join-Path $Root 'artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r16-regional-bulk-ingress-v1-20260902\h2-p8p-r16-regional-bulk-upload-v1.tar'
$Fixture = Join-Path $Root 'tools\nhm2-spherical-boson-star-v2-branch-proof\g2h\h2_p8p_r31_local_image_binding_fixture_v1.sh'
$Guest = Join-Path $Root 'tools\nhm2-spherical-boson-star-v2-branch-proof\g2h\h2_p8p_r32_fresh_vm_binding_guest_v1.sh'
$Evidence = Join-Path $Root 'artifacts\nhm2\g2h-e-s5\candidate-neutral\h2-p8p-r32-cloud-fixture-execution-v1-20260904'
$Gcloud = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd'
$Config = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config'
$created = $false

$env:CLOUDSDK_CONFIG = $Config
$env:CLOUDSDK_CORE_DISABLE_USAGE_REPORTING = 'true'

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

function Save-Text {
    param([Parameter(Mandatory)][string]$Path, [AllowEmptyString()][string]$Text)
    [System.IO.File]::WriteAllText($Path, $Text + "`n", [System.Text.UTF8Encoding]::new($false))
}

function Require-File {
    param([string]$Path, [int64]$Bytes, [string]$Sha)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "file absent: $Path" }
    if ((Get-Item -LiteralPath $Path).Length -ne $Bytes) { throw "byte mismatch: $Path" }
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant() -ne $Sha) { throw "hash mismatch: $Path" }
}

try {
    if (Test-Path -LiteralPath $Evidence) { throw 'R32 evidence root already exists' }
    New-Item -ItemType Directory -Path $Evidence | Out-Null
    Save-Text (Join-Path $Evidence 'start.utc.txt') ([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))
    Require-File $Packet 3153 '40ec0f70d9f1786cfe5cd6b8f9e7a6d3992b9035324655024878d14a75f6afaa'
    Require-File $Archive 236640768 '3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5'
    Require-File $Fixture 4024 '97c0209284fa67ee33e259a75abfef7947f1f8ce8971af3e7f39a3421ce07c79'
    Require-File $Guest 3129 'f66d2f72649c36f88c3e03134150967aadfba639f59781facfaa3ed6ccde9a19'

    $account = (Invoke-Gcloud @('auth','list','--filter=status:ACTIVE','--format=value(account)')).Trim()
    $projectValue = (Invoke-Gcloud @('config','get-value','core/project')).Trim()
    if ($account -ne 'pestypig@gmail.com' -or $projectValue -ne $Project) { throw 'account/project mismatch' }
    $pre = Invoke-Gcloud @('compute','instances','list',"--project=$Project","--filter=name=($Vm)",'--format=json')
    Save-Text (Join-Path $Evidence 'instance-absence.json') $pre
    if (@($pre | ConvertFrom-Json).Count -ne 0) { throw 'R32 VM already exists' }
    $diskPre = Invoke-Gcloud @('compute','disks','list',"--project=$Project","--filter=name=($Vm)",'--format=json')
    Save-Text (Join-Path $Evidence 'disk-absence.json') $diskPre
    if (@($diskPre | ConvertFrom-Json).Count -ne 0) { throw 'R32 disk already exists' }
    Save-Text (Join-Path $Evidence 'preexecution.pass.txt') 'R32_PREEXECUTION_PASS'

    $create = Invoke-Gcloud @(
        'compute','instances','create',$Vm,"--project=$Project","--zone=$Zone",
        '--machine-type=e2-standard-4','--provisioning-model=STANDARD',
        '--image=projects/debian-cloud/global/images/debian-12-bookworm-v20260817',
        '--boot-disk-size=30GB','--boot-disk-type=pd-standard','--boot-disk-auto-delete',
        '--max-run-duration=3600s','--instance-termination-action=STOP','--no-restart-on-failure','--format=json'
    )
    $created = $true
    Save-Text (Join-Path $Evidence 'create.json') $create
    $instanceJson = Invoke-Gcloud @('compute','instances','describe',$Vm,"--project=$Project","--zone=$Zone",'--format=json')
    Save-Text (Join-Path $Evidence 'instance.running.json') $instanceJson
    $instance = $instanceJson | ConvertFrom-Json
    if ($instance.status -ne 'RUNNING' -or -not $instance.machineType.EndsWith('/machineTypes/e2-standard-4')) { throw 'running instance mismatch' }
    if (@($instance.disks).Count -ne 1 -or [int]$instance.disks[0].diskSizeGb -ne 30) { throw 'attached disk mismatch' }

    Start-Sleep -Seconds 120
    $upload = Invoke-Gcloud @('compute','scp',$Archive,$Fixture,$Guest,"pestypig@${Vm}:/home/pestypig/","--project=$Project","--zone=$Zone",'--quiet')
    Save-Text (Join-Path $Evidence 'upload.scp.txt') $upload
    $ssh = Invoke-GcloudObserved @('compute','ssh',"pestypig@$Vm","--project=$Project","--zone=$Zone",'--quiet','--command=bash /home/pestypig/h2_p8p_r32_fresh_vm_binding_guest_v1.sh')
    Save-Text (Join-Path $Evidence 'ssh.stdout.txt') $ssh.Text
    Save-Text (Join-Path $Evidence 'ssh.exit.txt') ([string]$ssh.ExitCode)

    $deadline = [DateTime]::UtcNow.AddSeconds(3600)
    do {
        Start-Sleep -Seconds 30
        $status = (Invoke-Gcloud @('compute','instances','describe',$Vm,"--project=$Project","--zone=$Zone",'--format=value(status)')).Trim()
        Save-Text (Join-Path $Evidence 'last-status.txt') $status
    } while ($status -ne 'TERMINATED' -and [DateTime]::UtcNow -lt $deadline)
    if ($status -ne 'TERMINATED') { throw 'R32 runtime ceiling reached before automatic stop' }

    $serial = Invoke-Gcloud @('compute','instances','get-serial-port-output',$Vm,"--project=$Project","--zone=$Zone",'--port=1','--start=0')
    Save-Text (Join-Path $Evidence 'serial-port-1.txt') $serial
    if ($serial -notmatch 'R32_GUEST_TERMINAL phase=(?<phase>[a-z_]+) exit=(?<exit>[0-9]+)') { throw 'terminal marker absent from serial evidence' }
    $terminal = [regex]::Match($serial, 'R32_GUEST_TERMINAL phase=(?<phase>[a-z_]+) exit=(?<exit>[0-9]+)')
    Save-Text (Join-Path $Evidence 'terminal.phase.txt') $terminal.Groups['phase'].Value
    Save-Text (Join-Path $Evidence 'guest.exit.txt') $terminal.Groups['exit'].Value
    if ($terminal.Groups['phase'].Value -ne 'complete' -or $terminal.Groups['exit'].Value -ne '0') { throw 'R32 fixture reported terminal failure' }
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
    if ($created) {
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
