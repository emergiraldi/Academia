# Guia Rápido - Migração PostgreSQL → Firebird

**✅ Checklist para Repetir a Migração**

---

## ⚠️ ANTES DE COMEÇAR

```bash
# 1. FAZER BACKUP DO FIREBIRD!
copy "C:\QRSistema\db\QRSISTEMA.FDB" "C:\QRSistema\db\QRSISTEMA_BACKUP_[DATA].FDB"

# 2. Verificar se tem backup do PostgreSQL
dir "C:\Mac\Home\Documents\bkp brabancia\bmcmdb.bkp"
```

---

## 📝 Passo 1: Extrair Dados do PostgreSQL

```bash
cd C:\Projeto\Academia

# Extrair tabela pedidos
"c:\Projeto\Academia\pg-tools\pgsql\bin\pg_restore.exe" --data-only --table=pedidos -f "pedidos.sql" "C:\Mac\Home\Documents\bkp brabancia\bmcmdb.bkp"

# Verificar se extraiu
dir pedidos.sql
```

**✓ Deve criar arquivo `pedidos.sql` com ~27 mil linhas**

---

## 📝 Passo 2: Corrigir Usuários e Vendedores

```bash
python corrigir-usuarios-vendedores.py
```

**Resultado esperado:**
- ✓ 165 usuários corrigidos
- ✓ 46 vendedores marcados

---

## 📝 Passo 3: Corrigir Quantidades

```bash
python corrigir-qtde-pedidos-v2.py
```

**Resultado esperado:**
- ✓ 27.779 pedidos atualizados
- ✓ QTDE_TOTAL = soma das quantidades dos itens

---

## 📝 Passo 4: Corrigir Valores dos Produtos

```bash
python corrigir-todos-vlr-produtos.py
```

**Resultado esperado:**
- ✓ 27.752 pedidos atualizados
- ✓ VLR_PRODUTOS = soma dos itens
- ✓ 0 pedidos com diferença > R$ 1,00

---

## 📝 Passo 5: Migrar Frete e Desconto

```bash
python corrigir-frete-desconto.py
```

**Resultado esperado:**
- ✓ 27.756 pedidos atualizados
- ✓ ~5.500 pedidos com frete
- ✓ ~300 pedidos com desconto

---

## 📝 Passo 6: Corrigir VIEW (ÚLTIMO!)

```bash
python aplicar-correcao-view-v2.py
```

**Resultado esperado:**
- ✓ VIEW alterada com sucesso
- ✓ Valores agora divididos por 100

---

## ✅ Verificação Final

### 1. Verificar Usuários

```bash
python investigar-usuarios-vendedores.py
```

**Deve mostrar:**
- Nomes reais (não "USUARIO_2")
- 46 vendedores

### 2. Verificar Pedido Específico

```bash
python verificar-54329-simples.py
```

**Deve mostrar:**
- VLR_TOTAL: R$ 59.840,00
- VLR_PRODUTOS: R$ 53.934,15
- Soma dos itens: R$ 53.934,15

### 3. Testar no Sistema

1. Abrir `QRSistema.exe`
2. Menu → Relatórios → Pedidos de Venda
3. Período: 23/12/2020 a 23/12/2030
4. Clicar "Visualizar"

**Verificar:**
- ✓ Pedido 54216: R$ 11.312,01 (não R$ 1.131.201,00)
- ✓ Pedido 54257: R$ 42.082,02 (não R$ 4.208.202,00)
- ✓ Pedido 54329: R$ 59.840,00 (não R$ 5.984.000,00)

---

## 🔥 Problemas Comuns

### Erro: "Biblioteca fdb nao encontrada"

```bash
pip install fdb
```

### Erro: "pg_restore não encontrado"

```bash
# Verificar se existe
dir "c:\Projeto\Academia\pg-tools\pgsql\bin\pg_restore.exe"

# Se não existir, descompactar PostgreSQL tools
```

### VIEW não divide por 100

```bash
# Re-executar correção da VIEW
python aplicar-correcao-view-v2.py
```

### Pedidos com valores errados

```bash
# Re-executar correções na ordem:
python corrigir-todos-vlr-produtos.py
python corrigir-frete-desconto.py
python aplicar-correcao-view-v2.py
```

---

## 📊 Checklist de Verificação

Antes de considerar a migração concluída, verificar:

- [ ] Backup do Firebird criado
- [ ] 165 usuários com nomes reais
- [ ] 46 vendedores cadastrados
- [ ] 27.756 pedidos migrados
- [ ] ~5.500 pedidos com frete
- [ ] ~300 pedidos com desconto
- [ ] VIEW retorna valores em REAIS
- [ ] Relatório mostra valores corretos
- [ ] Pedido 54329 = R$ 59.840,00
- [ ] Pedido 54216 = R$ 11.312,01
- [ ] Pedido 54257 = R$ 42.082,02

**✓ Todos os itens OK = Migração concluída!**

---

## 📂 Arquivos Importantes

**Scripts de Correção:**
- `corrigir-usuarios-vendedores.py`
- `corrigir-qtde-pedidos-v2.py`
- `corrigir-todos-vlr-produtos.py`
- `corrigir-frete-desconto.py`
- `aplicar-correcao-view-v2.py`

**Scripts de Verificação:**
- `verificar-54329-simples.py`
- `investigar-usuarios-vendedores.py`
- `comparar-bancos-completo.py`

**Documentação:**
- `doc/MIGRACAO-POSTGRESQL-FIREBIRD.md` (completa)
- `doc/GUIA-RAPIDO-MIGRACAO.md` (este arquivo)

---

## ⏱️ Tempo Estimado

- Passo 1 (Extração): ~5 minutos
- Passo 2 (Usuários): ~2 minutos
- Passo 3 (Quantidades): ~3 minutos
- Passo 4 (Valores): ~5 minutos
- Passo 5 (Frete/Desconto): ~10 minutos
- Passo 6 (VIEW): ~1 minuto
- Verificação: ~5 minutos

**TOTAL: ~30 minutos**

---

## 💡 Dicas

1. **Execute um script por vez** e verifique o resultado antes de prosseguir
2. **Sempre faça backup** antes de executar correções
3. **A ordem é importante** - não pule passos!
4. **VIEW deve ser o último passo** - se executar antes, os outros scripts podem falhar
5. **Use os scripts de verificação** para confirmar que tudo está correto

---

**Última atualização:** Dezembro 2025
