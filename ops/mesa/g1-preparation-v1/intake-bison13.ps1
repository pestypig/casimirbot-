param(
    [Parameter(Mandatory = $true)][string]$OutputDirectory
)
# Read-only public source intake; never starts MESA or overwrites evidence.
$ErrorActionPreference = 'Stop'
$target = [IO.Path]::GetFullPath($OutputDirectory)
if (Test-Path -LiteralPath $target) { throw 'Output directory must be new.' }
$uri = 'https://arxiv.org/html/0905.0651v2'
$html = (Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 30).Content
$table = [regex]::Match($html, '<figure\s+id="S5.T3"[\s\S]*?</figure>')
if (!$table.Success) { throw 'Primary Table 3 not found; source layout changed.' }
$rows = @()
foreach ($row in [regex]::Matches($table.Value, '<tr\b[^>]*>([\s\S]*?)</tr>')) {
    $numbers = @()
    foreach ($cell in [regex]::Matches($row.Value, '<td\b[^>]*>([\s\S]*?)</td>')) {
        $value = ([regex]::Replace($cell.Groups[1].Value, '<[^>]+>', '')).Trim()
        if ($value -match '^\d\.\d+E[+-]\d+$') { $numbers += $value }
    }
    if ($numbers.Count -eq 0) { continue }
    if ($numbers.Count -ne 6) { throw 'Unexpected Table 3 numeric row width.' }
    $rows += ,$numbers
}
if ($rows.Count -ne 37) { throw "Unexpected Table 3 row count: $($rows.Count)" }
$previousC = 0.0
$previousRho = 0.0
foreach ($row in $rows) {
    $v = @($row | ForEach-Object { [double]::Parse($_, [Globalization.CultureInfo]::InvariantCulture) })
    if ($v[0] -le $previousC -or $v[3] -le $previousRho -or $v[0] -ge 1 -or $v[3] -ge 1) { throw 'Invalid radial grids.' }
    if (@($v | Where-Object { $_ -le 0 }).Count) { throw 'Nonpositive source datum.' }
    $previousC = $v[0]
    $previousRho = $v[3]
}
$null = New-Item -ItemType Directory -Path $target
$utf8 = New-Object Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $target 'source.html'), $html, $utf8)
$csv = 'r_c_over_R,c_cm_s,sigma_c_cm_s,r_rho_over_R,rho_g_cm3,sigma_rho_g_cm3' + "`n"
$csv += (($rows | ForEach-Object { $_ -join ',' }) -join "`n") + "`n"
[IO.File]::WriteAllText((Join-Path $target 'bison13-table3.csv'), $csv, $utf8)
$manifest = [ordered]@{
    schemaVersion = 'g1-bison13-intake/1'
    source = $uri
    retrievedUtc = [DateTime]::UtcNow.ToString('o')
    sourceEncoding = 'UTF-8 re-encoding of HTTP text; not original wire bytes'
    sourceSha256 = (Get-FileHash -LiteralPath (Join-Path $target 'source.html') -Algorithm SHA256).Hash.ToLowerInvariant()
    tableSha256 = (Get-FileHash -LiteralPath (Join-Path $target 'bison13-table3.csv') -Algorithm SHA256).Hash.ToLowerInvariant()
    rows = $rows.Count
    table = 'Table 3; BiSON-13 absolute inferred solar profiles, not the reference-model predictions'
    SIConversions = @{ soundSpeed = 'cm/s * 0.01 = m/s; same for uncertainty'; density = 'g/cm^3 * 1000 = kg/m^3; same for uncertainty' }
    status = 'NUMERICAL_TABLE_RETAINED_RESOLUTION_BINDING_PENDING'
    launchAllowed = $false
    admissionAllowed = $false
}
[IO.File]::WriteAllText((Join-Path $target 'intake.json'), ($manifest | ConvertTo-Json -Depth 5) + "`n", $utf8)
$manifest | ConvertTo-Json -Depth 5
