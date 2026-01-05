# Documentação da Migração PostgreSQL → Firebird

Esta pasta contém toda a documentação da migração realizada do banco PostgreSQL para o Firebird do sistema QRSistema.

---

## 📚 Arquivos Disponíveis

### 1. [MIGRACAO-POSTGRESQL-FIREBIRD.md](MIGRACAO-POSTGRESQL-FIREBIRD.md)
**Documentação Completa - 13.8 KB**

Este é o documento **MAIS COMPLETO** com todas as informações da migração:

- Resumo da migração (dados, conversões)
- Problemas encontrados e soluções detalhadas
- Scripts criados (correção e verificação)
- **Como repetir a migração** (passo a passo completo)
- Comandos importantes (Python, SQL)
- Verificações pós-migração
- Troubleshooting
- Estatísticas finais

**📖 Use quando:** Precisar de informações detalhadas ou estiver fazendo a migração pela primeira vez.

---

### 2. [GUIA-RAPIDO-MIGRACAO.md](GUIA-RAPIDO-MIGRACAO.md)
**Checklist Rápido - 4.8 KB**

Guia **PASSO-A-PASSO DIRETO** para repetir a migração:

- ✅ Checklist de execução
- 6 passos numerados com comandos prontos
- Resultados esperados de cada passo
- Verificação final
- Problemas comuns e soluções rápidas
- Tempo estimado: ~30 minutos

**🚀 Use quando:** Já conhece o processo e só precisa lembrar a ordem dos passos.

---

### 3. [PROBLEMAS-E-SOLUCOES.md](PROBLEMAS-E-SOLUCOES.md)
**FAQ - 9.6 KB**

Lista de **TODOS OS PROBLEMAS** encontrados em formato pergunta/resposta:

- 10 problemas principais com sintomas
- Por que cada problema aconteceu
- Como identificar cada problema
- Solução específica para cada um
- Diagnóstico rápido (checklist)
- Emergência: como reverter migração

**🔍 Use quando:** Encontrar um problema específico e precisar da solução.

---

### 4. [README.md](README.md)
**Este arquivo - 2.6 KB**

Guia de navegação dos documentos.

---

## 🗂️ Estrutura do Projeto

```
C:\Projeto\Academia\
├── doc\                              ← Documentação (esta pasta)
│   ├── MIGRACAO-POSTGRESQL-FIREBIRD.md
│   ├── GUIA-RAPIDO-MIGRACAO.md
│   ├── PROBLEMAS-E-SOLUCOES.md
│   └── README.md
│
├── Scripts de Correção:
│   ├── corrigir-usuarios-vendedores.py
│   ├── corrigir-qtde-pedidos-v2.py
│   ├── corrigir-todos-vlr-produtos.py
│   ├── corrigir-frete-desconto.py
│   └── aplicar-correcao-view-v2.py
│
├── Scripts de Verificação:
│   ├── verificar-54329-simples.py
│   ├── investigar-usuarios-vendedores.py
│   ├── comparar-bancos-completo.py
│   ├── identificar-pedidos-problema-v3.py
│   └── verificar-view-pedidos.py
│
└── Arquivos SQL:
    ├── pedidos.sql (gerado pelo pg_restore)
    └── corrigir-view-pedidos.sql
```

---

## 🎯 Qual Documento Usar?

### Cenário 1: Primeira Migração
**→ Comece com:** `MIGRACAO-POSTGRESQL-FIREBIRD.md`

Leia todo o documento para entender o processo completo antes de executar.

### Cenário 2: Repetir Migração
**→ Use:** `GUIA-RAPIDO-MIGRACAO.md`

Siga o checklist passo-a-passo. Se tiver dúvidas, consulte o documento completo.

### Cenário 3: Problema Específico
**→ Consulte:** `PROBLEMAS-E-SOLUCOES.md`

Procure o problema na lista (use Ctrl+F) e aplique a solução específica.

### Cenário 4: Novos Dados
**→ Use:** `GUIA-RAPIDO-MIGRACAO.md` + Scripts

Quando restaurar uma versão mais nova do banco PostgreSQL:
1. Seguir checklist do Guia Rápido
2. Executar scripts na ordem correta
3. Verificar resultados

---

## ⚠️ Importante Lembrar

### Antes de Executar

1. **SEMPRE fazer backup do Firebird:**
   ```bash
   copy "C:\QRSistema\db\QRSISTEMA.FDB" "C:\QRSistema\db\QRSISTEMA_BACKUP_[DATA].FDB"
   ```

2. **Executar scripts na ordem correta:**
   - Usuários/Vendedores
   - Quantidades
   - Valores de Produtos
   - Frete/Desconto
   - VIEW (último!)

3. **Verificar cada passo** antes de prosseguir.

### Após Executar

1. Verificar usuários (nomes reais, não genéricos)
2. Verificar vendedores (46 ao total)
3. Verificar valores no relatório (não 100x maiores)
4. Testar alguns pedidos conhecidos

---

## 📊 Estatísticas da Migração

- **Pedidos migrados:** 27.756
- **Usuários corrigidos:** 165
- **Vendedores identificados:** 46
- **Pedidos com frete:** 5.596 (R$ 5,3 milhões)
- **Pedidos com desconto:** 329 (R$ 63 mil)
- **Taxa de sucesso:** 99,92%
- **Tempo total:** ~30 minutos

---

## 🔗 Links Úteis

- **Banco Origem:** PostgreSQL `bmcmdb`
- **Banco Destino:** Firebird `C:\QRSistema\db\QRSISTEMA.FDB`
- **Backup PostgreSQL:** `C:\Mac\Home\Documents\bkp brabancia\bmcmdb.bkp`
- **PostgreSQL Tools:** `c:\Projeto\Academia\pg-tools\pgsql\bin\`

---

## 🆘 Em Caso de Problemas

1. **Consulte:** [PROBLEMAS-E-SOLUCOES.md](PROBLEMAS-E-SOLUCOES.md)
2. **Execute scripts de verificação** para diagnosticar
3. **Se necessário, restaure backup** e tente novamente
4. **Sempre execute na ordem correta!**

---

## 📝 Notas

- Valores no Firebird são armazenados em **CENTAVOS** (BIGINT)
- Sempre multiplicar por 100 ao inserir/atualizar
- VIEW já retorna valores em REAIS (divididos por 100)
- Ordem de execução é CRÍTICA!

---

**Última atualização:** Dezembro 2025
**Versão:** 1.0
**Status:** ✅ Migração concluída com sucesso
