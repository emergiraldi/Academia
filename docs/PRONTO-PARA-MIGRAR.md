# MIGRAÇÃO PRONTA PARA EXECUTAR!

## Estrutura do Firebird Identificada

Consegui conectar ao banco Firebird e identificar a estrutura correta! O script de migração já foi ajustado.

### Tabelas que serão usadas:

#### 1. CAD_PRODUTOS (Produtos)
- PostgreSQL `produtos` → Firebird `CAD_PRODUTOS`
- Mapeamento principal:
  - `idproduto` → `CODIGO`
  - `descricao` → `NOME`
  - `ean` → `CODIGO_BARRA`
  - `prevenda` → `PRC_VENDA` (convertido para centavos)
  - `deleted` → `ATIVO` ('S' ou 'N')

#### 2. FIN_CTAPAGAR (Contas a Pagar)
- PostgreSQL `conta_pagar` → Firebird `FIN_CTAPAGAR`
- Mapeamento principal:
  - `fornecedor_id` → `FORNECEDOR`
  - `documento` → `DOCUMENTO`
  - `data_vencimento` → `VENCIMENTO`
  - `valor` → `VALOR` (convertido para centavos)
  - `pago` → `QUITADO` ('S' ou 'N')

#### 3. FIN_CTARECEBER (Contas a Receber / Crediário)
- PostgreSQL `documentos` → Firebird `FIN_CTARECEBER`
- Mapeamento principal:
  - `idcliente` → `CLIENTE`
  - `vencimento` → `VENCIMENTO`
  - `valor` → `VALOR` (convertido para centavos)
  - `valorpago` → `VALOR_PAGO`
  - `parcela` → `PARCELA`
  - `status` → `QUITADO` ('S' ou 'N')

- PostgreSQL `creditos` também vai para `FIN_CTARECEBER` (com valores negativos e histórico especial)

## Ajustes Importantes Realizados

### 1. Conversão de Valores
- Todos os valores monetários são multiplicados por 100 (centavos)
- Exemplo: R$ 10,50 vira 1050 no Firebird

### 2. Campos Booleanos
- PostgreSQL usa `true/false` ou `t/f`
- Firebird usa `'S'/'N'`

### 3. Campos Obrigatórios Adicionados
- `EMPRESA` = 1 (código da empresa padrão)
- `DATA` = data atual
- `SITUACAO` = 'ABERTA' ou 'QUITADA'
- `VALOR_SALDO` = calculado automaticamente

### 4. Limites de Tamanho
- Strings são truncadas para respeitar os limites:
  - NOME: 200 caracteres
  - CODIGO_BARRA: 30 caracteres
  - DOCUMENTO: 30 caracteres
  - HISTORICO: 5000 caracteres

## Como Executar a Migração

### Passo 1: FAÇA BACKUP DO FIREBIRD! ⚠️

**MUITO IMPORTANTE:** Antes de qualquer coisa, faça backup do banco Firebird:

```bash
# Se tiver gbak instalado:
gbak -b -user SYSDBA -password masterkey C:\QRSistema\db\QRSISTEMA.FDB C:\QRSistema\db\BACKUP_ANTES_MIGRACAO.fbk
```

Ou simplesmente copie o arquivo:
```bash
copy "C:\QRSistema\db\QRSISTEMA.FDB" "C:\QRSistema\db\QRSISTEMA_BACKUP.FDB"
```

### Passo 2: Execute o script de migração

```bash
cd c:\Projeto\Academia
node migracao-dados.cjs
```

## O que vai acontecer:

1. ✅ O script vai ler o dump SQL do PostgreSQL
2. ✅ Vai parsear as tabelas: produtos, conta_pagar, documentos e creditos
3. ✅ Vai conectar ao Firebird (modo embedded, sem servidor)
4. ✅ Vai inserir os dados nas tabelas corretas do Firebird:
   - CAD_PRODUTOS
   - FIN_CTAPAGAR
   - FIN_CTARECEBER

5. ✅ Vai mostrar o progresso e eventuais erros

## Possíveis Problemas e Soluções

### 1. Erro: "Column not found"
- Alguma coluna pode estar diferente
- Verifique a mensagem de erro e me avise

### 2. Erro: "Violation of PRIMARY KEY constraint"
- Significa que o produto/conta já existe no Firebird
- Opções:
  - Limpe as tabelas antes de migrar (DELETE FROM CAD_PRODUTOS)
  - Ou ajuste o script para fazer UPDATE ao invés de INSERT

### 3. Erro: "Foreign key violation"
- Significa que está tentando inserir um produto com fornecedor que não existe
- Ou uma conta com cliente/fornecedor que não existe
- Solução: Migre clientes e fornecedores antes

### 4. Nenhum dado encontrado
- Se o script disser que não encontrou dados, o formato do dump pode estar diferente
- Me avise para ajustarmos o parser

## Verificando os Dados Migrados

Depois da migração, você pode verificar no banco Firebird:

```python
python verificar-firebird.py
```

Ou use uma ferramenta GUI como FlameRobin.

## Arquivos Criados

- [migracao-dados.cjs](migracao-dados.cjs) - Script principal de migração (ATUALIZADO!)
- [verificar-firebird.py](verificar-firebird.py) - Script para verificar estrutura
- [MIGRACAO-README.md](MIGRACAO-README.md) - Documentação detalhada
- [INSTRUCOES-FIREBIRD.md](INSTRUCOES-FIREBIRD.md) - Instruções alternativas
- [verificar-firebird.sql](verificar-firebird.sql) - SQL para verificação manual

## Precisa de Ajuda?

Se encontrar algum erro durante a migração:

1. Copie a mensagem de erro completa
2. Me mostre
3. Vou ajustar o script conforme necessário

## Dados que Serão Migrados

O script vai analisar o dump e mostrar quantos registros encontrou:
- X produtos
- X contas a pagar
- X contas a receber
- X créditos

Tudo pronto! Execute quando quiser! 🚀
