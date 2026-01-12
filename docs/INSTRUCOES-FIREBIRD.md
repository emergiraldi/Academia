# Instruções para Verificar Estrutura do Firebird

## Problema Atual

A biblioteca `node-firebird` está tendo problemas de conexão devido a configurações de criptografia do Firebird 3.0+.

## Soluções Alternativas

### Opção 1: Usar FlameRobin ou IBExpert (RECOMENDADO)

1. Baixe e instale o **FlameRobin** (gratuito): https://www.flamerobin.org/
2. Conecte ao banco: `C:\QRSistema\db\QRSISTEMA.FDB`
3. Expanda as tabelas e verifique a estrutura

**Tabelas que precisamos encontrar:**
- Tabela de PRODUTOS
- Tabela de CONTAS A PAGAR
- Tabela de CONTAS A RECEBER
- Tabela de CRÉDITOS

### Opção 2: Usar ISQL (Ferramenta de Linha de Comando do Firebird)

Se você tiver o Firebird instalado, execute:

```cmd
cd "C:\Program Files\Firebird\Firebird_X_X"
isql.exe -user SYSDBA -password masterkey C:\QRSistema\db\QRSISTEMA.FDB -i C:\Projeto\Academia\verificar-firebird.sql -o C:\Projeto\Academia\estrutura-firebird.txt
```

Depois abra o arquivo `estrutura-firebird.txt` para ver as tabelas.

### Opção 3: Usar Python com fdb

Se você tiver Python instalado:

```bash
pip install fdb
```

Depois execute este script Python:

```python
import fdb

con = fdb.connect(
    database='C:\\QRSistema\\db\\QRSISTEMA.FDB',
    user='sysdba',
    password='masterkey'
)

cur = con.cursor()

# Listar todas as tabelas
print("=== TABELAS ===")
cur.execute("""
    SELECT RDB$RELATION_NAME
    FROM RDB$RELATIONS
    WHERE RDB$SYSTEM_FLAG = 0
    AND RDB$VIEW_BLR IS NULL
    ORDER BY RDB$RELATION_NAME
""")

tabelas = []
for row in cur:
    nome = row[0].strip()
    tabelas.append(nome)
    print(f"- {nome}")

# Tabelas relevantes
print("\n=== TABELAS RELEVANTES ===")
relevantes = [t for t in tabelas if any(palavra in t.upper() for palavra in ['PRODUTO', 'CONTA', 'PAGAR', 'RECEBER', 'CREDITO'])]

for tabela in relevantes:
    print(f"\n📋 {tabela}")
    cur.execute(f"""
        SELECT RDB$FIELD_NAME, RDB$FIELD_SOURCE
        FROM RDB$RELATION_FIELDS
        WHERE RDB$RELATION_NAME = '{tabela}'
        ORDER BY RDB$FIELD_POSITION
    """)

    for col in cur:
        print(f"  - {col[0].strip().ljust(30)} ({col[1].strip()})")

con.close()
```

## O que fazer depois de ver a estrutura

Depois de identificar as tabelas e colunas corretas no Firebird, você precisa ajustar o arquivo `migracao-dados.cjs` para usar os nomes corretos.

### Exemplos de ajustes necessários:

No arquivo `migracao-dados.cjs`, procure por blocos como este:

```javascript
db.query(`
  INSERT INTO PRODUTOS (
    CODIGO, DESCRICAO, PRECO_VENDA, CUSTO,
    ESTOQUE, ATIVO, CODIGO_BARRAS
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`, [
  produto.idproduto,
  produto.descricao,
  // ...
```

E ajuste para os nomes reais das colunas que você encontrou.

### Estruturas comuns do QRSistema

Baseado em sistemas similares, as tabelas podem ter nomes como:

**Produtos:**
- `PRODUTOS` ou `PRODUTO` ou `CAD_PRODUTO`
- Colunas: `ID_PRODUTO`, `DESCRICAO`, `PRECO_VENDA`, `CODIGO_BARRAS`, etc.

**Contas a Pagar:**
- `CONTAS_PAGAR` ou `CONTA_PAGAR` ou `PAGAR`
- Colunas: `ID`, `FORNECEDOR_ID`, `VALOR`, `DATA_VENCIMENTO`, `PAGO`, etc.

**Contas a Receber:**
- `CONTAS_RECEBER` ou `CONTA_RECEBER` ou `RECEBER`
- Colunas: `ID`, `CLIENTE_ID`, `VALOR`, `DATA_VENCIMENTO`, etc.

**Créditos:**
- `CREDITOS` ou `CREDITO_CLIENTE`
- Colunas: `ID`, `CLIENTE_ID`, `VALOR`, `SALDO`, etc.

## Próximos Passos

1. ✅ Use uma das opções acima para ver a estrutura do banco
2. ✅ Anote os nomes das tabelas e colunas
3. ✅ Ajuste o arquivo `migracao-dados.cjs` com os nomes corretos
4. ✅ Execute: `node migracao-dados.cjs`

## Alternativa: Me forneça as informações

Se você conseguir extrair a estrutura das tabelas, me forneça e eu ajusto o script automaticamente!

Exemplo do que preciso:
```
TABELA: PRODUTOS
Colunas:
- ID_PRODUTO (INTEGER)
- DESCRICAO (VARCHAR)
- PRECO_VENDA (NUMERIC)
- ...
```
