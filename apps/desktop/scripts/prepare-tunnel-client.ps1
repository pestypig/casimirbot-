$ErrorActionPreference = "Stop"

$desktopRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$manifestPath = Join-Path $desktopRoot "tunnel-client.v1.json"
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

if ($manifest.schemaVersion -ne "casimir_desktop_tunnel_client_artifact/1") {
  throw "Unsupported tunnel-client artifact manifest"
}
if ($manifest.assetName -notmatch "^tunnel-client-v[0-9.]+-windows-amd64\.zip$") {
  throw "Unexpected tunnel-client asset name"
}
if ($manifest.downloadUrl -notmatch "^https://github\.com/openai/tunnel-client/releases/download/") {
  throw "Tunnel-client download must use the official OpenAI GitHub release"
}

$vendorRoot = [System.IO.Path]::GetFullPath((Join-Path $desktopRoot "vendor\tunnel-client"))
$versionRoot = Join-Path $vendorRoot ("v" + $manifest.version + "\windows-amd64")
$archivePath = Join-Path $versionRoot $manifest.assetName
$expandedRoot = Join-Path $versionRoot "expanded"
$executablePath = Join-Path $expandedRoot "tunnel-client.exe"
$licensePath = Join-Path $expandedRoot "LICENSE"

New-Item -ItemType Directory -Path $versionRoot -Force | Out-Null

function Get-LowerSha256([string]$path) {
  # Windows PowerShell installations embedded by some desktop build hosts do
  # not expose Microsoft.PowerShell.Utility's Get-FileHash cmdlet. Use the
  # framework implementation directly so artifact verification remains
  # available without weakening or skipping any checksum gate.
  $stream = $null
  $sha256 = $null
  try {
    $stream = [System.IO.File]::OpenRead($path)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $bytes = $sha256.ComputeHash($stream)
    return ([System.BitConverter]::ToString($bytes)).Replace("-", "").ToLowerInvariant()
  } finally {
    if ($null -ne $sha256) { $sha256.Dispose() }
    if ($null -ne $stream) { $stream.Dispose() }
  }
}

$payloadReady =
  (Test-Path -LiteralPath $executablePath -PathType Leaf) -and
  (Test-Path -LiteralPath $licensePath -PathType Leaf) -and
  ((Get-LowerSha256 $executablePath) -eq $manifest.executableSha256) -and
  ((Get-LowerSha256 $licensePath) -eq $manifest.licenseSha256)

if (-not $payloadReady) {
  if (-not (Test-Path -LiteralPath $archivePath -PathType Leaf) -or
      (Get-LowerSha256 $archivePath) -ne $manifest.archiveSha256) {
    Invoke-WebRequest -UseBasicParsing -Uri $manifest.downloadUrl -Headers @{
      "User-Agent" = "CasimirBot-desktop-build"
    } -OutFile $archivePath
  }
  if ((Get-LowerSha256 $archivePath) -ne $manifest.archiveSha256) {
    throw "Tunnel-client archive checksum mismatch"
  }
  Expand-Archive -LiteralPath $archivePath -DestinationPath $expandedRoot -Force
}

if ((Get-LowerSha256 $executablePath) -ne $manifest.executableSha256) {
  throw "Tunnel-client executable checksum mismatch"
}
if ((Get-LowerSha256 $licensePath) -ne $manifest.licenseSha256) {
  throw "Tunnel-client license checksum mismatch"
}

Write-Output "[desktop-tunnel] pinned OpenAI tunnel-client v$($manifest.version) verified"
