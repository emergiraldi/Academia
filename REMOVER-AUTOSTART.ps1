Write-Host "🗑️ Removendo auto-start do Sistema Academia..." -ForegroundColor Cyan
Write-Host ""

# Verificar se está executando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  AVISO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Clique com botão direito no arquivo e escolha 'Executar como Administrador'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

# 1. Parar processo Node.js se estiver rodando
Write-Host "🛑 Parando processos do Sistema Academia..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*Academia*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Remover tarefa agendada
Write-Host "🗑️ Removendo tarefa agendada..." -ForegroundColor Yellow
Unregister-ScheduledTask -TaskName "Sistema Academia AutoStart" -Confirm:$false -ErrorAction SilentlyContinue

# 3. Verificar
Write-Host ""
$task = Get-ScheduledTask -TaskName "Sistema Academia AutoStart" -ErrorAction SilentlyContinue

if ($null -eq $task) {
    Write-Host "✅ Auto-start removido com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "ℹ️  O sistema não vai mais iniciar automaticamente ao ligar o PC" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para iniciar manualmente:" -ForegroundColor Yellow
    Write-Host "   • Dê duplo clique em: start-academia.bat" -ForegroundColor White
    Write-Host "   • Ou execute: npm start" -ForegroundColor White
} else {
    Write-Host "❌ Erro ao remover auto-start" -ForegroundColor Red
    Write-Host "Tente remover manualmente pelo Agendador de Tarefas do Windows" -ForegroundColor Yellow
}

Write-Host ""
pause
