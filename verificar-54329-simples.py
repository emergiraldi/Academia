#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica o pedido 54329 no Firebird
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
print("VERIFICANDO PEDIDO 54329")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Buscar pedido
    print("\n>> PEDIDO 54329 NO FIREBIRD:")
    print("-"*100)

    cur.execute("""
        SELECT CODIGO, VLR_TOTAL, VLR_PRODUTOS, VLRFRETE, VLR_DESCONTO, DATA, CLIENTE
        FROM PEDIDOS
        WHERE CODIGO = 54329
    """)

    row = cur.fetchone()

    if row:
        codigo, vlr_total, vlr_produtos, vlr_frete, vlr_desconto, data, cliente = row

        # Converter de centavos para reais
        vlr_total_reais = float(vlr_total) / 100 if vlr_total else 0
        vlr_produtos_reais = float(vlr_produtos) / 100 if vlr_produtos else 0
        vlr_frete_reais = float(vlr_frete) / 100 if vlr_frete else 0
        vlr_desconto_reais = float(vlr_desconto) / 100 if vlr_desconto else 0

        print(f"\n  CÓDIGO: {codigo}")
        print(f"  DATA: {data}")
        print(f"  CLIENTE: {cliente}")
        print()
        print(f"  VLR_TOTAL (banco):      {vlr_total:>15,} centavos = R$ {vlr_total_reais:>15,.2f}")
        print(f"  VLR_PRODUTOS (banco):   {vlr_produtos:>15,} centavos = R$ {vlr_produtos_reais:>15,.2f}")
        print(f"  VLRFRETE (banco):       {vlr_frete:>15,} centavos = R$ {vlr_frete_reais:>15,.2f}")
        print(f"  VLR_DESCONTO (banco):   {vlr_desconto:>15,} centavos = R$ {vlr_desconto_reais:>15,.2f}")

        # Buscar nome do cliente
        cur.execute("SELECT NOME FROM CAD_PESSOA WHERE CODIGO = ?", [cliente])
        row_cli = cur.fetchone()
        if row_cli:
            print(f"\n  NOME CLIENTE: {row_cli[0]}")

        # Buscar itens
        print(f"\n>> ITENS DO PEDIDO:")
        print("-"*100)

        cur.execute("""
            SELECT IDPRODUTO, QTDE, VLR_UNIT, VLR_TOTAL
            FROM PEDIDOS_ITENS
            WHERE CODIGO = 54329
            ORDER BY IDPRODUTO
        """)

        itens = cur.fetchall()

        if itens:
            print(f"\n  {len(itens)} itens encontrados:")
            print(f"\n  {'COD.PRODUTO':<15} {'QTDE':<10} {'PREÇO UNIT':<15} {'VLR_TOTAL':<15}")
            print("  " + "-"*60)

            soma_itens_centavos = 0
            for produto, qtde, preco, vlr_total_item in itens:
                preco_reais = float(preco) / 100 if preco else 0
                vlr_item_reais = float(vlr_total_item) / 100 if vlr_total_item else 0
                soma_itens_centavos += vlr_total_item if vlr_total_item else 0

                print(f"  {produto:<15} {qtde:<10} R$ {preco_reais:>10,.2f}  R$ {vlr_item_reais:>12,.2f}")

            soma_itens_reais = float(soma_itens_centavos) / 100

            print("  " + "-"*60)
            print(f"  {'SOMA DOS ITENS:':<38} R$ {soma_itens_reais:>12,.2f}")
            print()

            # Comparar soma dos itens com VLR_PRODUTOS
            dif_itens = abs(soma_itens_reais - vlr_produtos_reais)
            status = "✓ OK" if dif_itens < 0.01 else "✗ DIFERENTE"

            print(f"  VLR_PRODUTOS (campo):                  R$ {vlr_produtos_reais:>12,.2f}")
            print(f"  Diferença:                             R$ {dif_itens:>12,.2f}  {status}")

            if dif_itens > 0.01:
                print(f"\n  ⚠️  VLR_PRODUTOS está diferente da soma dos itens!")
        else:
            print("  ✗ Nenhum item encontrado!")

        # Buscar na VIEW
        print(f"\n>> VALORES NA VIEW VW_RPT_PEDIDOSVENDAS:")
        print("-"*100)

        try:
            cur.execute("""
                SELECT VLR_TOTAL, VLR_PRODUTO, VLR_FRETE, VLR_DESCONTO
                FROM VW_RPT_PEDIDOSVENDAS
                WHERE CODIGO = 54329
            """)

            rows_view = cur.fetchall()
            if rows_view and len(rows_view) > 0:
                row_view = rows_view[0]
                vlr_total_v, vlr_prod_v, vlr_frete_v, vlr_desc_v = row_view

                print(f"\n  VLR_TOTAL (view):    R$ {vlr_total_v if vlr_total_v else 0:>15,.2f} (relatório vai mostrar isto)")
                print(f"  VLR_PRODUTO (view):  R$ {vlr_prod_v if vlr_prod_v else 0:>15,.2f}")
                print(f"  VLR_FRETE (view):    R$ {vlr_frete_v if vlr_frete_v else 0:>15,.2f}")
                print(f"  VLR_DESCONTO (view): R$ {vlr_desc_v if vlr_desc_v else 0:>15,.2f}")
            else:
                print("  ✗ Pedido não encontrado na view!")

        except Exception as e:
            print(f"  Erro ao buscar na view: {e}")

    else:
        print("\n  ✗ Pedido 54329 NÃO encontrado no Firebird!")

    con.close()

    print("\n" + "="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print()
