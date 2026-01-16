@echo off
echo ================================================
echo     DEPLOY - Integracao Toletus HUB
echo ================================================
echo.

REM Usando plink do PuTTY para SSH com senha
echo Conectando ao servidor...
echo.

plink -batch -pw "935559Emerson@" root@72.60.2.237 "cd /var/www/academia && echo '1. Atualizando codigo...' && git pull origin main && echo '' && echo '2. Executando migracao do banco...' && mysql -u academia -p'Academia2026Secure' academia_db -e \"ALTER TABLE gyms ADD COLUMN IF NOT EXISTS turnstileType ENUM('control_id', 'toletus_hub') DEFAULT 'control_id' NOT NULL COMMENT 'Tipo de sistema de catraca usado pela academia';\" && mysql -u academia -p'Academia2026Secure' academia_db -e \"CREATE TABLE IF NOT EXISTS toletus_devices (id INT AUTO_INCREMENT PRIMARY KEY, gymId INT NOT NULL, name VARCHAR(200) NOT NULL, hubUrl VARCHAR(500) NOT NULL DEFAULT 'https://localhost:7067', deviceId INT NOT NULL, deviceIp VARCHAR(50) NOT NULL, devicePort INT NOT NULL DEFAULT 7878, deviceType ENUM('LiteNet1', 'LiteNet2', 'LiteNet3') NOT NULL, location VARCHAR(200) DEFAULT NULL, active BOOLEAN DEFAULT TRUE NOT NULL, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL, FOREIGN KEY (gymId) REFERENCES gyms(id) ON DELETE CASCADE, INDEX idx_gymId (gymId), INDEX idx_active (active), INDEX idx_deviceIp (deviceIp)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\" && mysql -u academia -p'Academia2026Secure' academia_db -e \"ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS deviceType ENUM('control_id', 'toletus_hub') DEFAULT 'control_id' NOT NULL COMMENT 'Tipo de sistema que registrou o log';\" && echo '' && echo '3. Compilando...' && npm run build && echo '' && echo '4. Reiniciando PM2...' && pm2 restart academia-api && sleep 3 && echo '' && echo '5. Status do PM2:' && pm2 status && echo '' && echo '6. Ultimos logs:' && pm2 logs academia-api --lines 20 --nostream"

echo.
echo ================================================
echo     Deploy concluido!
echo ================================================
echo.
echo Proximos passos:
echo   1. Acesse: https://www.sysfitpro.com.br/admin/settings
echo   2. Selecione "Toletus HUB" no Sistema de Catraca
echo   3. Configure dispositivos em /admin/toletus-devices
echo   4. Configure o agent local com TOLETUS_HUB_URL
echo.
pause
