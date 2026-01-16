# 🚀 Deploy Manual - Integração Toletus HUB

## ✅ Código já foi enviado para o GitHub!

Commit: `feat: Adiciona integração completa com Toletus HUB para controle de catracas`

---

## 📋 Instruções para Deploy no VPS

### 1. Conectar ao servidor VPS

```bash
ssh root@72.60.2.237
```

Senha: `935559Emerson@`

### 2. Atualizar código do GitHub

```bash
cd /var/www/academia
git pull origin main
```

### 3. Executar migração do banco de dados

```bash
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
```

### 4. Compilar o projeto

```bash
npm run build
```

### 5. Reiniciar o PM2

```bash
pm2 restart academia-api
```

### 6. Verificar status e logs

```bash
# Aguardar 3 segundos
sleep 3

# Ver status
pm2 status

# Ver logs
pm2 logs academia-api --lines 30 --nostream
```

---

## 🔍 Verificação

Após o deploy, verifique:

1. **Backend rodando:** `pm2 status` deve mostrar "online"
2. **Sem erros:** `pm2 logs academia-api --lines 50`
3. **Acesse o sistema:** https://www.sysfitpro.com.br

---

## 📝 Próximos Passos (Configuração)

### No Sistema Web:

1. Acesse: https://www.sysfitpro.com.br/admin/settings
2. Na seção "Sistema de Catraca", selecione **"Toletus HUB"**
3. Salve as configurações
4. Acesse: https://www.sysfitpro.com.br/admin/toletus-devices
5. Configure os dispositivos Toletus

### No Cliente Local (onde o Toletus HUB está instalado):

1. Instalar e iniciar o Toletus HUB (.NET 9)
2. Configurar o agent local:

```bash
cd /caminho/para/agent
nano .env
```

Adicionar/verificar:

```env
# URL do Toletus HUB (rodando localmente)
TOLETUS_HUB_URL=https://localhost:7067

# URL do servidor VPS (WebSocket)
VPS_URL=wss://www.sysfitpro.com.br/agent

# ID único desta academia/agent
AGENT_ID=academia-1

# Token de autenticação
AUTH_TOKEN=seu-token-secreto-aqui
```

3. Reiniciar o agent:

```bash
pm2 restart agent
```

---

## 🎉 Funcionalidades Disponíveis

Após configurado:

- ✅ Gerenciar dispositivos Toletus HUB
- ✅ Descobrir dispositivos na rede automaticamente
- ✅ Conectar/desconectar dispositivos
- ✅ Liberar catraca manualmente (botão na lista de alunos)
- ✅ Teste de liberação individual por dispositivo
- ✅ Logs de acesso separados por tipo de sistema

---

## 📊 Arquitetura

```
VPS Server (sua aplicação)
    ↓ WebSocket
Agent Local (Node.js)
    ↓ HTTPS (localhost:7067)
Toletus HUB (.NET 9)
    ↓ TCP (porta 7878)
Catracas LiteNet (hardware)
```

---

**Qualquer dúvida, estou à disposição! 🚀**
