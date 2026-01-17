# 📋 Checklist - Instalação Toletus HUB no Cliente

## 🎯 O que o cliente precisa ter

### Hardware:
- ✅ Catraca LiteNet (Toletus) instalada e ligada
- ✅ Cabo de rede conectando a catraca ao roteador/switch
- ✅ Computador Windows na mesma rede (pode ser o mesmo do Control ID)
- ✅ Leitora Control ID (se usar integração híbrida)

---

## 📦 PASSO 1: Preparar o Computador do Cliente

### 1.1 Verificar se tem .NET 9 instalado:
```powershell
dotnet --version
```

**Se não tiver**, instalar de: https://dotnet.microsoft.com/download/dotnet/9.0

### 1.2 Verificar se tem Node.js instalado:
```bash
node --version
npm --version
```

**Se não tiver**, instalar de: https://nodejs.org (versão LTS)

---

## 📁 PASSO 2: Copiar Arquivos para o Cliente

### Copiar estas pastas/arquivos para o computador do cliente:

```
C:\Academia\
├── hub-main\                    # Código do Toletus HUB
├── agent\                       # Agent local
│   ├── agent.js
│   ├── package.json
│   ├── .env.example
│   └── node_modules\
├── RODAR_TOLETUS_HUB.ps1       # Script para iniciar HUB
└── CONFIGURAR_AGENT.bat        # Script para configurar agent
```

---

## ⚙️ PASSO 3: Configurar no Cliente

### 3.1 Configurar o Agent:

Criar arquivo `agent\.env` com:

```env
# IP da leitora Control ID (se tiver)
LEITORA_IP=192.168.X.XXX
LEITORA_PORT=80
LEITORA_USERNAME=admin
LEITORA_PASSWORD=admin

# URL do servidor VPS (PRODUÇÃO)
VPS_URL=wss://www.sysfitpro.com.br/agent

# ID único desta academia (pegar no painel admin)
AGENT_ID=academia-X

# Token de autenticação (pegar no painel admin)
AUTH_TOKEN=XXXXXXXXXXXXX

# URL do Toletus HUB (SEMPRE localhost)
TOLETUS_HUB_URL=https://localhost:7067
```

**IMPORTANTE**:
- `AGENT_ID` = pegar no painel de parâmetros da academia
- `AUTH_TOKEN` = pegar no painel de parâmetros da academia
- `LEITORA_IP` = descobrir na rede local do cliente

### 3.2 Instalar dependências do agent:

```bash
cd C:\Academia\agent
npm install
```

---

## 🚀 PASSO 4: Iniciar os Serviços

### 4.1 Iniciar Toletus HUB:

**Duplo clique em:** `RODAR_TOLETUS_HUB.ps1`

Vai aparecer:
```
================================================
     TOLETUS HUB - Servidor Local
================================================

Iniciando Toletus HUB na porta 7067...
Now listening on: https://localhost:7067
Application started.
```

✅ **Deixar essa janela aberta! Não pode fechar!**

### 4.2 Iniciar o Agent:

Abrir PowerShell/CMD em `C:\Academia\agent` e rodar:

```bash
npm start
```

Ou para rodar em background (PM2):
```bash
npm install -g pm2
pm2 start agent.js --name academia-agent
pm2 save
pm2 startup
```

---

## 🌐 PASSO 5: Configurar no Painel Web

### 5.1 Acessar painel admin da academia:
`https://www.sysfitpro.com.br/admin`

### 5.2 Ir em Parâmetros → Sistema de Catraca:
- Selecionar: **"Toletus HUB"**
- Salvar

### 5.3 Ir em Menu → Toletus HUB:

1. **Verificar Status do HUB**
   - Deve mostrar: ✅ Online

2. **Descobrir Dispositivos**
   - Clique no botão
   - Aguarde 10-20 segundos
   - Vai listar todas as catracas LiteNet encontradas

3. **Cadastrar cada catraca:**
   - Nome: "Entrada Principal"
   - Localização: "Recepção"
   - Ativa: ✅ Sim
   - Salvar

---

## 🔍 PASSO 6: Descobrir IP da Catraca (se necessário)

### Opção 1: Toletus Gerenciador (RECOMENDADO)
1. Baixar: https://downloads.toletus.com/toletusgerenciador2
2. Executar como administrador
3. Vai mostrar todas as catracas Toletus na rede

### Opção 2: Verificar no Roteador
1. Acessar roteador (192.168.0.1 ou 192.168.1.1)
2. Ver dispositivos conectados
3. Procurar "Toletus" ou "LiteNet"

### Opção 3: Varredura de rede
```bash
# Usar o discovery do Toletus HUB (já faz isso automaticamente)
curl -k https://localhost:7067/DeviceConnection/DiscoverDevices
```

---

## ✅ PASSO 7: Testar

### 7.1 Teste Manual:
1. Ir em **Alunos**
2. Clicar no ícone 🚪 ao lado de um aluno ativo
3. Selecionar a catraca
4. Clicar "Liberar Entrada"
5. ✅ Catraca deve abrir!

### 7.2 Teste Automático (Híbrido):
1. Aluno passa na **Control ID**
2. Control ID reconhece o rosto ✅
3. **Automaticamente** libera a catraca Toletus 🚪
4. Aluno passa pela catraca

---

## 🔧 Solução de Problemas

### Catraca não foi descoberta?
- ✅ Verificar se está ligada na energia
- ✅ Verificar cabo de rede conectado
- ✅ Ping no IP da catraca
- ✅ Usar Toletus Gerenciador para confirmar

### Toletus HUB não inicia?
- ✅ Verificar se .NET 9 está instalado
- ✅ Verificar se porta 7067 está livre
- ✅ Executar PowerShell como administrador

### Agent não conecta?
- ✅ Verificar AGENT_ID e AUTH_TOKEN
- ✅ Verificar internet (precisa acessar VPS)
- ✅ Ver logs: `npm start` (mostram o erro)

### Liberação não funciona?
- ✅ Verificar se tipo de catraca = "Toletus HUB"
- ✅ Verificar se dispositivo está ativo
- ✅ Ver logs do Toletus HUB (janela PowerShell)
- ✅ Testar liberação manual primeiro

---

## 🔄 Inicialização Automática (IMPORTANTE!)

Para o sistema funcionar sempre, **mesmo após reiniciar o PC**:

### Windows - Tarefa Agendada:

1. **Toletus HUB:**
   - Tecla Windows + R → `taskschd.msc`
   - Criar Tarefa Básica
   - Nome: "Toletus HUB"
   - Gatilho: Ao iniciar o sistema
   - Ação: Executar programa
   - Programa: `powershell.exe`
   - Argumentos: `-ExecutionPolicy Bypass -File "C:\Academia\RODAR_TOLETUS_HUB.ps1"`
   - ✅ Executar com privilégios mais altos

2. **Agent (Opção PM2 - Recomendado):**
   ```bash
   npm install -g pm2-windows-startup
   pm2-startup install
   pm2 save
   ```

---

## 📞 Suporte Técnico

### Logs para enviar em caso de problema:

**Toletus HUB:**
- Copiar texto da janela PowerShell

**Agent:**
- Se npm start: copiar terminal
- Se PM2: `pm2 logs academia-agent`

**Sistema:**
- Ir em painel admin → Logs de Acesso
- Filtrar por últimas 24h

---

## 📝 Resumo Rápido

**No computador do cliente:**
1. ✅ Instalar .NET 9 e Node.js
2. ✅ Copiar pastas hub-main e agent
3. ✅ Configurar agent\.env
4. ✅ Rodar RODAR_TOLETUS_HUB.ps1
5. ✅ Rodar agent (npm start)
6. ✅ Acessar painel web → configurar
7. ✅ Descobrir e cadastrar catracas
8. ✅ Testar liberação
9. ✅ Configurar inicialização automática

**Tempo estimado:** 30-45 minutos
