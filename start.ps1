# ============================================================================
#   Virtual Hydraulic Turbine - One-Click Launcher
#   Starts: InfluxDB -> Modbus Server -> Data Harvester -> FastAPI -> Frontend
# ============================================================================

$Host.UI.RawUI.WindowTitle = "Turbine Launcher"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  ======================================================" -ForegroundColor Cyan
Write-Host "    Virtual Hydraulic Turbine - Starting All Services" -ForegroundColor Cyan
Write-Host "  ======================================================" -ForegroundColor Cyan
Write-Host ""

# Track all spawned processes so we can kill them on exit
$procIds = @()

# -- Cleanup stale processes from previous runs --------------------------------
Write-Host "  [0/5] Cleaning up stale processes..." -ForegroundColor DarkGray
foreach ($port in @(8086, 5020, 8000, 5173)) {
    $listening = netstat -ano 2>$null | Select-String ":$port\s+.*LISTENING"
    foreach ($match in $listening) {
        $stalePid = ($match -split '\s+')[-1]
        if ($stalePid -and $stalePid -ne "0") {
            taskkill /PID $stalePid /F 2>$null | Out-Null
            Write-Host "    Freed port $port (killed PID $stalePid)" -ForegroundColor DarkGray
        }
    }
}
Get-Process -Name "node" -ErrorAction SilentlyContinue |
    Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# -- Helper: wait for a TCP port to become available --
function Wait-ForPort {
    param([int]$Port, [int]$TimeoutSec = 15, [string]$Label)
    Write-Host "  [..] Waiting for $Label on port $Port..." -ForegroundColor DarkGray -NoNewline
    $elapsed = 0
    while ($elapsed -lt $TimeoutSec) {
        # Try IPv4 first, then IPv6 (Vite/Node often binds to ::1 only)
        foreach ($addr in @("127.0.0.1", "::1")) {
            try {
                $tcp = New-Object System.Net.Sockets.TcpClient
                $tcp.Connect($addr, $Port)
                $tcp.Close()
                Write-Host " Ready!" -ForegroundColor Green
                return $true
            } catch {
                # not ready on this address, try next
            }
        }
        Start-Sleep -Milliseconds 500
        $elapsed += 0.5
    }
    Write-Host " Timeout!" -ForegroundColor Red
    return $false
}

# -- 1. InfluxDB ---------------------------------------------------------------
Write-Host "  [1/5] Starting InfluxDB..." -ForegroundColor Yellow
$influx = Start-Process -FilePath "$ROOT\influxd.exe" `
    -WorkingDirectory $ROOT `
    -WindowStyle Minimized `
    -PassThru
$procIds += $influx.Id
Wait-ForPort -Port 8086 -Label "InfluxDB" -TimeoutSec 20

# -- 2. Modbus Server ----------------------------------------------------------
Write-Host "  [2/5] Starting Modbus Server..." -ForegroundColor Yellow
$modbus = Start-Process -FilePath "python" `
    -ArgumentList "`"$ROOT\backend\modbus_server.py`"" `
    -WorkingDirectory "$ROOT\backend" `
    -WindowStyle Minimized `
    -PassThru
$procIds += $modbus.Id
Wait-ForPort -Port 5020 -Label "Modbus Server" -TimeoutSec 10

# -- 3. Data Harvester ---------------------------------------------------------
Write-Host "  [3/5] Starting Data Harvester..." -ForegroundColor Yellow
$harvester = Start-Process -FilePath "python" `
    -ArgumentList "`"$ROOT\backend\data_harvester.py`"" `
    -WorkingDirectory "$ROOT\backend" `
    -WindowStyle Minimized `
    -PassThru
$procIds += $harvester.Id
Start-Sleep -Seconds 2

# -- 4. FastAPI Backend ---------------------------------------------------------
Write-Host "  [4/5] Starting FastAPI Backend..." -ForegroundColor Yellow
$api = Start-Process -FilePath "python" `
    -ArgumentList "`"$ROOT\backend\fast_api.py`"" `
    -WorkingDirectory "$ROOT\backend" `
    -WindowStyle Minimized `
    -PassThru
$procIds += $api.Id
Wait-ForPort -Port 8000 -Label "FastAPI" -TimeoutSec 10

# -- 5. Frontend Dev Server ----------------------------------------------------
Write-Host "  [5/5] Starting Frontend..." -ForegroundColor Yellow
$frontend = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c cd /d `"$ROOT\frontend`" && npx vite --port 5173 --strictPort" `
    -WindowStyle Minimized `
    -PassThru
$procIds += $frontend.Id
# Vite starts in ~1s but binds to IPv6 only, which TcpClient can't reliably detect
Start-Sleep -Seconds 3
Write-Host "  [..] Frontend launched on port 5173" -ForegroundColor Green

# -- Done ----------------------------------------------------------------------
Write-Host ""
Write-Host "  ======================================================" -ForegroundColor Green
Write-Host "    All Services Running!" -ForegroundColor Green
Write-Host "  ======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "    Dashboard  :  http://localhost:5173"  -ForegroundColor Cyan
Write-Host "    API        :  http://localhost:8000/api/live-data" -ForegroundColor DarkGray
Write-Host "    InfluxDB   :  http://localhost:8086"  -ForegroundColor DarkGray
Write-Host "    Modbus     :  localhost:5020"          -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Press ENTER to stop all services and exit." -ForegroundColor Yellow
Write-Host ""

# Open the dashboard in the default browser
Start-Process "http://localhost:5173"

# Wait for user to press Enter
Read-Host

# -- Cleanup: kill all spawned processes ----------------------------------------
Write-Host ""
Write-Host "  Shutting down all services..." -ForegroundColor Yellow

foreach ($procId in $procIds) {
    try {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc -and !$proc.HasExited) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "    Stopped PID $procId ($($proc.ProcessName))" -ForegroundColor DarkGray
        }
    } catch {}
}

# Also clean up any child node processes from npm
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.StartTime -gt (Get-Date).AddHours(-2)
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "  All services stopped. Goodbye!" -ForegroundColor Green
Write-Host ""
