# Módulo de Vendas de Produtos - Sistema Academia

**Status:** 📋 Planejamento / Futura Implementação
**Data:** 17/01/2026
**Versão:** 1.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Análise do Mercado](#análise-do-mercado)
3. [Análise do Sistema Atual](#análise-do-sistema-atual)
4. [Funcionalidades do Módulo](#funcionalidades-do-módulo)
5. [Arquitetura e Database](#arquitetura-e-database)
6. [Implementação Backend](#implementação-backend)
7. [Implementação Frontend](#implementação-frontend)
8. [Sistema de Crediário](#sistema-de-crediário)
9. [Controle de Estoque](#controle-de-estoque)
10. [Integração com App do Aluno](#integração-com-app-do-aluno)
11. [Roadmap de Implementação](#roadmap-de-implementação)
12. [Estimativas e Custos](#estimativas-e-custos)

---

## 🎯 Visão Geral

### Objetivo

Implementar um **módulo completo de vendas de produtos** no sistema de academia, permitindo:

- 🛍️ **Venda de produtos** no balcão (suplementos, roupas, acessórios)
- 📦 **Controle de estoque** integrado
- 💳 **Múltiplas formas de pagamento** (PIX, dinheiro, cartão, fiado)
- 📊 **Sistema de crediário** (fiado com parcelas)
- 📱 **Loja virtual** para alunos no app
- 💰 **Gestão financeira** integrada ao sistema existente

### Benefícios

**Para a Academia:**
- ✅ Aumentar receita (venda de produtos)
- ✅ Fidelizar alunos (conveniência)
- ✅ Controle total de estoque
- ✅ Gestão integrada (não precisa sistema separado)
- ✅ Relatórios consolidados (mensalidades + vendas)

**Para o Aluno:**
- ✅ Comprar produtos sem sair da academia
- ✅ Parcelar ou comprar fiado
- ✅ Ver histórico no app
- ✅ Receber recomendações personalizadas

---

## 📊 Análise do Mercado

### Pesquisa de Sistemas PDV para Academias

#### 1. Nextar (Nex)
**Funcionalidades principais:**
- PDV completo com código de barras
- Controle de estoque em tempo real
- Categorização de produtos (tipo, marca, fornecedor)
- Relatórios de vendas e lucratividade
- Gestão de fornecedores integrada

**Preço:** R$ 79-159/mês

#### 2. Alfa Networks
**Funcionalidades principais:**
- Tela de vendas com seleção de cliente
- Estoque online em tempo real
- Transferência entre filiais
- Integração com NFC-e
- Gestão de lotes e validade

**Preço:** R$ 120-250/mês

#### 3. QuantoSobra
**Funcionalidades principais:**
- Programa específico para loja fitness
- Controle de estoque automático
- Limite de crédito por cliente
- Alertas de limite excedido
- Fluxo de caixa integrado

**Preço:** R$ 89-199/mês

#### 4. Sistema Pacto (Academia)
**Funcionalidades principais:**
- Pagamentos recorrentes automáticos
- Conciliação de cartão gratuita
- Controle de recebíveis
- Programação de débito em conta

**Preço:** R$ 150-350/mês

### Funcionalidades Comuns (Best Practices)

| Funcionalidade | Adoção | Importância |
|----------------|--------|-------------|
| Controle de estoque mínimo | 100% | ⭐⭐⭐⭐⭐ |
| Múltiplas formas de pagamento | 100% | ⭐⭐⭐⭐⭐ |
| Venda parcelada/crediário | 85% | ⭐⭐⭐⭐ |
| Código de barras/SKU | 90% | ⭐⭐⭐⭐ |
| Categorização de produtos | 95% | ⭐⭐⭐⭐ |
| Relatório de vendas | 100% | ⭐⭐⭐⭐⭐ |
| Controle de fornecedores | 75% | ⭐⭐⭐ |
| NFC-e/Cupom fiscal | 70% | ⭐⭐⭐ |
| Alertas de estoque baixo | 80% | ⭐⭐⭐⭐ |
| Integração com app cliente | 40% | ⭐⭐⭐⭐⭐ |

### Sistema de Crediário (Fiado)

**Características principais encontradas:**

1. **Limite de Crédito por Cliente**
   - Sistema define limite máximo
   - Alerta quando próximo do limite
   - Bloqueio automático ao exceder

2. **Parcelamento Flexível**
   - Entrada + parcelas
   - Parcelamento sem entrada
   - Juros configuráveis
   - Multa por atraso

3. **Cobrança Automática**
   - SMS/WhatsApp de vencimento
   - Cobrança automática via PIX
   - Débito em conta programado

4. **Gestão de Inadimplência**
   - Dashboard de devedores
   - Bloqueio de novos créditos
   - Histórico de pagamentos

---

## 🔍 Análise do Sistema Atual

### Stack Tecnológico

**Frontend:**
- React 18.3 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Wouter (roteamento)
- tRPC + React Query
- Vite

**Backend:**
- Node.js + Express 4
- tRPC 11 (type-safe API)
- Drizzle ORM
- MySQL 8/TiDB

### Database Schema Existente

**Tabelas Relevantes:**

```typescript
// EXISTENTES - Podem ser reutilizadas

students {
  id, gymId, userId, cpf, phone, address
  membershipStatus: 'active' | 'inactive' | 'blocked'
  creditLimit?: number // ADICIONAR para crediário
}

payments {
  id, gymId, subscriptionId, studentId
  amountInCents, status, dueDate, paidAt
  paymentMethod: 'pix' | 'cash' | 'card' | 'transfer'
  // Já suporta parcelamento!
  isInstallment, installmentPlanId
  installmentNumber, totalInstallments
}

suppliers {
  id, gymId, name, cnpj, phone
  bankName, bankAgency, bankAccount
  // Já existe para despesas, reutilizar!
}

paymentMethods {
  id, gymId, name, type, active
  // Já existe, pode adicionar novos métodos
}
```

### Sistema de Pagamentos Atual

**Métodos Implementados:**
- ✅ PIX (Efí Pay) - QR Code imediato + webhook
- ✅ PIX (Sicoob) - Para gyms com certificado
- ✅ Dinheiro - Marcação manual
- ⚠️ Cartão - Schema pronto, não integrado
- ✅ Transferência - Manual

**Infraestrutura Pronta:**
```typescript
// Pode ser reutilizada 100%
class PixService {
  createImmediateCharge()
  checkPaymentStatus()
  getAccessToken()
}

// Webhook já configurado
pixWebhook.post('/pix/webhook', handlePixWebhook)
```

### Páginas Admin Existentes

**24 páginas admin prontas:**
- AdminPayments - Histórico de pagamentos
- AdminFinancialDashboard - Gráficos e métricas
- AdminDefaulters - Inadimplentes
- AdminSuppliers - Fornecedores
- AdminCategories - Categorias financeiras
- AdminPaymentMethods - Métodos de pagamento
- AdminCashFlow - Fluxo de caixa
- AdminReports - Relatórios PDF/Excel

**Componentes UI Prontos:**
- Tabelas com filtros/paginação
- Modais de CRUD
- Gráficos (Recharts)
- Formulários validados (Zod)
- Toast notifications

### Rotas Student Existentes

```
/student/dashboard     - Dashboard com cards
/student/payments      - Ver e pagar mensalidades
/student/profile       - Editar perfil
/student/workout/:id   - Treino do dia
```

### O que NÃO existe

❌ **Módulo de Vendas:**
- Sem tabela `products`
- Sem tabela `sales_orders`
- Sem controle de estoque
- Sem página de vendas
- Sem loja para aluno
- Sem carrinho de compras
- Sem sistema de crediário

---

## ✨ Funcionalidades do Módulo

### Fase 1 - MVP (Essencial)

#### 1.1 Cadastro de Produtos

**Campos:**
- Nome do produto
- Descrição
- Categoria (Suplemento, Roupa, Acessório, Bebida, Outro)
- Preço de custo
- Preço de venda
- SKU / Código de barras
- Estoque atual
- Estoque mínimo (alerta)
- Foto do produto
- Fornecedor vinculado
- Status (ativo/inativo)

**Funcionalidades:**
- CRUD completo via admin
- Upload de foto (S3)
- Busca por nome/SKU
- Filtro por categoria
- Importação via CSV
- Código de barras (geração automática)

#### 1.2 Controle de Estoque

**Movimentações:**
- Entrada de produtos (compra)
- Saída por venda (automática)
- Ajuste manual (inventário)
- Devolução (estorno)
- Transferência entre filiais (futura)

**Relatórios:**
- Estoque atual por produto
- Histórico de movimentações
- Produtos com estoque baixo
- Valor total em estoque
- Produtos mais vendidos
- Produtos parados (sem giro)

#### 1.3 Ponto de Venda (PDV)

**Fluxo de Venda:**
1. Selecionar cliente (ou balcão)
2. Adicionar produtos ao carrinho
3. Escolher forma de pagamento
4. Confirmar venda
5. Gerar comprovante/cupom

**Formas de Pagamento:**
- PIX (QR Code imediato)
- Dinheiro
- Cartão (débito/crédito)
- Fiado/Crediário (com limite)
- Misto (combinar métodos)

**Recursos:**
- Busca rápida por SKU/código de barras
- Desconto por item ou total
- Troco automático
- Cancelamento de venda
- Impressão de cupom (opcional)

#### 1.4 Gestão de Vendas

**Dashboard:**
- Total de vendas do dia/mês
- Ticket médio
- Produtos mais vendidos
- Forma de pagamento preferida
- Gráfico de evolução

**Relatórios:**
- Vendas por período
- Vendas por categoria
- Vendas por vendedor
- Margem de lucro
- Exportar Excel/PDF

### Fase 2 - Crediário (Fiado)

#### 2.1 Limite de Crédito

**Configuração:**
- Limite global padrão (ex: R$ 500)
- Limite individual por aluno
- Liberação automática (após X pagamentos em dia)
- Bloqueio automático (inadimplente)

**Validações:**
- Verificar limite antes de vender
- Alertar quando próximo ao limite
- Bloquear se exceder
- Histórico de alterações

#### 2.2 Parcelamento

**Opções:**
- Sem entrada (todo parcelado)
- Com entrada + parcelas
- Número de parcelas configurável (2x, 3x, 4x...)
- Juros configurável por academia
- Vencimento: semanal, quinzenal, mensal

**Exemplo:**
```
Venda: R$ 150,00
Entrada: R$ 50,00
Saldo: R$ 100,00
Parcelas: 4x de R$ 25,00
Vencimentos: 07/02, 07/03, 07/04, 07/05
```

#### 2.3 Cobrança

**Automação:**
- Gerar parcelas automaticamente
- Enviar lembrete (WhatsApp/Email)
- PIX recorrente (QR Code)
- Marcar como pago via webhook

**Manual:**
- Marcar parcela como paga
- Perdoar juros/multa
- Renegociar dívida
- Cancelar parcela

#### 2.4 Controle de Inadimplência

**Dashboard:**
- Total de crédito em aberto
- Parcelas vencidas
- Alunos devedores
- Taxa de inadimplência

**Ações:**
- Bloquear novos créditos
- Notificação automática
- Relatório de cobrança
- Histórico de tentativas

### Fase 3 - Loja Virtual (App do Aluno)

#### 3.1 Catálogo de Produtos

**Funcionalidades:**
- Listar produtos disponíveis
- Filtrar por categoria
- Buscar por nome
- Ver detalhes (foto, descrição, preço)
- Verificar estoque

**UI/UX:**
- Cards com foto e preço
- Badge "Esgotado" se sem estoque
- Badge "Novidade" para produtos novos
- Ordenar por: preço, nome, mais vendidos

#### 3.2 Carrinho de Compras

**Funcionalidades:**
- Adicionar/remover produtos
- Alterar quantidade
- Ver total
- Aplicar cupom de desconto
- Salvar para depois

**Validações:**
- Verificar estoque ao adicionar
- Alertar se estoque insuficiente
- Calcular frete (se delivery futuro)

#### 3.3 Checkout

**Fluxo:**
1. Revisar carrinho
2. Escolher forma de pagamento
3. Confirmar pedido
4. Ver status

**Opções de Pagamento:**
- PIX (QR Code)
- Crediário (se tem limite)
- Pagar na academia (reserva)

**Entrega:**
- Retirar na academia (padrão)
- Entrega futura (delivery)

#### 3.4 Meus Pedidos

**Funcionalidades:**
- Histórico de compras
- Status do pedido (pendente, pago, entregue)
- Detalhes da compra
- Comprovante (PDF)
- Recomprar (mesmo pedido)

### Fase 4 - Funcionalidades Avançadas

#### 4.1 Promoções e Descontos

- Desconto percentual/fixo
- Cupom de desconto
- Compre X leve Y
- Desconto por categoria
- Desconto para alunos ativos
- Validade da promoção

#### 4.2 Kits e Combos

- Agrupar produtos (combo)
- Preço promocional do combo
- Sugestões de compra
- "Quem comprou X também comprou Y"

#### 4.3 Integração com Treino

- Suplementos recomendados por treino
- "Complete seu treino com..."
- Histórico de suplementação
- Metas nutricionais

#### 4.4 Programa de Fidelidade

- Pontos por compra
- Trocar pontos por desconto
- Cashback em crédito
- Níveis de fidelidade

#### 4.5 NFC-e / Cupom Fiscal

- Emissão de nota fiscal
- Integração com Sefaz
- Envio por email
- Armazenamento XML

---

## 🗄️ Arquitetura e Database

### Novas Tabelas (Schema)

#### 1. products

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gym_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('supplement', 'clothing', 'accessories', 'beverage', 'other') NOT NULL,

  -- Preços em centavos
  cost_price_cents INT NOT NULL DEFAULT 0,
  selling_price_cents INT NOT NULL,

  -- Identificação
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),

  -- Estoque
  stock_quantity INT NOT NULL DEFAULT 0,
  min_stock_quantity INT DEFAULT 0,

  -- Mídia
  image_url TEXT,

  -- Relacionamentos
  supplier_id INT,

  -- Status
  active BOOLEAN DEFAULT TRUE,

  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (gym_id) REFERENCES gyms(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  INDEX idx_gym_id (gym_id),
  INDEX idx_category (category),
  INDEX idx_sku (sku),
  INDEX idx_barcode (barcode)
);
```

#### 2. product_inventory_transactions

```sql
CREATE TABLE product_inventory_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,

  -- Movimentação
  transaction_type ENUM('purchase', 'sale', 'adjustment', 'return', 'transfer') NOT NULL,
  quantity_change INT NOT NULL, -- Positivo = entrada, Negativo = saída

  -- Custo (para calcular valor em estoque)
  unit_cost_cents INT,
  total_cost_cents INT,

  -- Referência
  reference_type VARCHAR(50), -- 'sales_order', 'purchase_order', 'manual'
  reference_id INT,

  -- Observações
  notes TEXT,

  -- Responsável
  user_id INT,

  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_product_id (product_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
);
```

#### 3. sales_orders

```sql
CREATE TABLE sales_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gym_id INT NOT NULL,

  -- Cliente
  student_id INT, -- NULL = venda balcão
  customer_name VARCHAR(255), -- Se venda balcão
  customer_phone VARCHAR(20),

  -- Data
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Valores em centavos
  subtotal_cents INT NOT NULL,
  discount_cents INT DEFAULT 0,
  total_cents INT NOT NULL,

  -- Pagamento
  payment_method ENUM('pix', 'cash', 'card_debit', 'card_credit', 'credit', 'mixed') NOT NULL,
  payment_status ENUM('pending', 'paid', 'partial', 'cancelled') DEFAULT 'pending',
  paid_at TIMESTAMP,

  -- Crediário
  is_credit BOOLEAN DEFAULT FALSE,
  credit_down_payment_cents INT DEFAULT 0,
  credit_installments INT DEFAULT 1,

  -- Entrega
  delivery_status ENUM('pending', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
  delivered_at TIMESTAMP,

  -- Observações
  notes TEXT,

  -- Responsável pela venda
  seller_id INT, -- User (staff/admin)

  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (gym_id) REFERENCES gyms(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  INDEX idx_gym_id (gym_id),
  INDEX idx_student_id (student_id),
  INDEX idx_order_date (order_date),
  INDEX idx_payment_status (payment_status)
);
```

#### 4. sales_order_items

```sql
CREATE TABLE sales_order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sales_order_id INT NOT NULL,
  product_id INT NOT NULL,

  -- Quantidade
  quantity INT NOT NULL,

  -- Preços em centavos (snapshot no momento da venda)
  unit_price_cents INT NOT NULL,
  discount_cents INT DEFAULT 0,
  total_price_cents INT NOT NULL,

  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_sales_order_id (sales_order_id),
  INDEX idx_product_id (product_id)
);
```

#### 5. credit_installments

```sql
CREATE TABLE credit_installments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sales_order_id INT NOT NULL,
  student_id INT NOT NULL,

  -- Parcela
  installment_number INT NOT NULL,
  total_installments INT NOT NULL,

  -- Valor em centavos
  amount_cents INT NOT NULL,

  -- Datas
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,

  -- Status
  status ENUM('pending', 'paid', 'overdue', 'forgiven', 'cancelled') DEFAULT 'pending',

  -- Pagamento
  payment_method VARCHAR(50),
  pix_tx_id VARCHAR(255),

  -- Juros/Multa
  interest_cents INT DEFAULT 0,
  fine_cents INT DEFAULT 0,

  -- Observações
  notes TEXT,

  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  INDEX idx_sales_order_id (sales_order_id),
  INDEX idx_student_id (student_id),
  INDEX idx_due_date (due_date),
  INDEX idx_status (status)
);
```

#### 6. student_credit_limits

```sql
CREATE TABLE student_credit_limits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gym_id INT NOT NULL,
  student_id INT NOT NULL UNIQUE,

  -- Limite em centavos
  credit_limit_cents INT NOT NULL DEFAULT 0,

  -- Usado
  used_credit_cents INT NOT NULL DEFAULT 0,

  -- Status
  blocked BOOLEAN DEFAULT FALSE,
  blocked_reason TEXT,

  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (gym_id) REFERENCES gyms(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  INDEX idx_gym_id (gym_id),
  INDEX idx_student_id (student_id)
);
```

#### 7. cart_items (Carrinho temporário)

```sql
CREATE TABLE cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,

  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_product (student_id, product_id),
  INDEX idx_student_id (student_id)
);
```

### Diagrama de Relacionamentos

```
┌─────────────┐
│    gyms     │
└──────┬──────┘
       │
       ├─────────┐
       │         │
┌──────▼──────┐  │
│  students   │  │
└──────┬──────┘  │
       │         │
┌──────▼─────────▼───────┐
│ student_credit_limits  │
└────────────────────────┘

       │
┌──────▼──────────┐       ┌──────────────┐
│  sales_orders   │◄──────┤  suppliers   │
└──────┬──────────┘       └──────┬───────┘
       │                         │
       │                  ┌──────▼──────┐
       │                  │  products   │
       │                  └──────┬──────┘
       │                         │
┌──────▼─────────────┐    ┌─────▼──────────────────────┐
│ sales_order_items  │────┤                            │
└────────────────────┘    │ product_inventory_trans... │
                          └────────────────────────────┘
       │
┌──────▼────────────────┐
│ credit_installments   │
└───────────────────────┘

┌─────────────┐
│ cart_items  │ (temporário)
└─────────────┘
```

---

## 💻 Implementação Backend

### Router: Products

**Arquivo:** `server/routers/products.ts`

```typescript
import { router, publicProcedure, gymAdminProcedure, studentProcedure } from '../trpc';
import { z } from 'zod';
import * as db from '../db';

export const productsRouter = router({
  /**
   * Listar produtos (público para alunos verem loja)
   */
  list: publicProcedure
    .input(z.object({
      gymId: z.number(),
      category: z.enum(['supplement', 'clothing', 'accessories', 'beverage', 'other']).optional(),
      searchTerm: z.string().optional(),
      activeOnly: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      return db.listProducts(input);
    }),

  /**
   * Detalhes de um produto
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getProductById(input.id);
    }),

  /**
   * Criar produto (apenas admin)
   */
  create: gymAdminProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      category: z.enum(['supplement', 'clothing', 'accessories', 'beverage', 'other']),
      costPriceCents: z.number().int().min(0),
      sellingPriceCents: z.number().int().min(1),
      sku: z.string().optional(),
      barcode: z.string().optional(),
      stockQuantity: z.number().int().min(0).default(0),
      minStockQuantity: z.number().int().min(0).default(0),
      imageUrl: z.string().url().optional(),
      supplierId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createProduct({
        ...input,
        gymId: ctx.user.gymId!,
      });
    }),

  /**
   * Atualizar produto
   */
  update: gymAdminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      category: z.enum(['supplement', 'clothing', 'accessories', 'beverage', 'other']).optional(),
      costPriceCents: z.number().int().min(0).optional(),
      sellingPriceCents: z.number().int().min(1).optional(),
      sku: z.string().optional(),
      barcode: z.string().optional(),
      stockQuantity: z.number().int().min(0).optional(),
      minStockQuantity: z.number().int().min(0).optional(),
      imageUrl: z.string().url().optional(),
      supplierId: z.number().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateProduct(id, ctx.user.gymId!, data);
    }),

  /**
   * Deletar produto (soft delete)
   */
  delete: gymAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.deleteProduct(input.id, ctx.user.gymId!);
    }),

  /**
   * Ajustar estoque manualmente
   */
  adjustStock: gymAdminProcedure
    .input(z.object({
      productId: z.number(),
      quantityChange: z.number().int(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.adjustProductStock({
        ...input,
        userId: ctx.user.id,
        transactionType: 'adjustment',
      });
    }),

  /**
   * Produtos com estoque baixo (alerta)
   */
  lowStock: gymAdminProcedure
    .query(async ({ ctx }) => {
      return db.getProductsWithLowStock(ctx.user.gymId!);
    }),

  /**
   * Histórico de movimentações de estoque
   */
  inventoryHistory: gymAdminProcedure
    .input(z.object({
      productId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getInventoryHistory({
        ...input,
        gymId: ctx.user.gymId!,
      });
    }),
});
```

### Router: Sales

**Arquivo:** `server/routers/sales.ts`

```typescript
import { router, gymAdminProcedure, studentProcedure } from '../trpc';
import { z } from 'zod';
import * as db from '../db';
import { pixService } from '../pix';

export const salesRouter = router({
  /**
   * Criar pedido (PDV - admin/staff)
   */
  create: gymAdminProcedure
    .input(z.object({
      studentId: z.number().optional(),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().int().min(1),
        unitPriceCents: z.number().int().min(0),
        discountCents: z.number().int().min(0).default(0),
      })),
      discountCents: z.number().int().min(0).default(0),
      paymentMethod: z.enum(['pix', 'cash', 'card_debit', 'card_credit', 'credit', 'mixed']),
      isCredit: z.boolean().default(false),
      creditDownPaymentCents: z.number().int().min(0).default(0),
      creditInstallments: z.number().int().min(1).max(12).default(1),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validar estoque
      for (const item of input.items) {
        const product = await db.getProductById(item.productId);
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Estoque insuficiente para ${product.name}`);
        }
      }

      // Se crediário, validar limite
      if (input.isCredit && input.studentId) {
        const limit = await db.getStudentCreditLimit(input.studentId);
        const total = input.items.reduce((sum, item) =>
          sum + (item.unitPriceCents * item.quantity - item.discountCents), 0
        ) - input.discountCents;

        const financed = total - input.creditDownPaymentCents;

        if (limit.usedCreditCents + financed > limit.creditLimitCents) {
          throw new Error('Limite de crédito excedido');
        }
      }

      // Criar pedido
      const order = await db.createSalesOrder({
        ...input,
        gymId: ctx.user.gymId!,
        sellerId: ctx.user.id,
      });

      // Baixar estoque
      for (const item of input.items) {
        await db.adjustProductStock({
          productId: item.productId,
          quantityChange: -item.quantity,
          userId: ctx.user.id,
          transactionType: 'sale',
          referenceType: 'sales_order',
          referenceId: order.id,
        });
      }

      // Se crediário, criar parcelas
      if (input.isCredit && input.studentId) {
        await db.createCreditInstallments({
          salesOrderId: order.id,
          studentId: input.studentId,
          totalInstallments: input.creditInstallments,
          totalCents: input.items.reduce((sum, item) =>
            sum + (item.unitPriceCents * item.quantity - item.discountCents), 0
          ) - input.discountCents - input.creditDownPaymentCents,
        });
      }

      return order;
    }),

  /**
   * Listar pedidos (admin)
   */
  list: gymAdminProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      paymentStatus: z.enum(['pending', 'paid', 'partial', 'cancelled']).optional(),
      studentId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return db.listSalesOrders({
        ...input,
        gymId: ctx.user.gymId!,
      });
    }),

  /**
   * Meus pedidos (aluno)
   */
  myOrders: studentProcedure
    .query(async ({ ctx }) => {
      return db.listSalesOrders({
        studentId: ctx.student!.id,
      });
    }),

  /**
   * Detalhes do pedido
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getSalesOrderById(input.id);
    }),

  /**
   * Marcar como entregue
   */
  markAsDelivered: gymAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.updateSalesOrder(input.id, ctx.user.gymId!, {
        deliveryStatus: 'delivered',
        deliveredAt: new Date(),
      });
    }),

  /**
   * Cancelar pedido
   */
  cancel: gymAdminProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Estornar estoque
      const order = await db.getSalesOrderById(input.id);

      for (const item of order.items) {
        await db.adjustProductStock({
          productId: item.productId,
          quantityChange: item.quantity,
          userId: ctx.user.id,
          transactionType: 'return',
          referenceType: 'sales_order',
          referenceId: order.id,
          notes: `Cancelamento: ${input.reason || 'Sem motivo'}`,
        });
      }

      return db.updateSalesOrder(input.id, ctx.user.gymId!, {
        paymentStatus: 'cancelled',
        deliveryStatus: 'cancelled',
      });
    }),

  /**
   * Dashboard de vendas
   */
  dashboard: gymAdminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getSalesDashboard({
        ...input,
        gymId: ctx.user.gymId!,
      });
    }),
});
```

### Router: Cart (Carrinho)

**Arquivo:** `server/routers/cart.ts`

```typescript
import { router, studentProcedure } from '../trpc';
import { z } from 'zod';
import * as db from '../db';

export const cartRouter = router({
  /**
   * Obter carrinho do aluno
   */
  get: studentProcedure
    .query(async ({ ctx }) => {
      return db.getCart(ctx.student!.id);
    }),

  /**
   * Adicionar item ao carrinho
   */
  addItem: studentProcedure
    .input(z.object({
      productId: z.number(),
      quantity: z.number().int().min(1).default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validar estoque
      const product = await db.getProductById(input.productId);
      if (product.stockQuantity < input.quantity) {
        throw new Error('Estoque insuficiente');
      }

      return db.addToCart({
        studentId: ctx.student!.id,
        productId: input.productId,
        quantity: input.quantity,
      });
    }),

  /**
   * Atualizar quantidade
   */
  updateQuantity: studentProcedure
    .input(z.object({
      productId: z.number(),
      quantity: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.quantity === 0) {
        return db.removeFromCart(ctx.student!.id, input.productId);
      }

      return db.updateCartQuantity({
        studentId: ctx.student!.id,
        productId: input.productId,
        quantity: input.quantity,
      });
    }),

  /**
   * Remover item
   */
  removeItem: studentProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.removeFromCart(ctx.student!.id, input.productId);
    }),

  /**
   * Limpar carrinho
   */
  clear: studentProcedure
    .mutation(async ({ ctx }) => {
      return db.clearCart(ctx.student!.id);
    }),

  /**
   * Fazer checkout (criar pedido)
   */
  checkout: studentProcedure
    .input(z.object({
      paymentMethod: z.enum(['pix', 'credit']),
      useCredit: z.boolean().default(false),
      creditDownPaymentCents: z.number().int().min(0).default(0),
      creditInstallments: z.number().int().min(1).max(12).default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const cart = await db.getCart(ctx.student!.id);

      if (cart.items.length === 0) {
        throw new Error('Carrinho vazio');
      }

      // Criar pedido
      const order = await db.createSalesOrderFromCart({
        studentId: ctx.student!.id,
        gymId: ctx.user.gymId!,
        cart,
        paymentMethod: input.paymentMethod,
        isCredit: input.useCredit,
        creditDownPaymentCents: input.creditDownPaymentCents,
        creditInstallments: input.creditInstallments,
      });

      // Limpar carrinho
      await db.clearCart(ctx.student!.id);

      return order;
    }),
});
```

### Router: Credit (Crediário)

**Arquivo:** `server/routers/credit.ts`

```typescript
import { router, gymAdminProcedure, studentProcedure } from '../trpc';
import { z } from 'zod';
import * as db from '../db';

export const creditRouter = router({
  /**
   * Obter limite de crédito do aluno
   */
  getLimit: studentProcedure
    .query(async ({ ctx }) => {
      return db.getStudentCreditLimit(ctx.student!.id);
    }),

  /**
   * Definir/atualizar limite (admin)
   */
  setLimit: gymAdminProcedure
    .input(z.object({
      studentId: z.number(),
      creditLimitCents: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.setStudentCreditLimit({
        ...input,
        gymId: ctx.user.gymId!,
      });
    }),

  /**
   * Bloquear/desbloquear crédito
   */
  block: gymAdminProcedure
    .input(z.object({
      studentId: z.number(),
      blocked: z.boolean(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.blockStudentCredit(input);
    }),

  /**
   * Listar parcelas do aluno
   */
  myInstallments: studentProcedure
    .input(z.object({
      status: z.enum(['pending', 'paid', 'overdue', 'forgiven', 'cancelled']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return db.listCreditInstallments({
        studentId: ctx.student!.id,
        status: input.status,
      });
    }),

  /**
   * Pagar parcela
   */
  payInstallment: studentProcedure
    .input(z.object({
      installmentId: z.number(),
      paymentMethod: z.enum(['pix', 'cash', 'card']),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.payCreditInstallment({
        ...input,
        studentId: ctx.student!.id,
      });
    }),

  /**
   * Listar todas as parcelas (admin)
   */
  listAll: gymAdminProcedure
    .input(z.object({
      studentId: z.number().optional(),
      status: z.enum(['pending', 'paid', 'overdue', 'forgiven', 'cancelled']).optional(),
      overdue: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return db.listCreditInstallments({
        ...input,
        gymId: ctx.user.gymId!,
      });
    }),

  /**
   * Perdoar juros/multa
   */
  forgiveInterest: gymAdminProcedure
    .input(z.object({ installmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.forgiveCreditInterest(input.installmentId);
    }),

  /**
   * Renegociar dívida
   */
  renegotiate: gymAdminProcedure
    .input(z.object({
      studentId: z.number(),
      installmentIds: z.array(z.number()),
      newInstallments: z.number().int().min(1).max(24),
      newInterestRate: z.number().min(0).max(10).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.renegotiateCreditDebt({
        ...input,
        gymId: ctx.user.gymId!,
      });
    }),

  /**
   * Dashboard de crediário
   */
  dashboard: gymAdminProcedure
    .query(async ({ ctx }) => {
      return db.getCreditDashboard(ctx.user.gymId!);
    }),
});
```

---

## 🎨 Implementação Frontend

### Página: AdminProducts

**Arquivo:** `client/src/pages/admin/AdminProducts.tsx`

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
import ProductForm from '@/components/products/ProductForm';

export default function AdminProducts() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: products, isLoading } = apiClient.products.list.useQuery({
    gymId: Number(localStorage.getItem('gymId')),
    searchTerm: searchTerm || undefined,
    category: selectedCategory as any,
  });

  const deleteMutation = apiClient.products.delete.useMutation({
    onSuccess: () => {
      toast({ title: 'Produto excluído com sucesso' });
    },
  });

  const categories = [
    { value: 'supplement', label: 'Suplementos' },
    { value: 'clothing', label: 'Roupas' },
    { value: 'accessories', label: 'Acessórios' },
    { value: 'beverage', label: 'Bebidas' },
    { value: 'other', label: 'Outros' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o catálogo de produtos</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Produto</DialogTitle>
            </DialogHeader>
            <ProductForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products?.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            {product.imageUrl && (
              <div className="aspect-square bg-muted">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                {!product.active && (
                  <Badge variant="destructive">Inativo</Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Preço</span>
                <span className="font-semibold">
                  R$ {(product.sellingPriceCents / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estoque</span>
                <div className="flex items-center gap-2">
                  {product.stockQuantity <= product.minStockQuantity && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className={product.stockQuantity <= product.minStockQuantity ? 'text-yellow-500 font-semibold' : ''}>
                    {product.stockQuantity} un
                  </span>
                </div>
              </div>

              {product.sku && (
                <div className="text-xs text-muted-foreground">
                  SKU: {product.sku}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate({ id: product.id })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando seu primeiro produto
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Produto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Componente: ProductForm

**Arquivo:** `client/src/components/products/ProductForm.tsx`

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

const productSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  category: z.enum(['supplement', 'clothing', 'accessories', 'beverage', 'other']),
  costPriceCents: z.number().min(0),
  sellingPriceCents: z.number().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  minStockQuantity: z.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
  supplierId: z.number().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSuccess?: () => void;
  initialData?: Partial<ProductFormData>;
}

export default function ProductForm({ onSuccess, initialData }: ProductFormProps) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData,
  });

  const createMutation = apiClient.products.create.useMutation({
    onSuccess: () => {
      toast({ title: 'Produto cadastrado com sucesso' });
      onSuccess?.();
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Nome do Produto *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" {...register('description')} rows={3} />
        </div>

        <div>
          <Label htmlFor="category">Categoria *</Label>
          <Select onValueChange={(value) => setValue('category', value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supplement">Suplementos</SelectItem>
              <SelectItem value="clothing">Roupas</SelectItem>
              <SelectItem value="accessories">Acessórios</SelectItem>
              <SelectItem value="beverage">Bebidas</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && <span className="text-sm text-red-500">{errors.category.message}</span>}
        </div>

        <div>
          <Label htmlFor="sku">SKU / Código</Label>
          <Input id="sku" {...register('sku')} />
        </div>

        <div>
          <Label htmlFor="costPrice">Preço de Custo (R$) *</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            onChange={(e) => setValue('costPriceCents', Math.round(parseFloat(e.target.value) * 100))}
          />
        </div>

        <div>
          <Label htmlFor="sellingPrice">Preço de Venda (R$) *</Label>
          <Input
            id="sellingPrice"
            type="number"
            step="0.01"
            onChange={(e) => setValue('sellingPriceCents', Math.round(parseFloat(e.target.value) * 100))}
          />
          {errors.sellingPriceCents && <span className="text-sm text-red-500">{errors.sellingPriceCents.message}</span>}
        </div>

        <div>
          <Label htmlFor="stockQuantity">Quantidade em Estoque *</Label>
          <Input
            id="stockQuantity"
            type="number"
            {...register('stockQuantity', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Label htmlFor="minStockQuantity">Estoque Mínimo</Label>
          <Input
            id="minStockQuantity"
            type="number"
            {...register('minStockQuantity', { valueAsNumber: true })}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="imageUrl">URL da Imagem</Label>
          <Input id="imageUrl" {...register('imageUrl')} placeholder="https://..." />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Salvando...' : 'Salvar Produto'}
        </Button>
      </div>
    </form>
  );
}
```

### Página: StudentStore (Loja do Aluno)

**Arquivo:** `client/src/pages/StudentStore.tsx`

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import { ShoppingCart, Plus, Minus, Search } from 'lucide-react';
import { useLocation } from 'wouter';

export default function StudentStore() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: products } = apiClient.products.list.useQuery({
    gymId: Number(localStorage.getItem('gymId')),
    searchTerm: searchTerm || undefined,
    category: selectedCategory as any,
    activeOnly: true,
  });

  const { data: cart } = apiClient.cart.get.useQuery();

  const addToCartMutation = apiClient.cart.addItem.useMutation({
    onSuccess: () => {
      toast({ title: 'Produto adicionado ao carrinho' });
    },
  });

  const categories = [
    { value: 'supplement', label: 'Suplementos', icon: '💊' },
    { value: 'clothing', label: 'Roupas', icon: '👕' },
    { value: 'accessories', label: 'Acessórios', icon: '🎒' },
    { value: 'beverage', label: 'Bebidas', icon: '🥤' },
  ];

  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Loja</h1>
          <p className="text-muted-foreground">Compre produtos diretamente no app</p>
        </div>
        <Button onClick={() => setLocation('/student/cart')}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Carrinho
          {cartItemCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Busca e Categorias */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          onClick={() => setSelectedCategory(null)}
        >
          Todos
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(cat.value)}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.map((product) => (
          <Card key={product.id}>
            {product.imageUrl && (
              <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold">
                    R$ {(product.sellingPriceCents / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {product.stockQuantity > 0 ? (
                      `${product.stockQuantity} em estoque`
                    ) : (
                      <Badge variant="destructive">Esgotado</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={product.stockQuantity === 0 || addToCartMutation.isPending}
                onClick={() => addToCartMutation.mutate({ productId: product.id, quantity: 1 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar ao Carrinho
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 💳 Sistema de Crediário

### Conceito

**Crediário** (também chamado "fiado" ou "caderneta") é um sistema de **venda a prazo** onde o próprio estabelecimento financia a compra do cliente, sem intermediação bancária.

### Como Funciona

1. **Academia define limite de crédito** para cada aluno
2. **Aluno compra produto** e escolhe "pagar no crediário"
3. **Sistema divide** o valor em parcelas
4. **Aluno paga** as parcelas mensalmente
5. **Academia controla** inadimplência e bloqueia novos créditos se necessário

### Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    VENDA NO CREDIÁRIO                       │
└─────────────────────────────────────────────────────────────┘

1. VENDA
   ├─ Aluno compra R$ 150 em suplementos
   ├─ Escolhe "Crediário"
   ├─ Sistema verifica limite disponível
   └─ Confirma se tem limite

2. CONFIGURAÇÃO
   ├─ Entrada: R$ 50 (opcional)
   ├─ Saldo financiado: R$ 100
   ├─ Parcelas: 4x de R$ 25
   └─ Vencimento: dia 10 de cada mês

3. PARCELAS CRIADAS
   ├─ Parcela 1/4: R$ 25 - Venc: 10/02/2026
   ├─ Parcela 2/4: R$ 25 - Venc: 10/03/2026
   ├─ Parcela 3/4: R$ 25 - Venc: 10/04/2026
   └─ Parcela 4/4: R$ 25 - Venc: 10/05/2026

4. COBRANÇA AUTOMÁTICA
   ├─ WhatsApp/Email 3 dias antes
   ├─ PIX QR Code gerado
   └─ Webhook confirma pagamento

5. CONTROLE
   ├─ Limite reduzido em R$ 100
   ├─ Limite volta conforme paga
   └─ Se atrasar > 3 dias: bloqueia novos créditos
```

### Configuração do Sistema

**Configurações Globais (por academia):**

```typescript
interface CreditSettings {
  // Limite padrão
  defaultCreditLimitCents: number; // Ex: 50000 (R$ 500)

  // Parcelamento
  maxInstallments: number; // Ex: 12
  minInstallmentValueCents: number; // Ex: 2000 (R$ 20)

  // Juros
  monthlyInterestRate: number; // Ex: 0.02 (2%)
  lateFeePerDay: number; // Ex: 0.001 (0.1%)

  // Bloqueio
  daysUntilBlock: number; // Ex: 3 (bloqueia após 3 dias de atraso)
  autoUnblockOnPayment: boolean; // Desbloqueia automaticamente ao pagar

  // Cobrança
  sendReminderDaysBefore: number; // Ex: 3
  sendWhatsAppReminder: boolean;
  sendEmailReminder: boolean;
}
```

**Limite Individual do Aluno:**

```typescript
interface StudentCreditLimit {
  studentId: number;
  creditLimitCents: number; // Limite máximo
  usedCreditCents: number; // Quanto está usando
  availableCreditCents: number; // Disponível = limite - usado
  blocked: boolean;
  blockedReason: string | null;
}
```

### Cálculo de Parcelas

```typescript
function calculateInstallments(
  totalCents: number,
  downPaymentCents: number,
  installments: number,
  interestRate: number
): CreditInstallment[] {
  const financedAmount = totalCents - downPaymentCents;

  // Com juros simples
  const totalWithInterest = financedAmount * (1 + interestRate * installments);
  const installmentValue = Math.round(totalWithInterest / installments);

  const result: CreditInstallment[] = [];
  const today = new Date();

  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(today);
    dueDate.setMonth(today.getMonth() + i);
    dueDate.setDate(10); // Sempre dia 10

    result.push({
      installmentNumber: i,
      totalInstallments: installments,
      amountCents: installmentValue,
      dueDate,
      status: 'pending',
    });
  }

  return result;
}
```

### Cobrança Automática (CRON)

```typescript
// server/cron.ts

/**
 * Lembrete de parcelas - Diário às 9h
 */
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Enviando lembretes de parcelas...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3); // 3 dias antes

  const installments = await db.getInstallmentsDueOn(tomorrow);

  for (const inst of installments) {
    // Enviar WhatsApp
    await whatsappService.sendTemplate(
      inst.student.phone,
      'lembrete_parcela_credito',
      {
        nome: inst.student.name,
        parcela: `${inst.installmentNumber}/${inst.totalInstallments}`,
        valor: (inst.amountCents / 100).toFixed(2),
        vencimento: inst.dueDate.toLocaleDateString('pt-BR'),
        link_pagamento: `https://app.academia.com/credit/pay/${inst.id}`,
      }
    );

    await sleep(1000); // Rate limit
  }
});

/**
 * Verificar parcelas vencidas - Diário às 10h
 */
cron.schedule('0 10 * * *', async () => {
  console.log('[CRON] Verificando parcelas vencidas...');

  const overdueInstallments = await db.getOverdueInstallments();

  for (const inst of overdueInstallments) {
    const daysOverdue = Math.floor(
      (Date.now() - inst.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calcular multa e juros
    const lateFee = inst.amountCents * 0.02; // 2% multa
    const dailyInterest = inst.amountCents * 0.001 * daysOverdue; // 0.1% ao dia

    await db.updateInstallmentCharges(inst.id, {
      fineCents: Math.round(lateFee),
      interestCents: Math.round(dailyInterest),
      status: 'overdue',
    });

    // Bloquear crédito se >= 3 dias
    if (daysOverdue >= 3 && !inst.student.creditBlocked) {
      await db.blockStudentCredit({
        studentId: inst.studentId,
        blocked: true,
        reason: `Parcela ${inst.installmentNumber}/${inst.totalInstallments} vencida há ${daysOverdue} dias`,
      });

      // Notificar aluno
      await whatsappService.sendTemplate(
        inst.student.phone,
        'alerta_credito_bloqueado',
        {
          nome: inst.student.name,
          dias_atraso: daysOverdue.toString(),
        }
      );
    }
  }
});
```

### Dashboard de Crediário

**Métricas importantes:**

```typescript
interface CreditDashboard {
  // Totais
  totalCreditGrantedCents: number; // Total de limite concedido
  totalCreditUsedCents: number; // Total usado
  totalOutstandingCents: number; // Total em aberto

  // Parcelas
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  overdueInstallments: number;

  // Inadimplência
  defaultRate: number; // Taxa de inadimplência (%)
  avgDaysOverdue: number;
  studentsBlocked: number;

  // Financeiro
  expectedRevenueThisMonth: number; // Receita esperada
  receivedThisMonth: number; // Já recebido
  lateFeesCollected: number; // Multas/juros cobrados
}
```

---

## 📦 Controle de Estoque

### Movimentações de Estoque

**Tipos de transação:**

| Tipo | Descrição | Quantidade | Quando |
|------|-----------|------------|--------|
| **purchase** | Compra de fornecedor | + (positivo) | Entrada manual admin |
| **sale** | Venda para cliente | - (negativo) | Automático ao confirmar venda |
| **adjustment** | Ajuste manual | + ou - | Inventário, correção |
| **return** | Devolução de cliente | + (positivo) | Cancelamento de venda |
| **transfer** | Transferência entre filiais | + e - | Futura implementação |

### Fluxo de Entrada (Compra)

```typescript
// Admin compra 100 unidades de Whey Protein

await db.adjustProductStock({
  productId: 42,
  quantityChange: +100,
  transactionType: 'purchase',
  unitCostCents: 8000, // R$ 80 unitário
  totalCostCents: 800000, // R$ 8.000 total
  notes: 'Compra NF 12345 - Fornecedor XYZ',
  userId: adminId,
});

// Resultado:
// - product.stockQuantity: 50 → 150
// - product_inventory_transactions: novo registro
```

### Fluxo de Saída (Venda)

```typescript
// Cliente compra 2 unidades de Whey

// Automático ao criar sales_order
await db.createSalesOrder({
  items: [
    { productId: 42, quantity: 2, unitPriceCents: 12000 }
  ],
  ...
});

// Internamente:
for (const item of items) {
  await db.adjustProductStock({
    productId: item.productId,
    quantityChange: -item.quantity,
    transactionType: 'sale',
    referenceType: 'sales_order',
    referenceId: salesOrderId,
    userId: sellerId,
  });
}

// Resultado:
// - product.stockQuantity: 150 → 148
// - product_inventory_transactions: registro de saída
```

### Alertas de Estoque Baixo

**Configuração:**
- Cada produto tem `minStockQuantity`
- Sistema alerta quando `stockQuantity <= minStockQuantity`

**Implementação:**

```typescript
// CRON - Diário às 8h
cron.schedule('0 8 * * *', async () => {
  const lowStockProducts = await db.getProductsWithLowStock(gymId);

  if (lowStockProducts.length > 0) {
    // Enviar email para admin
    await sendEmail({
      to: gym.adminEmail,
      subject: `⚠️ Alerta: ${lowStockProducts.length} produtos com estoque baixo`,
      html: `
        <h2>Produtos com estoque baixo:</h2>
        <ul>
          ${lowStockProducts.map(p => `
            <li>
              <strong>${p.name}</strong>:
              ${p.stockQuantity} em estoque
              (mínimo: ${p.minStockQuantity})
            </li>
          `).join('')}
        </ul>
      `,
    });
  }
});
```

**Dashboard Admin:**

```tsx
// Componente visual
<Card>
  <CardHeader>
    <CardTitle>
      <AlertTriangle className="inline h-5 w-5 text-yellow-500 mr-2" />
      Estoque Baixo
    </CardTitle>
  </CardHeader>
  <CardContent>
    {lowStockProducts.map(product => (
      <div key={product.id} className="flex justify-between py-2 border-b">
        <span>{product.name}</span>
        <Badge variant="warning">
          {product.stockQuantity}/{product.minStockQuantity}
        </Badge>
      </div>
    ))}
  </CardContent>
</Card>
```

### Inventário (Contagem Física)

**Processo:**

1. Admin faz contagem física
2. Compara com sistema
3. Ajusta diferenças

```typescript
// Exemplo: Sistema mostra 45, contou 42 (faltam 3)
await db.adjustProductStock({
  productId: 42,
  quantityChange: -3,
  transactionType: 'adjustment',
  notes: 'Inventário 17/01/2026 - Perda/Furto',
  userId: adminId,
});
```

### Relatórios de Estoque

**1. Valor Total em Estoque:**

```sql
SELECT
  SUM(stock_quantity * cost_price_cents) / 100 AS total_value_brl
FROM products
WHERE gym_id = ? AND active = TRUE;
```

**2. Giro de Estoque (Produtos mais vendidos):**

```sql
SELECT
  p.name,
  p.category,
  SUM(soi.quantity) AS total_sold,
  p.stock_quantity AS current_stock
FROM products p
JOIN sales_order_items soi ON soi.product_id = p.id
JOIN sales_orders so ON so.id = soi.sales_order_id
WHERE so.gym_id = ?
  AND so.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.id
ORDER BY total_sold DESC
LIMIT 20;
```

**3. Produtos Parados (Sem venda há 60 dias):**

```sql
SELECT
  p.id,
  p.name,
  p.stock_quantity,
  p.cost_price_cents * p.stock_quantity / 100 AS capital_locked_brl,
  MAX(so.order_date) AS last_sale_date
FROM products p
LEFT JOIN sales_order_items soi ON soi.product_id = p.id
LEFT JOIN sales_orders so ON so.id = soi.sales_order_id
WHERE p.gym_id = ? AND p.active = TRUE
GROUP BY p.id
HAVING last_sale_date IS NULL
   OR last_sale_date < DATE_SUB(NOW(), INTERVAL 60 DAY)
ORDER BY capital_locked_brl DESC;
```

---

## 📱 Integração com App do Aluno

### Navegação

**Adicionar ao menu do app:**

```tsx
// client/src/App.tsx

// Rotas Student
<Route path="/student/store" component={StudentStore} />
<Route path="/student/cart" component={StudentCart} />
<Route path="/student/orders" component={StudentOrders} />
<Route path="/student/orders/:id" component={StudentOrderDetail} />
<Route path="/student/credit" component={StudentCredit} />
```

**Menu lateral:**

```tsx
<nav>
  <Link href="/student/dashboard">
    <Home /> Dashboard
  </Link>
  <Link href="/student/workout">
    <Dumbbell /> Treino
  </Link>
  <Link href="/student/store"> {/* NOVO */}
    <ShoppingBag /> Loja
  </Link>
  <Link href="/student/payments">
    <CreditCard /> Mensalidades
  </Link>
  <Link href="/student/credit"> {/* NOVO */}
    <Wallet /> Meu Crédito
  </Link>
</nav>
```

### Página: StudentCart

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiClient } from '@/lib/apiClient';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useLocation } from 'wouter';

export default function StudentCart() {
  const [, setLocation] = useLocation();
  const { data: cart } = apiClient.cart.get.useQuery();
  const updateMutation = apiClient.cart.updateQuantity.useMutation();
  const removeMutation = apiClient.cart.removeItem.useMutation();

  const total = cart?.items.reduce(
    (sum, item) => sum + item.product.sellingPriceCents * item.quantity,
    0
  ) || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Carrinho</h1>

      {cart?.items.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Seu carrinho está vazio</p>
          <Button onClick={() => setLocation('/student/store')}>
            Ir para Loja
          </Button>
        </Card>
      )}

      {cart?.items.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex gap-4">
            {item.product.imageUrl && (
              <img
                src={item.product.imageUrl}
                alt={item.product.name}
                className="w-24 h-24 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{item.product.name}</h3>
              <p className="text-sm text-muted-foreground">
                R$ {(item.product.sellingPriceCents / 100).toFixed(2)} cada
              </p>

              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateMutation.mutate({
                    productId: item.productId,
                    quantity: item.quantity - 1,
                  })}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{item.quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateMutation.mutate({
                    productId: item.productId,
                    quantity: item.quantity + 1,
                  })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-bold">
                R$ {(item.product.sellingPriceCents * item.quantity / 100).toFixed(2)}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => removeMutation.mutate({ productId: item.productId })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {(cart?.items.length || 0) > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg">Total</span>
            <span className="text-2xl font-bold">
              R$ {(total / 100).toFixed(2)}
            </span>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={() => setLocation('/student/checkout')}
          >
            Finalizar Compra
          </Button>
        </Card>
      )}
    </div>
  );
}
```

### Notificações Push (Futura)

**Integração com Web Push API:**

```typescript
// Notificar aluno quando:
- Produto favoritado volta ao estoque
- Promoção em categoria que ele compra
- Parcela de crédito vencendo em 3 dias
- Pedido pronto para retirada
```

---

## 🗓️ Roadmap de Implementação

### Fase 1 - MVP Básico (4 semanas)

**Semana 1: Database + Backend Básico**
- [ ] Criar migrations para tabelas (products, sales_orders, etc)
- [ ] Implementar Drizzle schema
- [ ] Criar routers básicos (products, sales)
- [ ] Implementar queries de CRUD em `db.ts`
- [ ] Testar com Postman/Insomnia

**Semana 2: Admin - Produtos**
- [ ] Página AdminProducts (CRUD)
- [ ] Componente ProductForm
- [ ] Upload de imagens (S3)
- [ ] Filtros e busca
- [ ] Relatório de estoque

**Semana 3: Admin - PDV**
- [ ] Página AdminSales (PDV)
- [ ] Busca de produtos (SKU/nome)
- [ ] Adicionar ao carrinho
- [ ] Formas de pagamento (PIX, dinheiro)
- [ ] Gerar comprovante/cupom

**Semana 4: Testes e Ajustes**
- [ ] Testar fluxo completo de venda
- [ ] Validações de estoque
- [ ] Controle de baixa automática
- [ ] Dashboard de vendas
- [ ] Relatórios básicos

**Entregáveis Fase 1:**
- ✅ Cadastro de produtos
- ✅ Controle de estoque
- ✅ PDV funcional
- ✅ Vendas à vista (PIX/dinheiro)

---

### Fase 2 - Crediário (3 semanas)

**Semana 5: Limite de Crédito**
- [ ] Tabela student_credit_limits
- [ ] Router credit
- [ ] Página AdminCreditLimits
- [ ] Definir limite por aluno
- [ ] Bloqueio/desbloqueio

**Semana 6: Parcelamento**
- [ ] Tabela credit_installments
- [ ] Lógica de cálculo de parcelas
- [ ] Venda com crediário no PDV
- [ ] Validação de limite
- [ ] Geração de parcelas

**Semana 7: Cobrança e Controle**
- [ ] CRON de lembretes (WhatsApp)
- [ ] CRON de vencidas (multa/juros)
- [ ] Página AdminCreditDashboard
- [ ] Marcar parcela como paga
- [ ] Renegociação de dívida

**Entregáveis Fase 2:**
- ✅ Sistema de crediário completo
- ✅ Cobrança automática
- ✅ Controle de inadimplência

---

### Fase 3 - Loja Virtual (4 semanas)

**Semana 8: Catálogo**
- [ ] Página StudentStore
- [ ] Listar produtos
- [ ] Filtros por categoria
- [ ] Busca
- [ ] Detalhes do produto

**Semana 9: Carrinho**
- [ ] Tabela cart_items
- [ ] Router cart
- [ ] Página StudentCart
- [ ] Adicionar/remover itens
- [ ] Atualizar quantidade

**Semana 10: Checkout**
- [ ] Página StudentCheckout
- [ ] Escolher forma de pagamento
- [ ] PIX (QR Code)
- [ ] Crediário (se tem limite)
- [ ] Confirmar pedido

**Semana 11: Meus Pedidos**
- [ ] Página StudentOrders
- [ ] Histórico de compras
- [ ] Detalhes do pedido
- [ ] Status (pendente/pago/entregue)
- [ ] Comprovante PDF

**Entregáveis Fase 3:**
- ✅ Loja virtual no app
- ✅ Aluno compra pelo celular
- ✅ Checkout integrado

---

### Fase 4 - Avançado (4 semanas)

**Semana 12: Promoções**
- [ ] Tabela promotions
- [ ] Cupom de desconto
- [ ] Desconto por categoria
- [ ] Validade de promoção
- [ ] Badge "Promoção" no produto

**Semana 13: Kits e Combos**
- [ ] Tabela product_bundles
- [ ] Agrupar produtos
- [ ] Preço promocional
- [ ] Sugestões de compra

**Semana 14: Integração com Treino**
- [ ] Suplementos recomendados
- [ ] "Complete seu treino"
- [ ] Histórico de suplementação

**Semana 15: NFC-e**
- [ ] Integração Sefaz
- [ ] Emissão de cupom fiscal
- [ ] Envio por email
- [ ] Armazenamento XML

**Entregáveis Fase 4:**
- ✅ Promoções e descontos
- ✅ Recomendações personalizadas
- ✅ Cupom fiscal (opcional)

---

## 💵 Estimativas e Custos

### Tempo de Desenvolvimento

| Fase | Duração | Complexidade | Desenvolvedor |
|------|---------|--------------|---------------|
| Fase 1 - MVP | 4 semanas | Média | 1 full-stack |
| Fase 2 - Crediário | 3 semanas | Alta | 1 full-stack |
| Fase 3 - Loja Virtual | 4 semanas | Média | 1 full-stack |
| Fase 4 - Avançado | 4 semanas | Alta | 1 full-stack |
| **TOTAL** | **15 semanas** | | |

### Custos de Infraestrutura

**Sem novos custos:**
- ✅ Database: já existe (MySQL)
- ✅ Backend: já existe (Node.js)
- ✅ Frontend: já existe (React)
- ✅ Hosting: já existe (VPS)
- ✅ Storage S3: já existe (fotos de produtos)

**Custos adicionais:**
- NFC-e (opcional): R$ 50-200/mês (se implementar)

### ROI Esperado

**Exemplo: Academia com 300 alunos**

**Receita Adicional (Vendas):**
- 30% dos alunos compram/mês (90 alunos)
- Ticket médio: R$ 80
- Receita mensal: R$ 7.200
- Margem de lucro: 40%
- **Lucro mensal: R$ 2.880**

**Economia:**
- Sistema de PDV terceiro: R$ 150/mês
- Sistema de crediário: R$ 100/mês
- **Economia mensal: R$ 250**

**Total Benefício/Mês: R$ 3.130**
**Payback: ~2 meses** (desenvolvimento próprio ou customizado)

---

## 📚 Referências e Tecnologias

### Stack Atual (Reutilizar)

- **Backend:** Node.js 22 + Express 4 + tRPC 11
- **ORM:** Drizzle ORM
- **Database:** MySQL 8 / TiDB
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS 4 + shadcn/ui
- **Pagamentos:** Efí Pay (PIX) + Sicoob
- **Storage:** AWS S3 (fotos)
- **Email:** Nodemailer (SMTP)

### Bibliotecas Adicionais Sugeridas

```json
{
  "dependencies": {
    // Código de barras
    "jsbarcode": "^3.11.6",
    "@types/jsbarcode": "^3.11.1",

    // QR Code (já tem para PIX)
    "qrcode": "^1.5.3",

    // Geração de PDF (já tem)
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",

    // Excel export (já tem)
    "xlsx": "^0.18.5",

    // Formatação de moeda
    "currency.js": "^2.0.4"
  }
}
```

### Referências de Mercado

- **Nextar (Nex):** https://www.nextar.com.br
- **Alfa Networks:** https://www.alfanetworks.com.br
- **QuantoSobra:** https://www.quantosobra.com.br
- **Meu Crediário:** https://meucrediario.com.br

---

## 🎯 Conclusão

### Viabilidade

**MUITO VIÁVEL** considerando:
- ✅ Stack pronto e testado
- ✅ Sistema de pagamentos já implementado
- ✅ Multi-tenant isolado (seguro)
- ✅ UI components prontos (shadcn/ui)
- ✅ Padrões estabelecidos (tRPC, Drizzle)

### Priorização

**Ordem recomendada:**

1. **Fase 1 (MVP)** - Essencial
   - Permite venda básica
   - Controle de estoque
   - ROI imediato

2. **Fase 2 (Crediário)** - Alta prioridade
   - Diferencial competitivo
   - Aumenta ticket médio
   - Fideliza alunos

3. **Fase 3 (Loja Virtual)** - Média prioridade
   - Conveniência para aluno
   - Vendas 24/7
   - Reduz trabalho de balcão

4. **Fase 4 (Avançado)** - Baixa prioridade
   - Otimizações
   - Pode vir depois

### Próximos Passos

1. **Validação:** Confirmar com stakeholders
2. **Priorizar:** Escolher fase inicial (recomendo Fase 1)
3. **Planejar Sprint:** Quebrar semana 1 em tasks
4. **Iniciar:** Criar migrations e schema

---

**Documento criado em:** 17/01/2026
**Última atualização:** 17/01/2026
**Versão:** 1.0
**Autor:** Sistema Academia + Claude Code

**Status:** 📋 Aguardando aprovação para implementação
