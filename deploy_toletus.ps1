# Deploy - Integração Toletus HUB
$password = "935559Emerson@"
$server = "root@72.60.2.237"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOY: Integração Toletus HUB" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Criar script SSH
$sshScript = @"
cd /var/www/academia
echo '📥 1. Atualizando código do GitHub...'
git pull origin main
echo ''
echo '🗄️  2. Executando migração do banco de dados...'
mysql -u academia -p'Academia2026Secure' academia_db << 'SQLEOF'
-- Adicionar campo turnstileType na tabela gyms
ALTER TABLE gyms
ADD COLUMN IF NOT EXISTS turnstileType ENUM('control_id', 'toletus_hub')
DEFAULT 'control_id' NOT NULL
COMMENT 'Tipo de sistema de catraca usado pela academia';

-- Criar tabela toletus_devices
CREATE TABLE IF NOT EXISTS toletus_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  gymId INT NOT NULL,
  name VARCHAR(200) NOT NULL COMMENT 'Nome identificador do dispositivo',
  hubUrl VARCHAR(500) NOT NULL DEFAULT 'https://localhost:7067' COMMENT 'URL do Toletus HUB local',
  deviceId INT NOT NULL COMMENT 'ID do dispositivo no Toletus HUB',
  deviceIp VARCHAR(50) NOT NULL COMMENT 'IP do dispositivo na rede local',
  devicePort INT NOT NULL DEFAULT 7878 COMMENT 'Porta do dispositivo',
  deviceType ENUM('LiteNet1', 'LiteNet2', 'LiteNet3') NOT NULL COMMENT 'Tipo de dispositivo LiteNet',
  location VARCHAR(200) DEFAULT NULL COMMENT 'Localização física',
  active BOOLEAN DEFAULT TRUE NOT NULL COMMENT 'Dispositivo ativo',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE,
  INDEX idx_gymId (gymId),
  INDEX idx_active (active),
  INDEX idx_deviceIp (deviceIp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dispositivos Toletus HUB cadastrados por academia';

-- Adicionar campo deviceType na tabela access_logs
ALTER TABLE access_logs
ADD COLUMN IF NOT EXISTS deviceType ENUM('control_id', 'toletus_hub')
DEFAULT 'control_id' NOT NULL
COMMENT 'Tipo de sistema que registrou o log';
SQLEOF
echo ''
echo '🏗️  3. Compilando projeto...'
npm run build
echo ''
echo '🔄 4. Reiniciando PM2...'
pm2 restart academia-api
echo ''
echo '⏳ 5. Aguardando backend iniciar...'
sleep 3
echo ''
echo '📋 6. Últimos logs do PM2:'
pm2 logs academia-api --lines 30 --nostream
echo ''
echo '📊 7. Status do PM2:'
pm2 status
echo ''
echo '========================================'
echo '✅ DEPLOY CONCLUÍDO COM SUCESSO!'
echo '========================================'
echo ''
echo '🔍 PRÓXIMOS PASSOS:'
echo '1. Acesse: https://www.sysfitpro.com.br/admin/settings'
echo '2. Selecione "Toletus HUB" no campo Sistema de Catraca'
echo '3. Configure os dispositivos em /admin/toletus-devices'
echo '4. Configure o agent local com TOLETUS_HUB_URL'
echo ''
"@

# Executar via plink (se disponível) ou ssh
try {
    $plink = Get-Command plink.exe -ErrorAction Stop
    Write-Host "Usando plink..." -ForegroundColor Yellow
    echo y | & $plink.FullName -pw $password $server $sshScript
} catch {
    Write-Host "Usando ssh padrão..." -ForegroundColor Yellow
    # Tentar com sshpass se disponível
    try {
        $sshpass = Get-Command sshpass -ErrorAction Stop
        & $sshpass.FullName -p $password ssh -o StrictHostKeyChecking=no $server $sshScript
    } catch {
        Write-Host "`n⚠️  Nem plink nem sshpass encontrados!" -ForegroundColor Red
        Write-Host "Execute manualmente no servidor:`n" -ForegroundColor Yellow
        Write-Host $sshScript -ForegroundColor White
    }
}

Write-Host "`n✅ Deploy finalizado!" -ForegroundColor Green
