# Teste: DIREITA BLOQUEADA, ESQUERDA LIVRE

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR: DIREITA BLOQUEADA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Objetivo:" -ForegroundColor Yellow
Write-Host "  - DIREITA: BLOQUEADA (entrada controlada)" -ForegroundColor Yellow
Write-Host "  - ESQUERDA: LIVRE (saída)" -ForegroundColor Yellow
Write-Host ""

# Bypass SSL
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

$body = '{"Ip":"192.168.0.100","Port":3000,"Type":1}'

Write-Host "========================================" -ForegroundColor Green
Write-Host "TESTE 1: Mode 0 + EntryClockwise TRUE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

try {
    $r1 = Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetFlowControl?controlledFlow=0" -Method POST -Body $body -ContentType "application/json"
    Write-Host "SetFlowControl(0): $r1" -ForegroundColor Green

    Start-Sleep -Seconds 2

    $r2 = Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetEntryClockwise?entryClockwise=true" -Method POST -Body $body -ContentType "application/json"
    Write-Host "SetEntryClockwise(true): $r2" -ForegroundColor Green

    Write-Host ""
    Write-Host "TESTE AGORA:" -ForegroundColor Cyan
    Write-Host "  - DIREITA: Deve estar BLOQUEADO" -ForegroundColor White
    Write-Host "  - ESQUERDA: Deve estar LIVRE" -ForegroundColor White
    Write-Host ""
    $resultado = Read-Host "Funcionou? (s/n)"

    if ($resultado -ne "s") {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "TESTE 2: Mode 7 + EntryClockwise TRUE" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green

        $r3 = Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetFlowControl?controlledFlow=7" -Method POST -Body $body -ContentType "application/json"
        Write-Host "SetFlowControl(7): $r3" -ForegroundColor Green

        Start-Sleep -Seconds 2

        $r4 = Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetEntryClockwise?entryClockwise=true" -Method POST -Body $body -ContentType "application/json"
        Write-Host "SetEntryClockwise(true): $r4" -ForegroundColor Green

        Write-Host ""
        Write-Host "TESTE AGORA:" -ForegroundColor Cyan
        Write-Host "  - DIREITA: Deve estar BLOQUEADO" -ForegroundColor White
        Write-Host "  - ESQUERDA: Deve estar LIVRE" -ForegroundColor White
        Write-Host ""
        $resultado2 = Read-Host "Funcionou? (s/n)"

        if ($resultado2 -ne "s") {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Yellow
            Write-Host "Testando Mode 1 (Ambos Controlados)..." -ForegroundColor Yellow
            Write-Host "========================================" -ForegroundColor Yellow

            $r5 = Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetFlowControl?controlledFlow=1" -Method POST -Body $body -ContentType "application/json"
            Write-Host "SetFlowControl(1): $r5" -ForegroundColor Green

            Write-Host ""
            Write-Host "TESTE: Ambos lados devem estar bloqueados" -ForegroundColor White
        }
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SUCESSO!" -ForegroundColor Green
        Write-Host "Configuração: Mode 0 + EntryClockwise TRUE" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    }

} catch {
    Write-Host "ERRO: $_" -ForegroundColor Red
}
