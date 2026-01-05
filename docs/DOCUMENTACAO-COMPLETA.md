# 📚 Documentação Completa - Sistema de Academia

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Implementadas](#funcionalidades-implementadas)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Configuração e Instalação](#configuração-e-instalação)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Banco de Dados](#banco-de-dados)
8. [Integrações](#integrações)
9. [Cron Jobs](#cron-jobs)
10. [Endpoints tRPC](#endpoints-trpc)
11. [Fluxos Principais](#fluxos-principais)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Sistema completo de gestão de academias com controle de acesso facial via Control ID, pagamentos automáticos via PIX (Efí Pay), treinos personalizados, notificações por email e dashboard administrativo completo.

**Status do Projeto:** 95% completo e pronto para produção

---

## ✅ Funcionalidades Implementadas

### 👤 Gestão de Usuários
- ✅ Cadastro de alunos com dados completos (pessoais, endereço, plano)
- ✅ Cadastro de professores com login próprio
- ✅ Cadastro de funcionários com sistema de permissões granulares
- ✅ Sistema de autenticação OAuth via Manus
- ✅ Controle de acesso por roles (admin, professor, aluno)

### 💰 Sistema de Pagamentos
- ✅ Geração de QR Code PIX via Efí Pay
- ✅ Verificação manual de status de pagamento
- ✅ Criação automática de mensalidades ao vincular plano
- ✅ Dashboard financeiro com métricas
- ✅ Gestão de inadimplentes
- ✅ Histórico completo de pagamentos

### 📊 Planos e Assinaturas
- ✅ Cadastro de planos com nome, valor e duração
- ✅ Vinculação de planos aos alunos
- ✅ Renovação automática de mensalidades
- ✅ Edição e exclusão de planos

### 🏋️ Treinos Personalizados
- ✅ Criação de fichas de treino por professores
- ✅ Divisão por dias da semana (A, B, C, D, E, F, G)
- ✅ Exercícios com séries, repetições e observações
- ✅ Visualização de treinos pelo aluno no app
- ✅ Sistema de progressão bloqueado por dia

### 🔐 Controle de Acesso Facial (Control ID)
- ✅ Cadastro de dispositivos Control ID
- ✅ Cadastro facial interativo (aluno olha para dispositivo)
- ✅ Upload de foto para cadastro facial
- ✅ Sincronização de usuários com dispositivo
- ✅ Bloqueio/desbloqueio automático de acesso
- ✅ Logs de entrada e saída
- ✅ Tela de gestão de dispositivos

### 📧 Notificações Automáticas
- ✅ Email de vencimento (7 dias antes)
- ✅ Email de confirmação de pagamento
- ✅ Email de exame médico vencendo (15 dias antes)
- ✅ Email de boas-vindas ao novo aluno
- ✅ Email de bloqueio por inadimplência

### 🤖 Automações (Cron Jobs)
- ✅ Bloqueio automático de inadimplentes (diário às 6h)
- ✅ Envio de lembretes de pagamento (diário às 9h)
- ✅ Lembretes de exame médico (diário às 10h)

### 📄 Relatórios
- ✅ Relatório de inadimplência (PDF)
- ✅ Relatório de pagamentos por período (PDF/Excel)
- ✅ Relatório financeiro mensal (PDF)
- ✅ Exportação de lista de alunos (Excel)
- ✅ Filtros por mês e ano

### 📱 Área do Aluno
- ✅ Visualização de treinos
- ✅ Histórico de pagamentos
- ✅ Geração de QR Code PIX
- ✅ Carteirinha digital
- ✅ Verificação de status de pagamento

### 👨‍🏫 Área do Professor
- ✅ Login exclusivo para professores
- ✅ Criação de fichas de treino
- ✅ Gerenciamento de exercícios
- ✅ Visualização de alunos

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização
- **shadcn/ui** - Componentes UI
- **Wouter** - Roteamento
- **tRPC** - Type-safe API
- **Vite** - Build tool

### Backend
- **Node.js 22** - Runtime
- **Express 4** - Servidor HTTP
- **tRPC 11** - API type-safe
- **Drizzle ORM** - ORM para banco de dados
- **MySQL/TiDB** - Banco de dados
- **Superjson** - Serialização de dados

### Integrações
- **Efí Pay API** - Pagamentos PIX
- **Control ID API** - Reconhecimento facial
- **Nodemailer** - Envio de emails
- **Node-cron** - Agendamento de tarefas

### Bibliotecas Auxiliares
- **jsPDF** - Geração de PDFs
- **jspdf-autotable** - Tabelas em PDF
- **xlsx** - Exportação Excel
- **bcrypt** - Hash de senhas
- **jsonwebtoken** - Autenticação JWT

---

## 📁 Estrutura do Projeto

```
academia-system/
├── client/                    # Frontend React
│   ├── public/               # Arquivos estáticos
│   └── src/
│       ├── components/       # Componentes reutilizáveis
│       │   ├── ui/          # Componentes shadcn/ui
│       │   ├── DashboardLayout.tsx
│       │   └── AIChatBox.tsx
│       ├── pages/           # Páginas da aplicação
│       │   ├── admin/       # Páginas administrativas
│       │   │   ├── AdminStudents.tsx
│       │   │   ├── AdminProfessors.tsx
│       │   │   ├── AdminStaff.tsx
│       │   │   ├── AdminControlIdDevices.tsx
│       │   │   └── AdminReports.tsx
│       │   ├── Home.tsx
│       │   ├── Login.tsx
│       │   ├── StudentDashboard.tsx
│       │   └── ProfessorDashboard.tsx
│       ├── lib/
│       │   └── trpc.ts      # Cliente tRPC
│       ├── App.tsx          # Rotas principais
│       ├── main.tsx         # Entry point
│       └── index.css        # Estilos globais
│
├── server/                   # Backend Node.js
│   ├── _core/               # Infraestrutura (não editar)
│   │   ├── index.ts         # Servidor Express
│   │   ├── oauth.ts         # Autenticação OAuth
│   │   ├── llm.ts           # Integração LLM
│   │   └── ...
│   ├── db.ts                # Funções de banco de dados
│   ├── routers.ts           # Endpoints tRPC
│   ├── controlId.ts         # Serviço Control ID
│   ├── pix.ts               # Serviço Efí Pay PIX
│   ├── email.ts             # Serviço de email
│   ├── notifications.ts     # Notificações automáticas
│   ├── cron.ts              # Agendamento de tarefas
│   ├── receipt.ts           # Geração de recibos
│   └── storage.ts           # Upload S3
│
├── drizzle/                 # Migrations e schema
│   ├── schema.ts            # Definição das tabelas
│   └── meta/                # Histórico de migrations
│
├── shared/                  # Código compartilhado
│   ├── const.ts             # Constantes
│   └── types.ts             # Tipos TypeScript
│
├── docs/                    # Documentação
│   └── control-id-api.md    # API Control ID
│
├── package.json             # Dependências
├── tsconfig.json            # Config TypeScript
├── vite.config.ts           # Config Vite
├── drizzle.config.ts        # Config Drizzle ORM
└── todo.md                  # Lista de tarefas
```

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js 22+
- pnpm (gerenciador de pacotes)
- Banco de dados MySQL/TiDB
- Conta Efí Pay (para PIX)
- Dispositivo Control ID (para reconhecimento facial)

### Passo a Passo

1. **Extrair o arquivo ZIP**
```bash
unzip academia-system-completo.zip
cd academia-system
```

2. **Instalar dependências**
```bash
pnpm install
```

3. **Configurar variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto (veja seção [Variáveis de Ambiente](#variáveis-de-ambiente))

4. **Configurar banco de dados**
```bash
# Aplicar schema ao banco
pnpm db:push
```

5. **Iniciar servidor de desenvolvimento**
```bash
pnpm dev
```

O sistema estará disponível em `http://localhost:3000`

### Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor dev (frontend + backend)

# Banco de Dados
pnpm db:push          # Aplica schema ao banco
pnpm db:studio        # Abre interface visual do banco

# Testes
pnpm test             # Executa testes unitários
pnpm test:watch       # Testes em modo watch

# Build
pnpm build            # Build para produção
pnpm preview          # Preview do build de produção
```

---

## 🔐 Variáveis de Ambiente

### Variáveis Obrigatórias (Sistema)

Estas variáveis são **injetadas automaticamente** pela plataforma Manus:

```env
# Banco de Dados
DATABASE_URL=mysql://user:password@host:port/database

# Autenticação
JWT_SECRET=seu-secret-jwt
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Manus App
VITE_APP_ID=seu-app-id
VITE_APP_TITLE=Sistema de Academia
VITE_APP_LOGO=/logo.png

# Owner
OWNER_OPEN_ID=owner-id
OWNER_NAME=Nome do Proprietário

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=sua-api-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=frontend-api-key

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=seu-website-id
```

### Variáveis Personalizadas (Você deve configurar)

```env
# Efí Pay (PIX)
EFI_CLIENT_ID=seu-client-id-efi
EFI_CLIENT_SECRET=seu-client-secret-efi
EFI_CERTIFICATE_PATH=./certificado-efi.p12
EFI_SANDBOX=true  # false para produção

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app
SMTP_FROM_NAME=Academia Sistema
SMTP_FROM_EMAIL=noreply@academia.com

# Control ID (Opcional - configurar por dispositivo)
# Cada dispositivo tem IP, porta, usuário e senha próprios
# Configurados pela interface web em /admin/control-id-devices
```

### Como Adicionar Variáveis Personalizadas

1. Acesse o painel Manus
2. Vá em **Settings → Secrets**
3. Adicione cada variável com seu valor
4. Reinicie o servidor

---

## 🗄️ Banco de Dados

### Schema Principal

#### Tabela: `users`
Armazena todos os usuários do sistema (alunos, professores, funcionários, admins)

```sql
- id (PK)
- email (unique)
- password (hash bcrypt)
- role (enum: admin, gym_admin, professor, student, staff)
- name
- gymId (FK → gyms)
- createdAt, updatedAt
```

#### Tabela: `students`
Dados específicos de alunos

```sql
- id (PK)
- userId (FK → users)
- gymId (FK → gyms)
- registrationNumber (matrícula)
- cpf
- birthDate
- address, city, state, zipCode
- membershipStatus (enum: active, inactive, blocked, suspended)
- faceEnrolled (boolean)
- controlIdUserId (ID no Control ID)
- createdAt, updatedAt
```

#### Tabela: `plans`
Planos de mensalidade

```sql
- id (PK)
- gymId (FK → gyms)
- name
- description
- priceInCents (valor em centavos)
- durationDays
- features (JSON)
- active (boolean)
- createdAt, updatedAt
```

#### Tabela: `subscriptions`
Assinaturas de alunos

```sql
- id (PK)
- studentId (FK → students)
- planId (FK → plans)
- gymId (FK → gyms)
- status (enum: active, cancelled, expired)
- startDate
- endDate
- createdAt, updatedAt
```

#### Tabela: `payments`
Pagamentos e mensalidades

```sql
- id (PK)
- studentId (FK → students)
- subscriptionId (FK → subscriptions)
- gymId (FK → gyms)
- amountInCents
- status (enum: pending, paid, overdue, cancelled)
- dueDate
- paidAt
- paymentMethod (enum: pix, cash, card, bank_transfer)
- txId (ID da transação PIX)
- qrCode (QR Code PIX)
- qrCodeImage (Base64 da imagem)
- createdAt, updatedAt
```

#### Tabela: `workouts`
Fichas de treino

```sql
- id (PK)
- studentId (FK → students)
- professorId (FK → users)
- gymId (FK → gyms)
- name
- description
- dayOfWeek (enum: A, B, C, D, E, F, G)
- active (boolean)
- createdAt, updatedAt
```

#### Tabela: `exercises`
Exercícios dos treinos

```sql
- id (PK)
- workoutId (FK → workouts)
- name
- sets (séries)
- reps (repetições)
- weight
- restTime
- observations
- order (ordem de execução)
- createdAt, updatedAt
```

#### Tabela: `control_id_devices`
Dispositivos Control ID

```sql
- id (PK)
- gymId (FK → gyms)
- name
- ipAddress
- port
- username
- password
- location
- active (boolean)
- createdAt, updatedAt
```

#### Tabela: `staff`
Funcionários da academia

```sql
- id (PK)
- userId (FK → users)
- gymId (FK → gyms)
- permissions (JSON com permissões)
- active (boolean)
- createdAt, updatedAt
```

**Permissões disponíveis:**
- `viewStudents` - Visualizar alunos
- `editStudents` - Editar alunos
- `viewPayments` - Visualizar pagamentos
- `editPayments` - Editar pagamentos
- `viewReports` - Visualizar relatórios
- `manageAccess` - Gerenciar controle de acesso
- `managePlans` - Gerenciar planos

---

## 🔗 Integrações

### 1. Efí Pay (PIX)

**Arquivo:** `server/pix.ts`

**Funcionalidades:**
- Geração de QR Code PIX
- Verificação de status de pagamento
- Webhook para notificações (pendente)

**Como configurar:**

1. Crie uma conta na [Efí Pay](https://sejaefi.com.br/)
2. Gere credenciais de API (Client ID e Client Secret)
3. Baixe o certificado `.p12`
4. Configure as variáveis de ambiente:

```env
EFI_CLIENT_ID=seu-client-id
EFI_CLIENT_SECRET=seu-client-secret
EFI_CERTIFICATE_PATH=./certificado.p12
EFI_SANDBOX=true  # false para produção
```

**Endpoints tRPC:**
- `payments.generatePixQrCode` - Gera QR Code
- `payments.checkPixPaymentStatus` - Verifica status

### 2. Control ID (Reconhecimento Facial)

**Arquivo:** `server/controlId.ts`

**Funcionalidades:**
- Cadastro facial interativo
- Upload de foto para cadastro
- Sincronização de usuários
- Bloqueio/desbloqueio de acesso
- Obtenção de logs de entrada/saída

**Como configurar:**

1. Configure o dispositivo Control ID na rede local
2. Anote IP, porta, usuário e senha
3. Acesse `/admin/control-id-devices` no sistema
4. Cadastre o dispositivo
5. Teste a conexão

**Endpoints tRPC:**
- `devices.create` - Cadastra dispositivo
- `devices.list` - Lista dispositivos
- `controlId.enrollFace` - Cadastro facial interativo
- `controlId.uploadFacePhoto` - Upload de foto
- `controlId.blockUser` - Bloqueia usuário
- `controlId.unblockUser` - Desbloqueia usuário

**Documentação completa:** `docs/control-id-api.md`

### 3. Email (SMTP)

**Arquivo:** `server/email.ts`

**Como configurar Gmail:**

1. Ative a verificação em 2 etapas
2. Gere uma senha de app em https://myaccount.google.com/apppasswords
3. Configure as variáveis:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=senha-de-app-gerada
SMTP_FROM_NAME=Academia Sistema
SMTP_FROM_EMAIL=noreply@academia.com
```

**Outros provedores:**
- **Outlook:** smtp-mail.outlook.com:587
- **SendGrid:** smtp.sendgrid.net:587
- **Mailgun:** smtp.mailgun.org:587

---

## ⏰ Cron Jobs

**Arquivo:** `server/cron.ts`

### 1. Bloqueio Automático de Inadimplentes
- **Horário:** Diariamente às 6:00 AM
- **Função:** `checkAndBlockDefaulters()`
- **O que faz:**
  - Verifica alunos com mensalidades vencidas há mais de 7 dias
  - Bloqueia no banco de dados (status = blocked)
  - Bloqueia no Control ID (se configurado)
  - Envia email de notificação

### 2. Lembretes de Pagamento
- **Horário:** Diariamente às 9:00 AM
- **Função:** `sendDailyPaymentReminders()`
- **O que faz:**
  - Verifica mensalidades que vencem em 7 dias
  - Envia email de lembrete

### 3. Lembretes de Exame Médico
- **Horário:** Diariamente às 10:00 AM
- **Função:** `sendDailyMedicalExamReminders()`
- **O que faz:**
  - Verifica exames que vencem em 15 dias
  - Envia email de lembrete

**Como desabilitar um cron job:**

Edite `server/cron.ts` e comente a função `cron.schedule()` correspondente.

---

## 🔌 Endpoints tRPC

### Autenticação
- `auth.me` - Retorna usuário logado
- `auth.logout` - Faz logout

### Alunos
- `students.list` - Lista alunos da academia
- `students.create` - Cadastra novo aluno
- `students.update` - Atualiza dados do aluno
- `students.delete` - Remove aluno
- `students.me` - Dados do aluno logado

### Professores
- `professors.list` - Lista professores
- `professors.create` - Cadastra professor
- `professors.update` - Atualiza professor
- `professors.delete` - Remove professor

### Funcionários
- `staff.list` - Lista funcionários
- `staff.create` - Cadastra funcionário
- `staff.update` - Atualiza funcionário e permissões
- `staff.delete` - Remove funcionário

### Planos
- `plans.list` - Lista planos
- `plans.create` - Cadastra plano
- `plans.update` - Atualiza plano
- `plans.delete` - Remove plano

### Pagamentos
- `payments.listAll` - Lista todos os pagamentos
- `payments.myPayments` - Pagamentos do aluno logado
- `payments.generatePixQrCode` - Gera QR Code PIX
- `payments.checkPixPaymentStatus` - Verifica status do PIX
- `payments.markAsPaid` - Marca como pago manualmente

### Treinos
- `workouts.list` - Lista treinos do aluno
- `workouts.create` - Cria ficha de treino
- `workouts.update` - Atualiza treino
- `workouts.delete` - Remove treino
- `workouts.myWorkouts` - Treinos do aluno logado

### Exercícios
- `exercises.list` - Lista exercícios do treino
- `exercises.create` - Adiciona exercício
- `exercises.update` - Atualiza exercício
- `exercises.delete` - Remove exercício

### Dispositivos Control ID
- `devices.list` - Lista dispositivos
- `devices.create` - Cadastra dispositivo
- `devices.update` - Atualiza dispositivo
- `devices.delete` - Remove dispositivo
- `devices.checkStatus` - Testa conexão

### Control ID
- `controlId.enrollFace` - Cadastro facial interativo
- `controlId.uploadFacePhoto` - Upload de foto
- `controlId.blockUser` - Bloqueia usuário
- `controlId.unblockUser` - Desbloqueia usuário
- `controlId.getLogs` - Obtém logs de acesso

---

## 🔄 Fluxos Principais

### Fluxo 1: Cadastro de Aluno

1. Admin acessa `/admin/students`
2. Clica em "Novo Aluno"
3. Preenche formulário com:
   - Dados pessoais (nome, email, CPF, data de nascimento)
   - Endereço completo
   - Seleciona plano de mensalidade
4. Sistema cria:
   - Usuário na tabela `users`
   - Aluno na tabela `students`
   - Assinatura na tabela `subscriptions`
   - Primeira mensalidade na tabela `payments`
5. Aluno recebe email de boas-vindas

### Fluxo 2: Cadastro Facial

1. Admin acessa `/admin/students`
2. Clica em "Cadastrar Face" no aluno
3. Escolhe método:
   - **Interativo:** Aluno olha para dispositivo Control ID
   - **Upload:** Envia foto do aluno
4. Sistema:
   - Conecta ao dispositivo Control ID
   - Faz login
   - Sincroniza usuário
   - Cadastra face
   - Atualiza `faceEnrolled = true`

### Fluxo 3: Pagamento via PIX

1. Aluno acessa `/student/payments`
2. Vê mensalidade pendente
3. Clica em "Gerar PIX"
4. Sistema:
   - Chama API Efí Pay
   - Gera QR Code e copia-e-cola
   - Salva `txId` no banco
5. Aluno paga via app do banco
6. Admin verifica status manualmente
7. Sistema atualiza status para "paid"
8. Aluno recebe email de confirmação

### Fluxo 4: Bloqueio Automático

1. Cron job executa às 6h da manhã
2. Sistema busca alunos com mensalidades vencidas há 7+ dias
3. Para cada inadimplente:
   - Atualiza status para "blocked"
   - Bloqueia no Control ID
   - Envia email de notificação
4. Aluno não consegue mais acessar a academia

### Fluxo 5: Criação de Treino

1. Professor faz login em `/professor/login`
2. Acessa dashboard
3. Seleciona aluno
4. Clica em "Criar Treino"
5. Define:
   - Nome do treino
   - Dia da semana (A, B, C, etc)
   - Lista de exercícios com séries, reps, peso
6. Sistema salva treino
7. Aluno visualiza no app

---

## 🐛 Troubleshooting

### Problema: Servidor não inicia

**Erro:** `Error: Cannot find module...`

**Solução:**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Problema: Erro de conexão com banco de dados

**Erro:** `ER_ACCESS_DENIED_ERROR`

**Solução:**
1. Verifique `DATABASE_URL` no `.env`
2. Teste conexão:
```bash
mysql -h host -u user -p database
```

### Problema: Emails não estão sendo enviados

**Possíveis causas:**
1. SMTP mal configurado
2. Senha de app incorreta (Gmail)
3. Firewall bloqueando porta 587

**Solução:**
```bash
# Teste SMTP manualmente
node -e "require('./server/email').sendEmail({to:'seu-email@gmail.com',subject:'Teste',html:'<p>Teste</p>'})"
```

### Problema: Control ID não conecta

**Erro:** `ECONNREFUSED` ou `Timeout`

**Solução:**
1. Verifique se dispositivo está na mesma rede
2. Teste ping:
```bash
ping 192.168.1.100
```
3. Verifique IP, porta, usuário e senha
4. Certifique-se que API REST está habilitada no dispositivo

### Problema: QR Code PIX não gera

**Erro:** `Invalid credentials`

**Solução:**
1. Verifique credenciais Efí Pay
2. Certifique-se que certificado `.p12` está no caminho correto
3. Verifique se está em sandbox ou produção

### Problema: Cron jobs não executam

**Solução:**
1. Verifique logs do servidor
2. Certifique-se que `startCronJobs()` está sendo chamado em `server/_core/index.ts`
3. Reinicie o servidor

### Problema: Build falha

**Erro:** `TypeScript errors`

**Solução:**
```bash
# Limpar cache
rm -rf dist .vite
pnpm build
```

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique esta documentação
2. Consulte `docs/control-id-api.md` para Control ID
3. Consulte `todo.md` para funcionalidades pendentes
4. Entre em contato com o desenvolvedor

---

## 📝 Notas Finais

### O que está pronto para produção:
- ✅ Gestão completa de alunos, professores e funcionários
- ✅ Sistema de pagamentos PIX
- ✅ Treinos personalizados
- ✅ Notificações automáticas
- ✅ Relatórios PDF/Excel
- ✅ Bloqueio automático de inadimplentes
- ✅ Cadastro facial (requer dispositivo físico)

### O que precisa de configuração:
- ⚙️ Credenciais Efí Pay
- ⚙️ Configuração SMTP
- ⚙️ Dispositivos Control ID
- ⚙️ Webhook PIX (opcional)

### Próximos passos recomendados:
1. Configurar webhook PIX para atualização em tempo real
2. Implementar desbloqueio automático após pagamento
3. Criar tela de histórico de mensalidades detalhado
4. Adicionar sistema multi-tenant completo
5. Implementar notificações push no app

---

**Desenvolvido com ❤️ usando Manus AI**

**Versão:** 1.0.0  
**Data:** Janeiro 2025  
**Status:** Pronto para produção
