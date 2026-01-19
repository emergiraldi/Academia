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

## Data de Configuração

19/01/2026 - Testado e confirmado funcionando corretamente
