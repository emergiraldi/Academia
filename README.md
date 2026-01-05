# Sistema de Gestão para Academias

Sistema completo de gestão para academias com integração de controle de acesso facial (Control ID), gerenciamento de alunos, planos, pagamentos e treinos.

## 🚀 Funcionalidades

### 📊 Gestão Completa
- **Multi-tenant**: Suporta múltiplas academias em uma única instalação
- **Gestão de Alunos**: Cadastro completo, planos, pagamentos
- **Gestão de Professores**: Controle de alunos por professor
- **Planos e Assinaturas**: Gestão de mensalidades e renovações
- **Pagamentos PIX**: Integração com Efí Pay (Gerencianet)

### 🎭 Controle de Acesso Facial
- **Integração Control ID**: Cadastro e reconhecimento facial
- **Acesso por Biometria**: Liberação automática via face
- **Logs de Acesso**: Sincronização automática a cada 30s
- **Bloqueio Automático**: Inadimplentes bloqueados automaticamente

### 💪 Treinos e Avaliações
- **Fichas de Treino**: Criação e gestão de treinos personalizados
- **Avaliações Físicas**: Acompanhamento de evolução
- **Exercícios**: Biblioteca com fotos e vídeos
- **Registros de Treino**: Histórico de execução

### 📱 Portais Separados
- **Portal Admin**: Gestão completa da academia
- **Portal Aluno**: Acompanhamento de treinos e pagamentos
- **Portal Professor**: Gestão de alunos e treinos

## 🏗️ Arquitetura

```
┌─────────────────┐
│  VPS (Nuvem)   │  ← Backend Node.js + MySQL
│                │  ← Painel Web (Admin/Aluno)
└─────────────────┘
       │
       ↓ WebSocket (WSS)
┌──────────────────────────┐
│  ACADEMIA (Rede Local)   │
│  ┌──────────────┐        │
│  │  Agent Local │        │  ← Bridge VPS ↔ Leitora
│  └──────────────┘        │
│         ↓                │
│  ┌──────────────┐        │
│  │   Leitora    │        │  ← Control ID (Biometria)
│  │  Control ID  │        │
│  └──────────────┘        │
└──────────────────────────┘
```

### Vantagens:
- ✅ Admin gerencia tudo pela web
- ✅ Leitora funciona offline (não depende de internet)
- ✅ Sincronização automática
- ✅ Seguro (WebSocket criptografado)

## 🛠️ Tecnologias

### Backend
- **Node.js** + **TypeScript**
- **Express** - Framework web
- **tRPC** - Type-safe API
- **MySQL** - Banco de dados
- **Drizzle ORM** - ORM TypeScript-first
- **WebSocket** - Comunicação agent

### Frontend
- **React** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Shadcn/ui** - Componentes
- **Wouter** - Roteamento
- **TanStack Query** - State management

### Integrações
- **Control ID** - Controle de acesso facial
- **Efí Pay** - Pagamentos PIX
- **AWS S3** - Armazenamento de arquivos

## 📦 Instalação

### Pré-requisitos
- Node.js 20+
- MySQL 8+
- Git

### Deploy em VPS

Siga o guia completo: **[docs/DEPLOY-VPS.md](docs/DEPLOY-VPS.md)**

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/academia-system.git
cd academia-system

# 2. Instalar dependências
npm install

# 3. Configurar .env
cp .env.example .env
# Edite o .env com suas credenciais

# 4. Criar banco de dados
mysql -u root -p
CREATE DATABASE academia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 5. Aplicar schema
npm run db:push

# 6. Build
npm run build

# 7. Iniciar (produção)
npm start

# Ou usar PM2 (recomendado)
pm2 start npm --name "academia-api" -- start
```

## 🔧 Desenvolvimento

```bash
# Instalar dependências
npm install

# Configurar .env
cp .env.example .env

# Rodar em desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm test

# Type check
npm run check
```

## 📚 Documentação

- **[FLUXO-COMPLETO.md](docs/FLUXO-COMPLETO.md)** - Como funciona todo o sistema
- **[DEPLOY-VPS.md](docs/DEPLOY-VPS.md)** - Guia de deploy em VPS
- **[AGENT-LOCAL.md](docs/AGENT-LOCAL.md)** - Instalação do agent local
- **[CONTROLE_ACESSO.md](docs/CONTROLE_ACESSO.md)** - Integração Control ID

## 🔐 Segurança

- ✅ Autenticação JWT
- ✅ Senhas com bcrypt
- ✅ HTTPS obrigatório em produção
- ✅ WebSocket criptografado (WSS)
- ✅ Cookies httpOnly
- ✅ CORS configurado
- ✅ SQL injection protegido (ORM)

## 🌐 Variáveis de Ambiente

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/academia_db

# JWT
JWT_SECRET=sua-chave-secreta-forte-aqui

# Servidor
PORT=3000
NODE_ENV=production
AGENT_WS_PORT=8080

# Email (Opcional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha

# PIX (Opcional)
EFI_CLIENT_ID=seu-client-id
EFI_CLIENT_SECRET=seu-secret
```

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para mais detalhes.

## 🤝 Suporte

Para dúvidas e suporte, consulte a documentação em `/docs` ou abra uma issue.

---

Desenvolvido com ❤️ para academias modernas
