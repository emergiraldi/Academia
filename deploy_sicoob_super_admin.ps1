# Deploy do suporte Sicoob no Super Admin
# PowerShell script para deploy automatizado

Write-Host "🚀 Iniciando deploy do suporte Sicoob..." -ForegroundColor Cyan
Write-Host ""

# SSH para o servidor e executar comandos
$sshCommand = @"
cd /var/www/academia &&
echo '📥 1. Atualizando código do GitHub...' &&
git pull origin main &&
echo '' &&
echo '🔧 2. Executando migração Sicoob...' &&
node add_sicoob_fields_to_super_admin.js &&
echo '' &&
echo '📋 3. Copiando dados PIX da academia para Super Admin...' &&
node copy_gym_pix_to_super_admin.js &&
echo '' &&
echo '🏗️  4. Compilando projeto...' &&
npm run build &&
echo '' &&
echo '🔄 5. Reiniciando PM2...' &&
pm2 restart academia-api &&
echo '' &&
echo '⏳ 6. Aguardando backend iniciar...' &&
sleep 3 &&
echo '' &&
echo '📊 7. Status do PM2:' &&
pm2 status &&
echo '' &&
echo '========================================' &&
echo '✅ Deploy concluído com sucesso!' &&
echo '========================================' &&
echo '' &&
echo '🌐 Acesse: https://www.sysfitpro.com.br/super-admin/settings' &&
echo '📋 Vá na aba Pagamentos PIX para verificar os dados'
"@

sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@72.60.2.237 $sshCommand
