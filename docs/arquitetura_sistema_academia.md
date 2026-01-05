# Arquitetura do Sistema de Academia com Control ID e PIX

## 1. Visão Geral da Solução

Um **sistema completo de gestão de academia** que integra:
- **Controle de Acesso Facial**: Control ID (iDFace)
- **Pagamento Recorrente**: PIX Automático (Efí Pay)
- **Gestão Administrativa**: Painel de controle
- **App para Alunos**: Gerenciamento de perfil e pagamentos

---

## 2. Arquitetura Técnica

### 2.1 Stack Tecnológico

| Componente | Tecnologia | Justificativa |
|-----------|-----------|---------------|
| **Frontend Admin** | React + TypeScript + TailwindCSS | Interface moderna e responsiva |
| **Frontend Aluno** | React + TypeScript + TailwindCSS | App web responsivo |
| **Backend** | Node.js + Express/FastAPI | API REST para integração |
| **Banco de Dados** | MySQL | Dados estruturados e relacionais |
| **Autenticação** | JWT + OAuth | Segurança e integração |
| **Webhooks** | Express/FastAPI | Receber notificações PIX |
| **Integração Control ID** | REST API | Comunicação com leitores |

### 2.2 Arquitetura em Camadas

```
┌─────────────────────────────────────────────────┐
│           Frontend (React + TypeScript)          │
│  ┌──────────────────┬──────────────────────────┐ │
│  │  Admin Panel     │   Student App            │ │
│  │  - Gestão        │   - Perfil              │ │
│  │  - Relatórios    │   - Pagamentos          │ │
│  │  - Controle      │   - Histórico           │ │
│  └──────────────────┴──────────────────────────┘ │
└──────────────────────────────────────────────────┘
                        ↓ HTTP/REST
┌──────────────────────────────────────────────────┐
│        Backend (Node.js + Express)               │
│  ┌────────────────────────────────────────────┐  │
│  │  API Routes                                │  │
│  │  - Autenticação                            │  │
│  │  - Usuários/Alunos                         │  │
│  │  - Pagamentos/Cobranças                    │  │
│  │  - Control ID Integration                  │  │
│  │  - Webhooks PIX                            │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │  Services                                  │  │
│  │  - PIX Service (Efí Pay)                   │  │
│  │  - Control ID Service                      │  │
│  │  - User Service                            │  │
│  │  - Payment Service                         │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
         ↓ SQL              ↓ HTTP         ↓ HTTP
    ┌─────────────┐   ┌──────────────┐  ┌────────────┐
    │   MySQL     │   │  Control ID  │  │  Efí Pay   │
    │  Database   │   │   (iDFace)   │  │   (PIX)    │
    └─────────────┘   └──────────────┘  └────────────┘
```

---

## 3. Banco de Dados (MySQL)

### 3.1 Tabelas Principais

#### `users` (Usuários do Sistema)
```sql
- id (PK)
- email (UNIQUE)
- password_hash
- name
- role (admin, student, staff)
- created_at
- updated_at
```

#### `students` (Alunos/Membros)
```sql
- id (PK)
- user_id (FK → users)
- registration_number (UNIQUE)
- cpf (UNIQUE)
- phone
- birth_date
- address
- city
- state
- zip_code
- membership_status (active, inactive, suspended)
- control_id_user_id (ID no Control ID)
- face_enrolled (boolean)
- created_at
- updated_at
```

#### `plans` (Planos de Academia)
```sql
- id (PK)
- name
- description
- price (DECIMAL)
- duration_days (30, 90, 365)
- features (JSON)
- created_at
```

#### `subscriptions` (Assinaturas/Matrículas)
```sql
- id (PK)
- student_id (FK → students)
- plan_id (FK → plans)
- start_date
- end_date
- status (active, expired, cancelled)
- pix_recurrence_id (ID da recorrência no Efí)
- created_at
- updated_at
```

#### `payments` (Pagamentos/Cobranças)
```sql
- id (PK)
- subscription_id (FK → subscriptions)
- student_id (FK → students)
- amount (DECIMAL)
- due_date
- paid_date
- status (pending, paid, overdue, failed)
- pix_txid (Identificador PIX)
- pix_charge_id (ID da cobrança no Efí)
- payment_method (pix, card, cash)
- created_at
- updated_at
```

#### `access_logs` (Logs de Acesso)
```sql
- id (PK)
- student_id (FK → students)
- device_id (ID do Control ID)
- access_type (entry, exit)
- recognition_method (face, card, pin)
- timestamp
- authorized (boolean)
- created_at
```

#### `control_id_devices` (Dispositivos Control ID)
```sql
- id (PK)
- device_name
- device_ip
- device_port
- location (entrada, saída, etc)
- status (online, offline)
- last_sync
- created_at
- updated_at
```

#### `pix_webhooks` (Histórico de Webhooks)
```sql
- id (PK)
- event_type (payment_received, recurrence_created, etc)
- payload (JSON)
- processed (boolean)
- processed_at
- created_at
```

---

## 4. Fluxos Principais

### 4.1 Fluxo de Cadastro de Aluno

```
1. Aluno acessa app e clica em "Cadastrar"
2. Preenche dados pessoais (email, CPF, telefone, etc)
3. Cria senha
4. Sistema cria usuário em users + student
5. Admin enrola face do aluno no Control ID
   - Captura foto facial
   - Envia para Control ID via API
   - Armazena control_id_user_id
6. Aluno recebe confirmação
```

### 4.2 Fluxo de Ativação de PIX Automático

```
1. Aluno seleciona plano na app
2. Sistema cria recorrência no Efí Pay
   - POST /v2/rec (criar recorrência)
   - POST /v2/solicrec (solicitar confirmação)
3. Aluno recebe QR Code ou link de autorização
4. Aluno autoriza pagamento via PIX
5. Primeira cobrança é processada
6. Sistema armazena pix_recurrence_id
7. Webhook confirma pagamento
8. Sistema libera acesso no Control ID
```

### 4.3 Fluxo de Pagamento Recorrente

```
1. Sistema cria cobrança recorrente
   - PUT /v2/cobr/:txid (criar cobrança)
2. Aluno recebe notificação
3. Aluno efetua pagamento via PIX
4. Efí Pay processa pagamento
5. Webhook notifica sistema
   - POST /webhook/pix/payment
6. Sistema atualiza status em payments
7. Sistema autoriza acesso no Control ID
   - POST /remote_access_authorization.fcgi
8. Aluno consegue entrar na academia
```

### 4.4 Fluxo de Entrada na Academia

```
1. Aluno chega na entrada
2. Control ID detecta rosto
3. Valida contra base de dados
4. Verifica se tem acesso autorizado
   - Subscrição ativa?
   - Pagamento em dia?
5. Se sim: libera entrada (abre porta/catraca)
6. Se não: nega entrada
7. Registra log de acesso
```

---

## 5. APIs e Endpoints

### 5.1 Backend API (Node.js)

#### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/logout` - Fazer logout
- `GET /api/auth/me` - Dados do usuário autenticado

#### Alunos (Admin)
- `GET /api/students` - Listar alunos
- `POST /api/students` - Criar aluno
- `GET /api/students/:id` - Detalhes do aluno
- `PUT /api/students/:id` - Atualizar aluno
- `DELETE /api/students/:id` - Deletar aluno

#### Planos
- `GET /api/plans` - Listar planos
- `POST /api/plans` - Criar plano
- `PUT /api/plans/:id` - Atualizar plano

#### Assinaturas
- `GET /api/subscriptions` - Listar assinaturas
- `POST /api/subscriptions` - Criar assinatura
- `GET /api/subscriptions/:id` - Detalhes
- `PUT /api/subscriptions/:id` - Atualizar

#### Pagamentos
- `GET /api/payments` - Listar pagamentos
- `POST /api/payments` - Criar cobrança
- `GET /api/payments/:id` - Detalhes
- `PUT /api/payments/:id/retry` - Reenviar cobrança

#### Control ID
- `POST /api/control-id/enroll-face` - Enrolar face
- `GET /api/control-id/access-logs` - Logs de acesso
- `POST /api/control-id/authorize-access` - Autorizar acesso

#### Webhooks
- `POST /api/webhooks/pix/payment` - Webhook de pagamento PIX
- `POST /api/webhooks/pix/recurrence` - Webhook de recorrência

#### Relatórios (Admin)
- `GET /api/reports/revenue` - Receita
- `GET /api/reports/access` - Acessos
- `GET /api/reports/students` - Alunos ativos

---

## 6. Integração Control ID

### 6.1 Fluxo de Enrolamento Facial

```javascript
// 1. Login no Control ID
POST /login.fcgi
{
  "login": "admin",
  "password": "admin"
}
// Resposta: { "session": "xxx" }

// 2. Enrolar face remotamente
POST /remote_enroll.fcgi?session=xxx
{
  "type": "face",
  "user_id": 123,
  "save": true,
  "sync": true,
  "auto": true,
  "countdown": 3
}
// Resposta: { "success": true, "user_image": "base64..." }

// 3. Armazenar user_image no banco
UPDATE students SET face_enrolled = true WHERE id = xxx
```

### 6.2 Fluxo de Autorização Remota

```javascript
// Quando pagamento é confirmado
POST /remote_access_authorization.fcgi?session=xxx
{
  "user_id": 123,
  "door_id": 1,
  "time": 300  // 5 minutos
}
```

---

## 7. Integração Efí Pay (PIX)

### 7.1 Fluxo de Criação de Recorrência

```javascript
// 1. Criar recorrência
POST /v2/rec
{
  "valor": 150.00,
  "solicitante": "Academia XYZ",
  "pagador": {
    "cpf": "123.456.789-00",
    "nome": "João Silva"
  }
}

// 2. Criar solicitação de confirmação
POST /v2/solicrec
{
  "idRec": "xxx"
}

// 3. Aluno autoriza via QR Code

// 4. Criar primeira cobrança
PUT /v2/cobr/:txid
{
  "valor": 150.00,
  "idRec": "xxx"
}
```

### 7.2 Webhook de Pagamento

```javascript
// Configurar webhook
PUT /v2/webhook/:chave
{
  "url": "https://seu-dominio.com/api/webhooks/pix/payment",
  "skipMtls": false
}

// Receber notificação
POST /api/webhooks/pix/payment
{
  "id": "xxx",
  "txid": "xxx",
  "valor": 150.00,
  "status": "CONCLUIDA",
  "horario": "2025-12-11T10:30:00Z"
}
```

---

## 8. Segurança

### 8.1 Autenticação
- JWT com refresh token
- Senhas com bcrypt
- Session timeout

### 8.2 Autorização
- Role-based access control (RBAC)
- Admin, Staff, Student

### 8.3 Comunicação
- HTTPS obrigatório
- mTLS para Control ID
- Validação de webhooks (IP + HMAC)

### 8.4 Dados Sensíveis
- CPF/CNPJ criptografado
- Senhas com hash
- PII em conformidade com LGPD

---

## 9. Deployment

### 9.1 Estrutura de Pastas

```
academia-system/
├── frontend/
│   ├── admin/          (Painel administrativo)
│   └── student-app/    (App para alunos)
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   ├── config/
│   └── package.json
├── database/
│   └── migrations/
└── docker-compose.yml
```

### 9.2 Variáveis de Ambiente

```
# Backend
DATABASE_URL=mysql://user:pass@localhost:3306/academia
JWT_SECRET=xxx
CONTROL_ID_IP=192.168.1.100
CONTROL_ID_PORT=80
EFI_PAY_CLIENT_ID=xxx
EFI_PAY_CLIENT_SECRET=xxx
WEBHOOK_URL=https://seu-dominio.com/api/webhooks
```

---

## 10. Fases de Desenvolvimento

1. **Fase 1**: Inicializar projeto + BD
2. **Fase 2**: Autenticação + Gestão de Usuários
3. **Fase 3**: Painel Administrativo
4. **Fase 4**: App para Alunos
5. **Fase 5**: Integração Control ID
6. **Fase 6**: Integração PIX
7. **Fase 7**: Testes + Deploy

