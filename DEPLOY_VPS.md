# Deploy para VPS - Academia System

## Passo 1: Copiar arquivos atualizados para VPS

Execute estes comandos **no seu computador local** (PowerShell ou CMD):

```bash
# Copiar script de recriação de tabelas
scp recreate_tables.sql root@138.197.8.136:/var/www/academia/
scp recreate_tables.js root@138.197.8.136:/var/www/academia/
scp fix_vps_db.sh root@138.197.8.136:/var/www/academia/
```

Senha: `935559Emerson@`

## Passo 2: Conectar na VPS e executar deploy

```bash
ssh root@138.197.8.136
```

Senha: `935559Emerson@`

## Passo 3: Executar o script de correção

```bash
cd /var/www/academia
bash fix_vps_db.sh
```

## O que o script faz:

1. ✅ Atualiza código via git pull
2. ✅ Verifica DATABASE_URL no .env
3. ✅ Compila projeto (npm run build)
4. ✅ **RECRIA** as 4 tabelas com estrutura correta:
   - class_schedules
   - class_bookings
   - visitor_bookings
   - payment_methods
5. ✅ Reseta senha do admin
6. ✅ Reinicia PM2
7. ✅ Mostra logs

## Credenciais após deploy:

- Email: `admin@fitlife.com`
- Senha: `admin123`
- CNPJ teste: `23.538.490/0001-80`

## Estrutura das tabelas criadas:

### class_schedules
- id, gymId, professorId, name, **type**, description, dayOfWeek (INT), startTime, durationMinutes, capacity, active

### class_bookings
- id, **scheduleId**, studentId, bookingDate, status

### visitor_bookings
- id, **gymId**, scheduleId, visitorName, visitorEmail, visitorPhone, bookingDate, status, notes, leadId

### payment_methods
- id, **gymId**, name, type, description, active

**IMPORTANTE:** O script REMOVE e RECRIA estas 4 tabelas para garantir que a estrutura está correta. Isso vai apagar dados existentes nestas tabelas (se houver).
