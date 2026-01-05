# Documentação do Sistema de Controle de Acesso

Documentação técnica completa do sistema de controle de acesso biométrico integrado à leitora facial Control ID.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Integração Control ID](#integração-control-id)
- [Status de Matrícula](#status-de-matrícula)
- [Fluxos de Bloqueio/Desbloqueio](#fluxos-de-bloqueio-desbloqueio)
- [Logs de Acesso](#logs-de-acesso)
- [Configurações](#configurações)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema de controle de acesso gerencia entrada e saída de alunos através de reconhecimento facial, com bloqueio/desbloqueio automático baseado em regras de negócio.

### Componentes Principais

1. **Leitora Biométrica** - Control ID (hardware físico)
2. **Servidor Backend** - Gerencia lógica de negócio
3. **Banco de Dados** - Armazena cadastros e logs
4. **Cron Jobs** - Tarefas automáticas agendadas
5. **Interface Admin** - Gestão manual

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│  Leitora Facial │ ◄─────┐
│   (Control ID)  │        │
└─────────────────┘        │
         │                 │
         │ REST API        │ REST API
         │                 │
         ▼                 │
┌─────────────────────────┴───┐
│     Backend Node.js         │
│  ┌─────────────────────┐    │
│  │  ControlIdService   │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │   Cron Jobs         │    │
│  │  - Sync logs (30s)  │    │
│  │  - Block users (6h) │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │   tRPC Routers      │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
         │
         │ Drizzle ORM
         ▼
┌─────────────────┐
│   MySQL DB      │
│  - students     │
│  - access_logs  │
│  - payments     │
│  - etc.         │
└─────────────────┘
```

---

## 🔌 Integração Control ID

### Comunicação

**Protocolo:** HTTP REST API
**Porta:** 80 (padrão)
**Autenticação:** Session-based (login/logout)
**Formato:** JSON

### Endpoints Utilizados

#### 1. Login (Autenticação)
```typescript
POST http://{IP}:80/login.fcgi
Body: { "login": "admin", "password": "admin" }
Response: { "session": "abc123..." }
```

#### 2. Criar Usuário
```typescript
POST http://{IP}:80/create_objects.fcgi?session={session}
Body: {
  "object": "users",
  "values": [{
    "name": "Nome do Aluno",
    "registration": "12345"
  }]
}
Response: { "ids": [123] }
```

#### 3. Cadastrar Face (Biometria)
```typescript
POST http://{IP}:80/user_set_image_list.fcgi?session={session}
Body: {
  "user_id": 123,
  "images": ["base64_image_data"],
  "timestamp": 1234567890
}
```

#### 4. Adicionar ao Grupo de Acesso
```typescript
POST http://{IP}:80/create_objects.fcgi?session={session}
Body: {
  "object": "user_groups",
  "values": [{
    "user_id": 123,
    "group_id": 1
  }]
}
```

#### 5. Remover do Grupo (Bloquear)
```typescript
POST http://{IP}:80/destroy_objects.fcgi?session={session}
Body: {
  "object": "user_groups",
  "where": {
    "user_groups": {
      "user_id": 123,
      "group_id": 1
    }
  }
}
```

#### 6. Deletar Usuário
```typescript
POST http://{IP}:80/destroy_objects.fcgi?session={session}
Body: {
  "object": "users",
  "where": {
    "users": { "id": 123 }
  }
}
```

#### 7. Carregar Logs de Acesso
```typescript
POST http://{IP}:80/load_objects.fcgi?session={session}
Body: { "object": "access_logs" }
Response: {
  "access_logs": [{
    "user_id": 123,
    "device_id": 1,
    "event": 6,  // 6=entrada, 7=saída
    "time": 1234567890
  }]
}
```

### Classe ControlIdService

Localização: `server/controlId.ts`

**Principais Métodos:**

```typescript
class ControlIdService {
  // Autenticação
  async login(): Promise<string>

  // Cadastro facial
  async enrollFace(imageBase64: string, studentName: string): Promise<number>
  async uploadFaceImage(userId: number, imageBase64: string): Promise<boolean>

  // Gerenciamento de acesso
  async blockUserAccess(userId: number): Promise<boolean>
  async unblockUserAccess(userId: number, groupId: number): Promise<boolean>

  // CRUD usuários
  async createUser(name: string, registration: string): Promise<number>
  async deleteUser(userId: number): Promise<boolean>

  // Logs
  async loadAccessLogs(): Promise<any[]>

  // Utilitários
  async checkStatus(): Promise<boolean>
}
```

---

## 📊 Status de Matrícula

### 4 Status Disponíveis

| Status | Cor | Acesso | Uso |
|--------|-----|--------|-----|
| **ACTIVE** | 🟢 Verde | ✅ LIBERADO | Aluno regular em dia |
| **INACTIVE** | 🟡 Amarelo | 🚫 BLOQUEADO | Matrícula pausada |
| **SUSPENDED** | 🟠 Laranja | 🚫 BLOQUEADO | Suspensão temporária |
| **BLOCKED** | 🔴 Vermelho | 🚫 BLOQUEADO | Inadimplente ou exame vencido |

### Lógica de Acesso

**APENAS status "ACTIVE" permite acesso na leitora.**

```typescript
// Regra de acesso
if (student.membershipStatus === 'active') {
  // Adicionar ao grupo 1 (acesso liberado)
  await controlId.unblockUserAccess(student.controlIdUserId, 1);
} else {
  // Remover de todos os grupos (acesso bloqueado)
  await controlId.blockUserAccess(student.controlIdUserId);
}
```

### Sincronização com Control ID

**Mudança Manual (Admin):**
- Admin muda status no dropdown
- Sistema sincroniza instantaneamente com leitora
- Aluno pode/não pode entrar imediatamente

**Mudança Automática:**
- Cron job verifica diariamente (6h)
- Bloqueia/desbloqueia conforme regras
- Envia emails de notificação

---

## 🔄 Fluxos de Bloqueio/Desbloqueio

### 1️⃣ Bloqueio Automático por Inadimplência

**Trigger:** Cron job diário às 6:00 AM

**Condições:**
- Status atual != 'blocked'
- Possui pagamentos vencidos
- Vencimento > X dias (configurável, padrão 7)

**Ações:**
1. Atualiza status no DB para 'blocked'
2. Remove usuário de todos os grupos na Control ID
3. Envia email de notificação ao aluno
4. Registra log da ação

**Código:**
```typescript
// server/notifications.ts - checkAndBlockDefaulters()

const daysToBlock = settings.daysToBlockAfterDue || 7;
const blockThreshold = now - (daysToBlock * 24 * 60 * 60 * 1000);

const overduePayments = payments.filter(payment => {
  if (payment.status === 'paid') return false;
  const dueDate = new Date(payment.dueDate).getTime();
  return dueDate < blockThreshold;
});

if (overduePayments.length > 0) {
  await db.updateStudent(student.id, gym.id, {
    membershipStatus: 'blocked'
  });

  if (student.controlIdUserId) {
    await service.blockUserAccess(student.controlIdUserId);
  }

  await sendAccessBlockedNotification(...);
}
```

---

### 2️⃣ Bloqueio Automático por Exame Médico Vencido

**Trigger:** Cron job diário às 6:00 AM (mesma execução)

**Condições:**
- Configuração `blockOnExpiredExam = true`
- Status atual != 'blocked'
- Possui exame cadastrado
- Exame vencido há mais de X dias (padrão 90)

**Ações:**
1. Atualiza status no DB para 'blocked'
2. Remove usuário de todos os grupos na Control ID
3. Registra motivo: exame vencido

**Código:**
```typescript
if (settings.blockOnExpiredExam) {
  const examValidityDays = settings.examValidityDays || 90;
  const latestExam = getMostRecentExam(exams);
  const examDate = new Date(latestExam.examDate).getTime();
  const validUntil = examDate + (examValidityDays * 24 * 60 * 60 * 1000);

  if (Date.now() > validUntil) {
    await db.updateStudent(student.id, gym.id, {
      membershipStatus: 'blocked'
    });
    await service.blockUserAccess(student.controlIdUserId);
  }
}
```

---

### 3️⃣ Desbloqueio Automático - Pagamento PIX

**Trigger:** Webhook de confirmação PIX

**Fluxo:**
1. Sicoob envia webhook para `/api/pix/webhook`
2. Backend valida txid e atualiza pagamento
3. Se aluno estava bloqueado/inativo:
   - Atualiza status para 'active'
   - Adiciona ao grupo 1 na Control ID
4. Aluno pode entrar imediatamente

**Código:**
```typescript
// server/routers.ts - pixWebhook

if (student.membershipStatus === 'inactive' ||
    student.membershipStatus === 'blocked') {
  await db.updateStudentMembershipStatus(student.id, gym.id, 'active');
}

if (student.controlIdUserId) {
  const service = await getControlIdServiceForGym(gym.id);
  await service.unblockUserAccess(student.controlIdUserId, 1);
}
```

---

### 4️⃣ Desbloqueio Automático - Admin Marca Pagamento

**Trigger:** Admin confirma pagamento manual

**Fluxo:**
1. Admin clica em "Marcar como Pago" na interface
2. Gera recibo de pagamento
3. Se aluno estava bloqueado/inativo:
   - Atualiza status para 'active'
   - Adiciona ao grupo 1 na Control ID
4. Aluno pode entrar

**Código:**
```typescript
// server/routers.ts - markAsPaid mutation

if (student && (student.membershipStatus === 'inactive' ||
                student.membershipStatus === 'blocked')) {
  await db.updateStudentMembershipStatus(student.id, gym.id, 'active');
}

if (student && student.controlIdUserId) {
  const service = await getControlIdServiceForGym(gym.id);
  await service.unblockUserAccess(student.controlIdUserId, 1);
}
```

---

### 5️⃣ Bloqueio/Desbloqueio Manual - Mudança de Status

**Trigger:** Admin altera status no dropdown

**Fluxo:**
1. Admin seleciona novo status
2. Sistema detecta mudança
3. Se novo status = 'active':
   - Adiciona ao grupo 1 (libera acesso)
4. Se novo status != 'active':
   - Remove de todos os grupos (bloqueia)

**Código:**
```typescript
// server/routers.ts - updateStatus mutation

await db.updateStudent(studentId, gymId, {
  membershipStatus: input.membershipStatus
});

if (student.controlIdUserId) {
  const service = await getControlIdServiceForGym(gymId);

  if (input.membershipStatus === 'active') {
    await service.unblockUserAccess(student.controlIdUserId, 1);
  } else {
    await service.blockUserAccess(student.controlIdUserId);
  }
}
```

---

## 📝 Logs de Acesso

### Sincronização Automática

**Frequência:** A cada 30 segundos
**Cron:** `*/30 * * * * *`
**Função:** `syncAccessLogsFromControlId()`

### Processo

1. Busca logs da Control ID
2. Para cada log:
   - Identifica aluno por `controlIdUserId`
   - Traduz evento (6=entrada, 7=saída)
   - Verifica se já existe (evita duplicatas)
   - Insere no banco de dados
3. Logs aparecem em tempo real na interface

### Estrutura do Log

```typescript
interface AccessLog {
  id: number;
  gymId: number;
  studentId: number;
  deviceId: number;          // Qual leitora
  accessType: 'entry' | 'exit';
  denialReason?: string;     // Se acesso negado
  timestamp: Date;           // Quando ocorreu
  createdAt: Date;           // Quando foi registrado
}
```

### Prevenção de Duplicatas

```sql
-- Índice único
ALTER TABLE access_logs
ADD UNIQUE INDEX unique_access_log (
  studentId,
  timestamp,
  accessType,
  deviceId
);
```

### Verificação Adicional (Código)

```typescript
// Verifica duplicatas por timestamp próximo (±10 segundos)
const existingLogs = await db.getAccessLogsByStudent(studentId);
const isDuplicate = existingLogs.some(log => {
  const timeDiff = Math.abs(
    new Date(log.timestamp).getTime() - timestamp.getTime()
  );
  return timeDiff < 10000 && log.accessType === accessType;
});
```

---

## ⚙️ Configurações

### Tabela: `gym_settings`

```typescript
interface GymSettings {
  daysToBlockAfterDue: number;      // Dias até bloquear (padrão: 7)
  blockOnExpiredExam: boolean;       // Bloquear por exame vencido
  examValidityDays: number;          // Validade do exame (padrão: 90)
  paymentReminderDays: number;       // Dias antes p/ lembrete (padrão: 7)
  examReminderDays: number;          // Dias antes p/ lembrete (padrão: 15)
}
```

### Dispositivos Control ID

**Tabela:** `control_id_devices`

```typescript
interface ControlIdDevice {
  id: number;
  gymId: number;
  name: string;              // Ex: "Leitora Facial Principal"
  ip: string;                // Ex: "192.168.2.142"
  port: number;              // Padrão: 80
  location?: string;         // Ex: "Entrada principal"
  isActive: boolean;
}
```

---

## 📚 API Reference

### tRPC Mutations (Client → Server)

#### Cadastro Facial

```typescript
// Cadastrar foto facial
trpc.students.enrollFace.useMutation({
  gymSlug: string,
  studentId: number,
  imageData: string  // Base64
})
```

#### Mudança de Status

```typescript
// Alterar status manualmente
trpc.students.updateStatus.useMutation({
  gymSlug: string,
  studentId: number,
  membershipStatus: 'active' | 'inactive' | 'suspended' | 'blocked'
})
```

#### Exclusão

```typescript
// Excluir aluno (remove da Control ID também)
trpc.students.delete.useMutation({
  gymSlug: string,
  studentId: number
})
```

### tRPC Queries

```typescript
// Listar logs de acesso
trpc.accessLogs.list.useQuery({
  gymSlug: string,
  limit?: number,
  offset?: number
})

// Logs de um aluno específico
trpc.accessLogs.byStudent.useQuery({
  gymSlug: string,
  studentId: number
})

// Alunos presentes agora (entrada sem saída)
trpc.accessLogs.currentlyPresent.useQuery({
  gymSlug: string
})
```

---

## 🐛 Troubleshooting

### Problema: Leitora não responde

**Sintomas:**
- Erro de conexão ao tentar cadastrar
- Timeout nas requisições

**Verificações:**
1. Ping no IP da leitora: `ping 192.168.2.142`
2. Testar conexão: `curl http://192.168.2.142:80/login.fcgi`
3. Verificar firewall
4. Verificar se leitora está ligada
5. Verificar configuração de rede

**Solução:**
- Corrigir configuração de rede
- Reiniciar leitora se necessário
- Verificar credenciais (admin/admin)

---

### Problema: Foto facial não cadastra

**Sintomas:**
- Erro ao enviar imagem
- Imagem muito grande

**Verificações:**
1. Tamanho da imagem (máx 5MB)
2. Formato válido (JPG, PNG)
3. Base64 bem formatado
4. Sessão válida na Control ID

**Solução:**
```typescript
// Validar tamanho antes de enviar
if (file.size > 5 * 1024 * 1024) {
  toast.error("Imagem muito grande. Máximo: 5MB");
  return;
}

// Validar formato
if (!file.type.startsWith('image/')) {
  toast.error("Arquivo deve ser uma imagem");
  return;
}
```

---

### Problema: Aluno bloqueado mas leitora liberando

**Sintomas:**
- Status 'blocked' no sistema
- Leitora ainda permite entrada

**Verificações:**
1. Verificar `controlIdUserId` do aluno
2. Verificar se aluno ainda está em algum grupo
3. Logs de sincronização

**Solução:**
```bash
# Executar script de verificação
node verificar_grupos.cjs

# Desbloquear manualmente se necessário
node desbloquear_emerson.cjs
```

---

### Problema: Logs duplicados

**Sintomas:**
- Mesmo acesso aparece várias vezes
- Erro de unique constraint

**Causa:**
- Sync rodando múltiplas vezes
- Índice único faltando

**Solução:**
```sql
-- Criar índice único se não existir
ALTER TABLE access_logs
ADD UNIQUE INDEX unique_access_log (
  studentId, timestamp, accessType, deviceId
);

-- Remover duplicatas existentes
DELETE t1 FROM access_logs t1
INNER JOIN access_logs t2
WHERE t1.id > t2.id
  AND t1.studentId = t2.studentId
  AND t1.timestamp = t2.timestamp
  AND t1.accessType = t2.accessType;
```

---

### Problema: Desbloqueio não funcionando

**Sintomas:**
- Pagamento confirmado
- Aluno continua bloqueado

**Verificações:**
1. Status do pagamento no DB
2. Logs do servidor
3. Status do aluno
4. Grupos na Control ID

**Debug:**
```typescript
// Verificar status do aluno
const student = await db.getStudentById(studentId, gymId);
console.log('Status:', student.membershipStatus);
console.log('Control ID User:', student.controlIdUserId);

// Verificar grupos
const service = await getControlIdServiceForGym(gymId);
const groups = await service.loadUserGroups(student.controlIdUserId);
console.log('Grupos:', groups);
```

---

## 🔐 Segurança

### Boas Práticas

1. **Não versionar credenciais**
   - Usar variáveis de ambiente
   - `.env` no `.gitignore`

2. **Sessões com timeout**
   - Sessão Control ID expira
   - Auto-renovação implementada

3. **Logs auditáveis**
   - Todas as ações registradas
   - Rastreabilidade de mudanças

4. **Validação de dados**
   - Zod para validação
   - Sanitização de inputs

---

## 📞 Suporte Técnico

**Control ID:**
- Manual: [Control ID Docs](https://controlid.com.br)
- Suporte: suporte@controlid.com.br

**Sistema:**
- Documentação: `/docs`
- Logs: Console do servidor
- Debug: Ativar modo verbose

---

**Última atualização:** 18/12/2024
