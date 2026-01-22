# 🔧 SOLUÇÃO: Limpar Logs Antigos da Control ID - Academia 33

## 📊 Problema Identificado

**Buffer da Control ID CHEIO** - 68 logs antigos (6 horas atrás) impedem novos logs de serem gerados!

- ❌ Logs mais recentes: 16:29, 16:32 (6 horas atrás!)
- ❌ `logAge=20756s` (mais de 5 horas)
- ❌ `isRecent=false` → Sistema NUNCA libera catraca automaticamente
- ✅ Liberação manual (botão) funciona perfeitamente

## 🎯 Solução

Limpar logs antigos da Control ID para liberar espaço no buffer.

---

## 📝 Opção 1: Via PowerShell (Máquina Remota)

Execute este comando **NA MÁQUINA ONDE ESTÁ O AGENT** (`C:\SysFit\agent`):

```powershell
# Criar e executar script de limpeza
$scriptPath = "C:\SysFit\agent\limpar-logs.ps1"

@"
`$controlIdIp = "192.168.0.129"
`$controlIdPort = 80
`$username = "admin"
`$password = "admin"

Write-Host "🔐 Fazendo login na Control ID..." -ForegroundColor Yellow

# Login
`$loginUrl = "http://`${controlIdIp}:`${controlIdPort}/login.fcgi"
`$loginBody = @{
    login = `$username
    password = `$password
} | ConvertTo-Json

try {
    `$loginResponse = Invoke-RestMethod -Uri `$loginUrl -Method POST -Body `$loginBody -ContentType "application/json"
    `$session = `$loginResponse.session

    Write-Host "✅ Login OK! Sessão: `$session" -ForegroundColor Green

    # Carregar logs atuais
    Write-Host "`n📊 Carregando logs atuais..." -ForegroundColor Yellow
    `$logsUrl = "http://`${controlIdIp}:`${controlIdPort}/load_objects.fcgi?session=`$session"
    `$logsBody = @{ object = "access_logs" } | ConvertTo-Json

    `$logsResponse = Invoke-RestMethod -Uri `$logsUrl -Method POST -Body `$logsBody -ContentType "application/json"
    `$totalLogs = `$logsResponse.access_logs.Count

    Write-Host "📋 Total de logs: `$totalLogs" -ForegroundColor Cyan

    if (`$totalLogs -eq 0) {
        Write-Host "✅ Nenhum log para limpar!" -ForegroundColor Green
        exit
    }

    # Mostrar logs mais antigo e mais recente
    `$timestamps = `$logsResponse.access_logs | ForEach-Object { `$_.time }
    `$oldest = [DateTimeOffset]::FromUnixTimeSeconds((`$timestamps | Measure-Object -Minimum).Minimum).DateTime
    `$newest = [DateTimeOffset]::FromUnixTimeSeconds((`$timestamps | Measure-Object -Maximum).Maximum).DateTime

    Write-Host "   Mais antigo: `$oldest" -ForegroundColor Gray
    Write-Host "   Mais recente: `$newest" -ForegroundColor Gray

    # Calcular timestamp de corte (1 hora atrás)
    `$cutoffTime = [int]([DateTimeOffset]::Now.ToUnixTimeSeconds() - 3600)
    `$oldLogsCount = (`$logsResponse.access_logs | Where-Object { `$_.time -lt `$cutoffTime }).Count

    Write-Host "`n🗑️  Logs a deletar (mais de 1h): `$oldLogsCount" -ForegroundColor Yellow
    Write-Host "💾 Logs a manter: `$(`$totalLogs - `$oldLogsCount)" -ForegroundColor Green

    if (`$oldLogsCount -eq 0) {
        Write-Host "`n✅ Nenhum log antigo para deletar!" -ForegroundColor Green
        exit
    }

    # Confirmar
    `$confirm = Read-Host "`nDeseja deletar `$oldLogsCount logs antigos? (S/N)"
    if (`$confirm -ne "S") {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        exit
    }

    # Deletar logs antigos
    Write-Host "`n🗑️  Deletando logs antigos..." -ForegroundColor Yellow
    `$deleteUrl = "http://`${controlIdIp}:`${controlIdPort}/destroy_objects.fcgi?session=`$session"
    `$deleteBody = @{
        object = "access_logs"
        where = @{
            access_logs = @{
                time = @{ "<" = `$cutoffTime }
            }
        }
    } | ConvertTo-Json -Depth 5

    Invoke-RestMethod -Uri `$deleteUrl -Method POST -Body `$deleteBody -ContentType "application/json" | Out-Null

    Write-Host "✅ Logs deletados com sucesso!" -ForegroundColor Green

    # Verificar resultado
    Write-Host "`n📊 Verificando resultado..." -ForegroundColor Yellow
    `$logsResponse2 = Invoke-RestMethod -Uri `$logsUrl -Method POST -Body `$logsBody -ContentType "application/json"
    `$remainingLogs = `$logsResponse2.access_logs.Count

    Write-Host "✅ Logs restantes: `$remainingLogs" -ForegroundColor Green
    Write-Host "✅ Logs deletados: `$(`$totalLogs - `$remainingLogs)" -ForegroundColor Green

    Write-Host "`n🎉 CONCLUÍDO! Buffer liberado!" -ForegroundColor Green
    Write-Host "Agora peça para alguém passar o rosto na leitora para testar." -ForegroundColor Cyan

} catch {
    Write-Host "❌ Erro: `$_" -ForegroundColor Red
}
"@ | Out-File -FilePath `$scriptPath -Encoding UTF8

# Executar script
powershell -ExecutionPolicy Bypass -File `$scriptPath
```

---

## 📝 Opção 2: Via API (Endpoint que criamos)

**Requisitos:**
- Servidor VPS atualizado com o novo código
- Agent local atualizado
- Agent conectado à VPS

### 2.1. Teste via Navegador (Console)

Abra o navegador no sistema da academia e execute no console:

```javascript
// Fazer login primeiro e pegar o token
const token = localStorage.getItem('auth-token'); // ou sessionStorage

// Chamar API para limpar logs
fetch('http://72.60.2.237:3000/trpc/controlId.clearOldAccessLogs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    hoursAgo: 1  // Deletar logs com mais de 1 hora
  })
})
.then(res => res.json())
.then(data => console.log('Resultado:', data))
.catch(err => console.error('Erro:', err));
```

### 2.2. Teste via CURL (VPS)

```bash
# Na VPS, execute:
ssh root@72.60.2.237

# Teste o endpoint (sem autenticação por enquanto)
curl -X POST http://localhost:3000/trpc/controlId.clearOldAccessLogs \
  -H "Content-Type: application/json" \
  -d '{"hoursAgo": 1}'
```

---

## ✅ Verificação

Após limpar os logs, verifique:

1. **Peça para alguém passar o rosto na leitora**
2. **Aguarde 2-3 segundos**
3. **Verifique os logs da VPS:**

```bash
ssh root@72.60.2.237 "pm2 logs academia-api --lines 20 --nostream | grep -E '(toletus_releaseEntry|Liberando catraca|isRecent=true)'"
```

4. **Se funcionar, você verá:**
   - ✅ `isRecent=true`
   - ✅ `Liberando catraca Toletus para...`
   - ✅ `toletus_releaseEntry` sendo enviado ao agent
   - ✅ Catraca abrindo automaticamente!

---

## 🔍 Troubleshooting

### Se ainda não funcionar:

1. **Verifique se agent está conectado:**
```bash
ssh root@72.60.2.237 "pm2 logs academia-api --lines 5 --nostream | grep 'academia-33'"
```

2. **Verifique se há novos logs sendo gerados:**
```bash
ssh root@72.60.2.237 "mysql -u root academia_db -e \"SELECT COUNT(*) as total, MAX(timestamp) as newest FROM access_logs WHERE gymId = 33;\""
```

3. **Force restart do PM2:**
```bash
ssh root@72.60.2.237 "pm2 restart academia-api && pm2 logs academia-api --lines 0"
```

---

## 📞 Suporte

Se o problema persistir, envie:
- ✅ Output do script PowerShell
- ✅ Logs do agent (`C:\SysFit\agent\logs`)
- ✅ Screenshot da leitora Control ID mostrando logs

---

**Data:** 21/01/2026 23:30
**Academia:** Studio Vem Dançar (ID 33)
**Problema:** Buffer da Control ID cheio impedindo novos logs
