$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando deploy do calendário de datas..." -ForegroundColor Cyan

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
echo '📅 NOVO RECURSO: Calendário de Intervalo de Datas!' &&
echo '' &&
echo '🔍 Como usar:' &&
echo '1. Acesse: https://www.sysfitpro.com.br/admin/payments' &&
echo '2. Clique no filtro PERÍODO' &&
echo '3. Selecione Data Inicial e Data Final nos calendários' &&
echo '4. Use o botão "Mês Atual" para atalho rápido' &&
echo '5. Use "Limpar" para remover o filtro' &&
echo '' &&
echo '📋 Benefícios:' &&
echo '✓ Busque débitos em aberto por período específico' &&
echo '✓ Visualize mensalidades de qualquer intervalo' &&
echo '✓ Interface mais intuitiva e visual' &&
echo '✓ Maior flexibilidade na gestão financeira'
"@

try {
    & "C:\Program Files\Git\usr\bin\ssh.exe" -o StrictHostKeyChecking=no root@72.60.2.237 $sshCommand
    Write-Host "`n✅ Deploy finalizado!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Erro no deploy: $_" -ForegroundColor Red
    exit 1
}
