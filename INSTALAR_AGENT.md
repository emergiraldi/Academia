# 🚀 Guia Rápido: Instalar Agent Control ID

## ❓ Por que preciso do Agent?

O Agent é um programa pequeno que roda na **academia** e faz a comunicação entre:
- 🌐 Sistema na internet (VPS)
- 🏢 Leitora Control ID na rede local (192.168.x.x)

Sem o Agent, a VPS não consegue se comunicar com a leitora!

---

## 📋 O que você precisa:

- ✅ Computador Windows na mesma rede da leitora
- ✅ Node.js 16+ instalado
- ✅ Acesso à internet
- ✅ IP da leitora Control ID (exemplo: 192.168.2.142)

---

## 🔧 Instalação (Windows)

### Passo 1: Instalar Node.js

Se ainda não tem Node.js instalado:

1. Baixe: https://nodejs.org/ (versão LTS)
2. Instale (próximo, próximo, instalar)
3. Teste: Abra o CMD e digite `node --version`

### Passo 2: Copiar pasta do Agent

1. Copie a pasta `agent/` para um local fixo:
   ```
   C:\SysFit\agent\
   ```

2. Abra CMD na pasta:
   ```cmd
   cd C:\SysFit\agent
   ```

3. Instale as dependências:
   ```cmd
   npm install
   ```

### Passo 3: Configurar .env

Crie um arquivo `.env` dentro de `C:\SysFit\agent\.env` com:

```env
# IP da leitora Control ID (rede local)
LEITORA_IP=192.168.2.142
LEITORA_PORT=80
LEITORA_USERNAME=admin
LEITORA_PASSWORD=admin

# URL da VPS (WebSocket)
VPS_URL=wss://www.sysfitpro.com.br/agent

# ID do agent (academia-{gymId})
# Se sua academia tem ID 1, use: academia-1
# Se sua academia tem ID 4, use: academia-4
AGENT_ID=academia-1

# Token de autenticação (fornecido pelo suporte)
AUTH_TOKEN=sua-chave-secreta-aqui
```

**⚠️ IMPORTANTE:** Troque:
- `LEITORA_IP` pelo IP real da sua leitora
- `AGENT_ID` pelo ID da sua academia (verifique no banco: `SELECT id FROM gyms`)
- `AUTH_TOKEN` por um token seguro (gere um: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### Passo 4: Testar o Agent

```cmd
cd C:\SysFit\agent
node agent.js
```

Se funcionar, você verá:
```
[Agent] Conectando na VPS: wss://www.sysfitpro.com.br/agent
[Agent] ✅ Conectado! Agent ID: academia-1
[Agent] Aguardando comandos...
```

### Passo 5: Instalar Auto-Start (Opcional mas Recomendado)

Para o Agent iniciar automaticamente quando o computador ligar:

**Opção A: PM2 (Recomendado)**

```cmd
npm install -g pm2
npm install -g pm2-windows-startup

cd C:\SysFit\agent
pm2-startup install
pm2 start agent.js --name "agent-sysfitpro"
pm2 save
```

Comandos úteis:
```cmd
pm2 status                    # Ver status
pm2 logs agent-sysfitpro      # Ver logs
pm2 restart agent-sysfitpro   # Reiniciar
```

**Opção B: Agendador de Tarefas Windows**

1. Crie `C:\SysFit\start-agent.bat`:
   ```bat
   @echo off
   cd C:\SysFit\agent
   node agent.js
   ```

2. Abra "Agendador de Tarefas" do Windows
3. Criar Tarefa Básica
4. Nome: "Agent SysFit"
5. Gatilho: "Quando o computador iniciar"
6. Ação: "Iniciar programa" → selecione `start-agent.bat`
7. Marcar: "Executar com privilégios mais altos"

---

## ✅ Verificar se está funcionando

1. **No computador da academia (onde o Agent roda):**
   ```cmd
   pm2 logs agent-sysfitpro
   ```
   Deve mostrar: `✅ Conectado! Agent ID: academia-1`

2. **Na VPS:**
   ```bash
   ssh root@72.60.2.237
   pm2 logs academia-api | grep "Agent\|WebSocket"
   ```
   Deve mostrar: Conexão do agent recebida

3. **No sistema web:**
   - Cadastre foto de um aluno
   - Deve funcionar sem erro "Agent not connected"

---

## 🐛 Problemas Comuns

### "Agent academia-1 is not connected"

**Causa:** Agent não está rodando

**Solução:**
```cmd
cd C:\SysFit\agent
pm2 restart agent-sysfitpro
pm2 logs agent-sysfitpro
```

### "Connection refused"

**Causa:** Firewall bloqueando conexão

**Solução:**
- Liberar saída para porta 443 (WSS)
- Testar: `ping www.sysfitpro.com.br`

### "Session inválida" da leitora

**Causa:** Credenciais erradas

**Solução:**
- Verificar `LEITORA_USERNAME` e `LEITORA_PASSWORD` no .env
- Padrão: admin/admin

### Agent não encontra leitora

**Causa:** IP errado ou rede diferente

**Solução:**
```cmd
ping 192.168.2.142
ipconfig  # Ver se está na mesma rede
```

---

## 📞 Suporte

Problemas? Verifique os logs:
```cmd
pm2 logs agent-sysfitpro --lines 100
```

Envie os logs para análise.

---

## 🔐 Segurança

- ✅ Agent se conecta NA VPS (não abre portas)
- ✅ Comunicação criptografada (WSS/TLS)
- ✅ Token de autenticação obrigatório
- ✅ Leitora fica segura na rede local

---

**Última atualização:** Janeiro 2026
