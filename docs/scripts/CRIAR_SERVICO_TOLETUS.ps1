# Script para criar tarefa agendada do Toletus HUB
# Executa automaticamente ao iniciar o Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CRIAR SERVIÇO TOLETUS HUB" -ForegroundColor Cyan
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

Write-Host "Criando tarefa agendada para Toletus HUB..." -ForegroundColor Yellow
Write-Host ""

# Nome da tarefa
$taskName = "ToletusHubAutoStart"

# Verificar se tarefa já existe
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Tarefa '$taskName' já existe. Removendo..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Caminho completo do executável dotnet
$dotnetPath = "C:\Program Files\dotnet\dotnet.exe"

# Verificar se dotnet existe
if (-not (Test-Path $dotnetPath)) {
    Write-Host "ERRO: dotnet.exe não encontrado em $dotnetPath" -ForegroundColor Red
    Write-Host "Procurando dotnet em outros locais..." -ForegroundColor Yellow

    # Tentar encontrar dotnet
    $dotnetPath = (Get-Command dotnet -ErrorAction SilentlyContinue).Source

    if (-not $dotnetPath) {
        Write-Host "ERRO: dotnet não encontrado no sistema!" -ForegroundColor Red
        Write-Host "Instale o .NET SDK: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
        pause
        exit
    }

    Write-Host "dotnet encontrado em: $dotnetPath" -ForegroundColor Green
}

# Diretório do projeto
$workingDir = "C:\SysFit\agent\hub-main\src\Toletus.Hub.API"

# Verificar se diretório existe
if (-not (Test-Path $workingDir)) {
    Write-Host "ERRO: Diretório do Toletus HUB não encontrado!" -ForegroundColor Red
    Write-Host "Caminho esperado: $workingDir" -ForegroundColor Yellow
    pause
    exit
}

# Argumentos para o dotnet
$arguments = "run --urls https://localhost:7067 --project `"$workingDir\Toletus.Hub.API.csproj`""

# Criar ação da tarefa
$action = New-ScheduledTaskAction `
    -Execute $dotnetPath `
    -Argument $arguments `
    -WorkingDirectory $workingDir

# Criar trigger (ao iniciar o sistema)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Criar trigger adicional (ao fazer login)
$triggerLogin = New-ScheduledTaskTrigger -AtLogOn

# Configurações da tarefa
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Criar principal (executar com permissões mais altas)
$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# Registrar a tarefa
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger @($trigger, $triggerLogin) `
    -Settings $settings `
    -Principal $principal `
    -Description "Inicia o Toletus HUB automaticamente ao iniciar o Windows"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "TAREFA CRIADA COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Nome da tarefa: $taskName" -ForegroundColor White
Write-Host "Inicia: Ao iniciar o Windows e ao fazer login" -ForegroundColor White
Write-Host "Executa como: SYSTEM" -ForegroundColor White
Write-Host ""
Write-Host "Para verificar: Abra 'Agendador de Tarefas' e procure por '$taskName'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar manualmente agora:" -ForegroundColor Yellow
Write-Host "Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host ""
Write-Host "Para remover a tarefa:" -ForegroundColor Yellow
Write-Host "Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor White
Write-Host ""

$iniciarAgora = Read-Host "Deseja iniciar o Toletus HUB agora? (s/n)"

if ($iniciarAgora -eq "s") {
    Write-Host ""
    Write-Host "Iniciando Toletus HUB..." -ForegroundColor Yellow
    Start-ScheduledTask -TaskName $taskName
    Start-Sleep -Seconds 3

    # Verificar se está rodando
    Write-Host "Verificando se Toletus HUB está rodando..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:7067" -SkipCertificateCheck -TimeoutSec 5 -ErrorAction Stop
        Write-Host ""
        Write-Host "✅ Toletus HUB está rodando!" -ForegroundColor Green
        Write-Host "URL: https://localhost:7067" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "⚠️ Não foi possível confirmar se está rodando." -ForegroundColor Yellow
        Write-Host "Verifique em 'Agendador de Tarefas' se a tarefa está em execução." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Cyan
pause
