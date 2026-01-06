# 🔧 Guia do Técnico de Campo - SysFit Pro

> Manual simplificado para instalação e configuração do Agent nas academias

---

## 📋 Índice

1. [O que é o Agent?](#o-que-é-o-agent)
2. [Requisitos da Academia](#requisitos-da-academia)
3. [Passo a Passo - Instalação](#passo-a-passo---instalação)
4. [Configuração Automática (Rodar ao Ligar PC)](#configuração-automática-rodar-ao-ligar-pc)
5. [Comandos Principais](#comandos-principais)
6. [Problemas Comuns](#problemas-comuns)
7. [Checklist de Instalação](#checklist-de-instalação)

---

## 🤖 O que é o Agent?

O **Agent** é um programa que roda no computador da academia e faz a comunicação entre:

- **Control ID** (catraca com reconhecimento facial) ↔ **Sistema na Nuvem**

### Como Funciona?

```
Aluno aproxima do Control ID
        ↓
Control ID tira foto
        ↓
Agent pega foto e envia para nuvem
        ↓
Sistema verifica se aluno está liberado
        ↓
Agent recebe resposta e abre/bloqueia catraca
```

**IMPORTANTE:** O Agent precisa estar **sempre rodando** enquanto a academia estiver aberta!

---

## 💻 Requisitos da Academia

### Computador

- **Windows 10 ou 11** (64-bit)
- **RAM:** Mínimo 4GB
- **Disco:** 500MB livre
- **Processador:** Qualquer dual-core

### Internet

- **Conexão:** Mínimo 10 Mbps
- **Tipo:** Wi-Fi ou Cabo (Cabo é preferível)
- **Portas:** 8080 e 443 abertas

### Rede Local

- Control ID e computador na **mesma rede**
- IP do Control ID acessível (ex: `192.168.1.100`)

---

## 📥 Passo a Passo - Instalação

### ETAPA 1: Obter Dados da Academia

Antes de ir à academia, você precisa de:

1. **Agent ID** - Fornecido pelo suporte (ex: `academia-5`)
2. **Token de Autenticação** - Fornecido pelo suporte
3. **IP do Control ID** - Fornecido pela academia

### ETAPA 2: Instalar Node.js

1. **Baixar Node.js 20:**
   - Acesse: https://nodejs.org
   - Baixe a versão **LTS (Recomendada)**
   - Arquivo: `node-v20.x.x-x64.msi`

2. **Instalar:**
   - Execute o instalador
   - Clique em **Next > Next > Next > Install**
   - Aguarde finalizar
   - Clique em **Finish**

3. **Verificar Instalação:**
   - Abra o **Prompt de Comando** (CMD)
   - Digite: `node -v`
   - Deve aparecer: `v20.x.x`

### ETAPA 3: Baixar o Agent

1. **Copiar pasta do Agent:**
   - Copie a pasta `agent` do pen drive para `C:\SysFit\agent`
   - Ou baixe do repositório

2. **Estrutura de pastas:**
   ```
   C:\SysFit\
   └── agent\
       ├── index.js
       ├── package.json
       ├── .env           ← (você vai criar)
       └── node_modules\   ← (será criado)
   ```

### ETAPA 4: Instalar Dependências

1. Abra o **Prompt de Comando** (CMD)
2. Navegue até a pasta:
   ```cmd
   cd C:\SysFit\agent
   ```

3. Instale as dependências:
   ```cmd
   npm install
   ```

4. Aguarde terminar (pode demorar 1-2 minutos)

### ETAPA 5: Configurar o Agent

1. **Criar arquivo .env:**
   - Dentro de `C:\SysFit\agent\`
   - Copie o arquivo `.env.example` e renomeie para `.env`

2. **Editar arquivo .env:**
   - Abra com Bloco de Notas
   - Preencha com os dados:

```env
# IP do Control ID na rede local
LEITORA_IP=192.168.1.100
LEITORA_USER=admin
LEITORA_PASSWORD=admin

# URL do servidor (NÃO MUDAR)
VPS_URL=wss://www.sysfitpro.com.br/agent

# ID desta academia (FORNECIDO PELO SUPORTE)
AGENT_ID=academia-5

# Token de autenticação (FORNECIDO PELO SUPORTE)
AUTH_TOKEN=ad76d57f0deb1ee559c661411bec3d02b36dbef1b81a8f34ac98a61121ec7423
```

3. **Salvar e fechar**

### ETAPA 6: Testar o Agent

1. No Prompt de Comando, na pasta `C:\SysFit\agent`:
   ```cmd
   node index.js
   ```

2. **O que deve aparecer:**
   ```
   [INFO] Iniciando agent academia-5
   [INFO] Conectando ao VPS: wss://www.sysfitpro.com.br/agent
   [SUCCESS] ✓ Conectado ao servidor VPS!
   [SUCCESS] ✓ Autenticado como academia-5
   [INFO] Agent pronto e aguardando comandos...
   ```

3. **Se deu certo:**
   - ✅ Deixe rodando e passe para ETAPA 7

4. **Se deu erro:**
   - ❌ Veja seção [Problemas Comuns](#problemas-comuns)
   - Para parar: Pressione `Ctrl + C`

---

## ⚙️ Configuração Automática (Rodar ao Ligar PC)

### Opção 1: Usando PM2 (Recomendado)

PM2 é um gerenciador de processos que mantém o Agent rodando automaticamente.

#### Instalar PM2

```cmd
npm install -g pm2
npm install -g pm2-windows-startup
```

#### Configurar PM2 para iniciar com Windows

```cmd
pm2-startup install
```

#### Adicionar o Agent ao PM2

```cmd
cd C:\SysFit\agent
pm2 start index.js --name "agent-sysfitpro"
pm2 save
```

#### Comandos Úteis do PM2

```cmd
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs agent-sysfitpro

# Reiniciar agent
pm2 restart agent-sysfitpro

# Parar agent
pm2 stop agent-sysfitpro

# Remover do PM2
pm2 delete agent-sysfitpro
```

### Opção 2: Usando NSSM (Alternativa)

NSSM transforma o Agent em um serviço do Windows.

#### Baixar NSSM

1. Acesse: https://nssm.cc/download
2. Baixe `nssm-2.24.zip`
3. Extraia para `C:\SysFit\nssm\`

#### Instalar como Serviço

```cmd
cd C:\SysFit\nssm\win64
nssm install SysFitAgent
```

**Configurar na janela que abrir:**

- **Path:** `C:\Program Files\nodejs\node.exe`
- **Startup directory:** `C:\SysFit\agent`
- **Arguments:** `index.js`
- **Service name:** `SysFitAgent`

Clique em **Install service**

#### Iniciar Serviço

```cmd
nssm start SysFitAgent
```

#### Comandos Úteis NSSM

```cmd
# Ver status
nssm status SysFitAgent

# Parar serviço
nssm stop SysFitAgent

# Reiniciar serviço
nssm restart SysFitAgent

# Remover serviço
nssm remove SysFitAgent confirm
```

### Opção 3: Script .bat com Agendador de Tarefas

#### Criar Script

1. Criar arquivo `start-agent.bat` em `C:\SysFit\agent\`:

```bat
@echo off
cd C:\SysFit\agent
node index.js
pause
```

2. Salvar o arquivo

#### Configurar Agendador de Tarefas

1. Abra o **Agendador de Tarefas** do Windows
2. Clique em **Criar Tarefa Básica**
3. Nome: `SysFit Agent`
4. Gatilho: **Quando o computador iniciar**
5. Ação: **Iniciar um programa**
6. Programa: `C:\SysFit\agent\start-agent.bat`
7. Marcar: ✅ **Executar com privilégios mais altos**
8. Finalizar

---

## 🎮 Comandos Principais

### Verificar se Agent está rodando (PM2)

```cmd
pm2 status
```

**Resultado esperado:**
```
┌─────┬──────────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ mode    │ status  │ restart  │
├─────┼──────────────────┼─────────┼─────────┼──────────┤
│ 0   │ agent-sysfitpro  │ fork    │ online  │ 0        │
└─────┴──────────────────┴─────────┴─────────┴──────────┘
```

### Ver Logs (PM2)

```cmd
# Últimos 100 logs
pm2 logs agent-sysfitpro --lines 100

# Logs em tempo real (Ctrl+C para sair)
pm2 logs agent-sysfitpro
```

### Reiniciar Agent (PM2)

```cmd
pm2 restart agent-sysfitpro
```

### Testar Conexão Manual

```cmd
cd C:\SysFit\agent
node index.js
```

---

## 🔧 Problemas Comuns

### ❌ Erro: "node não é reconhecido como comando"

**Causa:** Node.js não instalado ou não está no PATH

**Solução:**
1. Reinstale o Node.js
2. Durante instalação, marque: **Adicionar ao PATH**
3. Reinicie o Prompt de Comando

### ❌ Erro: "Cannot find module"

**Causa:** Dependências não instaladas

**Solução:**
```cmd
cd C:\SysFit\agent
npm install
```

### ❌ Erro: "WebSocket connection failed"

**Causa:** Sem internet ou firewall bloqueando

**Solução:**
1. Verificar conexão com internet
2. Testar: `ping www.sysfitpro.com.br`
3. Se der erro, problema é internet/DNS
4. Configurar firewall para liberar porta 443 e 8080

### ❌ Erro: "Control ID não responde"

**Causa:** IP do Control ID errado ou rede diferente

**Solução:**
1. Verificar IP do Control ID:
   - Ir até o Control ID
   - Menu > Rede > Ver IP
2. Testar ping: `ping 192.168.1.100`
3. Se não pingar:
   - Computador e Control ID devem estar na **mesma rede**
   - Verificar cabo de rede ou Wi-Fi

### ❌ Erro: "Authentication failed"

**Causa:** Agent ID ou Token incorretos

**Solução:**
1. Abrir arquivo `.env`
2. Verificar se `AGENT_ID` e `AUTH_TOKEN` estão corretos
3. Contatar suporte para confirmar dados

### ❌ Agent para de funcionar sozinho

**Causa:** Não configurado para auto-start

**Solução:**
1. Configurar PM2 ou NSSM (ver seção [Configuração Automática](#configuração-automática-rodar-ao-ligar-pc))
2. Verificar se serviço está rodando
3. PM2: `pm2 status`
4. NSSM: `nssm status SysFitAgent`

### ❌ Computador reiniciou e Agent não voltou

**Causa:** Auto-start não configurado

**Solução:**
1. Configurar PM2:
   ```cmd
   cd C:\SysFit\agent
   pm2 start index.js --name "agent-sysfitpro"
   pm2 save
   pm2-startup install
   ```

---

## ✅ Checklist de Instalação

Use este checklist para garantir que tudo foi configurado:

### Antes de ir à academia

- [ ] Agent ID obtido do suporte
- [ ] Token de autenticação obtido do suporte
- [ ] IP do Control ID obtido da academia
- [ ] Pen drive com pasta `agent` preparado
- [ ] Instalador do Node.js baixado

### Na academia

- [ ] Node.js instalado (`node -v` funciona)
- [ ] Pasta `C:\SysFit\agent` criada
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado com dados corretos
- [ ] Teste manual funcionou (`node index.js`)
- [ ] PM2 ou NSSM instalado e configurado
- [ ] Agent rodando em background (`pm2 status`)
- [ ] Computador reiniciado e Agent voltou sozinho
- [ ] Teste de acesso na catraca realizado com sucesso

### Antes de sair

- [ ] Agent rodando: ✅
- [ ] Logs sem erros: ✅
- [ ] Catraca liberando acesso: ✅
- [ ] Auto-start funcionando: ✅
- [ ] Responsável da academia orientado
- [ ] Telefone do suporte deixado com academia

---

## 📞 Contato com Suporte

### Quando chamar o suporte?

- Agent não conecta após todas as tentativas
- Control ID não responde
- Agent ID ou Token incorretos
- Problemas na liberação de acesso

### Informações para passar ao suporte:

1. **Nome da academia**
2. **Agent ID** (exemplo: `academia-5`)
3. **Erro exato** (copie a mensagem de erro)
4. **Logs do Agent:**
   ```cmd
   pm2 logs agent-sysfitpro --lines 50
   ```
5. **Teste de conexão:**
   ```cmd
   ping www.sysfitpro.com.br
   ping 192.168.1.100
   ```

### Contatos

- **Email:** suporte@sysfitpro.com.br
- **WhatsApp Suporte:** (XX) XXXXX-XXXX
- **Horário:** Segunda a Sexta, 9h às 18h

---

## 🎯 Resumo Rápido

### Para instalar pela primeira vez:

```cmd
# 1. Instalar Node.js (baixar de nodejs.org)

# 2. Copiar pasta agent para C:\SysFit\agent

# 3. Instalar dependências
cd C:\SysFit\agent
npm install

# 4. Configurar arquivo .env com dados da academia

# 5. Instalar PM2 globalmente
npm install -g pm2
npm install -g pm2-windows-startup

# 6. Configurar auto-start
pm2-startup install
pm2 start index.js --name "agent-sysfitpro"
pm2 save

# 7. Verificar status
pm2 status
```

### Para verificar se está funcionando:

```cmd
# Ver status
pm2 status

# Ver logs
pm2 logs agent-sysfitpro
```

### Para reiniciar:

```cmd
pm2 restart agent-sysfitpro
```

---

## 📸 Dicas Visuais

### Como deve estar o PM2 rodando:

```
┌─────┬──────────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ mode    │ status  │ restart  │
├─────┼──────────────────┼─────────┼─────────┼──────────┤
│ 0   │ agent-sysfitpro  │ fork    │ online  │ 0        │  ← Deve estar "online"
└─────┴──────────────────┴─────────┴─────────┴──────────┘
```

### Como devem estar os logs:

```
[INFO] Iniciando agent academia-5
[SUCCESS] ✓ Conectado ao servidor VPS!
[SUCCESS] ✓ Autenticado como academia-5
[INFO] Agent pronto e aguardando comandos...
[INFO] Received: {"type":"check_access","student_id":123}
[SUCCESS] Access granted for student 123
```

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0.0

---

## 📝 Anotações do Técnico

Use este espaço para anotar informações da instalação:

**Academia:**
**Data da Instalação:**
**Agent ID:**
**IP Control ID:**
**IP Computador:**
**Observações:**

---
