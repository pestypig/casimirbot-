param(
  [string]$Address = "localhost:25565",
  [string]$MinecraftRoot = (Join-Path $env:APPDATA ".minecraft"),
  [string]$RequiredGameVersion = "1.21.8",
  [int]$LaunchTimeoutSeconds = 90,
  [int]$ConnectTimeoutSeconds = 45,
  [switch]$RestartClient
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Fail-Typed([string]$Code) {
  throw $Code
}

function Get-MemoryUsedPercent {
  $memory = Get-CimInstance Win32_OperatingSystem
  [math]::Round(
    (1 - ($memory.FreePhysicalMemory / $memory.TotalVisibleMemorySize)) * 100,
    1
  )
}

$addressMatch = [regex]::Match(
  $Address.Trim(),
  '^(localhost|127\.0\.0\.1|\[::1\])(?::([0-9]{1,5}))?$'
)
if (-not $addressMatch.Success) { Fail-Typed "minecraft_loopback_address_required" }
$port = if ($addressMatch.Groups[2].Success) {
  [int]$addressMatch.Groups[2].Value
} else {
  25565
}
if ($port -lt 1 -or $port -gt 65535) { Fail-Typed "minecraft_loopback_port_invalid" }
$normalizedAddress = "$($addressMatch.Groups[1].Value.ToLowerInvariant()):$port"

$root = [IO.Path]::GetFullPath($MinecraftRoot)
$profilesPath = Join-Path $root "launcher_profiles.json"
$logsPath = Join-Path $root "logs\latest.log"
$autoJoinInbox = Join-Path $root "config\helix-fabric-player-agent.autojoin-inbox"
$launcherPath = "C:\Program Files (x86)\Minecraft Launcher\MinecraftLauncher.exe"
if (-not (Test-Path -LiteralPath $profilesPath -PathType Leaf)) {
  Fail-Typed "minecraft_launcher_profiles_missing"
}
if (-not (Test-Path -LiteralPath $launcherPath -PathType Leaf)) {
  Fail-Typed "minecraft_launcher_missing"
}
if (-not (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)) {
  Fail-Typed "minecraft_loopback_server_not_listening"
}
$connectedClientIds = @(
  Get-NetTCPConnection -State Established -RemotePort $port -ErrorAction SilentlyContinue |
    ForEach-Object OwningProcess |
    Sort-Object -Unique
)
$existingMinecraftClient = Get-Process javaw -ErrorAction SilentlyContinue |
  Where-Object {
    $connectedClientIds -contains $_.Id -or
    # Minecraft marks a modded or otherwise modified client title with `*`
    # (for example `Minecraft* 1.21.8`). Treat that as the same verified game
    # window so a lifecycle retry reuses the client instead of clicking Play
    # again and then waiting for a second javaw process that will never start.
    ($_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -match '^Minecraft(?:\*|\s|$)')
  } |
  Sort-Object StartTime -Descending |
  Select-Object -First 1

if ($RestartClient -and $existingMinecraftClient) {
  $verifiedClientId = [int]$existingMinecraftClient.Id
  $verifiedClient = Get-Process -Id $verifiedClientId -ErrorAction SilentlyContinue
  if (-not $verifiedClient) { Fail-Typed "minecraft_existing_client_unavailable" }
  $null = $verifiedClient.CloseMainWindow()
  $closeDeadline = (Get-Date).AddSeconds(15)
  do {
    Start-Sleep -Milliseconds 250
    $verifiedClient = Get-Process -Id $verifiedClientId -ErrorAction SilentlyContinue
  } until (-not $verifiedClient -or (Get-Date) -ge $closeDeadline)
  if ($verifiedClient) {
    # RestartClient is an explicit operator delegation to replace this exact
    # verified Minecraft client. Never broaden this to every java/javaw PID.
    Stop-Process -Id $verifiedClientId
    Wait-Process -Id $verifiedClientId -Timeout 15 -ErrorAction SilentlyContinue
  }
  $existingMinecraftClient = $null
}
if ((Get-MemoryUsedPercent) -ge 90) { Fail-Typed "minecraft_launch_memory_ceiling" }

$profiles = Get-Content -LiteralPath $profilesPath -Raw | ConvertFrom-Json
$fabricProfiles = @(
  $profiles.profiles.PSObject.Properties |
    ForEach-Object {
      [pscustomobject]@{
        id = $_.Name
        name = [string]$_.Value.name
        version = [string]$_.Value.lastVersionId
        lastUsed = if ($_.Value.lastUsed) {
          [datetime]$_.Value.lastUsed
        } else {
          [datetime]::MinValue
        }
      }
    } |
    Where-Object { $_.version -match "^fabric-loader-.*-$([regex]::Escape($RequiredGameVersion))$" } |
    Sort-Object lastUsed -Descending
)
if ($fabricProfiles.Count -eq 0) { Fail-Typed "minecraft_fabric_profile_missing" }
$selectedProfile = $fabricProfiles[0]
$mostRecentProfile = @(
  $profiles.profiles.PSObject.Properties |
    ForEach-Object {
      [pscustomobject]@{
        id = $_.Name
        lastUsed = if ($_.Value.lastUsed) {
          [datetime]$_.Value.lastUsed
        } else {
          [datetime]::MinValue
        }
      }
    } |
    Sort-Object lastUsed -Descending
)[0]
if ($mostRecentProfile.id -ne $selectedProfile.id) {
  Fail-Typed "minecraft_fabric_profile_selection_required"
}

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies ([Drawing.Bitmap].Assembly.Location) -TypeDefinition @'
using System;
using System.Drawing;
using System.Runtime.InteropServices;

public static class HelixMinecraftLauncherAutomation {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }

    [DllImport("user32.dll")]
    private static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);
    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr window, out uint processId);
    [DllImport("kernel32.dll")]
    private static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")]
    private static extern bool AttachThreadInput(uint first, uint second, bool attach);
    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr window, int command);
    [DllImport("user32.dll")]
    private static extern bool BringWindowToTop(IntPtr window);
    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr window);
    [DllImport("user32.dll")]
    private static extern IntPtr SetFocus(IntPtr window);
    [DllImport("user32.dll")]
    private static extern bool GetWindowRect(IntPtr window, out RECT rectangle);
    [DllImport("user32.dll")]
    private static extern bool PrintWindow(IntPtr window, IntPtr deviceContext, uint flags);
    [DllImport("user32.dll")]
    private static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")]
    private static extern bool SetWindowPos(
        IntPtr window,
        IntPtr insertAfter,
        int x,
        int y,
        int width,
        int height,
        uint flags
    );
    [StructLayout(LayoutKind.Sequential)]
    private struct POINT { public int X, Y; }
    [DllImport("user32.dll")]
    private static extern IntPtr WindowFromPoint(POINT point);
    [DllImport("user32.dll")]
    private static extern IntPtr GetAncestor(IntPtr window, uint flags);
    [DllImport("user32.dll")]
    private static extern void mouse_event(uint flags, uint x, uint y, uint data, UIntPtr extra);
    [DllImport("user32.dll")]
    private static extern void keybd_event(byte virtualKey, byte scanCode, uint flags, UIntPtr extra);

    public static Point LocatePlayButton(Bitmap image) {
        // The launcher can reflow the profile/Play band all the way to the
        // bottom edge at narrower heights. Scan the complete bounded lower
        // center region; the right bound deliberately excludes gift banners.
        int left = image.Width / 3;
        int right = image.Width * 4 / 5;
        int top = image.Height / 2;
        int bottom = image.Height - 2;

        int width = right - left;
        int height = bottom - top;
        bool[,] green = new bool[height, width];
        for (int y = top; y < bottom; y++) {
            for (int x = left; x < right; x++) {
                Color pixel = image.GetPixel(x, y);
                bool buttonGreen = pixel.R >= 35 && pixel.R <= 90 &&
                    pixel.G >= 95 && pixel.G <= 175 &&
                    pixel.B >= 15 && pixel.B <= 75 &&
                    pixel.G >= pixel.R + 45;
                green[y - top, x - left] = buttonGreen;
            }
        }

        bool[,] visited = new bool[height, width];
        int bestScore = -1;
        Rectangle bestBounds = Rectangle.Empty;
        int[] deltaX = new int[] { -1, 1, 0, 0 };
        int[] deltaY = new int[] { 0, 0, -1, 1 };
        for (int localY = 0; localY < height; localY++) {
            for (int localX = 0; localX < width; localX++) {
                if (!green[localY, localX] || visited[localY, localX]) continue;
                var queue = new System.Collections.Generic.Queue<int>();
                queue.Enqueue(localY * width + localX);
                visited[localY, localX] = true;
                int minimumX = localX;
                int maximumX = localX;
                int minimumY = localY;
                int maximumY = localY;
                int greenCount = 0;
                while (queue.Count > 0) {
                    int encoded = queue.Dequeue();
                    int candidateY = encoded / width;
                    int candidateX = encoded % width;
                    greenCount++;
                    minimumX = Math.Min(minimumX, candidateX);
                    maximumX = Math.Max(maximumX, candidateX);
                    minimumY = Math.Min(minimumY, candidateY);
                    maximumY = Math.Max(maximumY, candidateY);
                    for (int direction = 0; direction < 4; direction++) {
                        int nextX = candidateX + deltaX[direction];
                        int nextY = candidateY + deltaY[direction];
                        if (
                            nextX < 0 || nextX >= width ||
                            nextY < 0 || nextY >= height ||
                            visited[nextY, nextX] || !green[nextY, nextX]
                        ) continue;
                        visited[nextY, nextX] = true;
                        queue.Enqueue(nextY * width + nextX);
                    }
                }
                int componentWidth = maximumX - minimumX + 1;
                int componentHeight = maximumY - minimumY + 1;
                int absoluteCenterY = top + (minimumY + maximumY) / 2;
                bool plausiblePlayControl =
                    // Exclude narrower green modal actions such as "Share
                    // crash report" while retaining the responsive Play band.
                    componentWidth >= image.Width / 6 &&
                    componentHeight >= Math.Max(12, image.Height / 60) &&
                    absoluteCenterY >= image.Height * 2 / 3;
                if (!plausiblePlayControl) continue;
                int score = greenCount + absoluteCenterY * 4;
                if (score > bestScore) {
                    bestScore = score;
                    bestBounds = new Rectangle(
                        left + minimumX,
                        top + minimumY,
                        componentWidth,
                        componentHeight
                    );
                }
            }
        }
        if (bestScore < 0 || bestBounds.IsEmpty) {
            throw new InvalidOperationException("minecraft_launcher_play_control_not_found");
        }
        return new Point(
            bestBounds.Left + bestBounds.Width / 2,
            bestBounds.Top + bestBounds.Height / 2
        );
    }

    private static bool TryLocateCrashReportDoNotShare(
        Bitmap image,
        out Point target
    ) {
        // The current launcher crash-consent modal renders a narrow green
        // "Share crash report" control in the lower-right half. Its privacy-
        // preserving "Do not share" sibling is immediately to the left. This
        // detector is used only after the wide Play component was absent.
        int left = image.Width / 2;
        int right = image.Width * 4 / 5;
        int top = image.Height / 2;
        // Current launcher builds place the crash-report actions below the
        // three-quarter line on tall windows. Keep the scan bounded above the
        // news cards while including that lower modal action row.
        int bottom = image.Height * 9 / 10;
        int width = right - left;
        int height = bottom - top;
        bool[,] green = new bool[height, width];
        for (int y = top; y < bottom; y++) {
            for (int x = left; x < right; x++) {
                Color pixel = image.GetPixel(x, y);
                bool buttonGreen = pixel.R >= 35 && pixel.R <= 100 &&
                    pixel.G >= 95 && pixel.G <= 190 &&
                    pixel.B >= 15 && pixel.B <= 90 &&
                    pixel.G >= pixel.R + 40;
                green[y - top, x - left] = buttonGreen;
            }
        }
        bool[,] visited = new bool[height, width];
        Rectangle best = Rectangle.Empty;
        int bestCount = -1;
        int[] dx = new int[] { -1, 1, 0, 0 };
        int[] dy = new int[] { 0, 0, -1, 1 };
        for (int localY = 0; localY < height; localY++) {
            for (int localX = 0; localX < width; localX++) {
                if (!green[localY, localX] || visited[localY, localX]) continue;
                var queue = new System.Collections.Generic.Queue<int>();
                queue.Enqueue(localY * width + localX);
                visited[localY, localX] = true;
                int minX = localX, maxX = localX, minY = localY, maxY = localY;
                int count = 0;
                while (queue.Count > 0) {
                    int encoded = queue.Dequeue();
                    int cy = encoded / width;
                    int cx = encoded % width;
                    count++;
                    minX = Math.Min(minX, cx); maxX = Math.Max(maxX, cx);
                    minY = Math.Min(minY, cy); maxY = Math.Max(maxY, cy);
                    for (int direction = 0; direction < 4; direction++) {
                        int nx = cx + dx[direction], ny = cy + dy[direction];
                        if (nx < 0 || nx >= width || ny < 0 || ny >= height ||
                            visited[ny, nx] || !green[ny, nx]) continue;
                        visited[ny, nx] = true;
                        queue.Enqueue(ny * width + nx);
                    }
                }
                int componentWidth = maxX - minX + 1;
                int componentHeight = maxY - minY + 1;
                if (count >= 500 &&
                    componentWidth >= Math.Max(100, image.Width / 12) &&
                    componentWidth < image.Width / 5 &&
                    componentHeight >= 20 && componentHeight <= image.Height / 8 &&
                    count > bestCount) {
                    bestCount = count;
                    best = new Rectangle(
                        left + minX,
                        top + minY,
                        componentWidth,
                        componentHeight
                    );
                }
            }
        }
        if (best.IsEmpty) {
            target = Point.Empty;
            return false;
        }
        int doNotShareX = best.Left - Math.Max(60, best.Width / 2);
        if (doNotShareX < image.Width / 3) {
            target = Point.Empty;
            return false;
        }
        target = new Point(doNotShareX, best.Top + best.Height / 2);
        return true;
    }

    public static string ClickRenderedPlay(
        IntPtr window,
        uint expectedProcessId,
        string diagnosticImagePath
    ) {
        IntPtr previousDpi = SetThreadDpiAwarenessContext(new IntPtr(-4));
        try {
            IntPtr oldForeground = GetForegroundWindow();
            uint oldProcessId;
            uint oldThread = GetWindowThreadProcessId(oldForeground, out oldProcessId);
            uint targetProcessId;
            uint targetThread = GetWindowThreadProcessId(window, out targetProcessId);
            if (targetProcessId != expectedProcessId) {
                throw new InvalidOperationException("minecraft_launcher_window_identity_mismatch");
            }
            uint currentThread = GetCurrentThreadId();
            AttachThreadInput(currentThread, oldThread, true);
            AttachThreadInput(currentThread, targetThread, true);
            try {
                ShowWindow(window, 9);
                keybd_event(0x12, 0, 0, UIntPtr.Zero);
                BringWindowToTop(window);
                SetForegroundWindow(window);
                SetFocus(window);
                keybd_event(0x12, 0, 2, UIntPtr.Zero);
                System.Threading.Thread.Sleep(500);

                RECT rectangle;
                if (!GetWindowRect(window, out rectangle)) {
                    throw new InvalidOperationException("minecraft_launcher_bounds_unavailable");
                }
                int width = rectangle.Right - rectangle.Left;
                int height = rectangle.Bottom - rectangle.Top;
                if (width < 640 || height < 480) {
                    // A launcher reopened from the tray can retain a tiny
                    // restored rectangle. Maximize this exact verified window,
                    // then recapture rather than guessing a stale coordinate.
                    ShowWindow(window, 3);
                    System.Threading.Thread.Sleep(500);
                    if (!GetWindowRect(window, out rectangle)) {
                        throw new InvalidOperationException("minecraft_launcher_bounds_unavailable");
                    }
                    width = rectangle.Right - rectangle.Left;
                    height = rectangle.Bottom - rectangle.Top;
                    if (width < 640 || height < 480) {
                        throw new InvalidOperationException("minecraft_launcher_bounds_invalid");
                    }
                }
                Point target;
                bool dismissCrashReport = false;
                using (Bitmap image = new Bitmap(width, height))
                using (Graphics graphics = Graphics.FromImage(image)) {
                    IntPtr deviceContext = graphics.GetHdc();
                    try {
                        if (!PrintWindow(window, deviceContext, 2)) {
                            throw new InvalidOperationException("minecraft_launcher_render_unavailable");
                        }
                    } finally {
                        graphics.ReleaseHdc(deviceContext);
                    }
                    try {
                        target = LocatePlayButton(image);
                    } catch (InvalidOperationException error) {
                        if (error.Message == "minecraft_launcher_play_control_not_found") {
                            if (!String.IsNullOrWhiteSpace(diagnosticImagePath)) {
                                image.Save(diagnosticImagePath, System.Drawing.Imaging.ImageFormat.Png);
                            }
                            Point privacyTarget;
                            if (TryLocateCrashReportDoNotShare(image, out privacyTarget)) {
                                target = privacyTarget;
                                dismissCrashReport = true;
                            } else {
                                // Older launcher versions dismissed this modal
                                // with Escape. A later frame must still expose
                                // and locate the real Play component.
                                keybd_event(0x1B, 0, 0, UIntPtr.Zero);
                                System.Threading.Thread.Sleep(100);
                                keybd_event(0x1B, 0, 2, UIntPtr.Zero);
                                throw;
                            }
                        } else {
                            throw;
                        }
                    }
                }
                int x = rectangle.Left + target.X;
                int y = rectangle.Top + target.Y;
                IntPtr topmost = new IntPtr(-1);
                IntPtr notTopmost = new IntPtr(-2);
                const uint preserveGeometryAndShow = 0x0001 | 0x0002 | 0x0040;
                SetWindowPos(window, topmost, 0, 0, 0, 0, preserveGeometryAndShow);
                try {
                    System.Threading.Thread.Sleep(250);
                    IntPtr hit = WindowFromPoint(new POINT { X = x, Y = y });
                    // GA_ROOT=2. A child rendering HWND is acceptable only
                    // when its root is the exact launcher window we captured.
                    if (hit == IntPtr.Zero || GetAncestor(hit, 2) != window) {
                        throw new InvalidOperationException(
                            "minecraft_launcher_click_target_occluded"
                        );
                    }
                    SetCursorPos(x, y);
                    mouse_event(0x0002, 0, 0, 0, UIntPtr.Zero);
                    System.Threading.Thread.Sleep(100);
                    mouse_event(0x0004, 0, 0, 0, UIntPtr.Zero);
                    // Foreground and focus were established above. Deliver
                    // exactly one physical click to the freshly rendered
                    // center. Multiple physical/posted clicks can enqueue
                    // multiple Java clients before this launcher build dims
                    // the Play control.
                    return dismissCrashReport
                        ? "crash_report_dismissed"
                        : x + "," + y;
                } finally {
                    SetWindowPos(
                        window,
                        notTopmost,
                        0,
                        0,
                        0,
                        0,
                        preserveGeometryAndShow
                    );
                }
            } finally {
                AttachThreadInput(currentThread, targetThread, false);
                AttachThreadInput(currentThread, oldThread, false);
            }
        } finally {
            SetThreadDpiAwarenessContext(previousDpi);
        }
    }
}
'@

$launcherAction = "reused_client"
$clickPoint = "not_required"
if ($existingMinecraftClient) {
  $client = Get-Process -Id $existingMinecraftClient.Id -ErrorAction SilentlyContinue
  if (-not $client) { Fail-Typed "minecraft_existing_client_unavailable" }
} else {
  $launcherAction = "launched_client"
  $existingClientIds = @(Get-Process javaw -ErrorAction SilentlyContinue | ForEach-Object Id)
  $staleOutputWindows = @(Get-Process MinecraftLauncher -ErrorAction SilentlyContinue |
    Where-Object {
      $_.MainWindowHandle -ne 0 -and
      $_.MainWindowTitle -eq "Minecraft game output"
    })
  $staleOutputWindows | ForEach-Object { $null = $_.CloseMainWindow() }
  if ($staleOutputWindows.Count -gt 0) {
    # A launch request sent while the stale launcher process cluster is still
    # exiting can be swallowed by that dying instance. Wait for either a real
    # launcher window or completion of the stale shutdown before starting it.
    $staleIds = @($staleOutputWindows | ForEach-Object Id)
    $staleDeadline = (Get-Date).AddSeconds(15)
    do {
      Start-Sleep -Milliseconds 250
      $realLauncher = Get-Process MinecraftLauncher -ErrorAction SilentlyContinue |
        Where-Object {
          $_.MainWindowHandle -ne 0 -and
          $_.MainWindowTitle -ne "Minecraft game output"
        } |
        Select-Object -First 1
      $staleAlive = @(Get-Process -Id $staleIds -ErrorAction SilentlyContinue)
    } until ($realLauncher -or $staleAlive.Count -eq 0 -or (Get-Date) -ge $staleDeadline)
  }
  $launcher = Get-Process MinecraftLauncher -ErrorAction SilentlyContinue |
    Where-Object {
      $_.MainWindowHandle -ne 0 -and
      $_.MainWindowTitle -ne "Minecraft game output"
    } |
    Select-Object -First 1
  if (-not $launcher) {
    Start-Process -FilePath $launcherPath
    $deadline = (Get-Date).AddSeconds(30)
    do {
      Start-Sleep -Milliseconds 500
      $launcher = Get-Process MinecraftLauncher -ErrorAction SilentlyContinue |
        Where-Object {
          $_.MainWindowHandle -ne 0 -and
          $_.MainWindowTitle -ne "Minecraft game output"
        } |
        Select-Object -First 1
    } until ($launcher -or (Get-Date) -ge $deadline)
  }
  if (-not $launcher) { Fail-Typed "minecraft_launcher_window_not_ready" }

  $playDeadline = (Get-Date).AddSeconds(30)
  $clickPoint = $null
  $lastLaunchFailure = "minecraft_launcher_play_control_not_attempted"
  $launcherDiagnosticImage = Join-Path $root "logs\helix-launcher-play-diagnostic.png"
  do {
    $currentLauncher = Get-Process MinecraftLauncher -ErrorAction SilentlyContinue |
      Where-Object {
        $_.MainWindowHandle -ne 0 -and
        $_.MainWindowTitle -ne "Minecraft game output"
      } |
      Select-Object -First 1
    if ($currentLauncher) { $launcher = $currentLauncher }
    try {
      $candidatePoint = [HelixMinecraftLauncherAutomation]::ClickRenderedPlay(
        $launcher.MainWindowHandle,
        [uint32]$launcher.Id,
        $launcherDiagnosticImage
      )
      if ($candidatePoint -eq "crash_report_dismissed") {
        $lastLaunchFailure = "minecraft_launcher_crash_report_dismissed"
        $clickPoint = $null
        Start-Sleep -Seconds 1
        continue
      }
      $clickPoint = $candidatePoint
    } catch {
      $launchFailure = [string]$_.Exception.InnerException.Message
      $lastLaunchFailure = $launchFailure
      if ($launchFailure -notin @(
        "minecraft_launcher_play_control_not_found",
        "minecraft_launcher_foreground_activation_failed",
        "minecraft_launcher_click_target_occluded",
        "minecraft_launcher_click_delivery_failed",
        "minecraft_launcher_bounds_unavailable",
        "minecraft_launcher_bounds_invalid"
      )) {
        throw
      }
      Start-Sleep -Seconds 1
    }
  } until ($clickPoint -or (Get-Date) -ge $playDeadline)
  if (-not $clickPoint) {
    Fail-Typed "minecraft_launcher_play_control_timeout:$lastLaunchFailure"
  }
  $clientDeadline = (Get-Date).AddSeconds($LaunchTimeoutSeconds)
  do {
    Start-Sleep -Seconds 1
    $client = Get-Process javaw -ErrorAction SilentlyContinue |
      Where-Object { $existingClientIds -notcontains $_.Id } |
      Sort-Object StartTime -Descending |
      Select-Object -First 1
  } until ($client -or (Get-Date) -ge $clientDeadline)
  if (-not $client) { Fail-Typed "minecraft_client_launch_timeout" }

  # The authenticated launcher has completed its responsibility. Closing its UI
  # reduces memory pressure without terminating the child game client.
  $null = $launcher.CloseMainWindow()
}

$modDeadline = (Get-Date).AddSeconds($LaunchTimeoutSeconds)
$modLoaded = $false
do {
  Start-Sleep -Seconds 1
  if (Test-Path -LiteralPath $logsPath -PathType Leaf) {
    $logFile = Get-Item -LiteralPath $logsPath -ErrorAction SilentlyContinue
    if ($logFile -and $logFile.LastWriteTime -ge $client.StartTime) {
      $modLoaded = [bool](
        Select-String `
          -LiteralPath $logsPath `
          -SimpleMatch 'Helix Fabric Player Agent loaded' `
          -Quiet `
          -ErrorAction SilentlyContinue
      )
    }
  }
} until ($modLoaded -or (Get-Date) -ge $modDeadline)
if (-not $modLoaded) { Fail-Typed "minecraft_helix_mod_load_timeout" }
if ((Get-MemoryUsedPercent) -ge 95) { Fail-Typed "minecraft_runtime_memory_ceiling" }

$connection = Get-NetTCPConnection -OwningProcess $client.Id -ErrorAction SilentlyContinue |
  Where-Object { $_.RemotePort -eq $port -and $_.State -eq 'Established' } |
  Select-Object -First 1
$connectionAction = "already_connected"
if (-not $connection) {
  $connectionAction = "autojoin_staged"
  New-Item -ItemType Directory -Path (Split-Path $autoJoinInbox) -Force | Out-Null
  $pending = "$autoJoinInbox.pending.$PID.$([guid]::NewGuid())"
  try {
    [IO.File]::WriteAllText(
      $pending,
      "/helix-player autojoin $normalizedAddress`n",
      [Text.UTF8Encoding]::new($false)
    )
    Move-Item -LiteralPath $pending -Destination $autoJoinInbox -Force
  } finally {
    Remove-Item -LiteralPath $pending -Force -ErrorAction SilentlyContinue
  }

  $connectDeadline = (Get-Date).AddSeconds($ConnectTimeoutSeconds)
  do {
    Start-Sleep -Seconds 1
    $connection = Get-NetTCPConnection -OwningProcess $client.Id -ErrorAction SilentlyContinue |
      Where-Object { $_.RemotePort -eq $port -and $_.State -eq 'Established' } |
      Select-Object -First 1
  } until ($connection -or (Get-Date) -ge $connectDeadline)
  if (-not $connection) { Fail-Typed "minecraft_loopback_connect_timeout" }
}

[ordered]@{
  schema = "helix.minecraft.workstation_launch_receipt.v1"
  status = "connected"
  profile_id = $selectedProfile.id
  profile_version = $selectedProfile.version
  client_process_id = $client.Id
  server_address = $normalizedAddress
  launcher_action = $launcherAction
  connection_action = $connectionAction
  play_control_point = $clickPoint
  mod_loaded = $modLoaded
  memory_used_percent = Get-MemoryUsedPercent
  credentials_exposed = $false
} | ConvertTo-Json -Compress
