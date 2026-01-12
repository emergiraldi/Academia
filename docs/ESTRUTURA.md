# Estrutura do Projeto - Sistema de Academia

## Estrutura Organizada

```
academia-system/
├── client/                          # Frontend React
│   ├── public/                      # Arquivos estáticos
│   └── src/
│       ├── components/              # Componentes reutilizáveis
│       │   └── ui/                  # Componentes shadcn/ui
│       ├── contexts/                # Contextos React
│       │   └── ThemeContext.tsx
│       ├── hooks/                   # Custom hooks
│       ├── lib/                     # Utilitários
│       │   └── trpc.ts             # Cliente tRPC
│       ├── pages/                   # Páginas da aplicação
│       │   ├── admin/               # Páginas administrativas
│       │   │   ├── AdminControlIdDevices.tsx
│       │   │   ├── AdminDefaulters.tsx
│       │   │   ├── AdminFinancialDashboard.tsx
│       │   │   ├── AdminPayments.tsx
│       │   │   ├── AdminPlans.tsx
│       │   │   ├── AdminProfessors.tsx
│       │   │   ├── AdminReports.tsx
│       │   │   ├── AdminStaff.tsx
│       │   │   └── AdminStudents.tsx
│       │   ├── super-admin/         # Páginas super admin
│       │   ├── AdminDashboard.tsx   # Dashboard principal admin
│       │   ├── AdminLogin.tsx       # Login OAuth admin
│       │   ├── Home.tsx             # Página inicial
│       │   ├── NotFound.tsx         # 404
│       │   ├── ProfessorDashboard.tsx
│       │   ├── ProfessorLogin.tsx
│       │   ├── StudentDashboard.tsx
│       │   ├── StudentLogin.tsx
│       │   ├── StudentRegister.tsx
│       │   └── StudentWorkoutDetail.tsx
│       ├── App.tsx                  # Rotas principais
│       ├── main.tsx                 # Entry point
│       └── index.css                # Estilos globais
│
├── server/                          # Backend Node.js
│   ├── _core/                       # Infraestrutura Manus
│   │   ├── context.ts
│   │   ├── cookies.ts
│   │   ├── dataApi.ts
│   │   ├── env.ts
│   │   ├── index.ts                # Servidor Express
│   │   ├── llm.ts
│   │   ├── map.ts
│   │   ├── notification.ts
│   │   ├── oauth.ts                # Autenticação OAuth
│   │   ├── sdk.ts
│   │   ├── systemRouter.ts
│   │   ├── trpc.ts
│   │   └── vite.ts
│   ├── controlId.ts                 # Serviço Control ID
│   ├── cron.ts                      # Agendamento de tarefas
│   ├── db.ts                        # Funções de banco de dados
│   ├── email.ts                     # Serviço de email
│   ├── notifications.ts             # Notificações automáticas
│   ├── pix.ts                       # Serviço Efí Pay PIX
│   ├── receipt.ts                   # Geração de recibos
│   ├── routers.ts                   # Endpoints tRPC
│   └── storage.ts                   # Upload S3
│
├── drizzle/                         # Migrations e schema
│   ├── schema.ts                    # Definição das tabelas
│   └── meta/                        # Histórico de migrations
│
├── shared/                          # Código compartilhado
│   ├── _core/
│   ├── const.ts                     # Constantes
│   └── types.ts                     # Tipos TypeScript
│
├── docs/                            # Documentação
│   ├── DOCUMENTACAO-COMPLETA.md
│   ├── arquitetura_sistema_academia.md
│   ├── control-id-api.md
│   ├── pesquisa_control_id.md
│   └── pesquisa_pix_pagamento.md
│
├── package.json                     # Dependências
├── tsconfig.json                    # Config TypeScript
├── vite.config.ts                   # Config Vite
├── drizzle.config.ts                # Config Drizzle ORM
├── todo.md                          # Lista de tarefas
└── ESTRUTURA.md                     # Este arquivo
```

## Rotas da Aplicação

### Públicas
- `/` - Home (escolha entre Aluno/Professor)
- `/student/login` - Login do aluno
- `/student/register` - Cadastro de aluno
- `/professor/login` - Login do professor
- `/admin` - Login admin (OAuth)

### Área do Aluno (autenticado)
- `/student/dashboard` - Dashboard principal
- `/student/workout/:id` - Detalhes do treino

### Área do Professor (autenticado)
- `/professor/dashboard` - Dashboard do professor

### Área Admin (autenticado via OAuth)
- `/admin/dashboard` - Dashboard principal
- `/admin/students` - Gestão de alunos
- `/admin/professors` - Gestão de professores
- `/admin/staff` - Gestão de funcionários
- `/admin/plans` - Gestão de planos
- `/admin/payments` - Gestão de pagamentos
- `/admin/financial` - Dashboard financeiro
- `/admin/defaulters` - Inadimplentes
- `/admin/control-id-devices` - Dispositivos Control ID
- `/admin/reports` - Relatórios

## Serviços Backend

### Core Services
- **routers.ts** - Todos os endpoints tRPC organizados
- **db.ts** - Camada de acesso ao banco de dados

### Integration Services
- **pix.ts** - Integração Efí Pay (pagamentos PIX)
- **controlId.ts** - Integração Control ID (biometria)
- **email.ts** - Envio de emails (SMTP)
- **storage.ts** - Upload de arquivos (S3)

### Automation Services
- **cron.ts** - Jobs agendados
- **notifications.ts** - Notificações automáticas por email
- **receipt.ts** - Geração de recibos em HTML

## Próximas Implementações

1. Tela de recuperação de senha
2. Webhook PIX (confirmação automática)
3. Liberação automática de acesso após pagamento
4. Sistema de progressão de treinos
5. Alertas de exame médico
6. Seleção de academia no login (multi-tenant)
7. Filtros de pagamentos
8. Upload de fotos/vídeos de exercícios
9. Tela de logs de acesso
10. Sistema de notificações no app

## Observações

- ✅ Estrutura organizada e limpa
- ✅ Separação clara entre client/server
- ✅ Páginas admin organizadas em subpasta
- ✅ Documentações centralizadas em /docs
- ✅ Arquivos duplicados removidos
- ✅ Imports atualizados
