# 💰 Sistema de Mensalidades Recorrentes - SysFit Pro

## 📋 Status de Implementação

✅ = Concluído | ⏳ = Em progresso | ❌ = Pendente

### Backend
- ✅ Tabela `gym_billing_cycles` criada
- ⏳ Campos configuração Super Admin
- ⏳ Funções CRON automáticas
- ⏳ Routers tRPC
- ⏳ DB functions
- ⏳ Email templates

### Frontend
- ⏳ Painel Super Admin (configuração)
- ⏳ Painel Academia (mensalidades)

---

## 🏗️ Arquitetura

### Tabela `gym_billing_cycles`
```sql
CREATE TABLE gym_billing_cycles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gym_id INT NOT NULL,
  reference_month VARCHAR(7) NOT NULL,  -- '2025-01'
  due_date DATE NOT NULL,               -- Data vencimento
  amount_cents INT NOT NULL,            -- Valor em centavos
  status ENUM('pending', 'paid', 'overdue', 'canceled'),
  payment_id INT NULL,                  -- FK gymPayments
  created_at DATETIME,
  paid_at DATETIME NULL,
  notified_at DATETIME NULL,            -- Quando enviou email
  blocked_at DATETIME NULL              -- Quando bloqueou
);
```

### Super Admin Settings (novos campos)
```
billingDueDay: INT DEFAULT 10           -- Dia do mês (1-31)
billingAdvanceDays: INT DEFAULT 10      -- Dias antes para notificar
billingGracePeriodDays: INT DEFAULT 5   -- Dias após vencer antes de bloquear
billingEnabled: CHAR(1) DEFAULT 'Y'     -- S=Ativo, N=Inativo
```

---

## 🔄 Fluxo Automático

### 1. Dia 1 do mês (00:00)
**CRON**: Gera mensalidades para todas academias ativas
- Busca academias com `status = 'active'`
- Cria registro em `gym_billing_cycles`
- Define `due_date` baseado em `billingDueDay`
- Valor baseado no plano (basic/professional/enterprise)

### 2. Diariamente 09:00
**CRON**: Envia notificações de cobrança
- Busca mensalidades `pending` com vencimento em X dias (`billingAdvanceDays`)
- Envia email para admin da academia
- Marca `notified_at`

### 3. Diariamente 06:00
**CRON**: Bloqueia inadimplentes
- Busca mensalidades `overdue` há mais de X dias (`billingGracePeriodDays`)
- Bloqueia academia (`status = 'suspended'`)
- Marca `blocked_at`

### 4. Toda vez que PIX é confirmado
**Webhook/Polling**: Dá baixa automática
- Webhook recebe confirmação
- Atualiza `gym_billing_cycles.status = 'paid'`
- Define `paid_at`
- Desbloqueia academia se estava bloqueada

---

## 💻 Como Funciona para o Usuário

### Super Admin
1. Acessa **Configurações → Cobrança**
2. Define:
   - Dia do vencimento (ex: 10)
   - Dias de antecedência para notificar (ex: 10)
   - Dias de tolerância antes de bloquear (ex: 5)
3. Sistema opera automaticamente

### Academia
1. Recebe email **10 dias antes** do vencimento
2. Acessa painel → vê mensalidade pendente
3. Clica em **"Pagar"** → gera QR Code PIX
4. Paga → sistema dá baixa automaticamente
5. Se não pagar → bloqueio após 5 dias

---

## 📧 Emails Enviados

### 1. Notificação de Cobrança (10 dias antes)
**Assunto**: Mensalidade vencendo - [Nome Academia]
**Conteúdo**:
- Valor
- Data de vencimento
- Link para painel
- Botão "Pagar Agora"

### 2. Confirmação de Pagamento
**Assunto**: Pagamento confirmado - [Nome Academia]
**Conteúdo**:
- Mensalidade quitada
- Próximo vencimento
- Recibo

### 3. Aviso de Bloqueio Iminente
**Assunto**: URGENTE - Academia será bloqueada
**Conteúdo**:
- Mensalidade atrasada
- Dias restantes antes de bloquear
- Link para regularizar

---

## 🎯 Casos de Uso

### Caso 1: Pagamento no Prazo
1. **Dia 1**: Mensalidade criada (vence dia 10)
2. **Dia 1**: Email enviado (10 dias antes)
3. **Dia 5**: Academia paga via PIX
4. **Imediato**: Sistema dá baixa
5. **Status**: `paid` ✅

### Caso 2: Pagamento Atrasado
1. **Dia 1**: Mensalidade criada
2. **Dia 10**: Vencimento (status → `overdue`)
3. **Dia 11-15**: Grace period (5 dias)
4. **Dia 16**: Bloqueio automático
5. **Academia**: Suspensa até regularizar

### Caso 3: Regularização Após Bloqueio
1. Academia bloqueada
2. Admin paga mensalidade atrasada
3. Sistema detecta pagamento
4. **Imediato**: Desbloqueia academia
5. **Status**: `paid` + `active` ✅

---

## 🚀 Deploy

### Produção (VPS)
```bash
ssh root@72.60.2.237
cd /var/www/academia
git pull origin main
node create_gym_billing_cycles_table.js
npm run build
pm2 restart academia-api
```

### Local
```bash
node create_gym_billing_cycles_table.js
npm run dev
```

---

## 📊 Métricas / Relatórios

Super Admin pode ver:
- Total de mensalidades pendentes
- Total de mensalidades pagas no mês
- Academias inadimplentes
- Taxa de conversão de pagamentos

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0
