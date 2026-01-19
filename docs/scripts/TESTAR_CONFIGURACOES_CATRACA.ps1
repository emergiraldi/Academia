# Script para testar todas as combinações de FlowControl e SetEntryClockwise
# Objetivo: Encontrar a configuração correta onde:
#   - DIREITA: BLOQUEADA (só libera com reconhecimento facial)
#   - ESQUERDA: LIVRE (sempre pode passar)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE DE CONFIGURAÇÕES DA CATRACA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "OBJETIVO:" -ForegroundColor Yellow
Write-Host "  - Lado DIREITO: BLOQUEADO (entrada controlada)" -ForegroundColor Yellow
Write-Host "  - Lado ESQUERDO: LIVRE (saída sempre liberada)" -ForegroundColor Yellow
Write-Host ""

# Bypass SSL certificate validation
add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint svcPoint, X509Certificate certificate,
            WebRequest request, int certificateProblem) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

$ip = "192.168.0.100"
$port = 3000
$hubUrl = "https://localhost:7067"

$body = @{
    Ip = $ip
    Port = $port
    Type = "LiteNet3"
} | ConvertTo-Json

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "TESTE 1: Mode 0 + EntryClockwise FALSE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

try {
    Invoke-RestMethod -Uri "$hubUrl/LiteNet3Commands/SetFlowControl?controlledFlow=0" -Method POST -Body $body -ContentType "application/json"
    Invoke-RestMethod -Uri "$hubUrl/LiteNet3Commands/SetEntryClockwise?entryClockwise=false" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Configurado: Mode 0 + EntryClockwise FALSE" -ForegroundColor Green
    Write-Host ""
    Write-Host "TESTE AGORA:" -ForegroundColor Cyan
    Write-Host "  - Tente empurrar DIREITA: Deve estar BLOQUEADO" -ForegroundColor White
    Write-Host "  - Tente empurrar ESQUERDA: Deve estar LIVRE" -ForegroundColor White
    Write-Host ""
    $resultado1 = Read-Host "Funcionou corretamente? (s/n)"
    if ($resultado1 -eq "s") {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "CONFIGURAÇÃO CORRETA ENCONTRADA!" -ForegroundColor Green
        Write-Host "Mode: 0" -ForegroundColor Green
        Write-Host "EntryClockwise: false" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        exit
    }
} catch {
    Write-Host "✗ Erro: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "TESTE 2: Mode 0 + EntryClockwise TRUE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

try {
    Invoke-RestMethod -Uri "$hubUrl/LiteNet3Commands/SetFlowControl?controlledFlow=0" -Method POST -Body $body -ContentType "application/json"
    Invoke-RestMethod -Uri "$hubUrl/LiteNet3Commands/SetEntryClockwise?entryClockwise=true" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Configurado: Mode 0 + EntryClockwise TRUE" -ForegroundColor Green
    Write-Host ""
    Write-Host "TESTE AGORA:" -ForegroundColor Cyan
    Write-Host "  - Tente empurrar DIREITA: Deve estar BLOQUEADO" -ForegroundColor White
    Write-Host "  - Tente empurrar ESQUERDA: Deve estar LIVRE" -ForegroundColor White
    Write-Host ""
    $resultado2 = Read-Host "Funcionou corretamente? (s/n)"
    if ($resultado2 -eq "s") {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "CONFIGURAÇÃO CORRETA ENCONTRADA!" -ForegroundColor Green
        Write-Host "Mode: 0" -ForegroundColor Green
        Write-Host "EntryClockwise: true" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        exit
    }
} catch {
    Write-Host "✗ Erro: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "TESTE 3: Mode 7 + EntryClockwise FALSE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

try {
    Invoke-RestMethod -Uri "$hubUrl/LiteNet3Commands/SetFlowControl?controlledFlow=7" -Method POST -Body $body -ContentType "application/json"
    Invoke-RestMethod -Uri "$hubUrl/LiteNet3Commands/SetEntryClockwise?entryClockwise=false" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Configurado: Mode 7 + EntryClockwise FALSE" -ForegroundColor Green
    Write-Host ""
    Write-Host "TESTE AGORA:" -ForegroundColor Cyan
    Write-Host "  - Tente empurrar DIREITA: Deve estar BLOQUEADO" -ForegroundColor White
    Write-Host "  - Tente empurrar ESQUERDA: Deve estar LIVRE" -ForegroundColor White
    Write-Host ""
    $resultado3 = Read-Host "Funcionou corretamente? (s/n)"
    if ($resultado3 -eq "s") {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "CONFIGURAÇÃO CORRETA ENCONTRADA!" -ForegroundColor Green
        Write-Host "Mode: 7" -ForegroundColor Green
        Write-Host "EntryClockwise: false" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        exit
    }
} catch {
    Write-Host "✗ Erro: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "TESTE 4: Mode 7 + EntryClockwise TRUE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

try {
    Invoke-RestMethod -Uri "$hubUrl/LiteNet3Commands/SetFlowControl?controlledFlow=7" -Method POST -Body $body -ContentType "application/json"
    Invoke-RestMethod -Uri "$hubUrl/LiteNet3Commands/SetEntryClockwise?entryClockwise=true" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Configurado: Mode 7 + EntryClockwise TRUE" -ForegroundColor Green
    Write-Host ""
    Write-Host "TESTE AGORA:" -ForegroundColor Cyan
    Write-Host "  - Tente empurrar DIREITA: Deve estar BLOQUEADO" -ForegroundColor White
    Write-Host "  - Tente empurrar ESQUERDA: Deve estar LIVRE" -ForegroundColor White
    Write-Host ""
    $resultado4 = Read-Host "Funcionou corretamente? (s/n)"
    if ($resultado4 -eq "s") {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "CONFIGURAÇÃO CORRETA ENCONTRADA!" -ForegroundColor Green
        Write-Host "Mode: 7" -ForegroundColor Green
        Write-Host "EntryClockwise: true" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        exit
    }
} catch {
    Write-Host "✗ Erro: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "TESTANDO OUTROS MODES..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# Testar modes 1, 2, 3, 6
$modes = @(1, 2, 3, 6)

foreach ($mode in $modes) {
    Write-Host ""
    Write-Host "Testando Mode $mode..." -ForegroundColor Cyan

    try {
        Invoke-RestMethod -Uri "$hubUrl/LiteNet3Commands/SetFlowControl?controlledFlow=$mode" -Method POST -Body $body -ContentType "application/json"
        Write-Host "✓ Mode $mode configurado" -ForegroundColor Green
        Write-Host "TESTE: Direita BLOQUEADO? Esquerda LIVRE?" -ForegroundColor White
        $resultado = Read-Host "Funcionou? (s/n)"
        if ($resultado -eq "s") {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "CONFIGURAÇÃO ENCONTRADA!" -ForegroundColor Green
            Write-Host "Mode: $mode" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            exit
        }
    } catch {
        Write-Host "✗ Erro no Mode $mode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "Nenhuma configuração funcionou!" -ForegroundColor Red
Write-Host "Consulte o manual da catraca LiteNet3" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
