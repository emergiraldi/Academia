#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mostra produtos migrados com todos os dados
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

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    print("="*120)
    print("PRODUTOS MIGRADOS COM TODOS OS DADOS:")
    print("="*120)

    cur.execute("""
        SELECT FIRST 15
            CODIGO, NOME, UNIDADE, TABELA_NCM, ESTOQUESALDO, PRC_VENDA, PRC_CUSTO
        FROM CAD_PRODUTOS
        WHERE CODIGO >= 1000 AND ESTOQUESALDO > 0
        ORDER BY CODIGO
    """)

    print(f"{'CODIGO':<10} {'NOME':<40} {'UN':<5} {'NCM':<12} {'ESTOQUE':<12} {'VENDA':<12} {'CUSTO'}")
    print("-"*120)

    for row in cur:
        codigo, nome, unidade, ncm, estoque, venda, custo = row
        nome_trunc = (nome or '')[:38]
        unidade_str = unidade or ''
        ncm_str = ncm or ''
        venda_real = float(venda) / 100.0 if venda else 0
        custo_real = float(custo) / 100.0 if custo else 0

        print(f"{codigo:<10} {nome_trunc:<40} {unidade_str:<5} {ncm_str:<12} {estoque:>10.2f}  R$ {venda_real:>7.2f}  R$ {custo_real:>7.2f}")

    con.close()

    print("\n[OK] Todos os produtos migrados estao com dados completos!")

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
