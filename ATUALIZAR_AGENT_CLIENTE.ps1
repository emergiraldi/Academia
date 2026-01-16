# Script para atualizar agent.js no cliente
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   ATUALIZADOR DE AGENT - CLIENTE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$origem = "C:\Projeto\Academia\agent\agent.js"
$destino = "C:\SysFit\agent\agent.js"

# Verificar se arquivo de origem existe
if (-not (Test-Path $origem)) {
    Write-Host "ERRO: Arquivo de origem nao encontrado!" -ForegroundColor Red
    Write-Host "Procurando em: $origem" -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar se pasta de destino existe
$pastaDestino = Split-Path $destino -Parent
if (-not (Test-Path $pastaDestino)) {
    Write-Host "ERRO: Pasta de destino nao encontrada!" -ForegroundColor Red
    Write-Host "Procurando em: $pastaDestino" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "1. Parando processos Node.js do agent..." -ForegroundColor Yellow
try {
    # Tentar parar processos node que estejam rodando agent.js
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*agent.js*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "   Processos parados!" -ForegroundColor Green
} catch {
    Write-Host "   Nenhum processo encontrado ou erro ao parar" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "2. Copiando agent.js atualizado..." -ForegroundColor Yellow
try {
    Copy-Item -Path $origem -Destination $destino -Force
    Write-Host "   Arquivo copiado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "   ERRO ao copiar arquivo!" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "3. Iniciando agent no cliente..." -ForegroundColor Yellow
Write-Host ""

try {
    Push-Location $pastaDestino
    Write-Host "Iniciando agent em: $pastaDestino" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "   AGENT RODANDO - Nao feche esta janela!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""

    # Iniciar o agent
    npm start
} catch {
    Write-Host "ERRO ao iniciar agent!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
} finally {
    Pop-Location
}

pause
