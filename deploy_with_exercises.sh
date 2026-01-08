#!/bin/bash

echo "========================================"
echo "🚀 Deploy Completo + Upload Exercícios"
echo "========================================"
echo ""

# Check if export file exists
if [ ! -f "exercises_library_export.json" ]; then
    echo "❌ Arquivo exercises_library_export.json não encontrado!"
    echo "💡 Execute: node export_exercises_library.js primeiro"
    exit 1
fi

echo "📤 1. Fazendo upload do arquivo de exercícios para VPS..."
sshpass -p "935559Emerson@" scp -o StrictHostKeyChecking=no exercises_library_export.json root@138.197.8.136:/var/www/academia/
if [ $? -eq 0 ]; then
    echo "✅ Upload concluído!"
else
    echo "❌ Erro no upload!"
    exit 1
fi
echo ""

echo "🔄 2. Executando deploy na VPS..."
echo ""

sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 << 'ENDSSH'
cd /var/www/academia

echo "📥 Atualizando código do GitHub..."
git pull origin main
echo ""

echo "🔧 Criando tabela gym_settings..."
node create_gym_settings_table.js
echo ""

echo "🗄️  Recriando tabelas Wellhub..."
node recreate_wellhub_tables.js
echo ""

echo "📍 Adicionando campos de endereço à tabela students..."
node migrate_student_address_fields.js
echo ""

echo "📚 Importando biblioteca de exercícios..."
node import_exercises_library.js
echo ""

echo "🏗️  Compilando projeto..."
npm run build
echo ""

echo "🔄 Reiniciando PM2..."
pm2 restart academia-api
echo ""

echo "⏳ Aguardando backend iniciar..."
sleep 3
echo ""

echo "📋 Últimos logs do PM2:"
pm2 logs academia-api --lines 20 --nostream
echo ""

echo "📊 Status do PM2:"
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
