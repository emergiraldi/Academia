# Configuração Catraca LiteNet3 - Academia 33

## Configuração Correta Identificada

Após testes extensivos, a configuração que funciona corretamente para a catraca LiteNet3 na academia é:

### Parâmetros
- **FlowControl Mode**: `0` (Entrada Controlada, Saída Livre)
- **EntryClockwise**: `true`

### Resultado
- **Lado DIREITO**: BLOQUEADO (entrada controlada por reconhecimento facial)
- **Lado ESQUERDO**: LIVRE (saída sempre liberada)

## Comandos PowerShell

```powershell
# 1. SSL bypass
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

# 2. Descobrir dispositivos
Invoke-RestMethod -Uri "https://localhost:7067/DeviceConnection/DiscoverDevices" -Method GET
Start-Sleep -Seconds 3

# 3. Conectar ao dispositivo
Invoke-RestMethod -Uri "https://localhost:7067/DeviceConnection/Connect?ip=192.168.0.100&type=LiteNet3&network=192.168.0.0" -Method POST
Start-Sleep -Seconds 2

# 4. Aplicar configurações
$body = '{"Ip":"192.168.0.100","Port":3000,"Type":1}'
Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetFlowControl?controlledFlow=0" -Method POST -Body $body -ContentType "application/json"
Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetEntryClockwise?entryClockwise=true" -Method POST -Body $body -ContentType "application/json"
```

## Descobertas Importantes

### 1. LiteNet3 usa endpoints LiteNet2Commands
O Toletus HUB **NÃO** possui endpoints `/LiteNet3Commands/`.

Para dispositivos LiteNet3, deve-se usar `/LiteNet2Commands/` com `Type: 1` no payload.

### 2. Dispositivo deve estar conectado
Antes de aplicar SetFlowControl ou SetEntryClockwise, o dispositivo deve estar:
1. Descoberto (DiscoverDevices)
2. Conectado (Connect)

Caso contrário, retorna erro 400 (Bad Request).

### 3. Toletus HUB deve estar rodando
O serviço Toletus HUB deve estar rodando em `https://localhost:7067`.

Iniciar com: `C:\SysFit\agent\START_TOLETUS_HUB.bat`

## Modos FlowControl Disponíveis

- **Mode 0**: Entrada Controlada, Saída Livre ✅ (CORRETO)
- **Mode 1**: Entrada Controlada, Saída Bloqueada
- **Mode 2**: Entrada Controlada, Saída Controlada
- **Mode 3**: Entrada Livre, Saída Controlada
- **Mode 5**: Ambos Livres
- **Mode 6**: Entrada Livre, Saída Bloqueada
- **Mode 7**: Entrada Bloqueada, Saída Livre
- **Mode 8**: Ambos Bloqueados

## Dispositivo

- **IP**: 192.168.0.100
- **Porta**: 3000
- **Tipo**: LiteNet3
- **Type (numeric)**: 1 (no payload)

## Integração com Agent

O arquivo `agent.js` foi atualizado para:
- Usar automaticamente `/LiteNet2Commands/` para dispositivos LiteNet3
- Não mais tentar usar endpoints `/LiteNet3Commands/` que não existem

## Troubleshooting e Erros Comuns

### Erro 400 (Bad Request)
**Causa**: Dispositivo não está conectado ao Toletus HUB.

**Solução**:
1. Executar `DiscoverDevices` primeiro
2. Executar `Connect` com IP e tipo corretos
3. Aguardar 2-3 segundos antes de enviar comandos

### Erro 404 (Not Found)
**Causa**: Tentando usar endpoint `/LiteNet3Commands/` que não existe.

**Solução**: Usar sempre `/LiteNet2Commands/` para dispositivos LiteNet3.

### Toletus HUB não responde
**Causa**: Serviço não está rodando.

**Solução**:
1. Abrir `C:\SysFit\agent\START_TOLETUS_HUB.bat`
2. Verificar se está rodando em `https://localhost:7067`
3. Manter a janela aberta (não fechar)

### Catraca completamente livre
**Causa**: Configuração errada de FlowControl ou EntryClockwise.

**Solução**:
- Usar Mode 0 (não Mode 1, 7 ou outros)
- Usar EntryClockwise = true (não false)
- Reconectar dispositivo se necessário

## Processo de Configuração Completo

### 1. Preparação
```powershell
# Iniciar Toletus HUB
cd C:\SysFit\agent
START_TOLETUS_HUB.bat
# Deixar janela aberta
```

### 2. Configurar SSL Bypass (PowerShell)
```powershell
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
```

### 3. Descobrir e Conectar Dispositivo
```powershell
# Descobrir
Invoke-RestMethod -Uri "https://localhost:7067/DeviceConnection/DiscoverDevices" -Method GET

# Aguardar
Start-Sleep -Seconds 3

# Conectar
Invoke-RestMethod -Uri "https://localhost:7067/DeviceConnection/Connect?ip=192.168.0.100&type=LiteNet3&network=192.168.0.0" -Method POST

# Aguardar
Start-Sleep -Seconds 2
```

### 4. Aplicar Configuração Final
```powershell
$body = '{"Ip":"192.168.0.100","Port":3000,"Type":1}'

# FlowControl Mode 0
Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetFlowControl?controlledFlow=0" -Method POST -Body $body -ContentType "application/json"

# EntryClockwise TRUE
Invoke-RestMethod -Uri "https://localhost:7067/LiteNet2Commands/SetEntryClockwise?entryClockwise=true" -Method POST -Body $body -ContentType "application/json"
```

### 5. Testar
- **DIREITA**: Empurrar - deve estar BLOQUEADO
- **ESQUERDA**: Empurrar - deve estar LIVRE

## Arquivos Modificados

### agent.js (Linhas 519-521 e 563-565)
Corrigido para usar sempre `/LiteNet2Commands/` para LiteNet3:

```javascript
// toletusSetEntryClockwise (linha 519-521)
const endpoint = device.type === 'LiteNet1' ? `/LiteNet1Commands/SetEntryClockwise?entryClockwise=${entryClockwise}` :
                 `/LiteNet2Commands/SetEntryClockwise?entryClockwise=${entryClockwise}`;

// toletusSetFlowControl (linha 563-565)
const endpoint = device.type === 'LiteNet1' ? `/LiteNet1Commands/SetFlowControl?controlledFlow=${controlledFlow}` :
                 `/LiteNet2Commands/SetFlowControl?controlledFlow=${controlledFlow}`;
```

## Configuração .env

Arquivo `C:\SysFit\agent\.env`:

```env
LEITORA_IP=192.168.0.129
LEITORA_PORT=80
LEITORA_USERNAME=Admim
LEITORA_PASSWORD=Admim
VPS_URL=wss://www.sysfitpro.com.br/agent
AGENT_ID=academia-33
AUTH_TOKEN=ad76d57f0deb1ee559c661411bec3d02b36dbef1b81a8f34ac98a61121ec7423
TOLETUS_HUB_URL=https://localhost:7067
```

## Histórico de Testes

### Teste 1: Mode 1 + EntryClockwise FALSE
- **Resultado**: Lado errado bloqueado (esquerda bloqueada, direita livre)
- **Status**: ❌ Falhou

### Teste 2: Mode 0 + EntryClockwise FALSE
- **Resultado**: Catraca completamente livre (ambos lados)
- **Status**: ❌ Falhou

### Teste 3: Mode 0 + EntryClockwise TRUE
- **Resultado**: DIREITA bloqueada, ESQUERDA livre
- **Status**: ✅ FUNCIONOU!

## Data de Configuração

19/01/2026 - Testado e confirmado funcionando corretamente
