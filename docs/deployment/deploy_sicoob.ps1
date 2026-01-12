#!/usr/bin/env pwsh
# Deploy Sicoob Integration - Super Admin PIX Settings
# Este script adiciona suporte para Sicoob no Super Admin

Write-Host "🚀 Deploy: Integração Sicoob - Super Admin PIX" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Passo 1: Adicionar campos Sicoob no servidor
Write-Host "📋 Passo 1: Adicionando campos Sicoob ao banco de dados remoto..." -ForegroundColor Yellow
sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 @"
cd /var/www/academia &&
echo '🔧 Executando migração add_sicoob_fields_to_super_admin.js...' &&
node add_sicoob_fields_to_super_admin.js
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao executar migração!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Passo 2: Copiar dados PIX da academia para Super Admin
Write-Host "📋 Passo 2: Copiando dados PIX da academia para Super Admin..." -ForegroundColor Yellow
sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 @"
cd /var/www/academia &&
echo '📦 Executando script de cópia de dados PIX...' &&
node copy_gym_pix_to_super_admin.js
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao copiar dados PIX!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Passo 3: Git operations
Write-Host "📋 Passo 3: Atualizando código no servidor..." -ForegroundColor Yellow
sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 @"
cd /var/www/academia &&
echo '📥 Fazendo git pull...' &&
git pull origin main
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer git pull!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Passo 4: Build do projeto
Write-Host "📋 Passo 4: Compilando projeto..." -ForegroundColor Yellow
sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 @"
cd /var/www/academia &&
echo '🏗️  Compilando...' &&
npm run build
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao compilar projeto!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Passo 5: Reiniciar PM2
Write-Host "📋 Passo 5: Reiniciando PM2..." -ForegroundColor Yellow
sshpass -p "935559Emerson@" ssh -o StrictHostKeyChecking=no root@138.197.8.136 @"
cd /var/www/academia &&
echo '🔄 Reiniciando PM2...' &&
pm2 restart academia-api &&
echo '' &&
echo '⏳ Aguardando backend iniciar...' &&
sleep 3 &&
echo '' &&
echo '📊 Status do PM2:' &&
pm2 status
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao reiniciar PM2!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Acesse: https://www.sysfitpro.com.br/super-admin" -ForegroundColor White
Write-Host "   2. Vá em: Configurações > Pagamentos PIX" -ForegroundColor White
Write-Host "   3. Verifique se os dados Sicoob foram copiados corretamente" -ForegroundColor White
Write-Host ""
