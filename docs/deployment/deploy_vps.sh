#!/bin/bash

# Script para atualizar código e banco de dados na VPS
# Execute na VPS: bash deploy_vps.sh

echo "======================================"
echo "🚀 Atualizando Academia na VPS"
echo "======================================"
echo ""

# 1. Ir para o diretório
cd /var/www/academia || exit 1

# 2. Atualizar código
echo "📥 Atualizando código..."
git pull origin main
echo ""

# 3. Executar migration de suppliers
echo "🗄️  Executando migration de suppliers..."
node migrate_suppliers_table.js
echo ""

# 4. Build do projeto
echo "🏗️  Compilando projeto..."
npm run build
echo ""

# 5. Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart academia
echo ""

# 6. Aguardar 3 segundos
echo "⏳ Aguardando backend iniciar..."
sleep 3
echo ""

# 7. Verificar logs
echo "📋 Últimos logs do PM2:"
pm2 logs academia --lines 20 --nostream
echo ""

echo "======================================"
echo "✅ Deploy concluído!"
echo "======================================"
