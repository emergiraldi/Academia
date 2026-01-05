#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ver estrutura da tabela PEDIDOS_ITENS
"""

import sys, codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

print("="*100)
print("ESTRUTURA DA TABELA PEDIDOS_ITENS")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Listar colunas
    cur.execute("""
        SELECT
            RDB$FIELD_NAME,
            RDB$FIELD_SOURCE
        FROM RDB$RELATION_FIELDS
        WHERE RDB$RELATION_NAME = 'PEDIDOS_ITENS'
        ORDER BY RDB$FIELD_POSITION
    """)

    colunas = cur.fetchall()

    print("\n>> COLUNAS DA TABELA PEDIDOS_ITENS:")
    print("-"*100)

    for idx, (nome, tipo) in enumerate(colunas, 1):
        print(f"  {idx:2}. {nome.strip():<30} ({tipo.strip()})")

    print(f"\nTotal: {len(colunas)} colunas")

    # Buscar um exemplo
    print("\n>> EXEMPLO (primeiro item do pedido 54329):")
    print("-"*100)

    cur.execute("SELECT FIRST 1 * FROM PEDIDOS_ITENS WHERE CODIGO = 54329")

    row = cur.fetchone()
    if row:
        print()
        for idx, col in enumerate(cur.description):
            col_name = col[0]
            valor = row[idx]
            print(f"  {col_name}: {valor}")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
