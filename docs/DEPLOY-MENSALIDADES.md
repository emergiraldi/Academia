# 🚀 Deploy Sistema de Mensalidades - GUIA COMPLETO

## ✅ Status Atual

### Banco de Dados
- ✅ Tabela `gym_billing_cycles` criada LOCALMENTE
- ✅ Script `add_billing_config_to_super_admin.js` atualizado com campos de multa
- ⚠️ **FALTA**: Executar na PRODUÇÃO (VPS)

### Campos Configuração (Super Admin Settings)
```
billingDueDay                 INT          Dia do vencimento (1-31)
billingAdvanceDays            INT          Dias antes para enviar cobrança
billingGracePeriodDays        INT          Dias após vencer antes de bloquear
billingLateFeePercentage      DECIMAL      Multa em % (ex: 2.00 = 2%)
billingLateFeeFixedCents      INT          Multa fixa em centavos
billingInterestRatePerDay     DECIMAL      Juros por dia (ex: 0.03 = 0,03%)
billingLateFeeType            ENUM         percentage | fixed | both
billingEnabled                CHAR         Y=Ativo | N=Inativo
```

---

## 📋 O QUE FALTA IMPLEMENTAR

### 1. Backend (60% concluído)

#### ✅ Já feito:
- Tabela `gym_billing_cycles`
- Campos configuração
- Scripts de migration

#### ❌ Falta fazer:
- [ ] Adicionar schema Drizzle para `gym_billing_cycles`
- [ ] Funções DB (CRUD)
- [ ] Routers tRPC
- [ ] CRON jobs (3 novos)
- [ ] Email templates
- [ ] Atualizar PIX webhook

### 2. Frontend (0% concluído)

#### ❌ Falta fazer:
- [ ] Painel Super Admin → Configurações de Cobrança
- [ ] Painel Academia → Lista de Mensalidades
- [ ] Botão "Pagar" com QR Code

---

## 🔧 PRÓXIMOS PASSOS

### PASSO 1: Deploy Tabelas na Produção

```bash
# 1. Fazer commit
git add .
git commit -m "feat: Sistema de mensalidades recorrentes - database schema"
git push origin main

# 2. No VPS
ssh root@72.60.2.237
cd /var/www/academia
git pull origin main

# 3. Rodar migrations
node create_gym_billing_cycles_table.js
node add_billing_config_to_super_admin.js

# 4. Verificar
mysql -u root -p academia_db -e "SHOW TABLES LIKE 'gym_billing%';"
```

### PASSO 2: Implementar Backend Completo

Criar arquivos:
- `server/db.ts` - Adicionar funções CRUD para gym_billing_cycles
- `server/routers/billing.ts` - Novo router tRPC
- `server/notifications.ts` - Adicionar 3 funções CRON
- `server/cron.ts` - Registrar novos CRON jobs
- `server/email.ts` - Templates de email
- `drizzle/schema.ts` - Schema Drizzle

### PASSO 3: Implementar Frontend

Criar páginas:
- `client/src/pages/super-admin/BillingSettings.tsx`
- `client/src/pages/admin/Billing.tsx`

---

## 💡 DECISÕES ARQUITETURAIS

### Cálculo de Multa e Juros

Quando mensalidade está atrasada:

```typescript
const daysLate = Math.max(0, daysSince(dueDate));
let totalAmount = baseAmount;

// Multa
if (lateFeeType === 'percentage') {
  totalAmount += baseAmount * (lateFeePercentage / 100);
} else if (lateFeeType === 'fixed') {
  totalAmount += lateFeeFixedCents;
} else if (lateFeeType === 'both') {
  totalAmount += baseAmount * (lateFeePercentage / 100) + lateFeeFixedCents;
}

// Juros por dia
if (daysLate > 0) {
  totalAmount += baseAmount * (interestRatePerDay / 100) * daysLate;
}
```

### Tabela gym_billing_cycles

**Status possíveis:**
- `pending` - Aguardando pagamento
- `paid` - Pago
- `overdue` - Vencido (passou da data)
- `canceled` - Cancelado

**Fluxo:**
1. Dia 1 → Cria `pending`
2. Vence → Muda para `overdue`
3. Paga → Muda para `paid`
4. Manual → Pode marcar como `canceled`

---

## 📅 CRON Jobs

### 1. Gerar Mensalidades (Dia 1 às 00:00)
```
0 0 1 * *
```
Cria mensalidades para todas academias ativas

### 2. Enviar Cobranças (Diário às 09:00)
```
0 9 * * *
```
Envia email X dias antes do vencimento

### 3. Bloquear Inadimplentes (Diário às 06:00)
```
0 6 * * *
```
Bloqueia academias com mensalidade vencida há X dias

---

## 🎯 EXEMPLO DE USO

### Configuração Super Admin:
- **Vencimento**: Dia 10
- **Enviar cobrança**: 10 dias antes (dia 1 do mês anterior)
- **Grace period**: 5 dias (bloqueia dia 15)
- **Multa**: 2%
- **Juros**: 0.03% ao dia

### Fluxo Academia "Teste":
- **01/Fev**: Mensalidade criada (vence 10/Fev) + Email enviado
- **10/Fev**: Vencimento (status → overdue)
- **11-15/Fev**: Grace period (5 dias)
- **15/Fev 06:00**: BLOQUEIO automático
- **16/Fev**: Admin paga (R$ 100 + R$ 2 multa + juros)
- **Imediato**: Sistema desbloqueia

---

## 📊 Relatórios / Métricas (Futuro)

Super Admin verá:
- Total arrecadado no mês
- Taxa de inadimplência
- Academias bloqueadas
- Próximos vencimentos

---

## ⚠️ IMPORTANTE

1. **Teste primeiro localmente** antes de fazer deploy
2. **Faça backup** do banco antes de rodar migrations
3. **Verifique tabela superAdminSettings** - pode ter nome diferente (superadminsettings)
4. **Configure SMTP** - necessário para enviar emails

---

**Status**: 40% Implementado
**Próximo passo**: Deploy tabelas na produção
**Tempo estimado restante**: 4-6 horas de desenvolvimento

---

📝 **Última atualização**: 09/01/2026
✍️ **Por**: Claude Code
