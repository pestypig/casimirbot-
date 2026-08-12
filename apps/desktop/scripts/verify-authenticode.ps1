param(
  [Parameter(Mandatory = $true)][string]$ReleaseDirectory,
  [Parameter(Mandatory = $true)][string]$PublisherName,
  [Parameter(Mandatory = $true)][string]$ReceiptPath
)

$releaseRoot = [System.IO.Path]::GetFullPath($ReleaseDirectory)
if (-not (Test-Path -LiteralPath $releaseRoot -PathType Container)) {
  throw "Release directory does not exist: $releaseRoot"
}

$executables = @(Get-ChildItem -LiteralPath $releaseRoot -File -Filter '*.exe')
if ($executables.Count -lt 1) {
  throw "No Windows executable artifacts found in $releaseRoot"
}

$receipts = foreach ($file in $executables) {
  $signature = Get-AuthenticodeSignature -LiteralPath $file.FullName
  $subject = $signature.SignerCertificate.Subject
  if ($signature.Status -ne [System.Management.Automation.SignatureStatus]::Valid) {
    throw "Authenticode signature is not valid for $($file.Name): $($signature.Status)"
  }
  if (-not $subject -or $subject.IndexOf($PublisherName, [System.StringComparison]::OrdinalIgnoreCase) -lt 0) {
    throw "Signer subject for $($file.Name) does not contain the configured publisher name"
  }
  [ordered]@{
    file = $file.Name
    status = [string]$signature.Status
    signer_subject = $subject
    signer_thumbprint = $signature.SignerCertificate.Thumbprint
    timestamp_subject = $signature.TimeStamperCertificate.Subject
  }
}

$receipt = [ordered]@{
  schema = 'casimir_desktop_authenticode_receipt/1'
  publisher_name = $PublisherName
  files = @($receipts)
}
$receiptDirectory = Split-Path -Parent ([System.IO.Path]::GetFullPath($ReceiptPath))
if ($receiptDirectory) {
  New-Item -ItemType Directory -Path $receiptDirectory -Force | Out-Null
}
$receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $ReceiptPath -Encoding utf8
Write-Output "[desktop-authenticode] PASS files=$($executables.Count) publisher=$PublisherName"
