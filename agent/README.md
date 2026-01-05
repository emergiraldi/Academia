# Control ID Agent - Cliente Local

Agent local que faz a ponte entre a VPS (backend na nuvem) e a leitora Control ID (rede local do cliente).

## 📋 Pré-requisitos

- Node.js 16.x ou superior
- Leitora Control ID configurada e conectada na rede local
- Acesso à internet (para conectar na VPS)

## 🚀 Instalação Rápida

### Windows

```bash
# 1. Ir para a pasta do agent
cd agent

# 2. Executar instalador
install-windows.bat
```

### Linux / Raspberry Pi

```bash
# 1. Ir para a pasta do agent
cd agent

# 2. Dar permissão de execução
chmod +x install-linux.sh

# 3. Executar instalador
./install-linux.sh
```

## ⚙️ Configuração Manual

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:

```env
# IP da leitora Control ID (rede local)
LEITORA_IP=192.168.2.142
LEITORA_PORT=80
LEITORA_USERNAME=admin
LEITORA_PASSWORD=admin

# URL da VPS (WebSocket)
VPS_URL=wss://seusite.com.br/agent

# ID único do agent
AGENT_ID=academia-1

# Token de autenticação
AUTH_TOKEN=seu-token-secreto-aqui
```

### 3. Iniciar Agent

#### Modo Desenvolvimento (com logs)

```bash
npm start
```

#### Modo Produção (com PM2)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar agent
pm2 start agent.js --name controlid-agent

# Salvar configuração
pm2 save

# Configurar auto-start (Windows)
npm install -g pm2-windows-startup
pm2-startup install

# Configurar auto-start (Linux)
pm2 startup
# (executar o comando que aparecer)
```

## 📊 Comandos Úteis

### Ver Status

```bash
pm2 status
```

### Ver Logs em Tempo Real

```bash
pm2 logs controlid-agent
```

### Reiniciar Agent

```bash
pm2 restart controlid-agent
```

### Parar Agent

```bash
pm2 stop controlid-agent
```

### Deletar Agent do PM2

```bash
pm2 delete controlid-agent
```

## 🔍 Troubleshooting

### Agent não conecta na VPS

**Verificações:**

1. Conferir `VPS_URL` no `.env`
2. Testar conectividade: `ping seusite.com.br`
3. Verificar se VPS está rodando
4. Verificar logs: `pm2 logs controlid-agent`

### Agent não conecta na Leitora

**Verificações:**

1. Conferir `LEITORA_IP` no `.env`
2. Testar ping: `ping 192.168.2.142`
3. Testar login manual:
   ```bash
   curl -X POST http://192.168.2.142/login.fcgi \
     -H "Content-Type: application/json" \
     -d '{"login":"admin","password":"admin"}'
   ```
4. Verificar se leitora está ligada
5. Verificar firewall da rede

### Agent reinicia constantemente

**Possíveis causas:**

1. Credenciais erradas (`LEITORA_USERNAME`/`LEITORA_PASSWORD`)
2. Token inválido (`AUTH_TOKEN`)
3. VPS inacessível
4. Erro no código (ver logs)

**Como verificar:**

```bash
pm2 logs controlid-agent --lines 100
```

### Leitora retorna "Session inválida"

O agent faz login automaticamente e renova a sessão. Se persistir:

1. Reiniciar agent: `pm2 restart controlid-agent`
2. Reiniciar leitora (desligar/ligar)
3. Verificar se leitora não está em modo offline

## 🔐 Segurança

### Token de Autenticação

O `AUTH_TOKEN` deve ser um valor secreto único. Para gerar um token seguro:

```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Firewall

O agent precisa:
- **Saída** para VPS (porta 443 ou 8080)
- **Acesso local** à leitora (porta 80)

Não é necessário abrir portas de entrada.

## 📝 Logs

Logs são salvos automaticamente pelo PM2:

```bash
# Ver logs
pm2 logs controlid-agent

# Ver logs antigos
pm2 logs controlid-agent --lines 1000

# Limpar logs
pm2 flush controlid-agent
```

Localização dos logs (Windows):
```
C:\Users\<usuario>\.pm2\logs\
```

Localização dos logs (Linux):
```
~/.pm2/logs/
```

## 🔄 Atualização

Para atualizar o agent:

```bash
# 1. Parar agent
pm2 stop controlid-agent

# 2. Baixar nova versão (Git pull ou copiar arquivos)

# 3. Instalar dependências (se mudaram)
npm install

# 4. Reiniciar
pm2 restart controlid-agent
pm2 save
```

## 💻 Requisitos de Hardware

### Mínimo

- Processador: 1 GHz
- RAM: 512 MB
- Disco: 1 GB
- Rede: WiFi ou Ethernet

### Recomendado

- Raspberry Pi 4 (2GB RAM ou mais)
- Conexão Ethernet (mais estável que WiFi)
- Fonte de alimentação confiável

## 🌐 Portas Utilizadas

- **Leitora Control ID**: 80 (HTTP)
- **VPS**: 8080 ou 443 (WebSocket)

## 📞 Suporte

Para problemas:

1. Verificar logs: `pm2 logs controlid-agent`
2. Verificar configuração: `cat .env`
3. Testar conexões (ping, curl)
4. Reiniciar: `pm2 restart controlid-agent`

---

**Versão:** 1.0.0
**Data:** Dezembro 2024
