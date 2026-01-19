# Teste Mode 7 - Entrada Bloqueada, Saída Livre

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE MODE 7 - ENTRADA BLOQUEADA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Bypass SSL certificate validation
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

$body = '{"Ip":"192.168.0.100","Port":3000,"Type":1}'

Write-Host "Configurando Mode 7 + EntryClockwise FALSE..." -ForegroundColor Yellow
Write-Host ""

try {
    # Mode 7: Entrada Bloqueada, Saída Livre
    $result1 = Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetFlowControl?controlledFlow=7" -Method POST -Body $body -ContentType "application/json"
    Write-Host "SetFlowControl(7): $result1" -ForegroundColor Green

    Start-Sleep -Seconds 2

    # EntryClockwise = false
    $result2 = Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetEntryClockwise?entryClockwise=false" -Method POST -Body $body -ContentType "application/json"
    Write-Host "SetEntryClockwise(false): $result2" -ForegroundColor Green

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "CONFIGURAÇÃO APLICADA!" -ForegroundColor Cyan
    Write-Host "Mode: 7 (Entrada Bloqueada, Saída Livre)" -ForegroundColor White
    Write-Host "EntryClockwise: false" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "TESTE AGORA:" -ForegroundColor Yellow
    Write-Host "  - Lado ESQUERDO: Deve estar BLOQUEADO" -ForegroundColor White
    Write-Host "  - Lado DIREITO: Deve estar LIVRE" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host "ERRO: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Se não funcionar, teste com EntryClockwise=TRUE:" -ForegroundColor Yellow
Write-Host ""
$testarTrue = Read-Host "Testar com EntryClockwise=TRUE? (s/n)"

if ($testarTrue -eq "s") {
    Write-Host ""
    Write-Host "Configurando Mode 7 + EntryClockwise TRUE..." -ForegroundColor Yellow

    try {
        $result3 = Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetFlowControl?controlledFlow=7" -Method POST -Body $body -ContentType "application/json"
        Write-Host "SetFlowControl(7): $result3" -ForegroundColor Green

        Start-Sleep -Seconds 2

        $result4 = Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetEntryClockwise?entryClockwise=true" -Method POST -Body $body -ContentType "application/json"
        Write-Host "SetEntryClockwise(true): $result4" -ForegroundColor Green

        Write-Host ""
        Write-Host "TESTE AGORA:" -ForegroundColor Yellow
        Write-Host "  - Lado ESQUERDO: Deve estar BLOQUEADO" -ForegroundColor White
        Write-Host "  - Lado DIREITO: Deve estar LIVRE" -ForegroundColor White

    } catch {
        Write-Host "ERRO: $_" -ForegroundColor Red
    }
}
