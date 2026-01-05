#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Atualiza produtos com UNIDADE e NCM corretos
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

print("=== ATUALIZACAO DE PRODUTOS (UNIDADE E NCM) ===\n")

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Contar produtos antes
    cur.execute("SELECT COUNT(*) FROM CAD_PRODUTOS")
    total_antes = cur.fetchone()[0]
    print(f"Produtos no Firebird antes: {total_antes:,}")

    # Deletar apenas produtos migrados (códigos > 1000)
    print("\nDeletando produtos migrados...")
    cur.execute("DELETE FROM CAD_PRODUTOS WHERE CODIGO >= 1000")
    con.commit()

    # Contar produtos depois
    cur.execute("SELECT COUNT(*) FROM CAD_PRODUTOS")
    total_depois = cur.fetchone()[0]
    print(f"Produtos no Firebird apos: {total_depois:,}")
    print(f"Deletados: {total_antes - total_depois:,}")

    con.close()

    print("\n[OK] Produtos deletados com sucesso!")
    print("Agora execute: python migracao-dados.py")

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
    exit(1)
