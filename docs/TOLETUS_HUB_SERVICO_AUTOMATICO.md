# Toletus HUB - Inicialização Automática

Configuração para o Toletus HUB iniciar automaticamente ao reiniciar a máquina.

## Por Que Configurar Inicialização Automática?

Sem a configuração automática, é necessário:
1. Abrir `C:\SysFit\agent\START_TOLETUS_HUB.bat` manualmente toda vez
2. Manter a janela do CMD/PowerShell aberta
3. Lembrar de iniciar após reiniciar o computador

Com o serviço automático:
✅ Inicia sozinho ao ligar o PC
✅ Não precisa manter janela aberta
✅ Reinicia automaticamente se der erro
✅ Não precisa estar logado no Windows

## Instalação do Serviço

### Passo 1: Executar Script de Instalação

**Clique com botão direito** em `CRIAR_SERVICO_TOLETUS.ps1` e selecione **"Executar como Administrador"**

Arquivo localizado em:
- `C:\SysFit\agent\CRIAR_SERVICO_TOLETUS.ps1`
- `C:\Projeto\Academia\docs\scripts\CRIAR_SERVICO_TOLETUS.ps1`

Ou via PowerShell (como Admin):
```powershell
cd C:\SysFit\agent
.\CRIAR_SERVICO_TOLETUS.ps1
```

### Passo 2: Confirmar Instalação

O script irá:
1. Verificar se está rodando como Administrador
2. Procurar o executável `dotnet.exe`
3. Verificar se o projeto Toletus HUB existe
4. Criar tarefa agendada chamada `ToletusHubAutoStart`
5. Perguntar se deseja iniciar agora

Responda **`s`** para iniciar imediatamente.

### Passo 3: Verificar

Abrir **Agendador de Tarefas** do Windows:
1. Pressionar `Win + R`
2. Digitar `taskschd.msc` e Enter
3. Procurar por `ToletusHubAutoStart`
4. Verificar se Status está "Pronto" ou "Em execução"

## Comandos Úteis

### Ver Status da Tarefa
```powershell
Get-ScheduledTask -TaskName "ToletusHubAutoStart"
```

### Iniciar Manualmente
```powershell
Start-ScheduledTask -TaskName "ToletusHubAutoStart"
```

### Parar
```powershell
Stop-ScheduledTask -TaskName "ToletusHubAutoStart"
```

### Verificar Se Toletus HUB Está Rodando
```powershell
# Testar conexão
Invoke-WebRequest -Uri "https://localhost:7067" -SkipCertificateCheck

# Ver processos dotnet
Get-Process -Name dotnet

# Ver logs (Event Viewer)
Get-WinEvent -LogName "Microsoft-Windows-TaskScheduler/Operational" | Where-Object {$_.Message -like "*ToletusHubAutoStart*"} | Select-Object -First 10
```

## Remover Serviço

### Opção 1: Via Script (Recomendado)

**Executar como Administrador:**
```powershell
cd C:\SysFit\agent
.\REMOVER_SERVICO_TOLETUS.ps1
```

### Opção 2: Via PowerShell Direto
```powershell
# Para a tarefa
Stop-ScheduledTask -TaskName "ToletusHubAutoStart" -ErrorAction SilentlyContinue

# Remove a tarefa
Unregister-ScheduledTask -TaskName "ToletusHubAutoStart" -Confirm:$false
```

### Opção 3: Via Interface Gráfica
1. Abrir Agendador de Tarefas (`taskschd.msc`)
2. Encontrar `ToletusHubAutoStart`
3. Clique direito → Excluir

## Configuração da Tarefa

A tarefa agendada criada possui:

**Gatilhos (Triggers):**
- Ao iniciar o sistema (At Startup)
- Ao fazer login (At Logon)

**Configurações:**
- Executar se em bateria: Sim
- Não parar se mudar para bateria: Sim
- Iniciar se disponível: Sim
- Reiniciar em caso de falha: 3 tentativas com intervalo de 1 minuto
- Executar como: SYSTEM (não precisa usuário logado)
- Executar com privilégios elevados: Sim

**Comando Executado:**
```
C:\Program Files\dotnet\dotnet.exe
```

**Argumentos:**
```
run --urls https://localhost:7067 --project "C:\SysFit\agent\hub-main\src\Toletus.Hub.API\Toletus.Hub.API.csproj"
```

**Diretório de Trabalho:**
```
C:\SysFit\agent\hub-main\src\Toletus.Hub.API
```

## Troubleshooting

### Serviço não inicia

**1. Verificar se dotnet está instalado:**
```powershell
dotnet --version
```

Se não estiver instalado, baixar em: https://dotnet.microsoft.com/download

**2. Verificar caminho do projeto:**
```powershell
Test-Path "C:\SysFit\agent\hub-main\src\Toletus.Hub.API"
```

**3. Ver logs da tarefa:**
```powershell
Get-WinEvent -LogName "Microsoft-Windows-TaskScheduler/Operational" -MaxEvents 50 | Where-Object {$_.Message -like "*ToletusHubAutoStart*"}
```

### Serviço inicia mas Toletus HUB não responde

**1. Verificar processo dotnet:**
```powershell
Get-Process -Name dotnet | Select-Object Id, StartTime, Path
```

**2. Testar manualmente:**
```powershell
cd C:\SysFit\agent
.\START_TOLETUS_HUB.bat
```

### Erro "Precisa ser executado como Administrador"

Clique com botão direito no script `.ps1` e selecione **"Executar como Administrador"**.

Ou abra PowerShell como Admin:
1. Pressionar `Win + X`
2. Selecionar "Windows PowerShell (Admin)"
3. Navegar para pasta e executar script

## Logs e Monitoramento

### Ver Todos os Processos Dotnet
```powershell
Get-Process -Name dotnet | Format-Table -AutoSize
```

### Matar Processo Dotnet (se necessário)
```powershell
Get-Process -Name dotnet | Where-Object {$_.Path -like "*Toletus*"} | Stop-Process -Force
```

### Reiniciar Serviço Completamente
```powershell
# Parar
Stop-ScheduledTask -TaskName "ToletusHubAutoStart"

# Aguardar 5 segundos
Start-Sleep -Seconds 5

# Matar qualquer processo dotnet do Toletus
Get-Process -Name dotnet | Where-Object {$_.Path -like "*Toletus*"} | Stop-Process -Force

# Aguardar 3 segundos
Start-Sleep -Seconds 3

# Iniciar novamente
Start-ScheduledTask -TaskName "ToletusHubAutoStart"

# Aguardar 5 segundos
Start-Sleep -Seconds 5

# Testar
Invoke-WebRequest -Uri "https://localhost:7067" -SkipCertificateCheck
```

## Benefícios

✅ **Sem Intervenção Manual**: Inicia automaticamente após reiniciar PC
✅ **Alta Disponibilidade**: Reinicia automaticamente em caso de falha
✅ **Execução em Background**: Não precisa manter janela aberta
✅ **Independente de Usuário**: Roda como SYSTEM, não precisa login
✅ **Recuperação Automática**: 3 tentativas de restart com intervalo de 1 minuto

## Data de Configuração

19/01/2026 - Documentação criada
