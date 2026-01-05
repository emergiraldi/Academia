#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ver estrutura da tabela CAD_PRODUTOS
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

    # Listar todos os campos da tabela
    cur.execute("""
        SELECT RDB$FIELD_NAME
        FROM RDB$RELATION_FIELDS
        WHERE RDB$RELATION_NAME = 'CAD_PRODUTOS'
        ORDER BY RDB$FIELD_POSITION
    """)

    print("="*80)
    print("CAMPOS DA TABELA CAD_PRODUTOS:")
    print("="*80)

    campos = [row[0].strip() for row in cur.fetchall()]
    for i, campo in enumerate(campos, 1):
        print(f"{i:3}. {campo}")

    # Agora vamos ver TODOS os campos do produto 81115
    print("\n" + "="*80)
    print("DADOS DO PRODUTO 81115 (TODOS OS CAMPOS):")
    print("="*80)

    # Construir query com todos os campos
    campos_query = ", ".join(campos)
    cur.execute(f"SELECT {campos_query} FROM CAD_PRODUTOS WHERE CODIGO = 81115")

    row = cur.fetchone()
    if row:
        for i, campo in enumerate(campos):
            valor = row[i]
            if valor is not None:
                if isinstance(valor, str):
                    valor = f"[{valor.strip()}]"
                print(f"  {campo:<30} = {valor}")
            else:
                print(f"  {campo:<30} = [NULL]")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
