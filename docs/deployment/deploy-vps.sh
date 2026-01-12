#!/bin/bash
#==============================================================================
# SCRIPT DE DEPLOY AUTOMÁTICO - SISTEMA ACADEMIA
# VPS: Hostinger - Ubuntu 24.04 LTS
# Domínio: www.sysfitpro.com.br
# IP: 172.60.2.237
#==============================================================================

set -e  # Para se houver erro

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         DEPLOY AUTOMÁTICO - SISTEMA DE ACADEMIA                ║"
echo "║                   www.sysfitpro.com.br                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

#==============================================================================
# PASSO 1: ATUALIZAR SISTEMA
#==============================================================================
echo "📦 [1/10] Atualizando sistema..."
apt update && apt upgrade -y

#==============================================================================
# PASSO 2: INSTALAR NODE.JS 20
#==============================================================================
echo "📦 [2/10] Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "✅ Node.js instalado: $(node -v)"
echo "✅ NPM instalado: $(npm -v)"

#==============================================================================
# PASSO 3: INSTALAR MYSQL
#==============================================================================
echo "📦 [3/10] Instalando MySQL Server..."
apt install -y mysql-server

# Iniciar MySQL
systemctl start mysql
systemctl enable mysql

echo "✅ MySQL instalado e rodando"

#==============================================================================
# PASSO 4: CONFIGURAR MYSQL
#==============================================================================
echo "📦 [4/10] Configurando banco de dados..."

# Gerar senha forte para MySQL
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32)

# Configurar senha do root
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';"
mysql -e "FLUSH PRIVILEGES;"

# Criar banco de dados
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS academia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "✅ Banco 'academia_db' criado"
echo "✅ Senha MySQL root salva em: /root/.mysql_password"
echo "${MYSQL_ROOT_PASSWORD}" > /root/.mysql_password
chmod 600 /root/.mysql_password

#==============================================================================
# PASSO 5: INSTALAR NGINX
#==============================================================================
echo "📦 [5/10] Instalando Nginx..."
apt install -y nginx

systemctl start nginx
systemctl enable nginx

echo "✅ Nginx instalado e rodando"

#==============================================================================
# PASSO 6: INSTALAR PM2
#==============================================================================
echo "📦 [6/10] Instalando PM2..."
npm install -g pm2

echo "✅ PM2 instalado globalmente"

#==============================================================================
# PASSO 7: CLONAR REPOSITÓRIO
#==============================================================================
echo "📦 [7/10] Clonando repositório do GitHub..."

# Criar diretório
mkdir -p /var/www
cd /var/www

# Clonar repositório
if [ -d "academia" ]; then
    echo "⚠️  Diretório 'academia' já existe. Removendo..."
    rm -rf academia
fi

git clone https://github.com/emergiraldi/Academia.git academia
cd academia

echo "✅ Repositório clonado"

#==============================================================================
# PASSO 8: CONFIGURAR VARIÁVEIS DE AMBIENTE
#==============================================================================
echo "📦 [8/10] Configurando variáveis de ambiente..."

# Gerar JWT Secret forte
JWT_SECRET=$(openssl rand -base64 32)

# Criar arquivo .env
cat > .env <<EOF
# DATABASE
DATABASE_URL=mysql://root:${MYSQL_ROOT_PASSWORD}@localhost:3306/academia_db

# JWT
JWT_SECRET=${JWT_SECRET}

# SERVIDOR
PORT=3000
NODE_ENV=production
AGENT_WS_PORT=8080

# OPCIONAL - Configure depois se necessário
# EMAIL (SMTP)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=seu-email@gmail.com
# SMTP_PASSWORD=sua-senha-app
# SMTP_FROM_NAME=Academia Sistema
# SMTP_FROM_EMAIL=noreply@sysfitpro.com.br

# PIX (Efí Pay)
# EFI_CLIENT_ID=
# EFI_CLIENT_SECRET=
# EFI_PIX_KEY=
# EFI_SANDBOX=false
EOF

chmod 600 .env

echo "✅ Arquivo .env criado e configurado"

#==============================================================================
# PASSO 9: INSTALAR DEPENDÊNCIAS E BUILD
#==============================================================================
echo "📦 [9/10] Instalando dependências e fazendo build..."

npm install --production --legacy-peer-deps
npm run build

echo "✅ Build concluído"

#==============================================================================
# PASSO 10: APLICAR SCHEMA DO BANCO
#==============================================================================
echo "📦 [10/10] Criando tabelas no banco de dados..."

npm run db:push

echo "✅ Tabelas criadas"

#==============================================================================
# CONFIGURAR PM2
#==============================================================================
echo "🚀 Iniciando aplicação com PM2..."

pm2 start npm --name "academia-api" -- start
pm2 startup
pm2 save

echo "✅ Aplicação rodando com PM2"

#==============================================================================
# CONFIGURAR NGINX
#==============================================================================
echo "🌐 Configurando Nginx..."

cat > /etc/nginx/sites-available/academia <<'NGINX_EOF'
# Redirecionar HTTP para HTTPS (será ativado após SSL)
server {
    listen 80;
    listen [::]:80;
    server_name sysfitpro.com.br www.sysfitpro.com.br;

    # Temporariamente permitir HTTP até configurar SSL
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
    }

    # WebSocket para Agent
    location /agent {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
NGINX_EOF

# Habilitar site
ln -sf /etc/nginx/sites-available/academia /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx

echo "✅ Nginx configurado"

#==============================================================================
# CONFIGURAR FIREWALL
#==============================================================================
echo "🔒 Configurando firewall..."

ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable

echo "✅ Firewall configurado"

#==============================================================================
# INSTALAR CERTBOT (SSL)
#==============================================================================
echo "🔐 Instalando Certbot para SSL..."

apt install -y certbot python3-certbot-nginx

echo "✅ Certbot instalado"

#==============================================================================
# RESUMO FINAL
#==============================================================================
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ DEPLOY CONCLUÍDO!                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 INFORMAÇÕES IMPORTANTES:"
echo ""
echo "🌐 Site HTTP: http://www.sysfitpro.com.br"
echo "🌐 Site IP: http://172.60.2.237"
echo ""
echo "🔐 Senha MySQL root: $(cat /root/.mysql_password)"
echo "   (Salva em: /root/.mysql_password)"
echo ""
echo "🔑 JWT Secret: ${JWT_SECRET}"
echo "   (Salvo em: /var/www/academia/.env)"
echo ""
echo "📂 Aplicação: /var/www/academia"
echo ""
echo "▶️  Status da aplicação:"
pm2 status
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1️⃣  Configurar SSL (HTTPS):"
echo "   sudo certbot --nginx -d sysfitpro.com.br -d www.sysfitpro.com.br"
echo ""
echo "2️⃣  Testar o site:"
echo "   http://www.sysfitpro.com.br"
echo ""
echo "3️⃣  Verificar logs:"
echo "   pm2 logs academia-api"
echo ""
echo "4️⃣  Instalar agent na academia (depois do SSL):"
echo "   Consulte: /var/www/academia/docs/AGENT-LOCAL.md"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "💡 DICA: Salve a senha MySQL em local seguro!"
echo "═══════════════════════════════════════════════════════════════"
