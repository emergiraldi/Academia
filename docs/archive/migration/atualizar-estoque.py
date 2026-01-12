#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Atualiza estoque dos produtos no Firebird com dados do PostgreSQL
"""

import sys
import codecs
import re

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

print("=== ATUALIZACAO DE ESTOQUE DOS PRODUTOS ===\n")

# Ler dados de estoque do PostgreSQL
print("Lendo dados de estoque do PostgreSQL...")
with open(r'c:\Projeto\Academia\estoque-extraido.sql', 'r', encoding='latin1') as f:
    conteudo = f.read()

estoques = []
linhas = conteudo.split('\n')
lendo_dados = False
colunas = []

for linha in linhas:
    # Detectar início de COPY
    match_copy = re.match(r'COPY public\.estoque \((.*?)\) FROM stdin;', linha)
    if match_copy:
        colunas = [c.strip() for c in match_copy.group(1).split(',')]
        lendo_dados = True
        continue

    # Detectar fim de dados
    if linha.strip() == '\\.':
        lendo_dados = False
        continue

    # Ler dados
    if lendo_dados and linha:
        valores = linha.split('\t')
        estoque = {}
        for idx, col in enumerate(colunas):
            if idx < len(valores):
                estoque[col] = None if valores[idx] == '\\N' else valores[idx]
        estoques.append(estoque)

print(f"Total de estoques lidos: {len(estoques):,}\n")

# Conectar ao Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    print("Atualizando produtos com dados de estoque...")
    atualizados = 0
    nao_encontrados = 0
    erros = 0

    for estoque in estoques:
        try:
            idproduto = int(estoque.get('idproduto') or 0)

            # Quantidade em estoque
            qtdest = float(estoque.get('qtdest') or 0)

            # Preços em centavos
            custo = int(float(estoque.get('custo') or 0) * 100)
            prevenda = int(float(estoque.get('prevenda') or 0) * 100)

            # Estoque mínimo e máximo
            estmin = float(estoque.get('estmin') or 0)
            estmax = float(estoque.get('estmax') or 0)

            # Verificar se o produto existe
            cur.execute("SELECT CODIGO FROM CAD_PRODUTOS WHERE CODIGO = ?", [idproduto])
            if not cur.fetchone():
                nao_encontrados += 1
                continue

            # Atualizar produto
            cur.execute("""
                UPDATE CAD_PRODUTOS SET
                    ESTOQUESALDO = ?,
                    PRC_CUSTO = ?,
                    PRC_VENDA = ?,
                    ESTOQUEMINIMO = ?,
                    ESTOQUEMAXIMO = ?
                WHERE CODIGO = ?
            """, [
                qtdest,
                custo,
                prevenda,
                estmin,
                estmax,
                idproduto
            ])

            atualizados += 1
            if atualizados % 1000 == 0:
                print(f"{atualizados} produtos atualizados...")
                con.commit()

        except Exception as erro:
            erros += 1
            if erros <= 5:
                print(f"Erro ao atualizar produto {estoque.get('idproduto')}: {erro}")

    con.commit()

    print(f"\n[OK] Atualizacao concluida!")
    print(f"  - Produtos atualizados: {atualizados:,}")
    print(f"  - Produtos nao encontrados: {nao_encontrados:,}")
    print(f"  - Erros: {erros}")

    # Verificar resultado
    print("\n>> Exemplos de produtos atualizados:")
    print("="*100)

    cur.execute("""
        SELECT FIRST 15
            CODIGO, NOME, ESTOQUESALDO, PRC_CUSTO, PRC_VENDA, ESTOQUEMINIMO, ESTOQUEMAXIMO
        FROM CAD_PRODUTOS
        WHERE CODIGO >= 1000 AND ESTOQUESALDO > 0
        ORDER BY CODIGO
    """)

    print(f"{'CODIGO':<10} {'NOME':<35} {'ESTOQUE':<10} {'CUSTO':<12} {'VENDA':<12} {'MIN':<8} {'MAX'}")
    print("-"*100)

    for row in cur:
        codigo, nome, estoque_val, custo_val, venda_val, est_min, est_max = row
        nome_trunc = (nome or '')[:33]
        custo_real = custo_val / 100.0 if custo_val else 0
        venda_real = venda_val / 100.0 if venda_val else 0

        print(f"{codigo:<10} {nome_trunc:<35} {estoque_val:<10.2f} R$ {custo_real:>7.2f}  R$ {venda_real:>7.2f}  {est_min:<8.1f} {est_max:.1f}")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
    exit(1)
