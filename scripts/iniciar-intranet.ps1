param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $root 'data'
$logsDir = Join-Path $root 'logs'
$pidFile = Join-Path $dataDir 'server.pid'
$url = 'http://127.0.0.1:8088'
$healthUrl = "$url/api/health"

New-Item -ItemType Directory -Force -Path $dataDir, $logsDir | Out-Null

function Test-Intranet {
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
        return $response.status -eq 'ok' -and $response.application -eq 'Intranet SSP'
    } catch {
        return $false
    }
}

function Find-Python {
    $bundled = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
    if (Test-Path $bundled) {
        return @{ File = $bundled; Arguments = @() }
    }

    $python = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($python -and $python.Source -notlike '*WindowsApps*') {
        return @{ File = $python.Source; Arguments = @() }
    }

    $py = Get-Command py.exe -ErrorAction SilentlyContinue
    if ($py) {
        return @{ File = $py.Source; Arguments = @('-3') }
    }

    throw 'Python 3 não foi encontrado. Instale o Python 3 ou execute pelo ambiente do Codex.'
}

Write-Host 'Intranet SSP - Inicialização' -ForegroundColor Cyan

if (-not (Test-Intranet)) {
    if (Test-Path $pidFile) {
        $savedPid = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($savedPid -match '^\d+$') {
            Stop-Process -Id ([int]$savedPid) -ErrorAction SilentlyContinue
        }
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }

    $runtime = Find-Python
    $launcher = Join-Path $PSScriptRoot 'launch-server.py'
    $arguments = @($runtime.Arguments) + @($launcher, $root)
    $stderr = Join-Path $logsDir 'server-error.log'

    Write-Host 'Iniciando o servidor...' -ForegroundColor Yellow
    & $runtime.File @arguments
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $pidFile)) {
        throw "Falha ao criar o processo do servidor. Consulte: $stderr"
    }
    $serverPid = [int](Get-Content $pidFile | Select-Object -First 1)
    $process = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
    if (-not $process) { throw "O processo do servidor não permaneceu ativo. Consulte: $stderr" }

    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 250
        if (Test-Intranet) { $ready = $true; break }
        if ($process.HasExited) { break }
    }

    if (-not $ready) {
        throw "O servidor não respondeu. Consulte: $stderr"
    }
}

Write-Host "Aplicação disponível em $url" -ForegroundColor Green
if (-not $NoBrowser) {
    Start-Process $url
}
