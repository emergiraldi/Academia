# Script para remover tarefa agendada do Toletus HUB

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REMOVER SERVIÇO TOLETUS HUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está executando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Clique com botão direito no script e selecione 'Executar como Administrador'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

# Nome da tarefa
$taskName = "ToletusHubAutoStart"

# Verificar se tarefa existe
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if (-not $task) {
    Write-Host "Tarefa '$taskName' não encontrada." -ForegroundColor Yellow
    Write-Host "O serviço não está configurado." -ForegroundColor White
    Write-Host ""
    pause
    exit
}

Write-Host "Tarefa encontrada: $taskName" -ForegroundColor Green
Write-Host "Status: $($task.State)" -ForegroundColor White
Write-Host ""

$confirmar = Read-Host "Deseja remover a tarefa agendada? (s/n)"

if ($confirmar -eq "s") {
    Write-Host ""
    Write-Host "Removendo tarefa..." -ForegroundColor Yellow

    # Parar a tarefa se estiver rodando
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

    # Remover a tarefa
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "TAREFA REMOVIDA COM SUCESSO!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "O Toletus HUB não será mais iniciado automaticamente." -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    Write-Host ""
}

pause
