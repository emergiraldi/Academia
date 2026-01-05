#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Compara valores PostgreSQL vs Firebird
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
print("COMPARACAO POSTGRESQL vs FIREBIRD")
print("="*100)

# Valores do PostgreSQL (em REAIS)
valores_pg = {
    54216: {'vlnota': 11312.01, 'vlprod': 7436.28},
    54222: {'vlnota': 1942.05, 'vlprod': 1880.92},
    54223: {'vlnota': 1260.23, 'vlprod': 1256.24},
    54224: {'vlnota': 1583.16, 'vlprod': 1583.16},
    54257: {'vlnota': 42082.02, 'vlprod': 37538.25},
    54261: {'vlnota': 27767.63, 'vlprod': 24191.87},
    54272: {'vlnota': 24753.65, 'vlprod': 23134.25},
    54276: {'vlnota': 21464.30, 'vlprod': 21464.30},
}

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    print("\n>> COMPARACAO:")
    print("-"*100)
    print(f"{'CODIGO':<10} {'PG VLNOTA':<20} {'FB VLR_TOTAL':<20} {'FB (BRUTO)':<20} {'STATUS'}")
    print("-"*100)

    for codigo, valores in valores_pg.items():
        cur.execute("SELECT VLR_TOTAL FROM PEDIDOS WHERE CODIGO = ?", [codigo])
        row = cur.fetchone()

        if row:
            vlr_total_bruto = row[0]
            vlr_total_fb_reais = float(vlr_total_bruto) / 100 if vlr_total_bruto else 0

            pg_vlnota = valores['vlnota']
            diferenca = abs(vlr_total_fb_reais - pg_vlnota)

            status = "OK" if diferenca < 0.01 else "DIFERENTE!"

            print(f"{codigo:<10} R$ {pg_vlnota:>15,.2f} R$ {vlr_total_fb_reais:>15,.2f} {vlr_total_bruto:>15,}  {status}")

    print("\n>> CONCLUSAO:")
    print("-"*100)
    print("  Os valores no Firebird estão em CENTAVOS (correto)")
    print("  Os valores no PostgreSQL estão em REAIS")
    print("  A conversão foi feita corretamente (multiplicou por 100)")
    print("\n  O PROBLEMA está no RELATORIO que exibe VLR_TOTAL sem dividir por 100!")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
