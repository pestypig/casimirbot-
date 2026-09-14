param([Parameter(Mandatory = $true)][string]$OutputDirectory)
# Retains selected pinned upstream source and transitive network includes.
# This is not installed-image verification or a full microphysics data audit.
$ErrorActionPreference = 'Stop'
$target = [IO.Path]::GetFullPath($OutputDirectory)
if (Test-Path -LiteralPath $target) { throw 'Output directory must be new.' }
$commit = '7ecf3dfa61d514c7b6f47645e02d968d3e3c28b7'
$base = "https://raw.githubusercontent.com/MESAHub/mesa/$commit/"
$queue = New-Object 'System.Collections.Generic.Queue[string]'
@('star/private/pre_ms_model.f90', 'star/job/run_star_support.f90',
  'star/public/star_lib.f90', 'star/private/init.f90',
  'star/defaults/controls.defaults', 'star/defaults/star_job.defaults',
  'eos/defaults/eos.defaults', 'kap/defaults/kap.defaults',
  'data/net_data/nets/pp_and_cno_extras.net') | ForEach-Object { $queue.Enqueue($_) }
$seen = @{}
$utf8 = New-Object Text.UTF8Encoding($false)
$records = @()
$null = New-Item -ItemType Directory -Path $target
while ($queue.Count) {
    $path = $queue.Dequeue()
    if ($seen.ContainsKey($path)) { continue }
    if ($path -match '\.\.' -or $path.StartsWith('/')) { throw 'Unsafe source path.' }
    $seen[$path] = $true
    $text = (Invoke-WebRequest -Uri ($base + $path) -UseBasicParsing -TimeoutSec 30).Content
    $file = Join-Path $target $path
    $null = New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($file)) -Force
    [IO.File]::WriteAllText($file, $text, $utf8)
    $includes = @()
    if ($path.StartsWith('data/net_data/nets/')) {
        foreach ($m in [regex]::Matches($text, "(?m)^\s*include\s+'([^']+)'")) {
            $child = 'data/net_data/nets/' + $m.Groups[1].Value
            $includes += $child
            $queue.Enqueue($child)
        }
    }
    $records += [ordered]@{ path = $path; sha256 = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant(); networkIncludes = $includes }
}
$manifest = [ordered]@{
    schemaVersion = 'g1-mesa-upstream-input-sources/1'
    commit = $commit
    retrievedUtc = [DateTime]::UtcNow.ToString('o')
    encoding = 'UTF-8 re-encoding of HTTP text'
    scope = 'Selected semantics/defaults and transitive network definition includes only; no rate tables, EOS/opacity binaries, compiler libraries or installed-byte verification'
    launchAllowed = $false
    files = $records
}
[IO.File]::WriteAllText((Join-Path $target 'manifest.json'), ($manifest | ConvertTo-Json -Depth 8) + "`n", $utf8)
$manifest | ConvertTo-Json -Depth 8
