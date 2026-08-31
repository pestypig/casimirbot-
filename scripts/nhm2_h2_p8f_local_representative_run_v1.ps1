$ErrorActionPreference = 'Stop'

$containerName = 'nhm2-h2-p8f-local-representative-20260830'
$imageName = 'nhm2-g2h-e-s5-c08-h2-p8f-representative-run:build-v1'
$expectedImageId = 'sha256:ec6ab2ada583d575fd2faedbef0ec6bdb865c44014d3eb3660a8b5c537c2defd'
$expectedExecutable = '12aa0158d56340a7fb7a545c4d2a5bc918c76148ba37548de2988cb968790d20'
$executable = '/usr/local/bin/mini-boson-star-primary-c08-h2-p8f-representative-run-v1'
$timeoutSeconds = 43200
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$evidenceRoot = Join-Path $repositoryRoot 'artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-local-representative-run-v1-20260830'

if (Test-Path -LiteralPath $evidenceRoot) {
    throw "immutable evidence root exists: $evidenceRoot"
}
& docker container inspect $containerName *> $null
if ($LASTEXITCODE -eq 0) {
    throw "fixed container already exists: $containerName"
}
$running = @(& docker ps -q)
if ($running.Count -ne 0) {
    throw 'another Docker container is running'
}
$imageId = (& docker image inspect $imageName --format '{{.Id}}').Trim()
if ($LASTEXITCODE -ne 0 -or $imageId -ne $expectedImageId) {
    throw "image identity mismatch: $imageId"
}
$binaryLine = (& docker run --rm --entrypoint sha256sum $imageName $executable).Trim()
if ($LASTEXITCODE -ne 0 -or -not $binaryLine.StartsWith($expectedExecutable + ' ')) {
    throw "executable identity mismatch: $binaryLine"
}

New-Item -ItemType Directory -Path $evidenceRoot | Out-Null
$startUtc = [DateTime]::UtcNow.ToString('o')
[IO.File]::WriteAllText((Join-Path $evidenceRoot 'start.utc.txt'), $startUtc + "`n")
[IO.File]::WriteAllText((Join-Path $evidenceRoot 'image.id.txt'), $imageId + "`n")
[IO.File]::WriteAllText((Join-Path $evidenceRoot 'executable.sha256.txt'), $expectedExecutable + "`n")

$containerId = (& docker create --name $containerName --network none --read-only --cap-drop ALL --security-opt no-new-privileges --pids-limit 256 --cpus 16 $imageName).Trim()
if ($LASTEXITCODE -ne 0 -or -not $containerId) {
    throw 'container creation failed'
}
[IO.File]::WriteAllText((Join-Path $evidenceRoot 'container.id.txt'), $containerId + "`n")
& docker start $containerName | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'container start failed' }

$deadline = [DateTime]::UtcNow.AddSeconds($timeoutSeconds)
$timedOut = $false
while ([DateTime]::UtcNow -lt $deadline) {
    $runningState = (& docker inspect $containerName --format '{{.State.Running}}').Trim()
    if ($runningState -ne 'true') { break }
    Start-Sleep -Seconds 30
}
if ((& docker inspect $containerName --format '{{.State.Running}}').Trim() -eq 'true') {
    $timedOut = $true
    & docker stop --time 30 $containerName | Out-Null
}

$finishUtc = [DateTime]::UtcNow.ToString('o')
$exitCode = (& docker inspect $containerName --format '{{.State.ExitCode}}').Trim()
$state = (& docker inspect $containerName).Trim()
$stdout = (& docker logs $containerName 2>$null) -join "`n"
$stderr = (& docker logs $containerName 2>&1 1>$null) -join "`n"
[IO.File]::WriteAllText((Join-Path $evidenceRoot 'finish.utc.txt'), $finishUtc + "`n")
[IO.File]::WriteAllText((Join-Path $evidenceRoot 'exit.code.txt'), $exitCode + "`n")
[IO.File]::WriteAllText((Join-Path $evidenceRoot 'timed_out.txt'), $timedOut.ToString().ToLowerInvariant() + "`n")
[IO.File]::WriteAllText((Join-Path $evidenceRoot 'stdout.txt'), $stdout + "`n")
[IO.File]::WriteAllText((Join-Path $evidenceRoot 'stderr.txt'), $stderr + "`n")
[IO.File]::WriteAllText((Join-Path $evidenceRoot 'container.inspect.json'), $state + "`n")
