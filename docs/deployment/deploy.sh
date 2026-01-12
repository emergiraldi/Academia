#!/bin/bash

# Deploy Script - Sistema de Planos SaaS
echo "========================================"
echo "  DEPLOY - SISTEMA DE PLANOS SAAS"
echo "========================================"
echo ""

PASSWORD="935559Emerson@"
IP="138.197.8.136"

# Instalar sshpass se necessário (apenas uma vez)
if ! command -v sshpass &> /dev/null; then
    echo "⚙️  Instalando sshpass..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    fi
fi

echo "📥 1. Conectando ao servidor e atualizando código..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@$IP << 'EOF'
cd /var/www/academia
echo '📥 Atualizando código do GitHub...'
git pull origin main
echo ''
echo '🏗️  Compilando projeto...'
npm run build
echo ''
echo '🔄 Reiniciando PM2...'
pm2 restart academia-api
echo ''
echo '⏳ Aguardando backend iniciar...'
sleep 3
echo ''
echo '📋 Últimos logs do PM2:'
pm2 logs academia-api --lines 20 --nostream
echo ''
echo '📊 Status do PM2:'
pm2 status
echo ''
echo '========================================'
echo '✅ Deploy concluído com sucesso!'
echo '========================================'
echo ''
echo '🌐 Site: https://www.sysfitpro.com.br'
EOF

echo ""
echo "✅ Deploy finalizado!"
