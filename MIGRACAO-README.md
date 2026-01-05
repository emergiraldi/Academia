# Migração de Dados PostgreSQL → Firebird

Este script realiza a migração de dados do banco PostgreSQL (dump) para o banco Firebird QRSistema.

## Dados que serão migrados

1. **Produtos** - Cadastro completo de produtos
2. **Contas a Pagar** - Todas as contas a pagar
3. **Contas a Receber** - Documentos e crediário
4. **Créditos** - Créditos de clientes

## Requisitos

- Node.js instalado
- Acesso ao banco Firebird em `C:\QRSistema\db\QRSISTEMA.FDB`
- Dump SQL do PostgreSQL em `C:\Mac\Home\Documents\bkp brabancia\dump-bmcmdb-202512221903.sql`

## Dependências Instaladas

- `node-firebird` - Conexão com banco Firebird
- `pg` - Para referência (não usado diretamente, pois lemos o dump)

## IMPORTANTE - Ajustes Necessários

Antes de executar o script, você **PRECISA** ajustar os nomes das tabelas e colunas no arquivo `migracao-dados.js` de acordo com a estrutura real do banco Firebird QRSistema.

### Estrutura que precisa ser verificada:

#### 1. Tabela de Produtos
No Firebird, verifique os nomes corretos das colunas:
```sql
-- Exemplo de verificação
SELECT FIRST 1 * FROM PRODUTOS;
```

Ajuste as colunas no script:
- `CODIGO` - código do produto
- `DESCRICAO` - descrição do produto
- `PRECO_VENDA` - preço de venda
- `CUSTO` - custo do produto
- `ESTOQUE` - quantidade em estoque
- `ATIVO` - se o produto está ativo
- `CODIGO_BARRAS` - código de barras

#### 2. Tabela de Contas a Pagar
Verifique e ajuste:
- `FORNECEDOR_ID`
- `DOCUMENTO`
- `DATA_VENCIMENTO`
- `VALOR`
- `OBSERVACAO`
- `PAGO`
- `DATA_EMISSAO`

#### 3. Tabela de Contas a Receber
Verifique e ajuste:
- `CLIENTE_ID`
- `DATA_VENCIMENTO`
- `VALOR`
- `VALOR_PAGO`
- `PARCELA`
- `STATUS`

#### 4. Tabela de Créditos
Verifique e ajuste:
- `CLIENTE_ID`
- `DATA`
- `VALOR`
- `SALDO`
- `OBSERVACAO`

## Como verificar a estrutura do Firebird

1. Use uma ferramenta como FlameRobin ou IBExpert
2. Ou use este script Node.js para listar as tabelas:

```javascript
const Firebird = require('node-firebird');

const config = {
  host: 'localhost',
  port: 3050,
  database: 'C:\\QRSistema\\db\\QRSISTEMA.FDB',
  user: 'SYSDBA',
  password: 'masterkey'
};

Firebird.attach(config, (err, db) => {
  if (err) {
    console.error('Erro:', err);
    return;
  }

  db.query('SELECT RDB$RELATION_NAME FROM RDB$RELATIONS WHERE RDB$SYSTEM_FLAG = 0', [], (err, result) => {
    console.log('Tabelas:', result);

    // Para ver colunas de uma tabela específica:
    db.query('SELECT RDB$FIELD_NAME FROM RDB$RELATION_FIELDS WHERE RDB$RELATION_NAME = ?', ['PRODUTOS'], (err, cols) => {
      console.log('Colunas da tabela PRODUTOS:', cols);
      db.detach();
    });
  });
});
```

## Configurações do Firebird

No arquivo `migracao-dados.js`, verifique/ajuste as configurações de conexão:

```javascript
const fbConfig = {
  host: 'localhost',
  port: 3050,
  database: 'C:\\QRSistema\\db\\QRSISTEMA.FDB',
  user: 'SYSDBA',
  password: 'masterkey',  // AJUSTE A SENHA SE NECESSÁRIO
  lowercase_keys: false,
  role: null,
  pageSize: 4096
};
```

## Como Executar

### Passo 1: Faça um BACKUP do banco Firebird

```bash
# Use gbak para fazer backup
gbak -b -user SYSDBA -password masterkey C:\QRSistema\db\QRSISTEMA.FDB C:\QRSistema\db\BACKUP_ANTES_MIGRACAO.fbk
```

### Passo 2: Execute o script de migração

```bash
cd c:\Projeto\Academia
node migracao-dados.js
```

## Resolução de Problemas

### Erro: "Column not found"
- Verifique os nomes das colunas no Firebird e ajuste no script

### Erro: "Table not found"
- Verifique os nomes das tabelas no Firebird e ajuste no script

### Erro: "Violation of PRIMARY KEY constraint"
- Pode haver dados duplicados. Verifique se os IDs já existem no Firebird
- Considere limpar as tabelas antes da migração (se apropriado)

### Erro de conexão
- Verifique se o Firebird está rodando
- Verifique usuário e senha
- Verifique o caminho do arquivo .FDB

## Estrutura do Dump PostgreSQL

O script lê dados das seguintes tabelas no dump:

- `produtos` → cadastro de produtos com todas as informações
- `conta_pagar` → contas a pagar
- `documentos` → contas a receber (parcelamentos)
- `creditos` → créditos de clientes (devoluções)

## Mapeamento de Dados

### Produtos PostgreSQL → Firebird
- `idproduto` → CODIGO
- `descricao` → DESCRICAO
- `prevenda` → PRECO_VENDA
- `ean` → CODIGO_BARRAS
- `deleted = false` → ATIVO = 1

### Contas a Pagar PostgreSQL → Firebird
- `fornecedor_id` → FORNECEDOR_ID
- `documento` → DOCUMENTO
- `data_vencimento` → DATA_VENCIMENTO
- `valor` → VALOR
- `pago = true` → PAGO = 1

### Contas a Receber PostgreSQL → Firebird
- `idcliente` → CLIENTE_ID
- `vencimento` → DATA_VENCIMENTO
- `valor` → VALOR
- `valorpago` → VALOR_PAGO
- `status = 'B'` → STATUS = 'PAGO'

## Notas Importantes

1. **IDs duplicados**: O script não verifica se os IDs já existem. Considere limpar as tabelas antes.
2. **Relacionamentos**: Certifique-se de que os IDs de clientes e fornecedores existem no Firebird.
3. **Tipos de dados**: Ajuste conversões de data/hora se necessário.
4. **Caracteres especiais**: O dump é lido em 'latin1' para compatibilidade.

## Próximos Passos

Após ajustar o script:

1. Faça backup do Firebird
2. Execute o script
3. Verifique os dados migrados
4. Corrija erros se necessário
5. Execute novamente se precisar

## Suporte

Se encontrar problemas:
1. Verifique os logs de erro no console
2. Verifique a estrutura das tabelas no Firebird
3. Ajuste os nomes de colunas conforme necessário
4. Execute parcialmente (comente partes do código para testar)
