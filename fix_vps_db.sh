#!/bin/bash

# Script para corrigir conexão do banco de dados na VPS
# Execute: bash fix_vps_db.sh

echo "======================================"
echo "🔧 Corrigindo Backend na VPS"
echo "======================================"
echo ""

# 1. Ir para o diretório
cd /var/www/academia || exit 1

# 2. Atualizar código
echo "📥 Atualizando código..."
git pull origin main
echo ""

# 3. Verificar DATABASE_URL
echo "🔍 Verificando DATABASE_URL..."
grep "DATABASE_URL" .env
echo ""

# 4. Build do projeto
echo "🏗️  Compilando projeto..."
npm run build
echo ""

# 5. Aplicar migrações do banco de dados
echo "🗄️  Aplicando migrações do banco de dados..."
npm run db:push
echo ""

# 6. Executar create_admin.js para resetar senha
echo "🔐 Resetando senha do admin..."
node create_admin.js
echo ""

# 7. Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart all
echo ""

# 7. Aguardar 3 segundos
echo "⏳ Aguardando backend iniciar..."
sleep 3
echo ""

# 8. Verificar logs
echo "📋 Últimos logs do PM2:"
pm2 logs --lines 20 --nostream
echo ""

echo "======================================"
echo "✅ Script concluído!"
echo "======================================"
echo ""
echo "🔑 Credenciais de login:"
echo "   Email: admin@fitlife.com"
echo "   Senha: admin123"
echo ""
echo "🧪 Teste de CNPJ: 23.538.490/0001-80"
echo ""
