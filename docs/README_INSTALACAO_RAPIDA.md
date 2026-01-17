# 🚀 Instalação Rápida - Cliente com Toletus HUB

## 📦 O que levar para o cliente:

```
1. Pasta completa do projeto Academia
2. Instaladores:
   - .NET 9 SDK (https://dotnet.microsoft.com/download/dotnet/9.0)
   - Node.js LTS (https://nodejs.org)
```

---

## ⚡ Passo a Passo (30 minutos)

### 1️⃣ Preparar Ambiente (5 min)

No computador do cliente:

```bash
# Instalar .NET 9
dotnet --version   # Verificar

# Instalar Node.js
node --version     # Verificar
npm --version      # Verificar
```

---

### 2️⃣ Configurar Agent (5 min)

```bash
cd C:\Academia\agent
CONFIGURAR_AGENT.bat
```

Vai pedir:
- **AGENT_ID**: pegar no painel admin da academia (ex: `academia-5`)
- **AUTH_TOKEN**: pegar no painel admin da academia
- **IP da Control ID**: descobrir na rede (ex: `192.168.1.142`)

---

### 3️⃣ Iniciar Serviços (2 min)

**Terminal 1 - Toletus HUB:**
```powershell
.\RODAR_TOLETUS_HUB.ps1
```
✅ Deixar aberto! Deve mostrar: `Now listening on: https://localhost:7067`

**Terminal 2 - Agent:**
```bash
cd agent
npm start
```
✅ Deve conectar ao VPS: `WebSocket conectado!`

---

### 4️⃣ Configurar no Painel Web (10 min)

Acessar: `https://www.sysfitpro.com.br/admin`

1. **Parâmetros → Sistema de Catraca**
   - Selecionar: "Toletus HUB"
   - Salvar ✅

2. **Menu → Toletus HUB**
   - Clicar "Verificar Status" → ✅ Online
   - Clicar "Descobrir Dispositivos"
   - Aguardar 10-20 seg
   - Cadastrar cada catraca encontrada

---

### 5️⃣ Testar (5 min)

**Teste Manual:**
- Ir em Alunos
- Clicar 🚪 ao lado de um aluno
- Selecionar catraca
- Liberar entrada
- ✅ Catraca deve abrir!

**Teste Automático (Híbrido):**
- Aluno passa na Control ID
- ✅ Rosto reconhecido
- ✅ Catraca Toletus abre automaticamente!

---

### 6️⃣ Inicialização Automática (5 min)

**PM2 (recomendado):**
```bash
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install

cd C:\Academia\agent
pm2 start agent.js --name academia-agent
pm2 save
```

**Toletus HUB (Tarefa Agendada):**
- Tecla Windows + R → `taskschd.msc`
- Criar Tarefa Básica
- Executar ao iniciar: `powershell.exe -ExecutionPolicy Bypass -File "C:\Academia\RODAR_TOLETUS_HUB.ps1"`

---

## 🔍 Solução Rápida de Problemas

### Catraca não descobriu?
```bash
# Verificar se está conectada:
ping 192.168.X.XXX

# Usar Toletus Gerenciador:
# https://downloads.toletus.com/toletusgerenciador2
```

### Agent não conecta?
```bash
# Verificar .env:
cd agent
type .env

# Ver erro nos logs
npm start
```

### Liberação não funciona?
- Painel → Parâmetros → Tipo = "Toletus HUB" ✅
- Toletus HUB rodando ✅
- Agent conectado ✅
- Dispositivo ativo ✅

---

## 📋 Checklist Final

- [ ] .NET 9 instalado
- [ ] Node.js instalado
- [ ] Agent configurado (.env)
- [ ] Toletus HUB rodando (porta 7067)
- [ ] Agent conectado ao VPS
- [ ] Tipo de catraca = "Toletus HUB"
- [ ] Dispositivos descobertos e cadastrados
- [ ] Teste manual funcionando
- [ ] Teste automático funcionando
- [ ] PM2 configurado
- [ ] Tarefa agendada criada

---

## 📞 Suporte

**Documentação completa:** `INSTALACAO_CLIENTE_TOLETUS.md`

**Logs importantes:**
- Toletus HUB: janela PowerShell
- Agent: terminal ou `pm2 logs academia-agent`
- Sistema: painel admin → Logs

**Contato:** integracao@toletus.com (suporte Toletus)
