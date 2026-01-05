# Sistema de Gestão de Academia

Sistema completo para gestão de academias com controle de acesso por reconhecimento facial integrado à leitora Control ID.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Funcionalidades Implementadas](#funcionalidades-implementadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração](#configuração)
- [Documentação Adicional](#documentação-adicional)

---

## 🎯 Visão Geral

Sistema web fullstack para gestão completa de academias, incluindo:
- Gestão de alunos, professores e funcionários
- Controle financeiro (mensalidades, pagamentos PIX)
- Controle de acesso biométrico (facial)
- Agendamento de aulas e treinos
- Exames médicos e avaliações físicas
- Relatórios e dashboards

---

## 🛠️ Tecnologias

### Frontend
- **React** com TypeScript
- **TailwindCSS** para estilização
- **Shadcn/ui** para componentes
- **tRPC** para comunicação type-safe com backend
- **React Webcam** para captura de fotos faciais

### Backend
- **Node.js** com TypeScript
- **Express** como servidor web
- **tRPC** para APIs type-safe
- **Drizzle ORM** para banco de dados
- **MySQL** como banco de dados
- **node-cron** para tarefas agendadas

### Integrações
- **Control ID** - Leitora biométrica facial
- **PIX (Sicoob)** - Pagamentos instantâneos
- **Nodemailer** - Envio de emails

---

## ✅ Funcionalidades Implementadas

### 1. Gestão de Alunos

#### Cadastro e Edição
- Cadastro completo de alunos (dados pessoais, endereço, contato)
- Edição de informações
- Upload de foto do perfil
- Vinculação a planos de mensalidade
- Cadastro de CPF e documentos

#### Cadastro Facial (Control ID)
- **Captura via webcam** - Captura foto ao vivo durante cadastro
- **Upload de arquivo** - Upload de foto existente (JPG, PNG, até 5MB)
- Envio automático para leitora Control ID
- Sincronização com dispositivo biométrico
- Opção disponível em:
  - Criação de novo aluno
  - Edição de aluno existente

#### Status de Matrícula
Sistema gerencia 4 status diferentes:

1. **ACTIVE (Ativo)** ✅
   - Aluno com acesso liberado
   - Pagamentos em dia
   - Exame médico válido
   - Leitora: PERMITE acesso

2. **INACTIVE (Inativo)** 🟡
   - Matrícula pausada
   - Sem acesso à academia
   - Leitora: BLOQUEIA acesso

3. **SUSPENDED (Suspenso)** 🟠
   - Suspensão administrativa temporária
   - Sem acesso à academia
   - Leitora: BLOQUEIA acesso

4. **BLOCKED (Bloqueado)** 🔴
   - Bloqueio por inadimplência ou exame vencido
   - Sem acesso à academia
   - Leitora: BLOQUEIA acesso
   - Email automático enviado ao aluno

#### Exclusão
- Exclusão completa do cadastro
- **Remoção automática da leitora Control ID**
- Remove foto facial e acesso biométrico

---

### 2. Controle de Acesso Biométrico

#### Integração Control ID
- Comunicação via API REST com leitora facial
- Autenticação e gerenciamento de sessão
- Suporte a múltiplos dispositivos

#### Cadastro Facial
- Envio de foto (base64) para Control ID
- Criação automática de usuário no dispositivo
- Vinculação ao grupo de acesso padrão

#### Bloqueio/Desbloqueio Automático

**Bloqueio Automático (Cron diário às 6h):**
- ❌ Inadimplência > 7 dias (configurável)
- ❌ Exame médico vencido > 90 dias
- 🚫 Remove aluno de todos os grupos na leitora
- 📧 Envia email de notificação

**Desbloqueio Automático:**
- ✅ Pagamento PIX confirmado via webhook
- ✅ Admin marca pagamento como pago
- ✅ Admin muda status para "Ativo"
- 🔓 Adiciona aluno ao grupo de acesso

#### Bloqueio/Desbloqueio Manual
- Admin pode mudar status a qualquer momento
- Sincronização instantânea com leitora
- Status "Ativo" → Desbloqueia
- Status "Inativo/Suspenso/Bloqueado" → Bloqueia

#### Logs de Acesso
- **Sincronização automática a cada 30 segundos**
- Registra entrada e saída de alunos
- Timestamp preciso
- Vinculação ao dispositivo usado
- Exibição em tempo real na interface
- Histórico completo por aluno

---

### 3. Gestão Financeira

#### Planos de Mensalidade
- Cadastro de múltiplos planos
- Definição de preço e periodicidade
- Descrição e benefícios
- Vinculação a alunos

#### Pagamentos PIX (Sicoob)
- **Geração automática de QR Code PIX**
- Webhook para confirmação em tempo real
- Polling de status a cada 30 segundos
- Atualização automática de status
- Desbloqueio automático ao confirmar pagamento

#### Pagamentos Manuais (Admin)
- Confirmação manual pela secretaria
- Registro de método de pagamento (dinheiro, cartão, etc)
- Geração de recibo
- Desbloqueio automático do aluno

#### Mensalidades
- Geração automática mensal
- Definição de dia de vencimento
- Controle de status (pendente/pago/vencido/cancelado)
- Geração de múltiplas mensalidades futuras
- Cálculo automático de valores

#### Controle de Inadimplência
- Identificação automática de pagamentos vencidos
- Cálculo de dias em atraso
- Bloqueio automático após período configurável
- Email de notificação ao aluno
- Dashboard de inadimplentes

---

### 4. Exames Médicos e Avaliações

#### Exames Médicos
- Cadastro de exames periódicos
- Data de realização
- Validade (padrão 90 dias)
- Anexo de documentos
- Alerta de vencimento

#### Bloqueio por Exame Vencido
- Verificação automática diária (6h)
- Bloqueio se exame vencido
- Email de notificação
- Remoção de acesso na leitora

#### Avaliações Físicas
- Registro de medidas corporais
- Histórico de evolução
- Acompanhamento de metas
- Comparativo de resultados

---

### 5. Treinos e Exercícios

#### Biblioteca de Exercícios
- Cadastro de exercícios
- Descrição e instruções
- Grupo muscular
- Equipamento necessário

#### Fichas de Treino
- Criação personalizada por aluno
- Definição de séries, repetições e carga
- Progressão de treino
- Histórico de treinos realizados

---

### 6. Notificações e Lembretes

#### Emails Automáticos
- Lembrete de pagamento (7 dias antes do vencimento)
- Lembrete de exame médico (15 dias antes)
- Notificação de bloqueio por inadimplência
- Confirmação de pagamento

#### Cron Jobs Configurados
- **6:00 AM** - Verificação e bloqueio de inadimplentes
- **9:00 AM** - Envio de lembretes de pagamento
- **10:00 AM** - Envio de lembretes de exame médico
- **A cada 30 segundos** - Sincronização de logs de acesso

---

### 7. Área Administrativa

#### Dashboard
- Visão geral de métricas
- Total de alunos ativos
- Receita mensal
- Inadimplentes
- Pagamentos pendentes

#### Gestão de Usuários
- Cadastro de funcionários
- Níveis de acesso (admin, professor, recepção)
- Controle de permissões

#### Relatórios
- Relatório financeiro
- Relatório de frequência
- Relatório de inadimplentes
- Exportação de dados

---

### 8. Área do Aluno

#### Portal do Aluno
- Login com email e senha
- Visualização de dados pessoais
- Histórico de pagamentos
- Visualização de treinos
- Agendamento de aulas
- Consulta de exames e avaliações

#### Pagamentos
- Geração de PIX para mensalidade
- Histórico de pagamentos
- Download de recibos
- Status da matrícula

---

## 📁 Estrutura do Projeto

```
Academia/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   │   ├── admin/     # Área administrativa
│   │   │   └── student/   # Área do aluno
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── lib/          # Utilitários e configurações
│   │   └── App.tsx       # Componente principal
│   └── package.json
│
├── server/                # Backend Node.js
│   ├── _core/            # Configuração do servidor
│   ├── controlId.ts      # Integração Control ID
│   ├── routers.ts        # Rotas tRPC
│   ├── db.ts            # Funções de banco de dados
│   ├── notifications.ts  # Sistema de notificações
│   ├── cron.ts          # Tarefas agendadas
│   └── pix/             # Integração PIX
│
├── drizzle/              # Schema do banco de dados
│   └── schema.ts        # Definições das tabelas
│
├── docs/                 # Documentação
│   ├── README.md        # Este arquivo
│   ├── MELHORIAS.md     # Melhorias futuras
│   └── CONTROLE_ACESSO.md # Detalhes do controle de acesso
│
└── package.json
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL=mysql://usuario:senha@localhost:3306/academia_db

# Control ID
CONTROL_ID_IP=192.168.2.142
CONTROL_ID_PORT=80

# PIX Sicoob
SICOOB_CLIENT_ID=seu_client_id
SICOOB_CLIENT_SECRET=seu_client_secret
SICOOB_CERT_PATH=caminho/para/certificado.pem
SICOOB_KEY_PATH=caminho/para/chave.pem

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# URLs
CLIENT_URL=http://localhost:3001
SERVER_URL=http://localhost:3001
```

### Instalação

```bash
# Instalar dependências
npm install

# Rodar migrações do banco
npm run db:push

# Iniciar em desenvolvimento
npm run dev
```

### Portas
- **3001** - Aplicação completa (frontend + backend)
- **80** - Control ID (leitora facial)

---

## 📖 Documentação Adicional

- [MELHORIAS.md](./MELHORIAS.md) - Lista de melhorias sugeridas para implementação futura
- [CONTROLE_ACESSO.md](./CONTROLE_ACESSO.md) - Documentação detalhada do sistema de controle de acesso
- [scripts/README.md](./scripts/README.md) - Scripts utilitários para administração e troubleshooting

---

## 🔐 Segurança

- Senhas hasheadas com bcrypt
- Sessões JWT para autenticação
- Validação de dados com Zod
- Proteção contra SQL injection (Drizzle ORM)
- HTTPS recomendado em produção
- Certificados SSL para integração PIX

---

## 📊 Status do Projeto

**Versão Atual:** 1.0.0

**Funcionalidades Principais:** ✅ Implementadas

**Próximos Passos:** Ver [MELHORIAS.md](./MELHORIAS.md)

---

## 👥 Suporte

Para dúvidas ou problemas, consulte a documentação ou entre em contato com a equipe de desenvolvimento.
