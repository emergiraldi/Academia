# Problemas Encontrados e Soluções - FAQ

**Migração PostgreSQL → Firebird**

---

## 🔴 Problema 1: Usuários com Nomes Genéricos

### Sintoma
```
USUARIO_2
USUARIO_3
USUARIO_4
...
```

### Por que aconteceu?
O script de migração estava usando o campo `LOGIN` que não existe na tabela `USUARIO` do Firebird. O campo correto é `USERNAME`.

### Como identificar?
```sql
SELECT CODIGO, USERNAME, NOME
FROM USUARIO
WHERE NOME LIKE 'USUARIO_%';
```

Se retornar registros, tem problema!

### Solução
```bash
python corrigir-usuarios-vendedores.py
```

Este script:
1. Busca dados dos funcionários no PostgreSQL
2. Atualiza o campo `NOME` na tabela `USUARIO` com os nomes reais
3. Atualiza o campo `NOMEABREVIADO` com versão abreviada

### Resultado esperado
165 usuários com nomes reais (ex: "SUZANA NAZARIO ANDRZEJEWSKI")

---

## 🔴 Problema 2: Poucos Vendedores

### Sintoma
Apenas 1 vendedor (THIAGO) no sistema, mas deveriam ter mais.

### Por que aconteceu?
Vendedores no PostgreSQL são identificados pelo campo `cargo = 6`. O script de migração não mapeou isso corretamente para o campo `TIPO = 'VENDEDOR'` no Firebird.

### Como identificar?
```sql
SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'VENDEDOR';
```

Deve retornar 46. Se retornar menos, tem problema!

### Solução
```bash
python corrigir-usuarios-vendedores.py
```

O mesmo script que corrige usuários também marca os vendedores.

### Resultado esperado
46 vendedores marcados com `TIPO = 'VENDEDOR'`

---

## 🔴 Problema 3: Valores 100x Maiores no Relatório

### Sintoma
```
Pedido 54216: R$ 1.131.201,00  ❌ (deveria ser R$ 11.312,01)
Pedido 54257: R$ 4.208.202,00  ❌ (deveria ser R$ 42.082,02)
```

### Por que aconteceu?
No Firebird, valores monetários são armazenados em **CENTAVOS** (BIGINT).

Exemplo:
- PostgreSQL: `11312.01` (DECIMAL em reais)
- Firebird: `1131201` (BIGINT em centavos)

A VIEW `VW_RPT_PEDIDOSVENDAS` retornava o valor bruto em centavos (`1131201`), e o relatório FastReport exibia diretamente como `1.131.201,00` ao invés de dividir por 100.

### Como identificar?
Gerar o "Relatório de Pedidos de Venda" e verificar se os valores estão absurdos (milhões).

### Solução
```bash
python aplicar-correcao-view-v2.py
```

Este script altera a VIEW para dividir automaticamente por 100:

```sql
CREATE OR ALTER VIEW VW_RPT_PEDIDOSVENDAS AS
SELECT
  ...
  COALESCE(ped.vlr_total, 0) / 100.0 AS VLR_TOTAL,
  COALESCE(ped.vlr_produtos, 0) / 100.0 AS VLR_PRODUTOS,
  ...
```

### Resultado esperado
Relatório mostra valores corretos em REAIS.

---

## 🔴 Problema 4: QTDE_TOTAL Absurdo

### Sintoma
```
Pedido 54088: 12.469.875.347,52 unidades  ❌
```

### Por que aconteceu?
O script estava somando os **IDs dos produtos** ao invés das **quantidades**.

```sql
-- ❌ ERRADO
SUM(IDPRODUTO)  -- Soma IDs (66723 + 151009 + ...)

-- ✓ CORRETO
SUM(QTDE)  -- Soma quantidades (45 + 360 + ...)
```

### Como identificar?
```sql
SELECT CODIGO, QTDE_TOTAL
FROM PEDIDOS
WHERE QTDE_TOTAL > 100000;
```

Se retornar registros, tem problema!

### Solução
```bash
python corrigir-qtde-pedidos-v2.py
```

Este script recalcula corretamente:

```sql
UPDATE PEDIDOS P
SET P.QTDE_TOTAL = (
    SELECT COALESCE(SUM(I.QTDE), 0)
    FROM PEDIDOS_ITENS I
    WHERE I.CODIGO = P.CODIGO
)
```

### Resultado esperado
27.779 pedidos com QTDE_TOTAL correto (valores realistas como 4, 10, 25 unidades).

---

## 🔴 Problema 5: VLR_PRODUTOS Diferente da Soma dos Itens

### Sintoma
```
Pedido 24637:
  VLR_PRODUTOS: R$ 17.744,34
  Soma dos itens: R$ 14.620,03
  Diferença: R$ 3.124,31  ❌
```

### Por que aconteceu?
O script estava calculando `VLR_PRODUTOS = VLNOTA - VLFRETE`, o que incluía impostos e outros valores indevidamente. O correto é usar o campo `VLPROD` do PostgreSQL ou somar os itens.

### Como identificar?
```bash
python identificar-pedidos-problema-v3.py
```

Lista pedidos com diferença > R$ 1,00.

### Solução
```bash
python corrigir-todos-vlr-produtos.py
```

Este script:
1. Busca TODOS os itens de TODOS os pedidos
2. Calcula a soma em Python (evita erro -804 do Firebird)
3. Atualiza `VLR_PRODUTOS` com a soma correta

### Resultado esperado
- 27.752 pedidos atualizados
- 0 pedidos com diferença > R$ 1,00

---

## 🔴 Problema 6: Frete e Desconto Zerados

### Sintoma
```
Pedido 54329:
  PostgreSQL: VLFRETE = R$ 6.472,09
  Firebird: VLRFRETE = R$ 0,00  ❌

  PostgreSQL: VLDESC = R$ 1.752,86
  Firebird: VLR_DESCONTO = R$ 0,00  ❌
```

### Por que aconteceu?
O script de migração original não mapeou corretamente esses campos do PostgreSQL para o Firebird.

### Como identificar?
```sql
SELECT COUNT(*)
FROM PEDIDOS
WHERE (VLRFRETE = 0 OR VLRFRETE IS NULL)
  OR (VLR_DESCONTO = 0 OR VLR_DESCONTO IS NULL);
```

Se retornar ~27 mil registros, tem problema!

### Solução
```bash
python corrigir-frete-desconto.py
```

Este script:
1. Extrai dados da tabela `pedidos` do PostgreSQL
2. Para cada pedido, busca `vlfrete` e `vldescontos`
3. Converte para centavos (×100)
4. Atualiza no Firebird

### Resultado esperado
- 27.756 pedidos atualizados
- ~5.500 pedidos com frete (total R$ 5.288.405,76)
- ~300 pedidos com desconto (total R$ 63.324,05)

---

## 🔴 Problema 7: Erro SQLCODE -804

### Sintoma
```
Error: SQLCODE -804
Incorrect values within SQLDA structure
empty pointer to data
```

### Por que aconteceu?
Firebird tem problemas com agregações SQL quando há valores NULL.

```sql
-- ❌ Causa erro -804
SELECT SUM(VLR_TOTAL)
FROM PEDIDOS_ITENS
WHERE CODIGO = ?
```

### Solução
Fazer agregação em **Python** ao invés de SQL:

```python
# ✓ CORRETO
cur.execute("SELECT CODIGO, VLR_TOTAL FROM PEDIDOS_ITENS")
todos_itens = cur.fetchall()

soma_por_pedido = {}
for codigo, vlr_total in todos_itens:
    if codigo not in soma_por_pedido:
        soma_por_pedido[codigo] = 0
    soma_por_pedido[codigo] += vlr_total if vlr_total else 0
```

---

## 🔴 Problema 8: Column unknown - PRODUTO

### Sintoma
```
Error: Column unknown - PRODUTO
```

### Por que aconteceu?
Nome de coluna errado. Na tabela `PEDIDOS_ITENS` do Firebird, o campo é `IDPRODUTO`, não `PRODUTO`.

### Como identificar?
```sql
SELECT RDB$FIELD_NAME
FROM RDB$RELATION_FIELDS
WHERE RDB$RELATION_NAME = 'PEDIDOS_ITENS';
```

### Solução
Usar o nome correto:

```sql
-- ❌ ERRADO
SELECT PRODUTO FROM PEDIDOS_ITENS

-- ✓ CORRETO
SELECT IDPRODUTO FROM PEDIDOS_ITENS
```

---

## 🔴 Problema 9: VIEW Retorna Valores em Centavos

### Sintoma
Mesmo depois de corrigir a VIEW, ela ainda retorna valores grandes (em centavos).

### Por que aconteceu?
A VIEW não foi alterada corretamente ou o cache não foi limpo.

### Solução
```bash
# Re-executar correção da VIEW
python aplicar-correcao-view-v2.py

# Ou executar SQL manualmente no IBExpert/FlameRobin
```

Verificar se a VIEW está correta:

```sql
-- Deve retornar valor em REAIS (não centavos)
SELECT VLR_TOTAL FROM VW_RPT_PEDIDOSVENDAS WHERE CODIGO = 54329;

-- Resultado esperado: 59840.00 (não 5984000)
```

---

## 🔴 Problema 10: Relatório Ainda Mostra Valores Errados

### Sintoma
Mesmo depois de corrigir a VIEW, o relatório ainda mostra valores 100x maiores.

### Possíveis causas

#### Causa 1: VIEW não foi alterada
```bash
python aplicar-correcao-view-v2.py
```

#### Causa 2: Sistema não foi reiniciado
Fechar e reabrir `QRSistema.exe`

#### Causa 3: Cache do relatório
Limpar cache:
1. Fechar `QRSistema.exe`
2. Deletar arquivos temporários
3. Reabrir sistema

#### Causa 4: VIEW foi alterada ANTES das correções
Se você executou `aplicar-correcao-view-v2.py` ANTES dos outros scripts, eles podem ter usado valores errados.

**Solução:** Re-executar TODOS os scripts na ordem correta:
```bash
python corrigir-usuarios-vendedores.py
python corrigir-qtde-pedidos-v2.py
python corrigir-todos-vlr-produtos.py
python corrigir-frete-desconto.py
python aplicar-correcao-view-v2.py  # ÚLTIMO!
```

---

## 📊 Diagnóstico Rápido

Use este checklist para diagnosticar problemas:

### 1. Verificar Usuários
```sql
SELECT COUNT(*) FROM USUARIO WHERE NOME LIKE 'USUARIO_%';
```
**Esperado:** 0

### 2. Verificar Vendedores
```sql
SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'VENDEDOR';
```
**Esperado:** 46

### 3. Verificar QTDE_TOTAL
```sql
SELECT COUNT(*) FROM PEDIDOS WHERE QTDE_TOTAL > 100000;
```
**Esperado:** 0

### 4. Verificar VLR_PRODUTOS
```bash
python identificar-pedidos-problema-v3.py
```
**Esperado:** 0 pedidos com diferença > R$ 1,00

### 5. Verificar Frete
```sql
SELECT COUNT(*) FROM PEDIDOS WHERE VLRFRETE > 0;
```
**Esperado:** ~5.500

### 6. Verificar Desconto
```sql
SELECT COUNT(*) FROM PEDIDOS WHERE VLR_DESCONTO > 0;
```
**Esperado:** ~300

### 7. Verificar VIEW
```sql
SELECT VLR_TOTAL FROM VW_RPT_PEDIDOSVENDAS WHERE CODIGO = 54329;
```
**Esperado:** 59840.00 (não 5984000)

### 8. Verificar Relatório
Gerar relatório e verificar pedido 54216.
**Esperado:** R$ 11.312,01 (não R$ 1.131.201,00)

---

## 🆘 Emergência: Reverter Migração

Se algo der muito errado e precisar voltar atrás:

```bash
# 1. Fechar QRSistema.exe

# 2. Restaurar backup
copy "C:\QRSistema\db\QRSISTEMA_BACKUP.FDB" "C:\QRSistema\db\QRSISTEMA.FDB"

# 3. Reabrir sistema e verificar
```

**SEMPRE FAÇA BACKUP ANTES DE EXECUTAR CORREÇÕES!**

---

## 📞 Onde Encontrar Ajuda

1. **Documentação completa:** `doc/MIGRACAO-POSTGRESQL-FIREBIRD.md`
2. **Guia rápido:** `doc/GUIA-RAPIDO-MIGRACAO.md`
3. **Scripts de verificação:** `C:\Projeto\Academia\*.py`
4. **Este FAQ:** `doc/PROBLEMAS-E-SOLUCOES.md`

---

**Última atualização:** Dezembro 2025
