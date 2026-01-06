# Agent Local - Control ID

Documentação técnica completa do sistema de Agent Local para comunicação entre VPS e leitoras Control ID.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Componentes](#componentes)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Desenvolvimento](#desenvolvimento)
- [Deploy](#deploy)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### Problema

Quando o sistema está hospedado em uma VPS (servidor na nuvem), o backend não consegue acessar diretamente a leitora Control ID que está na rede local do cliente, pois:

- Leitora tem IP privado (192.168.x.x)
- Não é acessível pela internet
- Ficaria exposta se fosse aberta para internet

### Solução: Agent Local

Um **agent local** é um pequeno programa que roda no cliente e faz a "ponte" entre a VPS e a leitora:

```
VPS (nuvem) ←→ Agent (cliente) ←→ Leitora Control ID (rede local)
```

**Vantagens:**
- ✅ Funciona com sistema hospedado
- ✅ Seguro (agent inicia conexão, sem portas abertas)
- ✅ Reconexão automática
- ✅ Funciona offline (cache local)
- ✅ Baixo custo (PC simples ou Raspberry Pi)

---

## 🏗️ Arquitetura

### Diagrama Completo

```
┌─────────────────────────────────────────────────┐
│  FRONTEND (Navegador)                           │
│  - React/TypeScript                             │
│  - Interface de gerenciamento                   │
└────────────┬────────────────────────────────────┘
             │ HTTPS
             ▼
┌─────────────────────────────────────────────────┐
│  VPS - Backend Node.js                          │
│  ├─ Express + tRPC                              │
│  ├─ ControlIdService (modo agent)               │
│  └─ AgentWebSocket Server (porta 8080)          │
└────────────┬────────────────────────────────────┘
             │ WSS (WebSocket Secure)
             │ Criptografado (TLS)
             │ Autenticação: Bearer Token
             ▼
┌─────────────────────────────────────────────────┐
│  CLIENTE - Agent Local                          │
│  - Node.js                                      │
│  - Conecta na VPS via WebSocket                 │
│  - Executa comandos HTTP na leitora             │
│  - Reconexão automática                         │
└────────────┬────────────────────────────────────┘
             │ HTTP (rede local)
             │ IP: 192.168.x.x
             ▼
┌─────────────────────────────────────────────────┐
│  Leitora Control ID (iDFace)                    │
│  - IP local: 192.168.2.142:80                   │
│  - API REST HTTP                                │
│  - Reconhecimento facial                        │
└─────────────────────────────────────────────────┘
```

### Fluxo de Comunicação

**Exemplo: Cadastrar Face**

1. Admin clica "Cadastrar Face" no navegador
2. Frontend → VPS via HTTPS
3. VPS → Agent via WebSocket: `{ action: 'enrollFace', data: {...} }`
4. Agent → Leitora via HTTP: `POST /user_set_image.fcgi`
5. Leitora processa e retorna resultado
6. Agent → VPS via WebSocket: `{ success: true, data: {...} }`
7. VPS → Frontend via HTTPS
8. Frontend mostra "✅ Face cadastrada!"

**Tempo total:** ~600-800ms

---

## 🔧 Componentes

### 1. Agent Local (`agent/agent.js`)

**Responsabilidades:**
- Conectar na VPS via WebSocket
- Receber comandos da VPS
- Executar HTTP na leitora Control ID
- Enviar respostas para VPS
- Reconexão automática
- Logs detalhados

**Tecnologias:**
- Node.js 16+
- ws (WebSocket client)
- axios (HTTP client)
- dotenv (variáveis de ambiente)

**Comandos suportados:**
- `login` - Login na leitora
- `createUser` - Criar usuário
- `enrollFace` - Cadastro facial interativo
- `uploadFaceImage` - Upload de foto
- `blockUserAccess` - Bloquear acesso
- `unblockUserAccess` - Desbloquear acesso
- `deleteUser` - Deletar usuário
- `loadAccessLogs` - Carregar logs
- `checkStatus` - Verificar status
- `getUserImage` - Obter imagem do usuário
- `listUsersWithFaces` - Listar usuários com face
- `removeUserFace` - Remover face

### 2. WebSocket Server (`server/agentWebSocket.ts`)

**Responsabilidades:**
- Gerenciar conexões de agents
- Rotear comandos para agents corretos
- Gerenciar timeouts e retries
- Monitorar saúde das conexões
- Limpar conexões mortas

**Recursos:**
- Autenticação via token
- Ping/pong para keep-alive
- Request/response pattern
- Suporte a múltiplos agents simultâneos
- Shutdown gracioso

**API:**
```typescript
// Enviar comando para agent
await sendCommandToAgent(agentId, action, data, timeout);

// Verificar se agent está conectado
isAgentConnected(agentId);

// Listar agents conectados
listConnectedAgents();

// Obter estatísticas
getStats();
```

### 3. ControlIdService Modificado (`server/controlId.ts`)

**Modos de operação:**

**Modo Direct (localhost):**
```typescript
const service = new ControlIdService({
  ip: '192.168.2.142',
  port: 80,
  useAgent: false
});
```

**Modo Agent (VPS):**
```typescript
const service = new ControlIdService({
  ip: '192.168.2.142', // Usado pelo agent
  port: 80,
  useAgent: true,
  agentId: 'academia-1'
});
```

**Auto-detecção:**
```typescript
// Usa agent automaticamente em produção
const service = await getControlIdServiceForGym(gymId);
// NODE_ENV=production → useAgent=true
// NODE_ENV=development → useAgent=false
```

---

## 📦 Instalação

### No Cliente (Academia)

#### Windows

```bash
# 1. Baixar e extrair pasta agent/
# 2. Executar instalador
cd agent
install-windows.bat
```

O instalador faz automaticamente:
- ✅ Verifica Node.js
- ✅ Instala dependências
- ✅ Cria arquivo .env
- ✅ Instala PM2
- ✅ Configura auto-start
- ✅ Inicia agent

#### Linux / Raspberry Pi

```bash
cd agent
chmod +x install-linux.sh
./install-linux.sh
```

### Na VPS (Servidor)

```bash
# Instalar dependência ws
npm install ws

# Configurar variável de ambiente
echo "AGENT_WS_PORT=8080" >> .env

# Em produção, usar SSL
echo "NODE_ENV=production" >> .env

# Reiniciar servidor
pm2 restart academia-backend
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

#### Agent (`.env` no cliente)

```env
# IP da leitora Control ID (rede local)
LEITORA_IP=192.168.2.142
LEITORA_PORT=80
LEITORA_USERNAME=admin
LEITORA_PASSWORD=admin

# URL da VPS (WebSocket)
# Desenvolvimento: ws://localhost:8080
# Produção: wss://seusite.com.br (SSL)
VPS_URL=wss://academia.seusite.com.br

# ID único do agent (academia-{gymId})
AGENT_ID=academia-1

# Token de autenticação (gerar token secreto)
AUTH_TOKEN=abc123xyz789...
```

#### VPS (`.env` no servidor)

```env
# Porta do WebSocket Server
AGENT_WS_PORT=8080

# Ambiente (produção usa agent automaticamente)
NODE_ENV=production

# Forçar uso de agent (opcional)
USE_CONTROL_ID_AGENT=true
```

### Gerar Token Seguro

```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔐 Segurança

### Comunicação VPS ↔ Agent

**Protocolo:** WSS (WebSocket Secure)
**Porta:** 8080 (ou configurável)
**Criptografia:** TLS 1.2+
**Autenticação:** Bearer Token

**Headers da conexão:**
```
x-client-id: academia-1
authorization: Bearer abc123...
```

### Comunicação Agent ↔ Leitora

**Protocolo:** HTTP (não criptografado)
**Porta:** 80
**Rede:** Local (não exposta)
**Autenticação:** Session-based (login/password)

**Não é necessário HTTPS** pois:
- ✅ Tráfego fica na rede local
- ✅ Protegido pelo firewall
- ✅ Leitora geralmente não suporta HTTPS

### Firewall

**Cliente precisa:**
- ✅ Saída para VPS (porta 8080 ou 443)
- ✅ Acesso local à leitora (porta 80)

**Cliente NÃO precisa:**
- ❌ Abrir portas de entrada
- ❌ Port forwarding
- ❌ IP público

---

## 🚀 Deploy

### 1. Deploy do Backend (VPS)

```bash
# Build do TypeScript
npm run build

# Iniciar com PM2
pm2 start dist/index.js --name academia-backend

# Salvar configuração
pm2 save

# Auto-start no boot
pm2 startup
```

### 2. Configurar SSL/TLS

**Nginx (proxy reverso):**

```nginx
# WebSocket para agents
upstream agent_ws {
    server localhost:8080;
}

server {
    listen 443 ssl;
    server_name academia.seusite.com.br;

    ssl_certificate /etc/letsencrypt/live/academia.seusite.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/academia.seusite.com.br/privkey.pem;

    # WebSocket endpoint
    location / {
        proxy_pass http://agent_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts longos para WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

### 3. Instalar Agent no Cliente

```bash
# Copiar pasta agent/ para o cliente
scp -r agent/ cliente@192.168.1.100:~/

# SSH no cliente
ssh cliente@192.168.1.100

# Instalar
cd agent
./install-linux.sh  # ou install-windows.bat no Windows

# Editar .env com configurações corretas
nano .env

# Reiniciar
pm2 restart controlid-agent
```

---

## 🔍 Troubleshooting

### Agent não conecta na VPS

**Sintomas:**
- Logs mostram "Erro ao conectar"
- Reconnect loop

**Verificações:**
```bash
# 1. Testar conectividade
ping academia.seusite.com.br

# 2. Testar porta
telnet academia.seusite.com.br 8080

# 3. Verificar firewall
sudo ufw status

# 4. Ver logs detalhados
pm2 logs controlid-agent --lines 100
```

**Soluções:**
- Verificar VPS_URL no .env
- Verificar se VPS está rodando
- Verificar firewall (liberar porta 8080)
- Verificar SSL/TLS se usar wss://

### Agent conecta mas não funciona

**Sintomas:**
- "Agent não responde"
- Timeout em comandos

**Verificações:**
```bash
# 1. Testar leitora
ping 192.168.2.142
curl http://192.168.2.142/

# 2. Ver logs
pm2 logs controlid-agent

# 3. Verificar .env
cat .env | grep LEITORA_IP
```

**Soluções:**
- Verificar IP da leitora
- Verificar credenciais (admin/admin)
- Reiniciar leitora
- Verificar se leitora está na mesma rede

### Leitora retorna erro

**Sintomas:**
- "Session inválida"
- "Face já cadastrada"

**Soluções:**
```bash
# Reiniciar agent (renova session)
pm2 restart controlid-agent

# Verificar logs do agent
pm2 logs controlid-agent

# Testar manual
curl -X POST http://192.168.2.142/login.fcgi \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin"}'
```

### Performance ruim

**Sintomas:**
- Comandos demoram muito
- Timeouts frequentes

**Verificações:**
```bash
# 1. Latência VPS ↔ Cliente
ping academia.seusite.com.br

# 2. Latência Cliente ↔ Leitora
ping 192.168.2.142

# 3. CPU/RAM do agent
top
htop
```

**Soluções:**
- Melhorar conexão internet do cliente
- Usar conexão Ethernet ao invés de WiFi
- Aumentar timeout em casos específicos

---

## 📊 Monitoramento

### Logs do Agent

```bash
# Ver logs em tempo real
pm2 logs controlid-agent

# Ver logs antigos
pm2 logs controlid-agent --lines 1000

# Filtrar erros
pm2 logs controlid-agent --err

# Limpar logs
pm2 flush controlid-agent
```

### Estatísticas

```bash
# Status PM2
pm2 status

# Monitoramento detalhado
pm2 monit

# Usar/RAM
pm2 show controlid-agent
```

### Endpoints de Health Check

**VPS:**
```typescript
// Adicionar em routers.ts
app.get('/api/health/agents', (req, res) => {
  const stats = getStats();
  res.json(stats);
});
```

**Resposta:**
```json
{
  "connectedAgents": 3,
  "pendingCommands": 0,
  "agents": [
    {
      "id": "academia-1",
      "connectedAt": "2024-12-01T10:00:00Z",
      "lastPing": "2024-12-01T11:30:00Z",
      "readyState": 1
    }
  ]
}
```

---

## 🔄 Atualização

### Atualizar Agent

```bash
# Parar agent
pm2 stop controlid-agent

# Baixar nova versão
git pull  # ou copiar arquivos novos

# Atualizar dependências (se mudaram)
npm install

# Reiniciar
pm2 restart controlid-agent
pm2 save
```

### Atualizar Backend

```bash
# Build
npm run build

# Reiniciar
pm2 restart academia-backend
```

---

## 📚 Referências

- [Control ID API](https://www.controlid.com.br/docs/access-api-pt/)
- [WebSocket (ws)](https://github.com/websockets/ws)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx WebSocket](https://www.nginx.com/blog/websocket-nginx/)

---

## 🆘 Suporte

**Problemas comuns:**
1. Consultar seção Troubleshooting
2. Verificar logs: `pm2 logs controlid-agent`
3. Testar conectividade (ping, curl)
4. Reiniciar: `pm2 restart controlid-agent`

**Arquivo de debug:**
```bash
# Gerar relatório completo
echo "=== INFORMAÇÕES DO SISTEMA ===" > debug.txt
echo "Data: $(date)" >> debug.txt
echo "" >> debug.txt

echo "=== CONFIGURAÇÃO ===" >> debug.txt
cat .env >> debug.txt
echo "" >> debug.txt

echo "=== STATUS PM2 ===" >> debug.txt
pm2 status >> debug.txt
echo "" >> debug.txt

echo "=== LOGS (últimas 100 linhas) ===" >> debug.txt
pm2 logs controlid-agent --lines 100 --nostream >> debug.txt
echo "" >> debug.txt

echo "=== PING VPS ===" >> debug.txt
ping -c 5 academia.seusite.com.br >> debug.txt
echo "" >> debug.txt

echo "=== PING LEITORA ===" >> debug.txt
ping -c 5 192.168.2.142 >> debug.txt

cat debug.txt
```

---

## 🔧 Configuração Dinâmica do Agent ID

### Como Obter o Agent ID Correto

O `AGENT_ID` deve corresponder ao gymId da sua academia no banco de dados. Ele segue o padrão:

```
AGENT_ID=academia-{gymId}
```

### Ao Cadastrar Nova Academia

Quando você cadastra uma academia através da página de registro (`/gym/signup`), o sistema exibe automaticamente o Agent ID correto na tela de sucesso:

```
Seu Agent ID: academia-5
```

Copie este ID e configure no arquivo `agent/.env`:

```env
AGENT_ID=academia-5
```

### Se Você Já Tem uma Academia Cadastrada

Consulte o banco de dados para descobrir o gymId:

```sql
SELECT id, name, slug FROM gyms;
```

Exemplo de resultado:
```
+----+-------------------+-----------+
| id | name              | slug      |
+----+-------------------+-----------+
|  1 | SysFit Pro        | sysfitpro |
|  4 | Academia Fit Life | fitlife   |
|  5 | Academia Vida     | vida      |
+----+-------------------+-----------+
```

Se sua academia tem `id = 5`, configure:

```env
AGENT_ID=academia-5
```

### Importante

- Cada agent deve ter um ID único
- Múltiplas academias precisam de múltiplos agents
- Se mudar o gymId no banco, atualize o AGENT_ID no agent

---

---

## 🆕 Atualizações Recentes - Janeiro 2025

### Sistema Multi-Tenant 100% Dinâmico

O sistema agora é completamente dinâmico e multi-tenant! Nenhuma configuração manual necessária.

#### ✅ O que mudou:

**1. Removidos Valores Hardcoded**
- ❌ Antes: `const gymSlug = "fitlife"` em 17 arquivos
- ✅ Agora: `const { gymSlug } = useGym()` - dinâmico do usuário autenticado

**2. Hook `useGym()` Criado**
- Criado em `client/src/_core/hooks/useGym.ts`
- Retorna automaticamente:
  - `gymSlug` - Identificador da academia do usuário
  - `gymId` - ID numérico da academia
  - `hasGym` - Se usuário pertence a uma academia
- Dados vindos diretamente do `auth.me` endpoint

**3. Auto-Cadastro de Academias**
- Nova rota pública: `/gym/signup`
- Formulário completo de cadastro
- Auto-geração de slug (sem espaços/acentos)
- Sistema cria automaticamente:
  - Academia no banco de dados
  - Usuário administrador
  - Configurações padrão (gym_settings)
  - **Agent ID** exibido na tela de sucesso!

**4. Endpoint `gyms.signUp`**
- Backend em `server/routers/gyms.ts:122-201`
- Validações automáticas:
  - ✅ Slug único (não permite duplicados)
  - ✅ Email único (administrador)
  - ✅ Dados obrigatórios
- Retorna Agent ID: `academia-{gymId}`
- Plano inicial: **basic** (trial de 30 dias)

#### Como Funciona Agora:

**Cadastrar Nova Academia:**

1. Acesse `https://www.sysfitpro.com.br/gym/signup`
2. Preencha formulário:
   - Nome da academia
   - Dados de contato
   - Dados do administrador
3. Clique em **Cadastrar**
4. ✅ Tela de sucesso mostra:
   ```
   Academia Cadastrada!

   Seu Agent ID: academia-5

   Configure no arquivo agent/.env:
   AGENT_ID=academia-5
   ```

**Configurar Agent:**

```env
# arquivo: agent/.env
AGENT_ID=academia-5  ← Copie da tela de cadastro
AUTH_TOKEN=seu-token-aqui
VPS_URL=wss://www.sysfitpro.com.br/agent
LEITORA_IP=192.168.1.100
```

**Todos os arquivos atualizados para usar `useGym()`:**
- ✅ AdminPlans.tsx
- ✅ AdminSettings.tsx
- ✅ AdminStudents.tsx
- ✅ AdminSuppliers.tsx
- ✅ AdminReports.tsx
- ✅ AdminPayments.tsx
- ✅ AdminFinancialDashboard.tsx
- ✅ AdminDefaulters.tsx
- ✅ AdminCostCenters.tsx
- ✅ AdminCategories.tsx
- ✅ AdminCashFlow.tsx
- ✅ AdminAccountsPayable.tsx
- ✅ AdminSchedule.tsx
- ✅ AdminProfessors.tsx
- ✅ AdminBankAccounts.tsx
- ✅ AdminStaff.tsx
- ✅ StudentRegister.tsx

---

### Configuração Automática do Agent (Auto-Start)

Agora o Agent pode rodar automaticamente ao ligar o computador!

#### Opção 1: PM2 (Recomendado - Windows/Linux)

**Instalar PM2:**
```cmd
npm install -g pm2
npm install -g pm2-windows-startup
```

**Configurar auto-start:**
```cmd
cd C:\SysFit\agent
pm2-startup install
pm2 start index.js --name "agent-sysfitpro"
pm2 save
```

**Comandos úteis:**
```cmd
# Ver status
pm2 status

# Logs em tempo real
pm2 logs agent-sysfitpro

# Reiniciar
pm2 restart agent-sysfitpro
```

#### Opção 2: NSSM (Windows Service)

**Instalar NSSM:**
1. Baixar: https://nssm.cc/download
2. Extrair para `C:\SysFit\nssm\`
3. Instalar:
```cmd
cd C:\SysFit\nssm\win64
nssm install SysFitAgent
```

**Configurar:**
- Path: `C:\Program Files\nodejs\node.exe`
- Startup directory: `C:\SysFit\agent`
- Arguments: `index.js`

**Iniciar:**
```cmd
nssm start SysFitAgent
```

#### Opção 3: Agendador de Tarefas (Windows)

1. Criar `start-agent.bat`:
```bat
@echo off
cd C:\SysFit\agent
node index.js
```

2. Adicionar ao Agendador de Tarefas:
   - Gatilho: **Quando o computador iniciar**
   - Ação: **Iniciar programa** → `start-agent.bat`
   - Marcar: **Executar com privilégios mais altos**

---

### Deploy VPS - Configuração Atual

**Servidor:** www.sysfitpro.com.br
**VPS:** 172.60.2.237

**Tecnologias:**
- ✅ Node.js 20.x
- ✅ MySQL 8.0
- ✅ Nginx (reverse proxy + SSL)
- ✅ PM2 (process manager)
- ✅ Let's Encrypt (SSL)

**Estrutura:**
```
/var/www/academia/
├── client/dist/          ← Frontend React (build)
├── dist/                 ← Backend Node.js (build)
├── server/               ← Código fonte backend
├── agent/                ← Agent local (para copiar)
├── ecosystem.config.js   ← PM2 config
└── .env                  ← Variáveis de ambiente
```

**Comandos de Deploy:**
```bash
# No VPS
cd /var/www/academia
git pull origin main
npm run build
pm2 restart academia-api
pm2 logs academia-api
```

**Portas:**
- 3000 - API Node.js (interno)
- 8080 - WebSocket Agents (interno)
- 80/443 - Nginx (público)

**Endpoints:**
- `https://www.sysfitpro.com.br` - Frontend
- `https://www.sysfitpro.com.br/api/trpc` - API tRPC
- `wss://www.sysfitpro.com.br/agent` - WebSocket Agents
- `https://www.sysfitpro.com.br/gym/signup` - Cadastro público

---

### Banco de Dados - Estrutura Atual

**Database:** `academia_db`
**Usuário:** `academia`
**Charset:** `utf8mb4_unicode_ci`

**Tabelas Principais:**
- `gyms` - Academias (multi-tenant)
- `users` - Usuários (admin, staff, alunos)
- `gym_settings` - Configurações por academia
- `students` - Alunos
- `plans` - Planos de mensalidade
- `payments` - Pagamentos
- `access_logs` - Logs de acesso (catraca)

**Importante:**
- Cada academia tem `gymId` único
- Todos os dados são isolados por `gymId`
- Super admin pode acessar todas academias
- Gym admin só acessa sua própria academia

**Consultas úteis:**
```sql
-- Ver todas academias
SELECT id, name, slug, plan, planStatus FROM gyms;

-- Ver Agent ID de uma academia
SELECT CONCAT('academia-', id) AS agent_id, name, slug FROM gyms WHERE slug = 'fitlife';

-- Ver usuários de uma academia
SELECT id, name, email, role FROM users WHERE gymId = 4;

-- Ver configurações de uma academia
SELECT * FROM gym_settings WHERE gymId = 4;
```

---

### Checklist de Instalação Completa

**Academia Nova (do Zero):**

- [ ] **1. Cadastrar Academia**
  - [ ] Acessar `/gym/signup`
  - [ ] Preencher formulário
  - [ ] Anotar **Agent ID** exibido

- [ ] **2. Preparar Computador da Academia**
  - [ ] Instalar Node.js 20+
  - [ ] Copiar pasta `agent/` para `C:\SysFit\agent`
  - [ ] `npm install` na pasta agent

- [ ] **3. Configurar Agent**
  - [ ] Criar arquivo `.env`
  - [ ] Configurar `AGENT_ID` (da tela de cadastro)
  - [ ] Configurar `LEITORA_IP` (IP do Control ID)
  - [ ] Configurar `AUTH_TOKEN` (fornecido pelo suporte)
  - [ ] Configurar `VPS_URL=wss://www.sysfitpro.com.br/agent`

- [ ] **4. Instalar Auto-Start**
  - [ ] Instalar PM2 ou NSSM
  - [ ] Configurar auto-start
  - [ ] Testar: reiniciar computador

- [ ] **5. Testes**
  - [ ] Agent conectado: `pm2 status`
  - [ ] Logs sem erro: `pm2 logs`
  - [ ] Login no sistema web
  - [ ] Cadastrar aluno teste
  - [ ] Testar reconhecimento facial
  - [ ] Testar liberação na catraca

- [ ] **6. Finalização**
  - [ ] Orientar responsável da academia
  - [ ] Deixar contatos de suporte
  - [ ] Documentar instalação

---

### Troubleshooting Atualizado

**Problema: "Agent academia-X is not connected"**

**Causa:** Agent ID incorreto ou Agent não está rodando

**Solução:**
```bash
# 1. Verificar Agent ID no banco
mysql -u academia -p academia_db -e "SELECT id, name, slug FROM gyms WHERE id = 4;"

# 2. Verificar .env do agent
cat C:\SysFit\agent\.env | findstr AGENT_ID

# 3. Verificar se agent está rodando
pm2 status

# 4. Ver logs do agent
pm2 logs agent-sysfitpro

# 5. Reiniciar agent
pm2 restart agent-sysfitpro
```

**Problema: "Academia não encontrada" ao criar planos**

**Causa:** Sistema tentando acessar academia com slug errado

**Solução:** Já corrigido! Sistema agora usa `useGym()` hook que pega automaticamente o gymSlug do usuário logado.

**Problema: Agent conecta mas Control ID não responde**

**Causa:** IP do Control ID incorreto ou rede diferente

**Solução:**
```cmd
# Testar ping
ping 192.168.1.100

# Verificar IP no .env
type C:\SysFit\agent\.env | findstr LEITORA_IP

# Testar manual
curl http://192.168.1.100/

# Verificar mesma rede
ipconfig
```

---

### Comandos Essenciais - Resumo

**VPS (Servidor):**
```bash
# Deploy
cd /var/www/academia && git pull && npm run build && pm2 restart academia-api

# Logs
pm2 logs academia-api
pm2 logs academia-api --err

# Status
pm2 status
pm2 monit

# Banco de dados
mysql -u academia -p academia_db

# Backup
mysqldump -u academia -p academia_db > backup_$(date +%Y%m%d).sql
```

**Agent (Cliente - Windows):**
```cmd
# Status
pm2 status

# Logs
pm2 logs agent-sysfitpro

# Reiniciar
pm2 restart agent-sysfitpro

# Parar/Iniciar
pm2 stop agent-sysfitpro
pm2 start agent-sysfitpro

# Teste manual
cd C:\SysFit\agent
node index.js
```

**Agent (Cliente - Linux):**
```bash
# Status
pm2 status

# Logs
pm2 logs controlid-agent

# Reiniciar
pm2 restart controlid-agent

# Ver configuração
cat /opt/controlid-agent/.env
```

---

### Segurança e Boas Práticas

**Tokens e Senhas:**
- ✅ Nunca commitar arquivo `.env`
- ✅ Gerar token único por academia
- ✅ Usar senhas fortes (min 12 caracteres)
- ✅ Trocar senha padrão do MySQL

**Firewall:**
- ✅ VPS: Liberar apenas 80, 443, 22
- ✅ Cliente: Permitir saída para porta 443/8080
- ✅ Não abrir portas de entrada no cliente

**Backup:**
- ✅ Backup diário do banco de dados
- ✅ Backup semanal de uploads (fotos)
- ✅ Manter últimos 7 dias
- ✅ Testar restauração regularmente

**Atualizações:**
- ✅ Node.js: Manter LTS atualizado
- ✅ MySQL: Aplicar patches de segurança
- ✅ Nginx: Manter atualizado
- ✅ SSL: Renovar automaticamente (Let's Encrypt)

---

**Última atualização:** Janeiro 2025
**Versão:** 3.0.0 - Sistema Multi-Tenant Dinâmico
