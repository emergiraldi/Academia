# Deploy com logs de debug para fluxo de caixa
$password = "935559Emerson@"
$server = "root@72.60.2.237"

Write-Host "📥 Fazendo deploy com logs de debug..." -ForegroundColor Cyan

# Criar script SSH
$sshScript = @"
cd /var/www/academia
echo '📥 1. Atualizando código do GitHub...'
git pull origin main
echo ''
echo '🏗️  2. Compilando projeto...'
npm run build
echo ''
echo '🔄 3. Reiniciando PM2...'
pm2 restart academia-api
echo ''
echo '🗑️  4. Limpando logs antigos...'
pm2 flush academia-api
echo ''
echo '⏳ 5. Aguardando backend iniciar...'
sleep 3
echo ''
echo '========================================'
echo '✅ Deploy concluído!'
echo '========================================'
echo ''
echo '🔍 AGORA:'
echo '1. Acesse: https://www.sysfitpro.com.br/admin/cash-flow'
echo '2. A página vai carregar os dados'
echo '3. Os logs de debug vão aparecer'
"@

# Executar via plink (se disponível) ou ssh
try {
    $plink = Get-Command plink.exe -ErrorAction Stop
    Write-Host "Usando plink..." -ForegroundColor Yellow
    echo y | & $plink.FullName -pw $password $server $sshScript
} catch {
    Write-Host "Usando ssh padrão..." -ForegroundColor Yellow
    # Tentar com expect (WSL)
    $expectScript = @"
spawn ssh -o StrictHostKeyChecking=no $server
expect "password:"
send "$password\r"
expect "$ "
send "$sshScript\r"
expect "$ "
send "exit\r"
expect eof
"@

    # Salvar script expect
    $expectScript | Out-File -FilePath "$env:TEMP\ssh_deploy.exp" -Encoding ASCII

    # Executar via WSL se disponível
    try {
        wsl bash -c "expect $env:TEMP\ssh_deploy.exp"
    } catch {
        Write-Host "❌ Erro: Não foi possível conectar via SSH" -ForegroundColor Red
        Write-Host "Execute manualmente:" -ForegroundColor Yellow
        Write-Host "ssh $server" -ForegroundColor Cyan
        Write-Host "Senha: $password" -ForegroundColor Cyan
    }
}
