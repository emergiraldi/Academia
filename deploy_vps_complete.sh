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

echo "🔧 2. Criando tabela gym_settings..."
node create_gym_settings_table.js
echo ""

echo "🗄️  3. Recriando tabelas Wellhub com estrutura correta..."
node recreate_wellhub_tables.js
echo ""

echo "📍 4. Adicionando campos de endereço à tabela students..."
node migrate_student_address_fields.js
echo ""

echo "📚 5. Importando biblioteca de exercícios..."
node import_exercises_library.js
echo ""

echo "🏗️  6. Compilando projeto (npm run build)..."
npm run build
echo ""

echo "🔄 7. Reiniciando PM2..."
pm2 restart academia-api
echo ""

echo "⏳ 8. Aguardando backend iniciar..."
sleep 3
echo ""

echo "📋 9. Últimos logs do PM2:"
pm2 logs academia-api --lines 20 --nostream
echo ""

echo "📊 10. Status do PM2:"
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
