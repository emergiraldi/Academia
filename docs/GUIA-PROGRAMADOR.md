# 📘 Guia do Programador - SysFit Pro

> Documentação técnica completa para desenvolvedores e administradores de sistema

---

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura](#arquitetura)
3. [Requisitos do Servidor VPS](#requisitos-do-servidor-vps)
4. [Instalação Inicial do VPS](#instalação-inicial-do-vps)
5. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
6. [Deploy da Aplicação](#deploy-da-aplicação)
7. [Configuração do Nginx](#configuração-do-nginx)
8. [Configuração SSL (HTTPS)](#configuração-ssl-https)
9. [Gerenciamento com PM2](#gerenciamento-com-pm2)
10. [Agent Local (Academias)](#agent-local-academias)
11. [Multi-Tenancy e Cadastro de Academias](#multi-tenancy-e-cadastro-de-academias)
12. [Comandos Essenciais](#comandos-essenciais)
13. [Troubleshooting](#troubleshooting)
14. [Backup e Manutenção](#backup-e-manutenção)

---

## 🎯 Visão Geral do Sistema

**SysFit Pro** é um sistema SaaS multi-tenant para gestão de academias com integração de controle de acesso por reconhecimento facial (Control ID).

### Tecnologias Principais

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS + shadcn/ui
- tRPC para comunicação type-safe
- React Query para cache

**Backend:**
- Node.js + Express
- tRPC (API type-safe)
- MySQL 8.0 (Drizzle ORM)
- WebSocket (para comunicação com Agents)
- PM2 (process manager)

**Infraestrutura:**
- VPS Linux (Ubuntu/Debian)
- Nginx (reverse proxy + SSL)
- Let's Encrypt (certificados SSL)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                  Internet/Usuários                   │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │   Nginx (Port 80/443)        │
         │   - Reverse Proxy            │
         │   - SSL Termination          │
         │   - Static Files             │
         └──────────┬───────────────────┘
                    │
         ┌──────────┴───────────┐
         │                      │
         ▼                      ▼
┌────────────────┐    ┌─────────────────┐
│  Node.js API   │    │  WebSocket      │
│  (Port 3000)   │    │  (Port 8080)    │
│  - tRPC        │    │  - Agent Comms  │
│  - REST        │    │  - Facial Recog │
└────────┬───────┘    └────────┬────────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   MySQL Database     │
         │   (Port 3306)        │
         └──────────────────────┘

         ┌─────────────────────────────────┐
         │  Academias (Clientes)           │
         │                                 │
         │  ┌──────────────────────┐      │
         │  │  Agent Local         │      │
         │  │  - WebSocket Client  │──────┤
         │  │  - Control ID Bridge │      │
         │  └──────────┬───────────┘      │
         │             │                   │
         │             ▼                   │
         │  ┌──────────────────────┐      │
         │  │  Control ID Hardware │      │
         │  │  (Catraca/Leitora)   │      │
         │  └──────────────────────┘      │
         └─────────────────────────────────┘
```

---

## 💻 Requisitos do Servidor VPS

### Mínimo Recomendado
- **CPU:** 2 vCPUs
- **RAM:** 4GB
- **Disco:** 40GB SSD
- **OS:** Ubuntu 20.04 LTS ou superior
- **Banda:** 100 Mbps

### Software Necessário
- Node.js 18+ ou 20+
- MySQL 8.0+
- Nginx
- Git
- PM2 (process manager)
- Certbot (para SSL)

---

## 🚀 Instalação Inicial do VPS

### 1. Acessar o VPS

```bash
ssh root@SEU_IP_VPS
```

### 2. Atualizar Sistema

```bash
apt update && apt upgrade -y
```

### 3. Instalar Node.js 20

```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Instalar Node.js
apt install -y nodejs

# Verificar instalação
node -v  # deve mostrar v20.x.x
npm -v   # deve mostrar 10.x.x
```

### 4. Instalar MySQL 8.0

```bash
# Instalar MySQL
apt install -y mysql-server

# Iniciar serviço
systemctl start mysql
systemctl enable mysql

# Configurar segurança
mysql_secure_installation
```

**Respostas recomendadas para mysql_secure_installation:**
- Validate password plugin? **Y**
- Password strength: **2** (STRONG)
- Remove anonymous users? **Y**
- Disallow root login remotely? **Y**
- Remove test database? **Y**
- Reload privilege tables? **Y**

### 5. Instalar Nginx

```bash
apt install -y nginx

# Iniciar e habilitar
systemctl start nginx
systemctl enable nginx
```

### 6. Instalar PM2 Globalmente

```bash
npm install -g pm2

# Configurar PM2 para iniciar no boot
pm2 startup systemd
# Execute o comando sugerido pelo PM2
```

### 7. Instalar Certbot (SSL)

```bash
apt install -y certbot python3-certbot-nginx
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Criar Banco de Dados

```bash
mysql -u root -p
```

```sql
-- Criar database
CREATE DATABASE academia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário
CREATE USER 'academia'@'localhost' IDENTIFIED BY 'SuaSenhaSegura123!@#';

-- Conceder permissões
GRANT ALL PRIVILEGES ON academia_db.* TO 'academia'@'localhost';
FLUSH PRIVILEGES;

-- Sair
EXIT;
```

### 2. Criar Estrutura de Tabelas

O sistema usa Drizzle ORM com migrations. Após o deploy, execute:

```bash
cd /var/www/academia
npm run db:push
```

### 3. Inserir Super Admin

```sql
USE academia_db;

-- Criar super admin (senha: admin123)
INSERT INTO users (openId, email, password, name, role, gymId, createdAt, updatedAt)
VALUES (
  'super-admin-1',
  'admin@sysfitpro.com.br',
  '$2a$10$YourHashedPasswordHere',  -- use bcrypt para gerar
  'Administrador',
  'super_admin',
  NULL,
  NOW(),
  NOW()
);
```

**Para gerar senha hasheada:**

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('SuaSenha', 10));"
```

---

## 📦 Deploy da Aplicação

### 1. Clonar Repositório

```bash
# Criar diretório
mkdir -p /var/www
cd /var/www

# Clonar repositório
git clone https://github.com/emergiraldi/Academia.git academia
cd academia

# Instalar dependências
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
nano .env
```

**Arquivo .env:**

```env
# Database
DATABASE_URL="mysql://academia:SuaSenhaSegura123!@#@localhost:3306/academia_db"

# Server
NODE_ENV=production
PORT=3000
AGENT_WS_PORT=8080

# Session/Auth
SESSION_SECRET=seu-secret-super-seguro-aqui-min-32-chars

# Email (configurar SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# Application
APP_URL=https://www.sysfitpro.com.br
```

### 3. Build da Aplicação

```bash
# Build do frontend e backend
npm run build

# Verificar se o build foi criado
ls -la dist/
ls -la client/dist/
```

### 4. Configurar PM2

**Criar arquivo ecosystem.config.js:**

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'academia-api',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      AGENT_WS_PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 5. Iniciar Aplicação

```bash
# Criar pasta de logs
mkdir -p logs

# Iniciar com PM2
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Verificar status
pm2 status
pm2 logs academia-api
```

---

## 🌐 Configuração do Nginx

### 1. Criar Configuração do Site

```bash
nano /etc/nginx/sites-available/sysfitpro
```

**Conteúdo:**

```nginx
server {
    listen 80;
    server_name www.sysfitpro.com.br sysfitpro.com.br;

    # Redirecionar HTTP para HTTPS
    return 301 https://www.sysfitpro.com.br$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.sysfitpro.com.br;

    # SSL configurado pelo Certbot
    ssl_certificate /etc/letsencrypt/live/www.sysfitpro.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.sysfitpro.com.br/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Logs
    access_log /var/log/nginx/sysfitpro-access.log;
    error_log /var/log/nginx/sysfitpro-error.log;

    # Max upload size (para fotos de alunos)
    client_max_body_size 50M;

    # Timeout para uploads
    client_body_timeout 300s;
    proxy_read_timeout 300s;

    # Root directory para arquivos estáticos
    root /var/www/academia/client/dist;
    index index.html;

    # API tRPC
    location /api/trpc {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # OAuth callbacks
    location /api/oauth {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Wellhub webhook
    location /wellhub/webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket para Agents (Control ID)
    location /agent {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # Arquivos estáticos do React
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Cache para assets (JS, CSS, imagens)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 2. Ativar Site

```bash
# Criar link simbólico
ln -s /etc/nginx/sites-available/sysfitpro /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx
```

---

## 🔒 Configuração SSL (HTTPS)

### 1. Obter Certificado Let's Encrypt

```bash
# Parar Nginx temporariamente
systemctl stop nginx

# Obter certificado
certbot certonly --standalone -d www.sysfitpro.com.br -d sysfitpro.com.br

# Reiniciar Nginx
systemctl start nginx
```

### 2. Renovação Automática

```bash
# Testar renovação
certbot renew --dry-run

# Adicionar ao cron para renovação automática (já vem configurado)
systemctl status certbot.timer
```

---

## 🔧 Gerenciamento com PM2

### Comandos Principais

```bash
# Ver status de todos os processos
pm2 status

# Ver logs em tempo real
pm2 logs academia-api

# Ver logs de erro apenas
pm2 logs academia-api --err

# Reiniciar aplicação
pm2 restart academia-api

# Parar aplicação
pm2 stop academia-api

# Deletar processo
pm2 delete academia-api

# Monitorar recursos
pm2 monit

# Salvar configuração atual
pm2 save

# Listar processos salvos
pm2 list
```

### Após Atualização do Código

```bash
cd /var/www/academia

# Pull das alterações
git pull origin main

# Instalar novas dependências (se houver)
npm install

# Build
npm run build

# Reiniciar PM2
pm2 restart academia-api

# Verificar logs
pm2 logs academia-api --lines 50
```

---

## 🖥️ Agent Local (Academias)

### Arquitetura do Agent

O **Agent** é um programa Node.js que roda localmente na academia e faz a ponte entre:
- **VPS (servidor central)** via WebSocket
- **Control ID (hardware de catraca)** via API REST local

### Fluxo de Comunicação

```
Usuário aproxima do Control ID
         ↓
Control ID envia foto via webhook
         ↓
Agent Local recebe e encaminha via WebSocket
         ↓
VPS processa reconhecimento facial
         ↓
VPS retorna se libera ou bloqueia
         ↓
Agent envia comando para Control ID
         ↓
Catraca libera/bloqueia acesso
```

### Instalação - Ver GUIA-TECNICO-CAMPO.md

Detalhes completos no guia do técnico de campo.

---

## 🏢 Multi-Tenancy e Cadastro de Academias

### Conceito Multi-Tenant

Cada academia é uma **tenant** isolada no sistema:
- Dados segregados por `gymId`
- Cada academia tem seu próprio `slug` único
- URL de acesso: `https://www.sysfitpro.com.br/admin?gym=nome-academia`

### Cadastro de Nova Academia

#### Método 1: Auto-Cadastro (Público)

1. Acesse: `https://www.sysfitpro.com.br/gym/signup`
2. Preencha formulário
3. Sistema gera automaticamente:
   - Academia no banco
   - Usuário administrador
   - Configurações padrão
   - Agent ID (`academia-{gymId}`)

#### Método 2: Via MySQL (Manual)

```sql
-- 1. Inserir academia
INSERT INTO gyms (name, slug, email, plan, planStatus, status, createdAt, updatedAt)
VALUES (
  'Nome da Academia',
  'slug-unico',
  'contato@academia.com',
  'basic',
  'trial',
  'active',
  NOW(),
  NOW()
);

-- 2. Pegar o ID gerado
SELECT LAST_INSERT_ID();  -- exemplo: 5

-- 3. Criar configurações padrão
INSERT INTO gym_settings (gymId, daysToBlockAfterDue, blockOnExpiredExam, examValidityDays, minimumAge)
VALUES (5, 7, 1, 90, 16);

-- 4. Criar usuário admin (senha: senha123)
INSERT INTO users (gymId, openId, email, password, name, role, createdAt, updatedAt)
VALUES (
  5,
  'gym-admin-5-' || UNIX_TIMESTAMP(),
  'admin@academia.com',
  '$2a$10$hashGeradoPorBcrypt',
  'Administrador Academia',
  'gym_admin',
  NOW(),
  NOW()
);
```

### Agent ID por Academia

Cada academia tem um **Agent ID único** no formato:

```
AGENT_ID=academia-{gymId}
```

Exemplo: Academia com `gymId=5` terá `AGENT_ID=academia-5`

**Como descobrir o gymId de uma academia:**

```sql
SELECT id, name, slug FROM gyms WHERE slug = 'nome-academia';
```

---

## ⚡ Comandos Essenciais

### Sistema

```bash
# Verificar uso de disco
df -h

# Verificar memória
free -m

# Verificar processos
htop
# ou
ps aux | grep node

# Verificar portas abertas
netstat -tlnp

# Verificar logs do sistema
journalctl -xe
```

### MySQL

```bash
# Acessar MySQL
mysql -u academia -p academia_db

# Backup do banco
mysqldump -u academia -p academia_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u academia -p academia_db < backup_20240101.sql

# Ver tamanho do banco
mysql -u root -p -e "SELECT table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
  FROM information_schema.TABLES
  WHERE table_schema = 'academia_db';"
```

### Git

```bash
# Ver branch atual
git branch

# Ver alterações
git status

# Ver commits recentes
git log --oneline -10

# Pull do repositório
git pull origin main

# Ver diff antes de pull
git fetch
git diff origin/main
```

### Nginx

```bash
# Testar configuração
nginx -t

# Recarregar (sem downtime)
systemctl reload nginx

# Reiniciar
systemctl restart nginx

# Ver logs de erro
tail -f /var/log/nginx/sysfitpro-error.log

# Ver logs de acesso
tail -f /var/log/nginx/sysfitpro-access.log
```

---

## 🔍 Troubleshooting

### Problema: Site não carrega

```bash
# 1. Verificar se Nginx está rodando
systemctl status nginx

# 2. Verificar se Node.js está rodando
pm2 status

# 3. Ver logs do Nginx
tail -f /var/log/nginx/sysfitpro-error.log

# 4. Ver logs da aplicação
pm2 logs academia-api
```

### Problema: Erro 502 Bad Gateway

```bash
# Geralmente significa que o Node.js parou
pm2 restart academia-api
pm2 logs academia-api
```

### Problema: Banco de dados não conecta

```bash
# Verificar se MySQL está rodando
systemctl status mysql

# Testar conexão
mysql -u academia -p academia_db

# Ver logs do MySQL
tail -f /var/log/mysql/error.log
```

### Problema: Agent não conecta

```bash
# No VPS, verificar se porta 8080 está aberta
netstat -tlnp | grep 8080

# Ver logs do PM2 filtrados por "AGENT" ou "WebSocket"
pm2 logs academia-api | grep AGENT
```

### Problema: Upload de fotos falha

```bash
# Verificar permissões do diretório
ls -la /var/www/academia/uploads/

# Ajustar permissões se necessário
chmod 755 /var/www/academia/uploads
chown -R www-data:www-data /var/www/academia/uploads

# Verificar limite no Nginx
grep client_max_body_size /etc/nginx/sites-available/sysfitpro
```

---

## 💾 Backup e Manutenção

### Script de Backup Automático

**Criar script:**

```bash
nano /root/backup-academia.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="academia_db"
DB_USER="academia"
DB_PASS="SuaSenha"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Backup do banco
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup dos uploads (fotos)
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/academia/uploads

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
```

**Tornar executável:**

```bash
chmod +x /root/backup-academia.sh
```

**Agendar no cron (diário às 3h):**

```bash
crontab -e
```

Adicionar linha:

```
0 3 * * * /root/backup-academia.sh >> /root/backup.log 2>&1
```

### Monitoramento de Recursos

```bash
# Instalar htop
apt install htop

# Monitorar em tempo real
htop

# Ver uso de disco
df -h

# Ver uso de memória
free -h

# Ver logs do PM2
pm2 logs
```

---

## 📞 Suporte e Contatos

- **GitHub:** https://github.com/emergiraldi/Academia
- **Email Suporte:** suporte@sysfitpro.com.br
- **Documentação Agent:** `/docs/GUIA-TECNICO-CAMPO.md`
- **Documentação Agent Local:** `/docs/AGENT-LOCAL.md`

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0.0
