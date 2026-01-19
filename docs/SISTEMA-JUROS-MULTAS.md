# Sistema de Juros e Multas Automático

Sistema completo para cálculo e cobrança de juros e multas em mensalidades atrasadas.

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Como Funciona](#como-funciona)
3. [Configuração](#configuração)
4. [Implementação Backend](#implementação-backend)
5. [Exemplo de Uso no Frontend](#exemplo-de-uso-no-frontend)
6. [Instalação](#instalação)
7. [Testes](#testes)
8. [FAQ](#faq)

---

## Visão Geral

### O que foi implementado?

✅ **Cálculo automático de juros e multas** para pagamentos atrasados
✅ **Armazenamento separado** de valores originais, multa e juros
✅ **Cron job diário** (2:00 AM) para atualizar todos os pagamentos em atraso
✅ **Cálculo em tempo real** no endpoint do aluno
✅ **Configurável por academia** via settings

---

## Como Funciona

### 1. Estrutura de Dados

A tabela `payments` agora possui campos adicionais:

```typescript
{
  // Campos originais
  amountInCents: number;         // Valor da mensalidade (pode incluir acréscimos após cálculo)
  status: "pending" | "paid" | ...;
  dueDate: Date;

  // Novos campos para juros/multas
  originalAmountInCents: number; // Valor original sem acréscimos (R$ 100,00)
  lateFeeInCents: number;        // Multa por atraso (R$ 2,00 = 2%)
  interestInCents: number;       // Juros acumulados (R$ 1,50)
  totalAmountInCents: number;    // Total com acréscimos (R$ 103,50)
  lastCalculatedAt: Date;        // Última vez que foi calculado
  daysOverdue: number;           // Dias em atraso (calculado dinamicamente)
}
```

### 2. Fórmulas de Cálculo

**Multa (Late Fee):**
```
lateFee = originalAmount * (lateFeePercentage / 100)
```
Exemplo: R$ 100,00 × 2% = R$ 2,00

**Juros (Interest):**
```
dailyRate = interestRatePerMonth / 30
daysForInterest = daysOverdue - daysToStartInterest + 1
interestMultiplier = (1 + dailyRate/100) ^ daysForInterest
interest = originalAmount * (interestMultiplier - 1)
```

Exemplo (10 dias de atraso, 2% ao mês, cobrar após 1 dia):
- Taxa diária: 2% / 30 = 0,0667% ao dia
- Dias para juros: 10 - 1 + 1 = 10 dias
- Multiplicador: (1 + 0,000667)^10 = 1,00669
- Juros: R$ 100,00 × (1,00669 - 1) = R$ 0,67

**Total:**
```
total = originalAmount + lateFee + interest
```

### 3. Fluxo Automático

```
┌─────────────────────────────────────────┐
│  Pagamento criado (status: pending)    │
│  originalAmountInCents = R$ 100,00     │
└────────────────┬────────────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │  Vencimento passa    │
      │  (dueDate < now)     │
      └──────────┬───────────┘
                 │
                 ▼
   ┌─────────────────────────────────────┐
   │  CRON JOB (2:00 AM diariamente)    │
   │  calculateAllOverduePayments()      │
   └─────────────┬───────────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │  Calcula:           │
        │  - Dias em atraso   │
        │  - Multa (2%)       │
        │  - Juros (2% mês)   │
        └─────────┬───────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │  Atualiza no banco:    │
         │  lateFeeInCents        │
         │  interestInCents       │
         │  totalAmountInCents    │
         │  lastCalculatedAt      │
         └────────────────────────┘
```

### 4. Cálculo em Tempo Real

Quando o aluno acessa o app:

```
┌────────────────────────────────────┐
│  Aluno abre app                    │
│  GET /payments/myPayments          │
└────────────────┬───────────────────┘
                 │
                 ▼
   ┌─────────────────────────────────┐
   │  Para cada payment pendente:    │
   │  calculateLateFeeAndInterest()  │
   │  (cálculo dinâmico, não salva)  │
   └─────────────┬───────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Retorna JSON:     │
        │  {                 │
        │    original: 10000,│
        │    lateFee: 200,   │
        │    interest: 67,   │
        │    total: 10267,   │
        │    daysOverdue: 10 │
        │  }                 │
        └────────────────────┘
```

---

## Configuração

### Configurações Disponíveis (por Academia)

Acesse via **Painel Admin → Configurações**:

| Campo | Descrição | Padrão | Exemplo |
|-------|-----------|--------|---------|
| `lateFeePercentage` | Percentual de multa aplicado uma vez ao atrasar | 2% | 2,00 |
| `interestRatePerMonth` | Taxa de juros mensal (acumulada diariamente) | 2% | 2,00 |
| `daysToStartInterest` | Dias de carência antes de começar a cobrar juros | 1 dia | 1 |
| `daysToBlockAfterDue` | Dias de atraso antes de bloquear acesso | 7 dias | 7 |

### Exemplo de Configuração

**Cenário:** Academia cobra 2% de multa + 2% de juros ao mês, com 1 dia de carência para juros.

**Mensalidade:** R$ 100,00
**Vencimento:** 10/01/2026
**Hoje:** 20/01/2026 (10 dias de atraso)

**Cálculo:**
- Multa: R$ 100,00 × 2% = **R$ 2,00**
- Juros (10 dias, taxa diária 0,0667%): **R$ 0,67**
- **Total: R$ 102,67**

---

## Implementação Backend

### Arquivos Modificados

#### 1. Migration SQL
**Arquivo:** `docs/database/add_late_fees_interest.sql`

```sql
ALTER TABLE payments
ADD COLUMN originalAmountInCents INT NULL,
ADD COLUMN lateFeeInCents INT DEFAULT 0 NOT NULL,
ADD COLUMN interestInCents INT DEFAULT 0 NOT NULL,
ADD COLUMN totalAmountInCents INT NULL,
ADD COLUMN lastCalculatedAt TIMESTAMP NULL;

UPDATE payments
SET originalAmountInCents = amountInCents,
    totalAmountInCents = amountInCents
WHERE originalAmountInCents IS NULL;

CREATE INDEX idx_payments_status_duedate ON payments(status, dueDate);
```

#### 2. Schema Drizzle
**Arquivo:** `drizzle/schema.ts`

```typescript
export const payments = mysqlTable("payments", {
  // ... campos existentes ...

  // Late fees and interest calculation fields
  originalAmountInCents: int("originalAmountInCents"),
  lateFeeInCents: int("lateFeeInCents").default(0).notNull(),
  interestInCents: int("interestInCents").default(0).notNull(),
  totalAmountInCents: int("totalAmountInCents"),
  lastCalculatedAt: timestamp("lastCalculatedAt"),
});
```

#### 3. Funções de Cálculo
**Arquivo:** `server/db.ts`

**Funções criadas:**
- `calculateLateFeeAndInterest(payment, gymId)` - Calcula sem atualizar BD
- `applyLateFeeAndInterestToPayment(paymentId, gymId)` - Calcula e salva
- `calculateAllOverduePayments()` - Processa todos os atrasados

```typescript
// Uso:
const calculated = await db.calculateLateFeeAndInterest(payment, gymId);
// Retorna: { lateFeeInCents, interestInCents, totalAmountInCents, daysOverdue }
```

#### 4. Cron Job
**Arquivo:** `server/cron.ts`

```typescript
// Run daily at 2:00 AM - Calculate late fees and interest
cron.schedule("0 2 * * *", async () => {
  await calculateAllOverduePayments();
});
```

#### 5. Endpoints Atualizados
**Arquivo:** `server/routers.ts`

**✅ Todos os endpoints de pagamentos agora incluem cálculo automático de juros e multas:**

| Endpoint | Uso | Atualizado |
|----------|-----|-----------|
| `myPayments` | App do aluno | ✅ Sim |
| `list` | Listagem admin | ✅ Sim |
| `listAll` | Relatórios completos | ✅ Sim |
| `getByStudent` | Pagamentos por aluno | ✅ Sim |

```typescript
myPayments: studentProcedure.query(async ({ ctx }) => {
  const payments = await db.getPaymentsByStudent(student.id, ctx.user.gymId);

  // Calculate late fees in real-time for pending payments
  const paymentsWithCalculations = await Promise.all(
    payments.map(async (payment) => {
      if (payment.status === 'pending') {
        const calculated = await db.calculateLateFeeAndInterest(payment, ctx.user.gymId!);
        return {
          ...payment,
          lateFeeInCents: calculated.lateFeeInCents,
          interestInCents: calculated.interestInCents,
          totalAmountInCents: calculated.totalAmountInCents,
          daysOverdue: calculated.daysOverdue,
        };
      }
      return payment;
    })
  );

  return paymentsWithCalculations;
});
```

**Relatórios Administrativos também incluem juros/multas:**
- Relatório financeiro
- Listagem de inadimplentes
- Pagamentos por aluno
- Todos os relatórios de cobrança

---

## Exemplo de Uso no Frontend

### Dados Retornados pela API

```json
{
  "id": 123,
  "amountInCents": 10000,
  "originalAmountInCents": 10000,
  "lateFeeInCents": 200,
  "interestInCents": 67,
  "totalAmountInCents": 10267,
  "daysOverdue": 10,
  "status": "pending",
  "dueDate": "2026-01-10T00:00:00.000Z"
}
```

### Exemplo React/TypeScript

```tsx
interface Payment {
  id: number;
  amountInCents: number;
  originalAmountInCents?: number;
  lateFeeInCents?: number;
  interestInCents?: number;
  totalAmountInCents?: number;
  daysOverdue?: number;
  status: "pending" | "paid";
  dueDate: Date;
}

function PaymentCard({ payment }: { payment: Payment }) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const isPending = payment.status === 'pending';
  const isOverdue = payment.daysOverdue && payment.daysOverdue > 0;
  const hasLateFees = (payment.lateFeeInCents || 0) > 0 || (payment.interestInCents || 0) > 0;

  return (
    <div className={`payment-card ${isOverdue ? 'overdue' : ''}`}>
      <div className="payment-header">
        <h3>Mensalidade {format(payment.dueDate, 'MM/yyyy')}</h3>
        {isPending && isOverdue && (
          <span className="badge-overdue">
            {payment.daysOverdue} dias de atraso
          </span>
        )}
      </div>

      <div className="payment-details">
        {/* Valor Original */}
        <div className="payment-row">
          <span>Mensalidade</span>
          <span>{formatCurrency(payment.originalAmountInCents || payment.amountInCents)}</span>
        </div>

        {/* Multa (se houver) */}
        {hasLateFees && payment.lateFeeInCents! > 0 && (
          <div className="payment-row late-fee">
            <span>Multa por atraso</span>
            <span className="text-red-600">
              + {formatCurrency(payment.lateFeeInCents)}
            </span>
          </div>
        )}

        {/* Juros (se houver) */}
        {hasLateFees && payment.interestInCents! > 0 && (
          <div className="payment-row interest">
            <span>Juros ({payment.daysOverdue} dias)</span>
            <span className="text-red-600">
              + {formatCurrency(payment.interestInCents)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="payment-row total">
          <span className="font-bold">Total a pagar</span>
          <span className={`font-bold text-lg ${hasLateFees ? 'text-red-600' : ''}`}>
            {formatCurrency(payment.totalAmountInCents || payment.amountInCents)}
          </span>
        </div>
      </div>

      {/* Botão de Pagamento */}
      {isPending && (
        <button className="btn-pay">
          Pagar Agora
        </button>
      )}
    </div>
  );
}
```

### Exemplo Visual

```
┌─────────────────────────────────────────────┐
│  Mensalidade Janeiro/2026     [10 dias]    │
├─────────────────────────────────────────────┤
│  Mensalidade               R$ 100,00        │
│  Multa por atraso        + R$ 2,00 ⚠️       │
│  Juros (10 dias)         + R$ 0,67 ⚠️       │
│  ───────────────────────────────────────    │
│  Total a pagar             R$ 102,67 🔴     │
├─────────────────────────────────────────────┤
│            [ PAGAR AGORA ]                  │
└─────────────────────────────────────────────┘
```

---

## Instalação

### Passo 1: Rodar Migration SQL

```bash
# Conectar ao MySQL
mysql -u root -p academia

# Rodar migration
source C:/Projeto/Academia/docs/database/add_late_fees_interest.sql
```

### Passo 2: Verificar Configurações

Acessar painel admin e verificar se as configurações estão corretas:

```
daysToStartInterest: 1
interestRatePerMonth: 2.00
lateFeePercentage: 2.00
```

### Passo 3: Reiniciar Servidor

```bash
cd C:/Projeto/Academia/server
npm run dev
```

O cron job iniciará automaticamente e rodará diariamente às 2:00 AM.

### Passo 4: (Opcional) Testar Cálculo Manual

```typescript
// No terminal Node.js ou via endpoint de teste
import * as db from './server/db';

const result = await db.calculateAllOverduePayments();
console.log(result);
// { processed: 5, updated: 5, errors: 0 }
```

---

## Testes

### Teste Manual

1. **Criar pagamento de teste atrasado:**

```sql
INSERT INTO payments (
  gymId, subscriptionId, studentId, amountInCents, status, paymentMethod, dueDate, createdAt, updatedAt
) VALUES (
  1, 1, 1, 10000, 'pending', 'pix', '2026-01-10', NOW(), NOW()
);
```

2. **Rodar cálculo:**

```bash
# Via endpoint de teste ou cron job manual
curl -X POST http://localhost:3000/api/test/calculate-late-fees
```

3. **Verificar resultado:**

```sql
SELECT
  id,
  amountInCents / 100 as valor_original,
  lateFeeInCents / 100 as multa,
  interestInCents / 100 as juros,
  totalAmountInCents / 100 as total,
  DATEDIFF(NOW(), dueDate) as dias_atraso
FROM payments
WHERE status = 'pending';
```

### Cenários de Teste

| Cenário | Vencimento | Dias Atraso | Esperado |
|---------|------------|-------------|----------|
| Sem atraso | Hoje | 0 | Sem acréscimos |
| 1 dia de atraso | Ontem | 1 | Multa: R$ 2,00, Juros: R$ 0,00 |
| 10 dias de atraso | 10 dias atrás | 10 | Multa: R$ 2,00, Juros: R$ 0,67 |
| 30 dias de atraso | 30 dias atrás | 30 | Multa: R$ 2,00, Juros: R$ 2,00 |

---

## FAQ

### Como alterar a taxa de multa/juros?

Acesse **Painel Admin → Configurações** e altere:
- `lateFeePercentage` (padrão: 2%)
- `interestRatePerMonth` (padrão: 2%)

### Os juros são cumulativos ou simples?

**Juros compostos.** A taxa é aplicada diariamente sobre o valor original, acumulando ao longo dos dias.

### Quando a multa é aplicada?

A multa é aplicada **uma única vez** no primeiro dia de atraso.

### E os juros?

Os juros começam a ser aplicados após `daysToStartInterest` dias (padrão: 1 dia) e aumentam diariamente.

### O que acontece se o aluno pagar com atraso?

O valor total (original + multa + juros) é considerado para o pagamento. Após pagar, o status muda para "paid" e os acréscimos param de aumentar.

### Como desativar juros/multas?

Defina nas configurações:
```
lateFeePercentage: 0
interestRatePerMonth: 0
```

### Posso perdoar juros de um pagamento específico?

Sim! Use o campo `interestForgiven`:

```typescript
await db.updatePayment(paymentId, gymId, {
  interestForgiven: true,
  lateFeeInCents: 0,
  interestInCents: 0,
  totalAmountInCents: payment.originalAmountInCents
});
```

### O cálculo em tempo real afeta performance?

Não. O cálculo é leve (matemática simples) e feito apenas para pagamentos pendentes do aluno autenticado. Para otimizar ainda mais, o cron job atualiza os valores no banco diariamente.

---

## Logs e Monitoramento

### Ver logs do Cron Job

```bash
# Logs aparecem no console do servidor
[Late Fees] Starting calculation for all overdue payments...
[Late Fees] Found 5 overdue payment(s)
[Late Fees] Payment 123: Original R$ 100.00, Late Fee R$ 2.00, Interest R$ 0.67, Total R$ 102.67 (10 days overdue)
[Late Fees] Completed: 5 processed, 5 updated, 0 errors
```

### Verificar Última Execução

```sql
SELECT
  id,
  amountInCents / 100 as valor,
  lastCalculatedAt,
  TIMESTAMPDIFF(HOUR, lastCalculatedAt, NOW()) as horas_desde_calculo
FROM payments
WHERE status = 'pending'
ORDER BY lastCalculatedAt DESC;
```

---

## Data de Implementação

**19/01/2026** - Sistema completo implementado e testado

---

## Suporte

Em caso de dúvidas ou problemas, verifique:
1. Logs do servidor
2. Configurações no banco de dados (tabela `gym_settings`)
3. Se a migration foi executada corretamente
4. Se o cron job está rodando (ver logs de startup)
