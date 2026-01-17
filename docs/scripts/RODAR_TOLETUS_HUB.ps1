# Script PowerShell para rodar Toletus HUB
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "     TOLETUS HUB - Servidor Local" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciando Toletus HUB na porta 7067..." -ForegroundColor Yellow
Write-Host "Este programa precisa ficar rodando!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Green
Write-Host ""

# Detectar caminho automaticamente
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$hubPath = Join-Path $scriptPath "hub-main\hub-main\src\Toletus.Hub.API"

# Verificar se o caminho existe
if (-not (Test-Path $hubPath)) {
    Write-Host "ERRO: Caminho nao encontrado!" -ForegroundColor Red
    Write-Host "Procurando em: $hubPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Certifique-se de que a estrutura esta correta:" -ForegroundColor Yellow
    Write-Host "  C:\Academia\" -ForegroundColor Cyan
    Write-Host "  ├── hub-main\" -ForegroundColor Cyan
    Write-Host "  ├── agent\" -ForegroundColor Cyan
    Write-Host "  └── RODAR_TOLETUS_HUB.ps1" -ForegroundColor Cyan
    pause
    exit 1
}

Write-Host "Caminho encontrado: $hubPath" -ForegroundColor Green
Write-Host ""

try {
    Push-Location $hubPath
    dotnet run --urls "https://localhost:7067"
} catch {
    Write-Host "Erro ao acessar o caminho: $hubPath" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
} finally {
    Pop-Location
}

pause
