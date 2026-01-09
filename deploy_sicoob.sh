#!/bin/bash
cd /var/www/academia
echo "📥 1. Atualizando código..."
git pull origin main
echo ""
echo "🔧 2. Executando migração..."
node add_sicoob_fields_to_super_admin.js
echo ""
echo "📋 3. Copiando dados PIX..."
node copy_gym_pix_to_super_admin.js
echo ""
echo "🏗️  4. Compilando..."
npm run build
echo ""
echo "🔄 5. Reiniciando..."
pm2 restart academia-api
sleep 3
echo ""
echo "✅ Deploy concluído!"
echo "🌐 https://www.sysfitpro.com.br/super-admin/settings"
