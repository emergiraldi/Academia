# Liberação Automática de Catraca - Solução Definitiva

**Data:** 22/01/2026
**Academia:** Studio Vem Dançar Jaime Arôxa Ap de Goiânia (ID 33)
**Status:** ✅ FUNCIONANDO

## Problema Identificado

A liberação automática da catraca Toletus HUB não estava funcionando quando alunos/funcionários passavam o reconhecimento facial no Control ID.

### Sintomas
- Botão manual "Liberar Entrada" funcionava perfeitamente
- Reconhecimento facial funcionava (leitora exibia "Portal Sempre Liberado")
- **Catraca NÃO abria automaticamente** após reconhecimento facial
- Sistema processava logs mas não disparava liberação

### Causa Raiz
O Control ID possui um **delay de 5-8 minutos** entre:
1. Pessoa passar pelo reconhecimento facial
2. Log ficar disponível na API (`load_objects.fcgi`)

O sistema antigo verificava se o log tinha menos de 2 minutos (`logAge < 2 * 60 * 1000`), o que **SEMPRE falhava** devido ao delay do Control ID.

**Exemplo do problema:**
```
Pessoa passa no Control ID: 21:30 (horário real)
Log disponível na API:      21:35-21:38 (5-8 min depois)
VPS verifica logAge:        > 5 minutos
Resultado:                  isRecent=false ❌ NÃO LIBERA
```

## Solução Implementada

**Remover completamente a verificação de `logAge` (idade do timestamp do log).**

### Lógica Correta
Se o log chegou até a verificação de liberação, significa que:
1. ✅ Log é **NOVO** (detecção de duplicatas já foi feita antes)
2. ✅ Pessoa foi reconhecida com sucesso
3. ✅ Pessoa está cadastrada no sistema

**Portanto: LIBERAR IMEDIATAMENTE, independente do timestamp do log!**

### Código Modificado

**Arquivo:** [`server/notifications.ts`](../server/notifications.ts)
**Linhas:** 764-779

#### ANTES (❌ Com verificação de tempo)
```typescript
// Verificar se o acesso é RECENTE (últimos 2 minutos) - não liberar para logs históricos!
const now = new Date();
const logAge = Math.abs(now.getTime() - timestamp.getTime());
const isRecentLog = logAge < 2 * 60 * 1000; // 2 minutos em ms

console.log(`[CRON] 🔍 Verificando liberação automática: accessType=${accessType}, gym.turnstileType=${gym.turnstileType}, personStatus=${personStatus}, logAge=${Math.floor(logAge/1000)}s, isRecent=${isRecentLog}`);

const shouldRelease = (accessType === "entry" || accessType === "exit") &&
                       (gym.turnstileType === "toletus_hub" || gym.turnstileType === "toletus") &&
                       personStatus === "active" &&
                       isRecentLog; // ❌ SEMPRE FALSE devido ao delay!
```

#### DEPOIS (✅ Sem verificação de tempo)
```typescript
// IMPORTANTE: Se chegou até aqui, o log é NOVO (verificação de duplicatas já foi feita acima)
// Portanto, devemos liberar a catraca IMEDIATAMENTE, independente do timestamp do log
// NOTA: Control ID tem delay de 5-8 minutos, mas o que importa é que o log é NOVO
console.log(`[CRON] 🔍 Verificando liberação automática: accessType=${accessType}, gym.turnstileType=${gym.turnstileType}, personStatus=${personStatus}`);

const shouldRelease = (accessType === "entry" || accessType === "exit") &&
                       (gym.turnstileType === "toletus_hub" || gym.turnstileType === "toletus") &&
                       personStatus === "active";
                       // ✅ REMOVIDA verificação isRecentLog
```

### Por Que Funciona

O sistema JÁ possui verificação de duplicatas **ANTES** da liberação (linhas 705-716):

```typescript
const isDuplicate = existingLogs.some(existing => {
  const timeDiff = Math.abs(new Date(existing.timestamp).getTime() - timestamp.getTime());
  const isDup = timeDiff < 1000 && existing.accessType === accessType;
  return isDup;
});

if (isDuplicate) {
  console.log(`[CRON] Skipping duplicate log for student ${student.id}`);
  continue; // Pula log duplicado
}
```

**Portanto:**
- Se o log é duplicado → Sistema pula **ANTES** de chegar na verificação de liberação
- Se o log chegou na verificação de liberação → É NOVO → Deve liberar!

## Como Funciona Agora

### Fluxo Completo

```
1. Aluno passa reconhecimento facial no Control ID
   ├─ Control ID: Reconhece pessoa
   ├─ Control ID: Exibe "Portal Sempre Liberado"
   └─ Control ID: DEMORA 5-8 min para disponibilizar log na API

2. [5-8 minutos depois] Log fica disponível na API do Control ID

3. VPS consulta Control ID API (a cada 1 segundo via CRON)
   └─ Agent (Windows local) → Control ID (192.168.0.129)

4. VPS detecta LOG NOVO
   ├─ Verifica duplicatas (linhas 705-716)
   ├─ Se duplicado: PULA
   └─ Se novo: CONTINUA

5. VPS verifica condições de liberação (linhas 777-779)
   ├─ ✅ accessType = "entry" ou "exit"
   ├─ ✅ gym.turnstileType = "toletus_hub"
   ├─ ✅ personStatus = "active"
   └─ ✅ SEM verificação de logAge!

6. VPS dispara liberação
   ├─ Envia comando para Agent (Windows)
   ├─ Agent → Toletus HUB (localhost:7067)
   ├─ Toletus HUB → Catraca (192.168.0.100)
   └─ ✅ CATRACA ABRE!
```

### Delay Total Esperado
- Pessoa passa no Control ID: **T=0**
- Log disponível na API: **T+5 a T+8 minutos**
- Catraca libera: **T+5 a T+8 minutos** (quase instantâneo após log ficar disponível)

## Observações Importantes

### 1. Timezone do Control ID
O Control ID retorna timestamps em **GMT-3** (horário de Brasília), mas o VPS está em **UTC**.

**Correção aplicada (linha 695):**
```typescript
const timestamp = typeof log.time === 'number' ?
  new Date((log.time + 10800) * 1000) : // +10800s = +3h (GMT-3 → UTC)
  new Date(log.time);
```

### 2. Mapeamento Control ID ↔ Alunos/Staff

Os alunos/funcionários precisam ter `controlIdUserId` configurado no banco de dados.

**Exemplos (Academia 33):**
```sql
-- Ludmila
UPDATE students SET controlIdUserId = 5 WHERE id = 12 AND gymId = 33;

-- Ana Paula
UPDATE students SET controlIdUserId = 80 WHERE id = 24 AND gymId = 33;

-- Joaquim
UPDATE students SET controlIdUserId = 21 WHERE id = 36 AND gymId = 33;
```

**Verificar mapeamentos:**
```sql
SELECT s.id, u.name, s.controlIdUserId
FROM students s
LEFT JOIN users u ON s.userId = u.id
WHERE s.gymId = 33 AND s.controlIdUserId IS NOT NULL;
```

### 3. Agent Local Deve Estar Rodando

O agent local (Windows) faz a ponte entre VPS ↔ Control ID:

**Localização:** `C:\SysFit\agent\agent.js`

**Iniciar:**
```bash
node C:\SysFit\agent\agent.js
```

**Verificar se está conectado:**
```bash
# Logs da VPS devem mostrar:
[AgentWS] ✅ Agent academia-33 conectado
```

### 4. Toletus HUB

**IP da catraca:** 192.168.0.100
**Toletus HUB:** https://localhost:7067

Configuração aplicada:
- **FlowControl Mode:** 0 (Entrada Controlada, Saída Livre)
- **EntryClockwise:** true
- **Resultado:** DIREITA bloqueada (entrada controlada), ESQUERDA livre (saída)

## Deploy

### 1. Build do Projeto
```bash
cd C:\Projeto\Academia
npm run build
```

### 2. Deploy para VPS
```bash
scp C:\Projeto\Academia\dist\index.js root@72.60.2.237:/var/www/academia/dist/
```

### 3. Restart PM2
```bash
ssh root@72.60.2.237 "pm2 restart academia-api"
```

### 4. Verificar Logs
```bash
ssh root@72.60.2.237 "pm2 logs academia-api --lines 100"
```

**Logs esperados quando alguém passa:**
```
[CRON] ✅ Encontrados 6 logs do Control ID para academia 33
[CRON] 🔍 Carregando logs de acesso...
[CRON] Processing log: user_id=21, event=7, accessType=exit
[CRON] 🔍 Verificando liberação automática: accessType=exit, gym.turnstileType=toletus_hub, personStatus=active
[CRON] 🔓 Academia Studio Vem Dançar usa Toletus HUB - Liberando catraca para JOAQUIM...
[Toletus] ✅ Catraca liberada com sucesso
```

## Troubleshooting

### Catraca não abre automaticamente

**1. Verificar se agent local está conectado**
```bash
ssh root@72.60.2.237 "pm2 logs academia-api --lines 50 | grep 'Agent academia-33'"
```
Deve mostrar: `✅ Agent academia-33 conectado`

**2. Verificar se logs estão sendo detectados**
```bash
ssh root@72.60.2.237 "pm2 logs academia-api --lines 100 | grep 'Encontrados.*logs.*33'"
```
Deve incrementar quando alguém passa: `✅ Encontrados 6 logs` → `✅ Encontrados 7 logs`

**3. Verificar mapeamento Control ID**
```bash
ssh root@72.60.2.237 "mysql -u root academia_db -e \"
  SELECT s.id, u.name, s.controlIdUserId
  FROM students s
  LEFT JOIN users u ON s.userId = u.id
  WHERE s.gymId = 33 AND s.controlIdUserId IS NOT NULL;
\""
```

**4. Verificar se liberação está sendo disparada**
```bash
ssh root@72.60.2.237 "pm2 logs academia-api --lines 200 | grep 'Liberando catraca'"
```

### Agent não conecta

**Reiniciar agent local:**
```bash
# Windows (C:\SysFit\agent\)
# Fechar janela do Node.js
# Abrir novamente:
node agent.js
```

### Toletus HUB não responde

**Verificar se está rodando:**
```powershell
# Windows
Invoke-WebRequest -Uri "https://localhost:7067" -SkipCertificateCheck
```

**Reiniciar Toletus HUB:**
```bash
C:\SysFit\agent\START_TOLETUS_HUB.bat
```

## Histórico de Correções

### 22/01/2026 - Solução Definitiva
- ✅ Removida verificação de `logAge` (isRecentLog)
- ✅ Liberação automática funciona mesmo com delay de 5-8 min do Control ID
- ✅ Sistema libera IMEDIATAMENTE quando log novo chega
- ✅ Testado e confirmado funcionando na Academia 33

### 21/01/2026 - Tentativas Anteriores
- ❌ Aumentar janela de tempo para 10 minutos (não resolveu)
- ❌ Corrigir timezone +3h (ajudou mas não resolveu completamente)
- ❌ Atualizar mapeamentos controlIdUserId (necessário mas não suficiente)

## Referências

- **Arquivo modificado:** [server/notifications.ts](../server/notifications.ts) (linhas 764-779)
- **Academia testada:** Studio Vem Dançar Jaime Arôxa Ap de Goiânia (ID 33)
- **VPS:** 72.60.2.237
- **Control ID:** 192.168.0.129
- **Toletus HUB:** https://localhost:7067
- **Catraca:** 192.168.0.100 (LiteNet3)
