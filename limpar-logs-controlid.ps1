# Script para limpar logs antigos da Control ID
# Academia 33 - Studio Vem Dançar

$controlIdIp = "192.168.0.129"
$controlIdPort = 80
$username = "admin"
$password = "admin"

Write-Host "`n🔧 LIMPEZA DE LOGS - CONTROL ID" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "🔐 Fazendo login na Control ID ($controlIdIp)..." -ForegroundColor Yellow

# 1. Login
$loginUrl = "http://${controlIdIp}:${controlIdPort}/login.fcgi"
$loginBody = @{
    login = $username
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $session = $loginResponse.session

    Write-Host "✅ Login OK! Sessão: $session`n" -ForegroundColor Green

    # 2. Carregar logs atuais
    Write-Host "📊 Carregando logs atuais..." -ForegroundColor Yellow
    $logsUrl = "http://${controlIdIp}:${controlIdPort}/load_objects.fcgi?session=$session"
    $logsBody = @{ object = "access_logs" } | ConvertTo-Json

    $logsResponse = Invoke-RestMethod -Uri $logsUrl -Method POST -Body $logsBody -ContentType "application/json" -ErrorAction Stop
    $totalLogs = $logsResponse.access_logs.Count

    Write-Host "📋 Total de logs: $totalLogs`n" -ForegroundColor Cyan

    if ($totalLogs -eq 0) {
        Write-Host "✅ Nenhum log para limpar!" -ForegroundColor Green
        exit
    }

    # 3. Mostrar logs mais antigo e mais recente
    $timestamps = $logsResponse.access_logs | ForEach-Object { $_.time }
    $oldestTimestamp = ($timestamps | Measure-Object -Minimum).Minimum
    $newestTimestamp = ($timestamps | Measure-Object -Maximum).Maximum

    $oldest = [DateTimeOffset]::FromUnixTimeSeconds($oldestTimestamp).LocalDateTime
    $newest = [DateTimeOffset]::FromUnixTimeSeconds($newestTimestamp).LocalDateTime

    Write-Host "   📅 Mais antigo: $oldest" -ForegroundColor Gray
    Write-Host "   📅 Mais recente: $newest`n" -ForegroundColor Gray

    # 4. Calcular timestamp de corte (1 hora atrás)
    $cutoffTime = [int]([DateTimeOffset]::Now.ToUnixTimeSeconds() - 3600)
    $oldLogs = $logsResponse.access_logs | Where-Object { $_.time -lt $cutoffTime }
    $oldLogsCount = $oldLogs.Count

    Write-Host "🗑️  Logs a deletar (mais de 1h): $oldLogsCount" -ForegroundColor Yellow
    Write-Host "💾 Logs a manter: $($totalLogs - $oldLogsCount)`n" -ForegroundColor Green

    if ($oldLogsCount -eq 0) {
        Write-Host "✅ Nenhum log antigo para deletar!" -ForegroundColor Green
        exit
    }

    # 5. Deletar logs antigos
    Write-Host "🗑️  Deletando $oldLogsCount logs antigos..." -ForegroundColor Yellow
    $deleteUrl = "http://${controlIdIp}:${controlIdPort}/destroy_objects.fcgi?session=$session"
    $deleteBody = @{
        object = "access_logs"
        where = @{
            access_logs = @{
                time = @{ "<" = $cutoffTime }
            }
        }
    } | ConvertTo-Json -Depth 5

    Invoke-RestMethod -Uri $deleteUrl -Method POST -Body $deleteBody -ContentType "application/json" -ErrorAction Stop | Out-Null

    Write-Host "✅ Logs deletados com sucesso!`n" -ForegroundColor Green

    # 6. Verificar resultado
    Write-Host "📊 Verificando resultado..." -ForegroundColor Yellow
    $logsResponse2 = Invoke-RestMethod -Uri $logsUrl -Method POST -Body $logsBody -ContentType "application/json" -ErrorAction Stop
    $remainingLogs = $logsResponse2.access_logs.Count

    Write-Host "✅ Logs restantes: $remainingLogs" -ForegroundColor Green
    Write-Host "✅ Logs deletados: $($totalLogs - $remainingLogs)`n" -ForegroundColor Green

    Write-Host "🎉 CONCLUÍDO! Buffer da Control ID liberado!" -ForegroundColor Green
    Write-Host "`n👉 Agora peça para alguém passar o rosto na leitora para testar." -ForegroundColor Cyan
    Write-Host "   A catraca deve abrir AUTOMATICAMENTE em 1-2 segundos!" -ForegroundColor Cyan

} catch {
    Write-Host "`n❌ ERRO: $_" -ForegroundColor Red
    Write-Host "`nDetalhes:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`nPressione Enter para sair..."
Read-Host
