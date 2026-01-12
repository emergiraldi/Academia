#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica o pedido 54329 no PostgreSQL e Firebird
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
print("VERIFICANDO PEDIDO 54329 - POSTGRESQL vs FIREBIRD")
print("="*100)

# =======================
# 1. VERIFICAR POSTGRESQL
# =======================
print("\n>> 1. POSTGRESQL:")
print("-"*100)

# Ler do dump do PostgreSQL
import os

dump_dir = r'C:\Mac\Home\Documents\bkp brabancia'
dump_file = os.path.join(dump_dir, 'bmcmdb_pedidos.txt')

pg_values = None

if os.path.exists(dump_file):
    print(f"  Procurando pedido 54329 em: {dump_file}")

    found = False
    with open(dump_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if line.startswith('54329\t'):
                parts = line.strip().split('\t')

                if len(parts) >= 20:
                    idpedido = parts[0]
                    vlnota = parts[11] if len(parts) > 11 else '0'
                    vlprod = parts[12] if len(parts) > 12 else '0'
                    vlfrete = parts[13] if len(parts) > 13 else '0'
                    vldesc = parts[14] if len(parts) > 14 else '0'

                    try:
                        vlnota_val = float(vlnota) if vlnota != '\\N' else 0
                        vlprod_val = float(vlprod) if vlprod != '\\N' else 0
                        vlfrete_val = float(vlfrete) if vlfrete != '\\N' else 0
                        vldesc_val = float(vldesc) if vldesc != '\\N' else 0

                        print(f"\n  PEDIDO {idpedido} encontrado no PostgreSQL:")
                        print(f"    VLNOTA (Total):     R$ {vlnota_val:>15,.2f}")
                        print(f"    VLPROD (Produtos):  R$ {vlprod_val:>15,.2f}")
                        print(f"    VLFRETE (Frete):    R$ {vlfrete_val:>15,.2f}")
                        print(f"    VLDESC (Desconto):  R$ {vldesc_val:>15,.2f}")

                        # Salvar para comparação
                        pg_values = {
                            'vlnota': vlnota_val,
                            'vlprod': vlprod_val,
                            'vlfrete': vlfrete_val,
                            'vldesc': vldesc_val
                        }
                        found = True

                    except ValueError as e:
                        print(f"  Erro ao converter valores: {e}")

                    break

    if not found:
        print("  Pedido 54329 NÃO encontrado no PostgreSQL!")
else:
    print(f"  Arquivo de dump não encontrado: {dump_file}")

# =======================
# 2. VERIFICAR FIREBIRD
# =======================
print("\n>> 2. FIREBIRD:")
print("-"*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Buscar na tabela PEDIDOS
    cur.execute("""
        SELECT CODIGO, VLR_TOTAL, VLR_PRODUTOS, VLRFRETE, VLR_DESCONTO
        FROM PEDIDOS
        WHERE CODIGO = 54329
    """)

    row = cur.fetchone()

    if row:
        codigo, vlr_total, vlr_produtos, vlr_frete, vlr_desconto = row

        # Converter de centavos para reais
        vlr_total_reais = float(vlr_total) / 100 if vlr_total else 0
        vlr_produtos_reais = float(vlr_produtos) / 100 if vlr_produtos else 0
        vlr_frete_reais = float(vlr_frete) / 100 if vlr_frete else 0
        vlr_desconto_reais = float(vlr_desconto) / 100 if vlr_desconto else 0

        print(f"\n  PEDIDO {codigo} encontrado no Firebird:")
        print(f"    VLR_TOTAL (bruto):      {vlr_total:>15,} centavos = R$ {vlr_total_reais:>15,.2f}")
        print(f"    VLR_PRODUTOS (bruto):   {vlr_produtos:>15,} centavos = R$ {vlr_produtos_reais:>15,.2f}")
        print(f"    VLRFRETE (bruto):       {vlr_frete:>15,} centavos = R$ {vlr_frete_reais:>15,.2f}")
        print(f"    VLR_DESCONTO (bruto):   {vlr_desconto:>15,} centavos = R$ {vlr_desconto_reais:>15,.2f}")

        fb_values = {
            'vlr_total': vlr_total_reais,
            'vlr_produtos': vlr_produtos_reais,
            'vlr_frete': vlr_frete_reais,
            'vlr_desconto': vlr_desconto_reais
        }

        # Buscar itens do pedido
        print(f"\n  Itens do pedido:")
        cur.execute("""
            SELECT PRODUTO, QTDE, PRECO, VLR_TOTAL
            FROM PEDIDOS_ITENS
            WHERE CODIGO = 54329
            ORDER BY PRODUTO
        """)

        itens = cur.fetchall()

        if itens:
            print(f"    {len(itens)} itens encontrados:")
            print(f"\n    {'PRODUTO':<15} {'QTDE':<10} {'PREÇO':<15} {'VLR_TOTAL'}")
            print("    " + "-"*60)

            soma_itens_centavos = 0
            for produto, qtde, preco, vlr_total_item in itens[:10]:  # Mostrar primeiros 10
                preco_reais = float(preco) / 100 if preco else 0
                vlr_item_reais = float(vlr_total_item) / 100 if vlr_total_item else 0
                soma_itens_centavos += vlr_total_item if vlr_total_item else 0

                print(f"    {produto:<15} {qtde:<10} R$ {preco_reais:>10,.2f} R$ {vlr_item_reais:>10,.2f}")

            if len(itens) > 10:
                print(f"    ... e mais {len(itens) - 10} itens")

            soma_itens_reais = float(soma_itens_centavos) / 100
            print(f"\n    SOMA DOS ITENS: R$ {soma_itens_reais:,.2f}")
        else:
            print("    Nenhum item encontrado!")
            soma_itens_reais = 0

    else:
        print("\n  Pedido 54329 NÃO encontrado no Firebird!")
        fb_values = None
        soma_itens_reais = 0

    # Buscar na VIEW
    print(f"\n  Valores na VIEW VW_RPT_PEDIDOSVENDAS:")
    cur.execute("""
        SELECT CODIGO, VLR_TOTAL, VLR_PRODUTO, VLR_FRETE, VLR_DESCONTO
        FROM VW_RPT_PEDIDOSVENDAS
        WHERE CODIGO = 54329
    """)

    rows = cur.fetchall()
    if rows and len(rows) > 0:
        row_view = rows[0]
        cod_v, vlr_total_v, vlr_prod_v, vlr_frete_v, vlr_desc_v = row_view

        print(f"    VLR_TOTAL:    R$ {vlr_total_v if vlr_total_v else 0:>15,.2f}")
        print(f"    VLR_PRODUTO:  R$ {vlr_prod_v if vlr_prod_v else 0:>15,.2f}")
        print(f"    VLR_FRETE:    R$ {vlr_frete_v if vlr_frete_v else 0:>15,.2f}")
        print(f"    VLR_DESCONTO: R$ {vlr_desc_v if vlr_desc_v else 0:>15,.2f}")

    con.close()

except Exception as e:
    print(f"\n  [ERRO] {e}")
    import traceback
    traceback.print_exc()
    fb_values = None

# =======================
# 3. COMPARAÇÃO
# =======================
if pg_values and fb_values:
    print("\n" + "="*100)
    print("COMPARAÇÃO POSTGRESQL vs FIREBIRD")
    print("="*100)

    print(f"\n{'CAMPO':<20} {'POSTGRESQL':<20} {'FIREBIRD':<20} {'DIFERENÇA':<20} {'STATUS'}")
    print("-"*100)

    # VLR_TOTAL (VLNOTA no PG)
    dif_total = abs(pg_values['vlnota'] - fb_values['vlr_total'])
    status_total = "✓ OK" if dif_total < 0.01 else "✗ DIFERENTE"
    print(f"{'VLR_TOTAL':<20} R$ {pg_values['vlnota']:>15,.2f} R$ {fb_values['vlr_total']:>15,.2f} R$ {dif_total:>15,.2f} {status_total}")

    # VLR_PRODUTOS (VLPROD no PG)
    dif_prod = abs(pg_values['vlprod'] - fb_values['vlr_produtos'])
    status_prod = "✓ OK" if dif_prod < 0.01 else "✗ DIFERENTE"
    print(f"{'VLR_PRODUTOS':<20} R$ {pg_values['vlprod']:>15,.2f} R$ {fb_values['vlr_produtos']:>15,.2f} R$ {dif_prod:>15,.2f} {status_prod}")

    # VLR_FRETE
    dif_frete = abs(pg_values['vlfrete'] - fb_values['vlr_frete'])
    status_frete = "✓ OK" if dif_frete < 0.01 else "✗ DIFERENTE"
    print(f"{'VLR_FRETE':<20} R$ {pg_values['vlfrete']:>15,.2f} R$ {fb_values['vlr_frete']:>15,.2f} R$ {dif_frete:>15,.2f} {status_frete}")

    # VLR_DESCONTO
    dif_desc = abs(pg_values['vldesc'] - fb_values['vlr_desconto'])
    status_desc = "✓ OK" if dif_desc < 0.01 else "✗ DIFERENTE"
    print(f"{'VLR_DESCONTO':<20} R$ {pg_values['vldesc']:>15,.2f} R$ {fb_values['vlr_desconto']:>15,.2f} R$ {dif_desc:>15,.2f} {status_desc}")

    # Soma dos itens vs VLR_PRODUTOS
    if soma_itens_reais > 0:
        dif_itens = abs(soma_itens_reais - fb_values['vlr_produtos'])
        status_itens = "✓ OK" if dif_itens < 0.01 else "✗ DIFERENTE"
        print(f"\n{'SOMA ITENS':<20} R$ {soma_itens_reais:>15,.2f}")
        print(f"{'vs VLR_PRODUTOS':<20} R$ {fb_values['vlr_produtos']:>15,.2f}")
        print(f"{'Diferença':<20} R$ {dif_itens:>15,.2f} {status_itens}")

print("\n" + "="*100)
