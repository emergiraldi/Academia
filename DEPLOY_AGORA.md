# 🚀 Deploy Rápido para VPS

## Execute estes comandos no PowerShell ou CMD:

### 1. Conectar na VPS
```bash
ssh root@138.197.8.136
```
**Senha:** `935559Emerson@`

### 2. Ir para o diretório do projeto
```bash
cd /var/www/academia
```

### 3. Executar o script de deploy
```bash
bash fix_vps_db.sh
```

## O que vai acontecer:

✅ Git pull (atualiza código)
✅ Verifica DATABASE_URL
✅ npm run build (compila)
✅ **RECRIA** as 4 tabelas:
   - class_schedules
   - class_bookings
   - visitor_bookings
   - payment_methods
✅ Reseta senha admin
✅ Reinicia PM2
✅ Mostra logs

## Tempo estimado:
⏱️ 2-3 minutos

## Após conclusão:
✅ Todos os erros do console vão desaparecer
✅ Sistema 100% funcional

## Credenciais:
- Email: `admin@fitlife.com`
- Senha: `admin123`
- CNPJ teste: `23.538.490/0001-80`
