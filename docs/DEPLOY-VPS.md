# Guia de Deploy em VPS

## Checklist Pré-Deploy

Antes de fazer o deploy, certifique-se que você tem:

- [ ] VPS contratada (Ubuntu 20.04+ ou similar)
- [ ] Domínio configurado apontando para o IP da VPS
- [ ] Acesso SSH root ou sudo na VPS
- [ ] Certificado SSL (Let's Encrypt - configuraremos)

---

## 1. Preparação da VPS

### 1.1 Conectar via SSH

```bash
ssh root@seu-ip-vps
# ou
ssh usuario@seu-ip-vps
```

### 1.2 Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar Dependências

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL
sudo apt install -y mysql-server

# Nginx
sudo apt install -y nginx

# PM2 (gerenciador de processos)
sudo npm install -g pm2

# Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Git
sudo apt install -y git
```

---

## 2. Configurar MySQL

### 2.1 Configurar Senha Root

```bash
sudo mysql
```

No console MySQL:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'SuaSenhaForteAqui123!';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Criar Banco de Dados

```bash
mysql -u root -p
```

```sql
CREATE DATABASE academia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

---

## 3. Deploy da Aplicação

### 3.1 Criar Diretório

```bash
sudo mkdir -p /var/www/academia
sudo chown -R $USER:$USER /var/www/academia
cd /var/www/academia
```

### 3.2 Clonar/Upload do Projeto

**Opção A - Via Git:**
```bash
git clone seu-repositorio.git .
```

**Opção B - Via SCP (do seu PC local):**
```bash
# No seu PC local (Windows):
scp -r C:\Projeto\Academia root@seu-ip-vps:/var/www/academia
```

### 3.3 Instalar Dependências

```bash
cd /var/www/academia
npm install --production
```

### 3.4 Fazer Build

```bash
npm run build
```

### 3.5 Configurar Variáveis de Ambiente

```bash
nano .env
```

Preencha com:

```env
# DATABASE
DATABASE_URL=mysql://root:SuaSenhaForteAqui123!@localhost:3306/academia_db

# JWT
JWT_SECRET=gere-uma-chave-secreta-forte-aqui-min-32-chars

# SERVIDOR
PORT=3000
NODE_ENV=production

# AGENT WEBSOCKET
AGENT_WS_PORT=8080

# EMAIL (Configure com seu provedor)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app
SMTP_FROM_NAME=Academia Sistema
SMTP_FROM_EMAIL=noreply@suaacademia.com.br

# PIX (Efí Pay) - Opcional
EFI_CLIENT_ID=seu-client-id
EFI_CLIENT_SECRET=seu-client-secret
EFI_PIX_KEY=sua-chave@pix.com.br
EFI_SANDBOX=false

# AWS S3 (para fotos/documentos) - Opcional
AWS_ACCESS_KEY_ID=sua-access-key
AWS_SECRET_ACCESS_KEY=sua-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=academia-uploads
```

**IMPORTANTE:** Gere uma chave JWT forte:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.6 Criar Tabelas do Banco

```bash
npm run db:push
```

---

## 4. Configurar PM2

### 4.1 Iniciar Aplicação

```bash
pm2 start npm --name "academia-api" -- start
```

### 4.2 Auto-start no Boot

```bash
pm2 startup
pm2 save
```

### 4.3 Verificar Status

```bash
pm2 status
pm2 logs academia-api
```

### 4.4 Comandos Úteis PM2

```bash
# Ver logs
pm2 logs academia-api

# Reiniciar
pm2 restart academia-api

# Parar
pm2 stop academia-api

# Deletar
pm2 delete academia-api

# Monitorar recursos
pm2 monit
```

---

## 5. Configurar Nginx

### 5.1 Criar Configuração

```bash
sudo nano /etc/nginx/sites-available/academia
```

Cole:

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name seudominio.com.br www.seudominio.com.br;

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirecionar todo o resto para HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Aplicação Principal
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name seudominio.com.br www.seudominio.com.br;

    # SSL (será configurado pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy para Node.js (porta 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket para Agent (porta 8080)
    location /agent {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts (mais longos)
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Logs
    access_log /var/log/nginx/academia_access.log;
    error_log /var/log/nginx/academia_error.log;
}
```

### 5.2 Habilitar Site

```bash
sudo ln -s /etc/nginx/sites-available/academia /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
```

### 5.3 Obter Certificado SSL

```bash
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

Siga as instruções do Certbot.

### 5.4 Reiniciar Nginx

```bash
sudo systemctl restart nginx
```

### 5.5 Auto-renovação SSL

O Certbot instala um cron job automaticamente. Teste:

```bash
sudo certbot renew --dry-run
```

---

## 6. Configurar Firewall

```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

---

## 7. Testar a Aplicação

### 7.1 Verificar Backend

```bash
curl http://localhost:3000
```

### 7.2 Verificar WebSocket

```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: localhost:8080" \
  -H "Origin: http://localhost:8080" \
  http://localhost:8080/agent
```

### 7.3 Acessar pelo Navegador

```
https://seudominio.com.br
```

---

## 8. Monitoramento e Manutenção

### 8.1 Ver Logs em Tempo Real

```bash
# Logs da aplicação
pm2 logs academia-api

# Logs do Nginx
sudo tail -f /var/log/nginx/academia_access.log
sudo tail -f /var/log/nginx/academia_error.log

# Logs do sistema
sudo journalctl -u nginx -f
```

### 8.2 Monitorar Recursos

```bash
# CPU e memória
htop

# Espaço em disco
df -h

# Status do MySQL
sudo systemctl status mysql

# Status do Nginx
sudo systemctl status nginx

# Status da aplicação
pm2 status
pm2 monit
```

### 8.3 Backup do Banco

```bash
# Criar backup
mysqldump -u root -p academia_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u root -p academia_db < backup_20250105.sql
```

---

## 9. Atualizar Aplicação

```bash
cd /var/www/academia

# Fazer backup do banco antes
mysqldump -u root -p academia_db > backup_before_update.sql

# Atualizar código
git pull  # ou fazer upload dos novos arquivos

# Instalar novas dependências
npm install --production

# Rebuild
npm run build

# Aplicar migrações do banco
npm run db:push

# Reiniciar aplicação
pm2 restart academia-api

# Verificar logs
pm2 logs academia-api
```

---

## 10. Solução de Problemas

### Aplicação não inicia

```bash
# Ver logs detalhados
pm2 logs academia-api --lines 100

# Verificar variáveis de ambiente
cat .env

# Testar conexão com banco
mysql -u root -p -e "SELECT 1"

# Verificar portas em uso
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8080
```

### Erro de permissão

```bash
# Ajustar permissões
sudo chown -R $USER:$USER /var/www/academia
chmod -R 755 /var/www/academia
```

### Nginx não reinicia

```bash
# Verificar sintaxe
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Testar configuração
sudo nginx -T
```

### SSL não funciona

```bash
# Renovar certificado
sudo certbot renew

# Verificar certificados
sudo certbot certificates

# Forçar renovação
sudo certbot renew --force-renewal
```

### WebSocket não conecta

```bash
# Verificar se porta 8080 está aberta
sudo netstat -tulpn | grep :8080

# Verificar logs do agent
pm2 logs academia-api | grep WebSocket

# Testar conexão local
curl -i http://localhost:8080
```

---

## 11. Segurança Adicional

### 11.1 Fail2Ban (proteção contra brute force)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 11.2 Limitar Taxa de Requisições (Nginx)

Adicionar no bloco `http` do `/etc/nginx/nginx.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

E no bloco `location /` do site:

```nginx
limit_req zone=api_limit burst=20 nodelay;
```

### 11.3 Desabilitar Login Root SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Alterar:
```
PermitRootLogin no
```

Reiniciar SSH:
```bash
sudo systemctl restart ssh
```

---

## Resumo dos Serviços

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Node.js API | 3000 | Backend principal (interno) |
| WebSocket Agent | 8080 | Comunicação com agents (interno) |
| Nginx HTTP | 80 | Redireciona para HTTPS |
| Nginx HTTPS | 443 | Proxy reverso público |
| MySQL | 3306 | Banco de dados (interno) |

**Portas internas (3000, 8080, 3306):** Não precisam estar abertas externamente, apenas o Nginx (80, 443) deve ser público.

---

## URLs Importantes Após Deploy

- **Site Principal:** https://seudominio.com.br
- **Cadastro de Academia:** https://seudominio.com.br/signup
- **Login Admin:** https://seudominio.com.br/admin/login
- **Login Aluno:** https://seudominio.com.br/student/login
- **Agent WebSocket:** wss://seudominio.com.br/agent

---

## Próximo Passo: Configurar Agent Local

Após o deploy na VPS estar funcionando, você precisará instalar o agent local na academia onde está a leitora facial.

Consulte o arquivo [AGENT-LOCAL.md](./AGENT-LOCAL.md) para instruções detalhadas.
