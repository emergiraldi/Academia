$password = "935559Emerson@"
$ip = "138.197.8.136"

# Criar script expect temporário
$expectScript = @"
#!/usr/bin/expect -f
set timeout -1
spawn ssh -o StrictHostKeyChecking=no root@$ip
expect "password:"
send "$password\r"
expect "$ "
send "cd /var/www/academia\r"
expect "$ "
send "echo '📥 1. Atualizando código do GitHub...'\r"
expect "$ "
send "git pull origin main\r"
expect "$ "
send "echo ''\r"
expect "$ "
send "echo '📦 2. Copiando credenciais PIX da Academia FitLife para Super Admin...'\r"
expect "$ "
send "node copy_gym_pix_to_super_admin.js\r"
expect "$ "
send "echo ''\r"
expect "$ "
send "echo '🏗️  3. Compilando projeto...'\r"
expect "$ "
send "npm run build\r"
expect "$ "
send "echo ''\r"
expect "$ "
send "echo '🔄 4. Reiniciando PM2...'\r"
expect "$ "
send "pm2 restart academia-api\r"
expect "$ "
send "echo ''\r"
expect "$ "
send "echo '⏳ 5. Aguardando backend iniciar...'\r"
expect "$ "
send "sleep 3\r"
expect "$ "
send "echo ''\r"
expect "$ "
send "echo '📋 6. Últimos logs do PM2:'\r"
expect "$ "
send "pm2 logs academia-api --lines 20 --nostream\r"
expect "$ "
send "echo ''\r"
expect "$ "
send "echo '========================================'\r"
expect "$ "
send "echo '✅ Deploy concluído com sucesso!'\r"
expect "$ "
send "echo '========================================'\r"
expect "$ "
send "echo ''\r"
expect "$ "
send "echo '🌐 Teste criando uma nova academia em: https://www.sysfitpro.com.br'\r"
expect "$ "
send "exit\r"
expect eof
"@

# Salvar e executar via WSL
$expectFile = "C:\Projeto\Academia\deploy_expect.sh"
$expectScript | Out-File -FilePath $expectFile -Encoding ASCII

try {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  DEPLOY - COPIAR PIX E ATUALIZAR" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    wsl bash -c "expect $expectFile"

} catch {
    Write-Host "⚠️  Erro ao conectar automaticamente." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, execute manualmente no servidor:" -ForegroundColor Cyan
    Write-Host "ssh root@$ip" -ForegroundColor White
    Write-Host "Senha: $password" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Depois execute:" -ForegroundColor Cyan
    Write-Host "cd /var/www/academia" -ForegroundColor White
    Write-Host "git pull origin main" -ForegroundColor White
    Write-Host "node copy_gym_pix_to_super_admin.js" -ForegroundColor White
    Write-Host "npm run build" -ForegroundColor White
    Write-Host "pm2 restart academia-api" -ForegroundColor White
    Write-Host "pm2 logs academia-api --lines 20 --nostream" -ForegroundColor White
}

Remove-Item $expectFile -ErrorAction SilentlyContinue
