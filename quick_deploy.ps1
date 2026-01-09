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

# Salvar comandos em arquivo temporário
$tempFile = [System.IO.Path]::GetTempFileName()
$commands | Out-File -FilePath $tempFile -Encoding ASCII

# Usar SSH com autenticação por senha via expectk ou criar script de automação
# Como não temos sshpass ou plink, vamos usar uma abordagem com arquivo de script
$sshScript = @"
`$password = '$password'
`$securePassword = ConvertTo-SecureString `$password -AsPlainText -Force
`$credential = New-Object System.Management.Automation.PSCredential('root', `$securePassword)

# Executar comandos via SSH
& 'C:\Program Files\Git\usr\bin\ssh.exe' -o StrictHostKeyChecking=no root@$ip @'
$commands
'@
"@

# Tentar usar o método expect se disponível, senão avisar usuário
try {
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
send "git pull origin main\r"
expect "$ "
send "npm run build\r"
expect "$ "
send "pm2 restart academia-api\r"
expect "$ "
send "pm2 logs academia-api --lines 10 --nostream\r"
expect "$ "
send "exit\r"
expect eof
"@

    # Salvar e executar via WSL
    $expectFile = "C:\Projeto\Academia\deploy_expect.sh"
    $expectScript | Out-File -FilePath $expectFile -Encoding ASCII
    wsl bash -c "expect $expectFile"
} catch {
    Write-Host "⚠️  Não foi possível conectar automaticamente." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, execute manualmente no servidor:" -ForegroundColor Cyan
    Write-Host "ssh root@$ip" -ForegroundColor White
    Write-Host "Senha: $password" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Depois execute:" -ForegroundColor Cyan
    Write-Host $commands -ForegroundColor White
}

Remove-Item $tempFile -ErrorAction SilentlyContinue
