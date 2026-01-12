#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica produtos migrados com todos os dados
"""

import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

print("=== VERIFICACAO DE PRODUTOS MIGRADOS ===\n")

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Contar total de produtos
    cur.execute("SELECT COUNT(*) FROM CAD_PRODUTOS")
    total = cur.fetchone()[0]
    print(f"Total de produtos: {total:,}\n")

    # Verificar produtos com unidade e NCM
    cur.execute("""
        SELECT COUNT(*) FROM CAD_PRODUTOS
        WHERE UNIDADE IS NOT NULL AND UNIDADE != 'UN'
    """)
    com_unidade = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) FROM CAD_PRODUTOS
        WHERE TABELA_NCM IS NOT NULL AND TABELA_NCM != ''
    """)
    com_ncm = cur.fetchone()[0]

    print(f"Produtos com unidade diferente de 'UN': {com_unidade:,}")
    print(f"Produtos com NCM preenchido: {com_ncm:,}\n")

    # Mostrar exemplos de produtos
    print("="*80)
    print("EXEMPLOS DE PRODUTOS MIGRADOS:")
    print("="*80)

    cur.execute("""
        SELECT FIRST 15
            CODIGO, NOME, UNIDADE, TABELA_NCM, PRC_VENDA, PESO, MARCA_ID
        FROM CAD_PRODUTOS
        WHERE CODIGO >= 1000
        ORDER BY CODIGO
    """)

    print(f"{'CODIGO':<10} {'NOME':<30} {'UN':<5} {'NCM':<12} {'PRECO':<10} {'PESO':<8} {'MARCA'}")
    print("-"*80)

    for row in cur:
        codigo, nome, unidade, ncm, preco, peso, marca = row
        preco_real = preco / 100.0 if preco else 0
        nome_trunc = (nome or '')[:28]
        unidade_str = unidade or ''
        ncm_str = ncm or ''
        peso_str = f"{peso:.2f}" if peso else ''
        marca_str = str(marca) if marca else ''

        print(f"{codigo:<10} {nome_trunc:<30} {unidade_str:<5} {ncm_str:<12} R${preco_real:>7.2f}  {peso_str:<8} {marca_str}")

    # Estatísticas por unidade
    print("\n" + "="*80)
    print("DISTRIBUICAO POR UNIDADE:")
    print("="*80)

    cur.execute("""
        SELECT UNIDADE, COUNT(*) as QTDE
        FROM CAD_PRODUTOS
        WHERE CODIGO >= 1000
        GROUP BY UNIDADE
        ORDER BY QTDE DESC
    """)

    print(f"{'UNIDADE':<10} {'QUANTIDADE':<15}")
    print("-"*25)
    for row in cur:
        unidade, qtde = row
        print(f"{unidade or '(vazio)':<10} {qtde:>10,}")

    con.close()

    print("\n[OK] Verificacao concluida!")

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
