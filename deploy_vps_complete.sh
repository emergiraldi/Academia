#!/bin/bash

echo "========================================"
echo "🚀 Deploy Completo para VPS"
echo "========================================"
echo ""

sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 << 'ENDSSH'
cd /var/www/academia

echo "📥 1. Atualizando código do GitHub..."
git pull origin main
echo ""

echo "🗄️  2. Recriando tabelas Wellhub com estrutura correta..."
node recreate_wellhub_tables.js
echo ""

echo "🏗️  3. Compilando projeto (npm run build)..."
npm run build
echo ""

echo "🔄 4. Reiniciando PM2..."
pm2 restart academia-api
echo ""

echo "⏳ 5. Aguardando backend iniciar..."
sleep 3
echo ""

echo "📋 6. Últimos logs do PM2:"
pm2 logs academia-api --lines 20 --nostream
echo ""

echo "📊 7. Status do PM2:"
pm2 status
echo ""

echo "========================================"
echo "✅ Deploy concluído com sucesso!"
echo "========================================"
echo ""
echo "🌐 Site: https://www.sysfitpro.com.br"
echo ""

ENDSSH

echo ""
echo "✅ Script finalizado!"
