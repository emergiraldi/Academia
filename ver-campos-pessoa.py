#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys, codecs
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
    con = fdb.connect(database=r'C:\QRSistema\db\QRSISTEMA.FDB', user='sysdba', password='masterkey')
    cur = con.cursor()

    cur.execute("""
        SELECT RDB$FIELD_NAME
        FROM RDB$RELATION_FIELDS
        WHERE RDB$RELATION_NAME = 'CAD_PESSOA'
        ORDER BY RDB$FIELD_POSITION
    """)

    print("Campos da tabela CAD_PESSOA:")
    for row in cur.fetchall():
        print(f"  {row[0].strip()}")

    con.close()
except Exception as e:
    print(f"Erro: {e}")
