#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Investiga de onde vieram os valores absurdos
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
print("INVESTIGACAO: VALORES ABSURDOS NOS PEDIDOS")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Verificar os pedidos com valores muito altos
    print("\n>> ANALISANDO PEDIDOS COM VALORES > R$ 1.000.000:")
    print("-"*100)

    cur.execute("""
        SELECT
            P.CODIGO, P.DATA, P.VLR_TOTAL, P.VLR_PRODUTOS, P.QTDE_TOTAL,
            P.CLIENTE
        FROM PEDIDOS P
        WHERE CAST(P.VLR_TOTAL AS BIGINT) > 100000000
        ORDER BY P.VLR_TOTAL DESC
    """)

    print(f"{'CODIGO':<10} {'DATA':<12} {'VLR_TOTAL':<25} {'VLR_PRODUTOS':<20} {'QTDE':<8} {'CLIENTE'}")
    print("-"*100)

    pedidos_problematicos = []

    for row in cur.fetchall():
        codigo, data, vlr_total, vlr_produtos, qtde, cliente = row
        vlr_total_real = float(vlr_total) / 100 if vlr_total else 0
        vlr_prod_real = float(vlr_produtos) / 100 if vlr_produtos else 0

        print(f"{codigo:<10} {str(data):<12} R$ {vlr_total_real:>19,.2f} R$ {vlr_prod_real:>15,.2f} {qtde:>6.2f}  {cliente}")

        pedidos_problematicos.append(codigo)

    # Verificar os itens desses pedidos
    print("\n>> ANALISANDO ITENS DOS PEDIDOS PROBLEMATICOS:")
    print("-"*100)

    for codigo_pedido in pedidos_problematicos[:5]:  # Primeiros 5
        print(f"\nPedido {codigo_pedido}:")

        cur.execute("""
            SELECT
                IDPRODUTO, QTDE, VLR_UNIT, VLR_TOTAL
            FROM PEDIDOS_ITENS
            WHERE CODIGO = ?
            ORDER BY IDPRODUTO
        """, [codigo_pedido])

        itens = cur.fetchall()

        if itens:
            print(f"  Total de itens: {len(itens)}")
            print(f"  {'PRODUTO':<12} {'QTDE':<10} {'VLR_UNIT':<20} {'VLR_TOTAL'}")
            print("  " + "-"*80)

            soma_itens = 0

            for item in itens[:10]:  # Primeiros 10 itens
                idprod, qtde, vlr_unit, vlr_total = item
                vlr_u = float(vlr_unit) / 100 if vlr_unit else 0
                vlr_t = float(vlr_total) / 100 if vlr_total else 0
                soma_itens += vlr_t

                print(f"  {idprod:<12} {qtde:<10.2f} R$ {vlr_u:>15,.2f} R$ {vlr_t:>15,.2f}")

            print(f"\n  Soma dos itens: R$ {soma_itens:,.2f}")

            # Calcular o que deveria ser o total
            cur.execute("""
                SELECT COALESCE(SUM(VLR_TOTAL), 0)
                FROM PEDIDOS_ITENS
                WHERE CODIGO = ?
            """, [codigo_pedido])

            soma_total = cur.fetchone()[0]
            soma_total_real = float(soma_total) / 100 if soma_total else 0

            print(f"  Soma total dos itens: R$ {soma_total_real:,.2f}")

        else:
            print("  Nenhum item encontrado!")

    # Verificar se o problema está no VLR_TOTAL sendo inteiro em vez de centavos
    print("\n\n>> VERIFICANDO SE VLR_TOTAL ESTA SEM A CONVERSAO DE CENTAVOS:")
    print("-"*100)

    for codigo_pedido in pedidos_problematicos[:3]:
        cur.execute("""
            SELECT VLR_TOTAL, VLR_PRODUTOS
            FROM PEDIDOS
            WHERE CODIGO = ?
        """, [codigo_pedido])

        row = cur.fetchone()
        if row:
            vlr_total, vlr_produtos = row

            print(f"\nPedido {codigo_pedido}:")
            print(f"  VLR_TOTAL (valor bruto): {vlr_total}")
            print(f"  VLR_TOTAL / 100: R$ {float(vlr_total)/100:,.2f}")
            print(f"  VLR_TOTAL / 10000: R$ {float(vlr_total)/10000:,.2f}")

            # Verificar soma dos itens
            cur.execute("""
                SELECT COALESCE(SUM(VLR_TOTAL), 0)
                FROM PEDIDOS_ITENS
                WHERE CODIGO = ?
            """, [codigo_pedido])

            soma_itens = cur.fetchone()[0]

            print(f"  Soma itens (bruto): {soma_itens}")
            print(f"  Soma itens / 100: R$ {float(soma_itens)/100:,.2f}")

            # Qual seria a relação?
            if soma_itens > 0:
                relacao = float(vlr_total) / float(soma_itens)
                print(f"  Relação VLR_TOTAL / SOMA_ITENS: {relacao:,.2f}x")

    # Verificar pedidos normais para comparação
    print("\n\n>> COMPARACAO COM PEDIDOS NORMAIS (valores corretos):")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 5
            P.CODIGO, P.VLR_TOTAL,
            (SELECT COALESCE(SUM(I.VLR_TOTAL), 0) FROM PEDIDOS_ITENS I WHERE I.CODIGO = P.CODIGO)
        FROM PEDIDOS P
        WHERE CAST(P.VLR_TOTAL AS BIGINT) > 10000 AND CAST(P.VLR_TOTAL AS BIGINT) < 1000000
        ORDER BY P.CODIGO
    """)

    print(f"{'CODIGO':<10} {'PEDIDO.VLR_TOTAL':<20} {'SOMA ITENS':<20} {'RELACAO'}")
    print("-"*100)

    for row in cur.fetchall():
        codigo, vlr_ped, soma_itens = row

        vlr_p = float(vlr_ped) if vlr_ped else 0
        soma_i = float(soma_itens) if soma_itens else 0

        if soma_i > 0:
            relacao = vlr_p / soma_i
            print(f"{codigo:<10} {vlr_p:<20,.0f} {soma_i:<20,.0f} {relacao:.4f}x")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
