ssh -o StrictHostKeyChecking=no root@72.60.2.237 @"
cd /var/www/academia
echo '📥 Atualizando código...'
git pull origin main
echo ''
echo '🏗️  Compilando...'
npm run build
echo ''
echo '🔄 Reiniciando...'
pm2 restart academia-api
echo ''
echo '⏳ Aguardando...'
sleep 3
echo ''
echo '✅ Deploy concluído!'
echo ''
echo '🌐 Acesse: https://www.sysfitpro.com.br/admin/billing'
echo '   Agora você pode dar baixa sem erro de validação!'
"@
