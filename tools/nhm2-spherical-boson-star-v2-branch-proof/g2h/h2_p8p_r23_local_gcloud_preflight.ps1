$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$archivePath = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\google-cloud-sdk-583.0.0-windows-x86_64-bundled-python.zip'
$extractRoot = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk'
$gcloudPath = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-583.0.0\sdk\google-cloud-sdk\bin\gcloud.cmd'
$configRoot = 'C:\Users\dan\AppData\Local\NHM2\p8p-r22-gcloud-config'
$expectedBytes = 101597540
$expectedHash = '25fe2511abdf05d514bbb67859475e7e76acc1f36c0bcac37232e1e34892d768'
$expectedAccount = 'pestypig@gmail.com'
$expectedProject = 'dark-stratum-455714-h4'

if (-not (Test-Path -LiteralPath $archivePath -PathType Leaf)) {
    throw 'R23_ARCHIVE_ABSENT'
}
$archiveItem = Get-Item -LiteralPath $archivePath
if ($archiveItem.Length -ne $expectedBytes) {
    throw 'R23_ARCHIVE_SIZE_MISMATCH'
}
$actualHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualHash -ne $expectedHash) {
    throw 'R23_ARCHIVE_HASH_MISMATCH'
}
$stream = [System.IO.File]::OpenRead($archivePath)
try {
    $signature = New-Object byte[] 4
    if ($stream.Read($signature, 0, 4) -ne 4) {
        throw 'R23_ARCHIVE_SIGNATURE_SHORT_READ'
    }
} finally {
    $stream.Dispose()
}
if (($signature | ForEach-Object { $_.ToString('x2') }) -join '' -ne '504b0304') {
    throw 'R23_ARCHIVE_SIGNATURE_MISMATCH'
}
if (Test-Path -LiteralPath $extractRoot) {
    throw 'R23_EXTRACTION_ROOT_NOT_ABSENT'
}
if (Test-Path -LiteralPath $configRoot) {
    throw 'R23_CONFIG_ROOT_NOT_ABSENT'
}

Write-Output 'R23_ARCHIVE_AUTHENTICATED'
Expand-Archive -LiteralPath $archivePath -DestinationPath $extractRoot
if (-not (Test-Path -LiteralPath $gcloudPath -PathType Leaf)) {
    throw 'R23_GCLOUD_EXECUTABLE_ABSENT'
}

$env:CLOUDSDK_CONFIG = $configRoot
$env:CLOUDSDK_CORE_DISABLE_USAGE_REPORTING = 'true'
$versionOutput = (& $gcloudPath version --format='value(Google Cloud SDK)' 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $versionOutput -ne '583.0.0') {
    throw "R23_GCLOUD_VERSION_MISMATCH:$versionOutput"
}
Write-Output 'R23_GCLOUD_VERSION_AUTHENTICATED'

& $gcloudPath auth login --account=$expectedAccount --no-launch-browser
if ($LASTEXITCODE -ne 0) {
    throw 'R23_AUTH_LOGIN_FAILED'
}

& $gcloudPath config set core/project $expectedProject --quiet
if ($LASTEXITCODE -ne 0) {
    throw 'R23_PROJECT_SET_FAILED'
}
$activeAccount = (& $gcloudPath auth list --filter='status:ACTIVE' --format='value(account)' 2>&1 | Out-String).Trim()
$activeProject = (& $gcloudPath config get-value core/project 2>$null | Out-String).Trim()
if ($activeAccount -ne $expectedAccount) {
    throw "R23_ACTIVE_ACCOUNT_MISMATCH:$activeAccount"
}
if ($activeProject -ne $expectedProject) {
    throw "R23_ACTIVE_PROJECT_MISMATCH:$activeProject"
}

Write-Output "R23_ACTIVE_ACCOUNT=$activeAccount"
Write-Output "R23_ACTIVE_PROJECT=$activeProject"
Write-Output 'R23_LOCAL_TRANSPORT_AUTHENTICATED'
