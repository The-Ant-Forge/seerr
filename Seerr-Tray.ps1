# Seerr-Tray.ps1 — System tray manager for Seerr
# Right-click tray icon to start/stop, open browser, or exit.
# Double-click tray icon to open in browser.

param(
    [string]$SeerrDir = $PSScriptRoot,
    [int]$Port = 0  # 0 = auto-detect from $env:PORT or default 5055
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Resolve port: param > $env:PORT > 5055 (matches server/index.ts logic)
if ($Port -eq 0) {
    $Port = if ($env:PORT) { [int]$env:PORT } else { 5055 }
}

$script:seerrProcess = $null
$script:baseUrl = "http://localhost:$Port"

# --- Icon loading ---
$icoPath = Join-Path $SeerrDir 'seerr.ico'
if (Test-Path $icoPath) {
    $iconRunning = New-Object System.Drawing.Icon($icoPath, 16, 16)
    # Grayscale version for stopped state
    $bmp = $iconRunning.ToBitmap()
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        for ($y = 0; $y -lt $bmp.Height; $y++) {
            $px = $bmp.GetPixel($x, $y)
            $gray = [int](0.3 * $px.R + 0.59 * $px.G + 0.11 * $px.B)
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($px.A, $gray, $gray, $gray))
        }
    }
    $iconStopped = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
} else {
    # Fallback: generate simple "S" icons
    function New-SeerrIcon([System.Drawing.Color]$color) {
        $bmp = New-Object System.Drawing.Bitmap(16, 16)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = 'AntiAlias'
        $g.Clear($color)
        $font = New-Object System.Drawing.Font('Segoe UI', 9, [System.Drawing.FontStyle]::Bold)
        $g.DrawString('S', $font, [System.Drawing.Brushes]::White, -1, 0)
        $g.Dispose()
        $font.Dispose()
        return [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
    }
    $iconRunning = New-SeerrIcon ([System.Drawing.Color]::FromArgb(108, 93, 211))
    $iconStopped = New-SeerrIcon ([System.Drawing.Color]::FromArgb(100, 100, 100))
}

# --- Tray icon setup ---
$trayIcon = New-Object System.Windows.Forms.NotifyIcon
$trayIcon.Text = 'Seerr (Stopped)'
$trayIcon.Icon = $iconStopped
$trayIcon.Visible = $true

$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$menuOpen = $contextMenu.Items.Add('Open Seerr')
$menuOpen.Font = New-Object System.Drawing.Font($menuOpen.Font, [System.Drawing.FontStyle]::Bold)

$null = $contextMenu.Items.Add('-')  # separator

$menuStart = $contextMenu.Items.Add('Start')
$menuStop = $contextMenu.Items.Add('Stop')
$menuStop.Enabled = $false

$null = $contextMenu.Items.Add('-')  # separator

$menuExit = $contextMenu.Items.Add('Exit')

$trayIcon.ContextMenuStrip = $contextMenu

# --- Functions ---
function Start-Seerr {
    if ($script:seerrProcess -and -not $script:seerrProcess.HasExited) { return }

    $env:NODE_ENV = 'production'
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'node'
    $psi.Arguments = 'dist/index.js'
    $psi.WorkingDirectory = $SeerrDir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.EnvironmentVariables['NODE_ENV'] = 'production'
    $psi.EnvironmentVariables['PORT'] = "$Port"

    $script:seerrProcess = [System.Diagnostics.Process]::Start($psi)

    $trayIcon.Icon = $iconRunning
    $trayIcon.Text = "Seerr (Running on port $Port)"
    $trayIcon.ShowBalloonTip(2000, 'Seerr', "Server started on port $Port", 'Info')

    $menuStart.Enabled = $false
    $menuStop.Enabled = $true
}

function Stop-Seerr {
    if ($script:seerrProcess -and -not $script:seerrProcess.HasExited) {
        $script:seerrProcess.Kill()
        $script:seerrProcess.WaitForExit(5000)
        $script:seerrProcess.Dispose()
        $script:seerrProcess = $null
    }

    $trayIcon.Icon = $iconStopped
    $trayIcon.Text = 'Seerr (Stopped)'
    $trayIcon.ShowBalloonTip(2000, 'Seerr', 'Server stopped', 'Info')

    $menuStart.Enabled = $true
    $menuStop.Enabled = $false
}

function Open-Seerr {
    Start-Process $script:baseUrl
}

# --- Event handlers ---
$menuOpen.Add_Click({ Open-Seerr })
$menuStart.Add_Click({ Start-Seerr })
$menuStop.Add_Click({ Stop-Seerr })
$menuExit.Add_Click({
    Stop-Seerr
    $trayIcon.Visible = $false
    $trayIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$trayIcon.Add_DoubleClick({ Open-Seerr })

# --- Auto-start the server ---
Start-Seerr

# --- Run the message loop ---
[System.Windows.Forms.Application]::Run()
