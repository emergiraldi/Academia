#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica quantos registros foram migrados para o Firebird
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

print("=== VERIFICACAO DA MIGRACAO ===\n")

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    print("[OK] Conectado ao Firebird\n")

    cur = con.cursor()

    # Contar produtos
    cur.execute("SELECT COUNT(*) FROM CAD_PRODUTOS")
    total_produtos = cur.fetchone()[0]

    # Contar contas a pagar
    cur.execute("SELECT COUNT(*) FROM FIN_CTAPAGAR")
    total_contas_pagar = cur.fetchone()[0]

    # Contar contas a receber
    cur.execute("SELECT COUNT(*) FROM FIN_CTARECEBER")
    total_contas_receber = cur.fetchone()[0]

    print(">>> REGISTROS NO FIREBIRD:")
    print("=" * 60)
    print(f"Produtos (CAD_PRODUTOS):           {total_produtos:,}")
    print(f"Contas a Pagar (FIN_CTAPAGAR):     {total_contas_pagar:,}")
    print(f"Contas a Receber (FIN_CTARECEBER): {total_contas_receber:,}")
    print("=" * 60)
    print(f"\nTOTAL DE REGISTROS MIGRADOS:       {total_produtos + total_contas_pagar + total_contas_receber:,}")

    # Mostrar alguns produtos de exemplo
    print("\n>>> EXEMPLOS DE PRODUTOS MIGRADOS:")
    print("-" * 60)
    cur.execute("""
        SELECT FIRST 5 CODIGO, NOME, PRC_VENDA, ATIVO
        FROM CAD_PRODUTOS
        ORDER BY CODIGO
    """)

    for row in cur:
        codigo, nome, preco, ativo = row
        preco_real = preco / 100.0  # Converter de centavos
        print(f"  {codigo:5} | {nome[:40]:40} | R$ {preco_real:8.2f} | {ativo}")

    con.close()
    print("\n[OK] Verificacao concluida!")

except Exception as e:
    print(f"[ERRO] {e}")
    import traceback
    traceback.print_exc()
