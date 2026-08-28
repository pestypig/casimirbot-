param(
  [string]$ExecutablePath = "",
  [int]$TimeoutSeconds = 100
)

$ErrorActionPreference = "Stop"

$desktopRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$releaseRoot = [IO.Path]::GetFullPath((Join-Path $desktopRoot "release\win-unpacked"))
$resolvedExecutable = if ($ExecutablePath) {
  (Resolve-Path -LiteralPath $ExecutablePath).Path
} else {
  (Resolve-Path -LiteralPath (Join-Path $releaseRoot "CasimirBot.exe")).Path
}
if (-not $resolvedExecutable.StartsWith(
  $releaseRoot,
  [StringComparison]::OrdinalIgnoreCase
)) {
  throw "Packaged executable resolved outside the expected release directory."
}

$tempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$testRoot = [IO.Path]::GetFullPath((Join-Path $tempBase (
  "casimir-desktop-launch-" + [guid]::NewGuid().ToString("N")
)))
if (
  -not $testRoot.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase) -or
  (Split-Path $testRoot -Leaf) -notlike "casimir-desktop-launch-*"
) {
  throw "Disposable launch root failed containment validation."
}

function Get-ProcessTreeIds([uint32]$RootProcessId) {
  $processes = @(Get-CimInstance Win32_Process |
    Select-Object ProcessId, ParentProcessId)
  $ids = [System.Collections.Generic.HashSet[uint32]]::new()
  [void]$ids.Add($RootProcessId)
  $added = $true
  while ($added) {
    $added = $false
    foreach ($process in $processes) {
      if (
        $ids.Contains([uint32]$process.ParentProcessId) -and
        -not $ids.Contains([uint32]$process.ProcessId)
      ) {
        [void]$ids.Add([uint32]$process.ProcessId)
        $added = $true
      }
    }
  }
  return $ids
}

New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
$rootProcess = $null
$minFreePhysicalGiB = [double]::PositiveInfinity
$maxCommitPercent = 0.0
$listenerCount = 0
$userDataFileCount = 0
$processCount = 0
$readyReceiptValid = $false
$serviceListenerVerified = $false
$readyReceiptPath = Join-Path $testRoot "state\desktop-service-ready.json"
$providerCredentialKeyVaultPath = Join-Path $testRoot (
  "brokerage\provider-credential-key.dpapi"
)
$protocolCommandKey =
  "Registry::HKEY_CURRENT_USER\Software\Classes\casimirbot\shell\open\command"
$protocolCommandBefore = if (Test-Path -LiteralPath $protocolCommandKey) {
  (Get-ItemProperty `
    -LiteralPath $protocolCommandKey `
    -Name "(default)" `
    -ErrorAction SilentlyContinue)."(default)"
} else {
  $null
}

try {
  $initialOperatingSystem = Get-CimInstance Win32_OperatingSystem
  $initialFreePhysicalGiB = $initialOperatingSystem.FreePhysicalMemory / 1MB
  if ($initialFreePhysicalGiB -lt 4) {
    throw "Packaged launch requires at least 4 GiB physical headroom."
  }
  $launchStartedUtc = [DateTime]::UtcNow
  $rootProcess = Start-Process `
    -FilePath $resolvedExecutable `
    -ArgumentList @("--user-data-dir=$testRoot", "--disable-gpu") `
    -WindowStyle Hidden `
    -PassThru

  $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
  do {
    Start-Sleep -Milliseconds 500
    $ids = @(Get-ProcessTreeIds ([uint32]$rootProcess.Id))
    $processCount = $ids.Count
    $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      Where-Object {
        $_.LocalAddress -eq "127.0.0.1" -and
        $ids -contains [uint32]$_.OwningProcess
      })
    $listenerCount = $listeners.Count
    $userDataFiles = @(Get-ChildItem `
      -LiteralPath $testRoot `
      -Recurse `
      -File `
      -ErrorAction SilentlyContinue)
    $userDataFileCount = $userDataFiles.Count
    $readyReceiptValid = $false
    $serviceListenerVerified = $false
    if (Test-Path -LiteralPath $readyReceiptPath) {
      try {
        $receiptFile = Get-Item -LiteralPath $readyReceiptPath
        $receipt = Get-Content -LiteralPath $readyReceiptPath -Raw |
          ConvertFrom-Json
        $receiptOrigin = [Uri]$receipt.origin
        $readyReceiptValid =
          $receipt.schema -eq "casimir_desktop_service_ready_receipt/1" -and
          $receipt.ready -eq $true -and
          $receiptOrigin.Scheme -eq "http" -and
          $receiptOrigin.Host -eq "127.0.0.1" -and
          $receiptOrigin.Port -ge 1024 -and
          ($receipt.serviceProcessId -is [int] -or
            $receipt.serviceProcessId -is [long]) -and
          $receiptFile.LastWriteTimeUtc -ge $launchStartedUtc
        if ($readyReceiptValid) {
          $serviceListenerVerified = @($listeners | Where-Object {
            $_.LocalPort -eq $receiptOrigin.Port -and
            $_.OwningProcess -eq $receipt.serviceProcessId
          }).Count -eq 1
        }
      }
      catch {
        $readyReceiptValid = $false
      }
    }

    $operatingSystem = Get-CimInstance Win32_OperatingSystem
    $freePhysicalGiB = $operatingSystem.FreePhysicalMemory / 1MB
    $commitPercent = (Get-Counter `
      "\Memory\% Committed Bytes In Use").CounterSamples[0].CookedValue
    $minFreePhysicalGiB = [math]::Min(
      $minFreePhysicalGiB,
      $freePhysicalGiB
    )
    $maxCommitPercent = [math]::Max($maxCommitPercent, $commitPercent)
    if ($freePhysicalGiB -lt 1.5 -or $commitPercent -ge 85) {
      throw "Packaged launch crossed the workstation memory stop threshold."
    }
  } until (
    (
      $listenerCount -eq 2 -and
      $userDataFileCount -gt 0 -and
      $readyReceiptValid -and
      $serviceListenerVerified
    ) -or
    [DateTime]::UtcNow -ge $deadline -or
    $rootProcess.HasExited
  )

  if ($rootProcess.HasExited) {
    throw "Packaged application exited before verification completed."
  }
  if ($listenerCount -ne 2) {
    throw (
      "Expected the service and credential-broker loopback listeners, " +
      "found $listenerCount."
    )
  }
  if ($userDataFileCount -eq 0) {
    throw "The packaged application did not use the isolated user-data root."
  }
  if (-not $readyReceiptValid) {
    throw "The packaged application did not reach full API readiness."
  }
  if (-not $serviceListenerVerified) {
    throw "The ready receipt did not identify exactly one service listener."
  }
  if (
    -not (Test-Path -LiteralPath $providerCredentialKeyVaultPath) -or
    (Get-Item -LiteralPath $providerCredentialKeyVaultPath).Length -le 0
  ) {
    throw "The packaged application did not create its protected provider credential key vault."
  }
  $protocolCommandAfter = if (Test-Path -LiteralPath $protocolCommandKey) {
    (Get-ItemProperty `
      -LiteralPath $protocolCommandKey `
      -Name "(default)" `
      -ErrorAction SilentlyContinue)."(default)"
  } else {
    $null
  }
  if ($protocolCommandAfter -ne $protocolCommandBefore) {
    throw (
      "The isolated packaged launch replaced casimirbot:// protocol ownership."
    )
  }

  [pscustomobject]@{
    Verdict = "PASS"
    Processes = $processCount
    LoopbackListeners = $listenerCount
    IsolatedUserDataFiles = $userDataFileCount
    FullReadinessReceipt = "PASS"
    ServiceListenerReceipt = "PASS"
    ProviderCredentialKeyVault = "PASS"
    ProtocolRegistrationPreserved = "PASS"
    MinFreePhysicalGiB = [math]::Round($minFreePhysicalGiB, 2)
    MaxCommitPercent = [math]::Round($maxCommitPercent, 1)
  } | ConvertTo-Json -Compress
}
finally {
  if ($rootProcess) {
    $ids = @(Get-ProcessTreeIds ([uint32]$rootProcess.Id))
    foreach ($processId in @($ids)) {
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    $processDeadline = [DateTime]::UtcNow.AddSeconds(5)
    do {
      Start-Sleep -Milliseconds 250
      $remainingProcesses = @($ids | Where-Object {
        Get-Process -Id $_ -ErrorAction SilentlyContinue
      })
    } until (
      $remainingProcesses.Count -eq 0 -or
      [DateTime]::UtcNow -ge $processDeadline
    )
  }

  if (Test-Path -LiteralPath $testRoot) {
    $validatedRoot = [IO.Path]::GetFullPath($testRoot)
    if (
      -not $validatedRoot.StartsWith(
        $tempBase,
        [StringComparison]::OrdinalIgnoreCase
      ) -or
      (Split-Path $validatedRoot -Leaf) -notlike "casimir-desktop-launch-*"
    ) {
      throw "Refused to remove an unvalidated launch root."
    }
    $removeDeadline = [DateTime]::UtcNow.AddSeconds(5)
    do {
      try {
        Remove-Item -LiteralPath $validatedRoot -Recurse -Force
      } catch {
        if ([DateTime]::UtcNow -ge $removeDeadline) { throw }
        Start-Sleep -Milliseconds 250
      }
    } while (Test-Path -LiteralPath $validatedRoot)
  }
}
