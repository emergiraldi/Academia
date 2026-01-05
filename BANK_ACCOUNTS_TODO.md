# Sistema de Contas Bancárias com PIX - Status da Implementação

## ✅ Concluído

1. **Tabela no Banco de Dados** (`bank_accounts`)
   - Criada com todos os campos PIX
   - Compatível com o sistema qrsistema

2. **Schema Drizzle** (`drizzle/schema.ts`)
   - Definição completa da tabela
   - Types TypeScript exportados

3. **Funções CRUD** (`server/db.ts`)
   - `listBankAccounts(gymId)`
   - `getBankAccountById(id, gymId)`
   - `getActivePixBankAccount(gymId)` - Busca conta com PIX ativo
   - `createBankAccount(data)`
   - `updateBankAccount(id, gymId, data)`
   - `deleteBankAccount(id, gymId)` - Soft delete

## ✅ Concluído Recentemente

4. **Router tRPC** (`server/routers.ts`)
   - Endpoints completos: list, create, update, delete
   - Todos protegidos com `gymAdminProcedure`
   - Validação completa com Zod

5. **Página Admin** (`client/src/pages/admin/AdminBankAccounts.tsx`)
   - Interface completa de CRUD
   - Formulário com todos os campos PIX
   - Lista de bancos brasileiros
   - Tipos de chave PIX
   - Seleção de ambiente (Produção/Homologação)

6. **Rota no App** (`client/src/App.tsx`)
   - Rota `/admin/bank-accounts` adicionada
   - Import do componente AdminBankAccounts

7. **Menu de Navegação** (`client/src/components/DashboardLayout.tsx`)
   - Item "Contas Bancárias" com ícone Landmark
   - Posicionado após "Formas de Pagamento"

8. **Serviço PIX Atualizado** (`server/pix.ts`)
   - Nova função `getPixServiceFromBankAccount(gymId)`
   - Busca credenciais da tabela `bank_accounts`
   - Detecta ambiente automaticamente (Produção/Homologação)

9. **Integração PIX** (`server/routers.ts`)
   - Procedures `generatePixQrCode` e `checkPaymentStatus` atualizados
   - Agora usam `getPixServiceFromBankAccount()` ao invés de env vars
   - Mensagens de erro mais amigáveis

## 🔄 Pendente

### 1. ~~Router tRPC (`server/routers.ts`)~~ ✅ CONCLUÍDO

~~Adicionar após a seção de `paymentMethods`:~~

```typescript
// ============ BANK ACCOUNTS ============
bankAccounts: router({
  list: gymAdminProcedure
    .input(z.object({ gymSlug: z.string() }))
    .query(async ({ input }) => {
      const gym = await db.getGymBySlug(input.gymSlug);
      if (!gym) throw new TRPCError({ code: "NOT_FOUND" });
      return await db.listBankAccounts(gym.id);
    }),

  create: gymAdminProcedure
    .input(z.object({
      gymSlug: z.string(),
      titularNome: z.string().optional(),
      banco: z.number(),
      agenciaNumero: z.string().optional(),
      agenciaDv: z.string().optional(),
      contaNumero: z.string().optional(),
      contaDv: z.string().optional(),
      pixAtivo: z.string().optional(),
      pixScope: z.string().optional(),
      pixChave: z.string().optional(),
      pixTipoChave: z.string().optional(),
      pixTipoAmbiente: z.string().optional(),
      pixClientId: z.string().optional(),
      pixClientSecret: z.string().optional(),
      pixCertificadoPath: z.string().optional(),
      pixChavePrivadaPath: z.string().optional(),
      pixSenhaCertificado: z.string().optional(),
      pixVersaoApi: z.string().optional(),
      pixTimeoutMs: z.number().optional(),
      pixTokenExpiracao: z.number().optional(),
      pixTipoAutenticacao: z.string().optional(),
      pixUrlBase: z.string().optional(),
      pixUrlToken: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const gym = await db.getGymBySlug(input.gymSlug);
      if (!gym) throw new TRPCError({ code: "NOT_FOUND" });
      const { gymSlug, ...data } = input;
      return await db.createBankAccount({ ...data, gymId: gym.id });
    }),

  update: gymAdminProcedure
    .input(z.object({
      id: z.number(),
      gymSlug: z.string(),
      // mesmos campos do create, todos opcionais
    }))
    .mutation(async ({ input }) => {
      const gym = await db.getGymBySlug(input.gymSlug);
      if (!gym) throw new TRPCError({ code: "NOT_FOUND" });
      const { id, gymSlug, ...data } = input;
      return await db.updateBankAccount(id, gym.id, data);
    }),

  delete: gymAdminProcedure
    .input(z.object({
      id: z.number(),
      gymSlug: z.string(),
    }))
    .mutation(async ({ input }) => {
      const gym = await db.getGymBySlug(input.gymSlug);
      if (!gym) throw new TRPCError({ code: "NOT_FOUND" });
      return await db.deleteBankAccount(input.id, gym.id);
    }),
}),
```

### 2. ~~Página Admin (`client/src/pages/admin/AdminBankAccounts.tsx`)~~ ✅ CONCLUÍDO

~~Criar página similar a AdminPaymentMethods.tsx com:~~
- Lista de contas bancárias
- Formulário para cadastro/edição
- Campos:
  - Nome do Titular
  - Banco (dropdown com lista de bancos brasileiros)
  - Agência e DV
  - Conta e DV
  - **Seção PIX:**
    - PIX Ativo (S/N)
    - Tipo de Chave (CPF, CNPJ, Email, Telefone, Aleatória)
    - Chave PIX
    - Client ID
    - Client Secret
    - Caminho Certificado
    - Caminho Chave Privada
    - URL Base API
    - URL Token
    - Ambiente (Produção/Homologação)
    - Timeout

**Lista de Bancos para o Dropdown:**
- 001 - Banco do Brasil
- 033 - Santander
- 077 - Banco Inter
- 104 - Caixa Econômica Federal
- 237 - Bradesco
- 341 - Itaú
- 756 - Sicoob
- 748 - Sicredi
- 260 - Nubank
- 336 - C6 Bank

### 3. ~~Rota no App (`client/src/App.tsx`)~~ ✅ CONCLUÍDO

~~import AdminBankAccounts from "./pages/admin/AdminBankAccounts";~~

~~// Adicionar na seção de rotas admin:~~
~~<Route path="/admin/bank-accounts" component={AdminBankAccounts} />~~

### 4. ~~Adicionar no Menu do Admin~~ ✅ CONCLUÍDO

~~No componente `DashboardLayout.tsx` ou similar, adicionar:~~
~~<NavigationItem~~
~~  to="/admin/bank-accounts"~~
~~  icon={<Landmark />}~~
~~  text="Contas Bancárias"~~
~~/>~~

### 5. ~~Modificar Sistema PIX~~ ✅ CONCLUÍDO

~~No arquivo `server/pix.ts`, modificar para buscar configurações de `bank_accounts` ao invés de `gyms`:~~

~~// Implementado via função `getPixServiceFromBankAccount(gymId)`~~
~~// Busca conta ativa com PIX e retorna instância configurada do PixService~~

## 📝 Notas Importantes

- O sistema foi baseado no `qrsistema` da LojaAP
- Suporta múltiplos bancos e múltiplas contas por academia
- Soft delete (marca como inativo ao invés de deletar)
- Campos PIX completos para integração com Sicoob, Itaú, Bradesco, etc.

## 🎯 Próximos Passos

1. ~~Criar o router tRPC~~ ✅
2. ~~Criar a página AdminBankAccounts.tsx~~ ✅
3. ~~Adicionar rota no App.tsx~~ ✅
4. ~~Modificar sistema PIX para usar bank_accounts~~ ✅
5. **Testar cadastro completo de uma conta bancária** ⬅️ PRÓXIMO
6. **Testar geração de PIX com as novas configurações**
7. **Validar integração com banco real (Sicoob, Itaú, etc.)**

## 🚀 Como Testar

1. **Acessar o sistema:**
   - Login como admin em `/admin`
   - Navegar para "Contas Bancárias" no menu lateral

2. **Cadastrar uma conta:**
   - Clicar em "Nova Conta Bancária"
   - Preencher dados básicos (Titular, Banco, Agência, Conta)
   - Ativar PIX (S)
   - Configurar credenciais PIX:
     - Client ID e Client Secret
     - Chave PIX
     - Tipo de Chave
     - Ambiente (Produção ou Homologação)
   - Salvar

3. **Testar PIX:**
   - Login como aluno
   - Acessar área de pagamentos
   - Clicar em "Pagar Agora" em um pagamento pendente
   - Verificar se o QR Code é gerado com as credenciais da conta bancária cadastrada
