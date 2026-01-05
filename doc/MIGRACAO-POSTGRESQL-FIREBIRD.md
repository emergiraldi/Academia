# Documentação da Migração PostgreSQL → Firebird

**Data:** Dezembro 2025
**Sistema:** QRSistema
**Banco Origem:** PostgreSQL (bmcmdb)
**Banco Destino:** Firebird (QRSISTEMA.FDB)

---

## 📋 Índice

1. [Resumo da Migração](#resumo-da-migração)
2. [Problemas Encontrados e Soluções](#problemas-encontrados-e-soluções)
3. [Scripts Criados](#scripts-criados)
4. [Como Repetir a Migração](#como-repetir-a-migração)
5. [Comandos Importantes](#comandos-importantes)
6. [Verificações Pós-Migração](#verificações-pós-migração)

---

## 📊 Resumo da Migração

### Dados Migrados

| Tabela | Origem (PostgreSQL) | Destino (Firebird) | Registros |
|--------|---------------------|---------------------|-----------|
| Usuários | `funcionarios` | `USUARIO` | 165 |
| Vendedores | `funcionarios` (cargo=6) | `CAD_PESSOA` (TIPO='VENDEDOR') | 46 |
| Pedidos | `pedidos` | `PEDIDOS` | 27.756 |
| Itens de Pedidos | `pedidos_itens` | `PEDIDOS_ITENS` | - |

### Conversões Importantes

- **Valores Monetários:** Multiplicados por 100 (armazenados em CENTAVOS no Firebird)
- **Tipos de Dados:** DECIMAL → BIGINT
- **Campos Mapeados:**
  - `VLNOTA` → `VLR_TOTAL`
  - `VLPROD` → `VLR_PRODUTOS`
  - `VLFRETE` → `VLRFRETE`
  - `VLDESC` → `VLR_DESCONTO`

---

## 🐛 Problemas Encontrados e Soluções

### 1. Usuários com Nomes Genéricos

**Problema:**
- 165 usuários apareciam como "USUARIO_2", "USUARIO_3", etc.

**Causa:**
- Campo `LOGIN` não existe na tabela `USUARIO` do Firebird
- Campo correto é `USERNAME`

**Solução:**
```python
# Script: corrigir-usuarios-vendedores.py
UPDATE USUARIO
SET NOME = <nome_real_do_funcionario>,
    NOMEABREVIADO = <nome_abreviado>
WHERE CODIGO = <idusuario>
```

**Resultado:** ✓ 165 usuários corrigidos com nomes reais

---

### 2. Vendedores Não Migrados

**Problema:**
- Apenas 1 vendedor (THIAGO) no sistema
- Deveriam ter 46 vendedores

**Causa:**
- Vendedores são funcionários com `cargo = 6` (VENDEDOR)
- Não foi feito o mapeamento correto

**Solução:**
```python
# Identificar vendedores
SELECT * FROM funcionarios WHERE cargo = 6

# Marcar como vendedores no Firebird
UPDATE CAD_PESSOA
SET TIPO = 'VENDEDOR'
WHERE CODIGO IN (códigos dos funcionários com cargo 6)
```

**Resultado:** ✓ 46 vendedores identificados e marcados

---

### 3. Valores de Pedidos 100x Maiores

**Problema:**
- Pedidos mostravam valores absurdos
- Exemplo: R$ 1.131.201,00 ao invés de R$ 11.312,01

**Causa:**
- VIEW `VW_RPT_PEDIDOSVENDAS` retornava valores em CENTAVOS
- Relatório FastReport exibia valores diretamente sem dividir por 100

**Solução:**
```sql
-- Script: corrigir-view-pedidos.sql
CREATE OR ALTER VIEW VW_RPT_PEDIDOSVENDAS AS
SELECT
  ...
  COALESCE(ped.vlr_total, 0) / 100.0 AS VLR_TOTAL,
  COALESCE(ped.vlr_produtos, 0) / 100.0 AS VLR_PRODUTOS,
  COALESCE(ped.vlr_desconto, 0) / 100.0 AS VLR_DESCONTO,
  COALESCE(ped.vlrfrete, 0) / 100.0 AS VLRFRETE,
  ...
FROM pedidos ped
...
```

**Resultado:** ✓ Relatórios agora exibem valores corretos em REAIS

---

### 4. QTDE_TOTAL Calculado Errado

**Problema:**
- QTDE_TOTAL somava IDs de produtos ao invés de quantidades
- Pedido 54088: 12.469.875.347,52 unidades (absurdo!)

**Causa:**
- Script estava somando `IDPRODUTO` ao invés de `QTDE`

**Solução:**
```sql
-- Script: corrigir-qtde-pedidos-v2.py
UPDATE PEDIDOS P
SET P.QTDE_TOTAL = (
    SELECT COALESCE(SUM(I.QTDE), 0)
    FROM PEDIDOS_ITENS I
    WHERE I.CODIGO = P.CODIGO
)
```

**Resultado:** ✓ 27.779 pedidos com QTDE_TOTAL corrigida

---

### 5. VLR_PRODUTOS Divergente

**Problema:**
- 1.405 pedidos com diferença entre VLR_PRODUTOS e soma dos itens
- Diferença total: R$ 227.938,11

**Causa:**
- VLR_PRODUTOS estava sendo calculado como `VLNOTA - VLFRETE`
- Deveria usar `VLPROD` diretamente ou somar os itens

**Solução:**
```python
# Script: corrigir-todos-vlr-produtos.py
# Calcular soma real dos itens
soma_itens = {}
for codigo, vlr_total in todos_itens:
    if codigo not in soma_itens:
        soma_itens[codigo] = 0
    soma_itens[codigo] += vlr_total

# Atualizar VLR_PRODUTOS
UPDATE PEDIDOS
SET VLR_PRODUTOS = <soma_dos_itens>
WHERE CODIGO = <codigo>
```

**Resultado:** ✓ 27.752 pedidos com VLR_PRODUTOS = soma dos itens

---

### 6. Frete e Desconto Não Migrados

**Problema:**
- VLRFRETE zerado em 27.723 pedidos
- VLR_DESCONTO zerado em 27.723 pedidos

**Causa:**
- Script de migração original não mapeou corretamente os campos

**Solução:**
```python
# Script: corrigir-frete-desconto.py
# Extrair dados do PostgreSQL
pg_restore --data-only --table=pedidos backup.bkp

# Atualizar Firebird
UPDATE PEDIDOS
SET VLRFRETE = <vlfrete * 100>,    # Converter para centavos
    VLR_DESCONTO = <vldesc * 100>  # Converter para centavos
WHERE CODIGO = <idpedido>
```

**Resultado:**
- ✓ 27.756 pedidos atualizados
- ✓ 5.596 pedidos com frete (total R$ 5.288.405,76)
- ✓ 329 pedidos com desconto (total R$ 63.324,05)

---

## 📝 Scripts Criados

### Scripts de Correção

| Script | Função | Status |
|--------|--------|--------|
| `corrigir-usuarios-vendedores.py` | Corrige nomes de usuários e marca vendedores | ✓ Executado |
| `corrigir-qtde-pedidos-v2.py` | Recalcula QTDE_TOTAL dos pedidos | ✓ Executado |
| `restaurar-valores-v2.py` | Restaura valores originais do PostgreSQL | ✓ Executado |
| `corrigir-vlr-produtos.py` | Corrige VLR_PRODUTOS = VLPROD | ✓ Executado |
| `corrigir-todos-vlr-produtos.py` | Ajusta VLR_PRODUTOS = soma dos itens | ✓ Executado |
| `aplicar-correcao-view-v2.py` | Modifica VIEW para dividir por 100 | ✓ Executado |
| `corrigir-frete-desconto.py` | Migra FRETE e DESCONTO do PostgreSQL | ✓ Executado |

### Scripts de Verificação

| Script | Função |
|--------|--------|
| `investigar-usuarios-vendedores.py` | Analisa usuários e vendedores |
| `comparar-bancos-completo.py` | Compara valores PG vs FB |
| `investigar-diferencas-valores.py` | Analisa divergências de valores |
| `identificar-pedidos-problema-v3.py` | Lista pedidos com problemas |
| `verificar-view-pedidos.py` | Verifica estrutura da VIEW |
| `verificar-54329-simples.py` | Verifica pedido específico |
| `comparar-pg-fb.py` | Compara valores específicos |

### Scripts SQL

| Arquivo | Função |
|---------|--------|
| `corrigir-view-pedidos.sql` | ALTER VIEW para correção dos valores |
| `pedidos-54329.sql` | Dump de dados do PostgreSQL |

---

## 🔄 Como Repetir a Migração

### Pré-requisitos

1. **Ferramentas Necessárias:**
   - Python 3.x
   - Biblioteca `fdb` (Firebird): `pip install fdb`
   - `pg_restore` (PostgreSQL tools)

2. **Arquivos Necessários:**
   - Backup do PostgreSQL: `bmcmdb.bkp`
   - Banco Firebird: `QRSISTEMA.FDB`

### Passo 1: Configuração Inicial

```bash
# Criar pasta de trabalho
mkdir C:\Projeto\Academia

# Instalar biblioteca Firebird
pip install fdb
```

### Passo 2: Extrair Dados do PostgreSQL

```bash
# Extrair tabela de pedidos
pg_restore --data-only --table=pedidos -f pedidos.sql backup.bkp

# Extrair tabela de funcionários
pg_restore --data-only --table=funcionarios -f funcionarios.sql backup.bkp
```

### Passo 3: Executar Scripts de Correção (ORDEM IMPORTANTE!)

```bash
# 1. Corrigir usuários e vendedores
python corrigir-usuarios-vendedores.py

# 2. Corrigir quantidade total
python corrigir-qtde-pedidos-v2.py

# 3. Corrigir valores de produtos
python corrigir-todos-vlr-produtos.py

# 4. Migrar frete e desconto
python corrigir-frete-desconto.py

# 5. Corrigir VIEW (último passo!)
python aplicar-correcao-view-v2.py
```

### Passo 4: Verificação

```bash
# Verificar pedidos
python verificar-54329-simples.py

# Comparar bancos
python comparar-bancos-completo.py
```

---

## 💻 Comandos Importantes

### Conectar no Firebird (Python)

```python
import fdb

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

con = fdb.connect(**fbConfig)
cur = con.cursor()
```

### Converter Valores (REAIS → CENTAVOS)

```python
# PostgreSQL: valores em REAIS
vlnota_pg = 59840.00  # R$ 59.840,00

# Firebird: valores em CENTAVOS (BIGINT)
vlr_total_fb = int(vlnota_pg * 100)  # 5984000

# Para exibir: dividir por 100
vlr_total_reais = float(vlr_total_fb) / 100  # 59840.00
```

### Atualizar Pedido no Firebird

```python
# Valores em centavos!
cur.execute("""
    UPDATE PEDIDOS
    SET VLR_TOTAL = ?,
        VLR_PRODUTOS = ?,
        VLRFRETE = ?,
        VLR_DESCONTO = ?
    WHERE CODIGO = ?
""", [vlr_total_centavos, vlr_produtos_centavos, vlr_frete_centavos, vlr_desc_centavos, codigo])

con.commit()
```

### Consultar VIEW Corrigida

```sql
-- A VIEW já retorna valores em REAIS (divididos por 100)
SELECT CODIGO, VLR_TOTAL, VLR_PRODUTO, VLR_FRETE, VLR_DESCONTO
FROM VW_RPT_PEDIDOSVENDAS
WHERE CODIGO = 54329;

-- Resultado:
-- VLR_TOTAL = 59840.00 (não 5984000)
```

---

## ✅ Verificações Pós-Migração

### 1. Verificar Usuários

```sql
-- Devem ter nomes reais, não "USUARIO_2"
SELECT CODIGO, USERNAME, NOME
FROM USUARIO
WHERE NOME LIKE 'USUARIO_%';

-- Resultado esperado: 0 registros
```

### 2. Verificar Vendedores

```sql
-- Devem ter 46 vendedores
SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'VENDEDOR';

-- Resultado esperado: 46
```

### 3. Verificar Valores dos Pedidos

```python
# Comparar alguns pedidos conhecidos
pedidos_teste = [54216, 54257, 54329]

for codigo in pedidos_teste:
    # Buscar no Firebird
    cur.execute("SELECT VLR_TOTAL FROM PEDIDOS WHERE CODIGO = ?", [codigo])
    vlr_fb_centavos = cur.fetchone()[0]
    vlr_fb_reais = vlr_fb_centavos / 100

    # Buscar no PostgreSQL (do backup)
    # vlr_pg_reais = ...

    # Comparar
    diferenca = abs(vlr_fb_reais - vlr_pg_reais)
    if diferenca < 0.01:
        print(f"Pedido {codigo}: OK")
    else:
        print(f"Pedido {codigo}: DIFERENÇA R$ {diferenca:.2f}")
```

### 4. Verificar Relatório

1. Abrir `QRSistema.exe`
2. Menu → Relatórios → Pedidos de Venda
3. Selecionar período
4. Clicar em "Visualizar"
5. Verificar se valores estão em REAIS (não centavos)

**Exemplo de valores corretos:**
- Pedido 54216: R$ 11.312,01 ✓
- Pedido 54257: R$ 42.082,02 ✓
- Pedido 54329: R$ 59.840,00 ✓

**Valores errados (antes da correção):**
- Pedido 54216: R$ 1.131.201,00 ✗

### 5. Verificar Integridade dos Dados

```sql
-- VLR_PRODUTOS deve ser igual à soma dos itens
SELECT P.CODIGO,
       P.VLR_PRODUTOS,
       (SELECT SUM(I.VLR_TOTAL) FROM PEDIDOS_ITENS I WHERE I.CODIGO = P.CODIGO) AS SOMA_ITENS
FROM PEDIDOS P
WHERE ABS(P.VLR_PRODUTOS - (SELECT COALESCE(SUM(I.VLR_TOTAL), 0) FROM PEDIDOS_ITENS I WHERE I.CODIGO = P.CODIGO)) > 100;

-- Resultado esperado: 0 registros (diferença < R$ 1,00)
```

---

## 🔧 Troubleshooting

### Erro: SQLCODE -804

**Problema:** `Incorrect values within SQLDA structure - empty pointer to data`

**Causa:** Agregações SQL com NULL no Firebird

**Solução:** Fazer agregação em Python ao invés de SQL

```python
# ❌ ERRADO (causa erro -804)
cur.execute("SELECT SUM(VLR_TOTAL) FROM PEDIDOS_ITENS WHERE CODIGO = ?", [codigo])

# ✓ CORRETO
cur.execute("SELECT CODIGO, VLR_TOTAL FROM PEDIDOS_ITENS")
todos_itens = cur.fetchall()

# Agregar em Python
soma_por_pedido = {}
for codigo, vlr in todos_itens:
    if codigo not in soma_por_pedido:
        soma_por_pedido[codigo] = 0
    soma_por_pedido[codigo] += vlr
```

### Erro: Column unknown - PRODUTO

**Problema:** Nome de coluna incorreto

**Solução:** Verificar estrutura da tabela

```sql
-- Ver colunas da tabela
SELECT RDB$FIELD_NAME
FROM RDB$RELATION_FIELDS
WHERE RDB$RELATION_NAME = 'PEDIDOS_ITENS'
ORDER BY RDB$FIELD_POSITION;

-- Usar nome correto: IDPRODUTO (não PRODUTO)
```

### VIEW Retorna Valores Errados

**Problema:** VIEW não divide por 100

**Solução:** Re-executar script de correção da VIEW

```bash
python aplicar-correcao-view-v2.py
```

---

## 📌 Notas Importantes

### Backup Antes de Executar

**SEMPRE faça backup antes de executar scripts de correção!**

```bash
# Backup do Firebird
copy "C:\QRSistema\db\QRSISTEMA.FDB" "C:\QRSistema\db\QRSISTEMA_BACKUP.FDB"
```

### Ordem de Execução

A ordem dos scripts é IMPORTANTE:

1. **Primeiro:** Corrigir usuários e vendedores
2. **Segundo:** Corrigir quantidades
3. **Terceiro:** Corrigir valores de produtos
4. **Quarto:** Migrar frete e desconto
5. **ÚLTIMO:** Corrigir VIEW (para não afetar scripts anteriores)

### Campos em CENTAVOS

No Firebird, valores monetários são BIGINT em **CENTAVOS**:

- `VLR_TOTAL`: centavos
- `VLR_PRODUTOS`: centavos
- `VLRFRETE`: centavos
- `VLR_DESCONTO`: centavos
- `VLR_UNIT`: centavos (em PEDIDOS_ITENS)

**Sempre multiplicar por 100 ao inserir/atualizar!**

### VIEW Corrigida

Após executar `aplicar-correcao-view-v2.py`, a VIEW `VW_RPT_PEDIDOSVENDAS` **já retorna valores em REAIS**.

Não precisa dividir por 100 ao usar a VIEW!

---

## 📊 Estatísticas Finais

### Dados Migrados

- **Usuários corrigidos:** 165
- **Vendedores identificados:** 46
- **Pedidos migrados:** 27.756
- **Pedidos com frete:** 5.596 (R$ 5.288.405,76)
- **Pedidos com desconto:** 329 (R$ 63.324,05)

### Taxa de Sucesso

- **Valores corretos:** 99,92% (27.733 de 27.756)
- **Pedidos com diferença < R$ 0,01:** 27.733
- **Pedidos com diferença R$ 0,01:** 23 (arredondamento)

### Tempo Estimado

- **Migração completa:** ~30 minutos
- **Correções:** ~2 horas
- **Verificação:** ~30 minutos
- **TOTAL:** ~3 horas

---

## 📞 Contato e Suporte

Para dúvidas sobre esta migração ou problemas encontrados, consulte:

1. Esta documentação
2. Scripts de verificação em `C:\Projeto\Academia\`
3. Logs de execução dos scripts

---

**Última atualização:** Dezembro 2025
**Versão do documento:** 1.0
**Status:** ✓ Migração concluída com sucesso
