#!/bin/bash

echo "========================================"
echo "🚀 Deploy + Restauração do Banco de Dados"
echo "========================================"
echo ""

# Check if backup file exists
if [ ! -f "academia_db_backup.sql" ]; then
    echo "❌ Arquivo academia_db_backup.sql não encontrado!"
    echo "💡 Execute primeiro: node export_database.js"
    exit 1
fi

echo "📊 Informações do backup:"
ls -lh academia_db_backup.sql | awk '{print "   Tamanho: " $5}'
echo ""

read -p "⚠️  ATENÇÃO: Isso vai SUBSTITUIR todo o banco de dados na VPS! Continuar? (s/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada"
    exit 1
fi
echo ""

echo "📤 1. Fazendo upload do backup para VPS..."
sshpass -p "935559Emerson@" scp -o StrictHostKeyChecking=no academia_db_backup.sql root@138.197.8.136:/var/www/academia/
if [ $? -eq 0 ]; then
    echo "✅ Upload concluído!"
else
    echo "❌ Erro no upload!"
    exit 1
fi
echo ""

echo "🔄 2. Atualizando código e restaurando banco na VPS..."
echo ""

sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 << 'ENDSSH'
cd /var/www/academia

echo "📥 Atualizando código do GitHub..."
git pull origin main
echo ""

echo "🗄️  Restaurando banco de dados..."
echo "   ⚠️  Dropando banco existente..."
mysql -u root -e "DROP DATABASE IF EXISTS academia_db;"
echo "   ✓ Banco removido"

echo "   📥 Importando backup..."
mysql -u root < academia_db_backup.sql
echo "   ✓ Backup restaurado"

echo "   🧹 Removendo arquivo de backup..."
rm academia_db_backup.sql
echo "   ✓ Arquivo removido"
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
echo "✅ Deploy e restauração concluídos!"
echo "========================================"
echo ""
echo "🌐 Site: https://www.sysfitpro.com.br"
echo ""

ENDSSH

echo ""
echo "✅ Script finalizado!"
echo "💡 O backup local foi mantido em: academia_db_backup.sql"
