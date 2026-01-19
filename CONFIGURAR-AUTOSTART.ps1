Write-Host "🚀 Configurando Sistema Academia para auto-start..." -ForegroundColor Cyan
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

# 1. Criar script BAT para iniciar o Sistema
Write-Host "📝 Criando script de inicialização..." -ForegroundColor Yellow
$batContent = @'
@echo off
title Sistema Academia - Starting...
cd /d C:\Projeto\Academia
npm start
'@

Set-Content -Path "C:\Projeto\Academia\START_ACADEMIA.bat" -Value $batContent

# 2. Criar VBScript para executar invisível (sem janela)
Write-Host "🔒 Criando launcher invisível..." -ForegroundColor Yellow
$vbsContent = @'
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "C:\Projeto\Academia\START_ACADEMIA.bat", 0, False
'@

Set-Content -Path "C:\Projeto\Academia\START_ACADEMIA_INVISIBLE.vbs" -Value $vbsContent

# 3. Remover tarefa antiga se existir
Write-Host "🗑️ Removendo configurações antigas..." -ForegroundColor Yellow
Unregister-ScheduledTask -TaskName "Sistema Academia AutoStart" -Confirm:$false -ErrorAction SilentlyContinue

# 4. Criar tarefa agendada para auto-start
Write-Host "⚙️ Criando tarefa agendada..." -ForegroundColor Yellow

$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument '"C:\Projeto\Academia\START_ACADEMIA_INVISIBLE.vbs"' -WorkingDirectory "C:\Projeto\Academia"

# Trigger: Iniciar no boot do sistema (com delay de 30 segundos)
$trigger = New-ScheduledTaskTrigger -AtStartup
$trigger.Delay = "PT30S"

# Principal: Executar com privilégios de usuário atual
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Highest

# Settings: Configurações da tarefa
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit 0 `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Registrar a tarefa
Register-ScheduledTask `
    -TaskName "Sistema Academia AutoStart" `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Inicia o Sistema Academia automaticamente no boot do Windows (porta 5000)" `
    -Force

# 5. Verificar
Write-Host ""
Write-Host "📊 Status da tarefa:" -ForegroundColor Yellow
Get-ScheduledTask -TaskName "Sistema Academia AutoStart" | Format-Table -Property TaskName, State, @{Label="Next Run";Expression={$_.NextRunTime}}

Write-Host ""
Write-Host "✅ Sistema Academia configurado para iniciar automaticamente!" -ForegroundColor Green
Write-Host ""
Write-Host "ℹ️  Informações:" -ForegroundColor Cyan
Write-Host "   • O sistema vai iniciar automaticamente ao ligar o PC" -ForegroundColor White
Write-Host "   • Delay de 30 segundos após o boot para garantir que a rede esteja pronta" -ForegroundColor White
Write-Host "   • Executa invisível (sem janelas)" -ForegroundColor White
Write-Host "   • Reinicia automaticamente se falhar (até 3 tentativas)" -ForegroundColor White
Write-Host "   • Acesse: http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "🎮 Gerenciamento:" -ForegroundColor Cyan
Write-Host "   • Para PARAR: Abra o Gerenciador de Tarefas e finalize 'Node.js'" -ForegroundColor White
Write-Host "   • Para DESATIVAR auto-start: Execute REMOVER-AUTOSTART.ps1" -ForegroundColor White
Write-Host "   • Para VER STATUS: Abra 'Agendador de Tarefas' do Windows" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Quer iniciar o sistema agora? (s/n): " -ForegroundColor Yellow -NoNewline
$resposta = Read-Host

if ($resposta -eq 's' -or $resposta -eq 'S') {
    Write-Host ""
    Write-Host "🚀 Iniciando Sistema Academia..." -ForegroundColor Green
    Start-Process -FilePath "wscript.exe" -ArgumentList "C:\Projeto\Academia\START_ACADEMIA_INVISIBLE.vbs"
    Start-Sleep -Seconds 3
    Write-Host "✅ Sistema iniciado! Acesse: http://localhost:5000" -ForegroundColor Green
    Start-Process "http://localhost:5000"
}

Write-Host ""
pause
