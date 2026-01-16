$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando deploy da correção de listagem de alunos..." -ForegroundColor Cyan

$sshCommand = @"
cd /var/www/academia &&
echo '📥 1. Atualizando código do GitHub...' &&
git pull origin main &&
echo '' &&
echo '🏗️  2. Compilando projeto...' &&
npm run build &&
echo '' &&
echo '🔄 3. Reiniciando PM2...' &&
pm2 restart academia-api &&
echo '' &&
echo '⏳ 4. Aguardando backend iniciar...' &&
sleep 3 &&
echo '' &&
echo '📊 5. Status do PM2:' &&
pm2 status &&
echo '' &&
echo '========================================' &&
echo '✅ Deploy concluído com sucesso!' &&
echo '========================================' &&
echo '' &&
echo '🔍 TESTE AGORA:' &&
echo '1. Acesse: https://www.sysfitpro.com.br/admin/payments' &&
echo '2. Clique em GERAR MENSALIDADES' &&
echo '3. Busque por nomes de alunos' &&
echo '4. Agora TODOS os alunos devem aparecer!'
"@

try {
    & "C:\Program Files\Git\usr\bin\ssh.exe" -o StrictHostKeyChecking=no root@72.60.2.237 $sshCommand
    Write-Host "`n✅ Deploy finalizado!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Erro no deploy: $_" -ForegroundColor Red
    exit 1
}
