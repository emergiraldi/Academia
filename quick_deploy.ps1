$password = "935559Emerson@"
$ip = "138.197.8.136"

# Criar arquivo temporário com comandos
$commands = @"
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
pm2 flush academia-api
echo '🔍 TESTE AGORA enviando um email em:'
echo 'https://www.sysfitpro.com.br/student/forgot-password'
exit
"@

# Usar plink se disponível, senão ssh
echo $commands | plink -batch -pw $password root@$ip
