#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Corrige VLR_PRODUTOS de todos os pedidos com problema
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
print("CORRIGINDO VLR_PRODUTOS DE TODOS OS PEDIDOS")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Buscar todos os itens e agregar em Python
    print("\n>> Calculando soma real dos itens por pedido...")
    cur.execute("SELECT CODIGO, VLR_TOTAL FROM PEDIDOS_ITENS")
    todos_itens = cur.fetchall()

    soma_por_pedido = {}
    for codigo, vlr_total in todos_itens:
        vlr = vlr_total if vlr_total else 0  # Manter em centavos

        if codigo not in soma_por_pedido:
            soma_por_pedido[codigo] = 0
        soma_por_pedido[codigo] += vlr

    print(f"  {len(soma_por_pedido):,} pedidos processados")

    # Atualizar VLR_PRODUTOS de todos os pedidos
    print("\n>> Atualizando VLR_PRODUTOS para todos os pedidos com itens...")

    pedidos_atualizados = 0

    for codigo_pedido, vlr_produtos_correto in soma_por_pedido.items():
        cur.execute("""
            UPDATE PEDIDOS
            SET VLR_PRODUTOS = ?
            WHERE CODIGO = ?
        """, [vlr_produtos_correto, codigo_pedido])

        if cur.rowcount > 0:
            pedidos_atualizados += 1

            if pedidos_atualizados % 1000 == 0:
                con.commit()
                print(f"  {pedidos_atualizados:,} pedidos atualizados...")

    con.commit()

    print(f"\n>> Total de pedidos atualizados: {pedidos_atualizados:,}")

    # Verificar alguns pedidos que tinham problema
    print("\n>> VERIFICANDO PEDIDOS QUE TINHAM PROBLEMA:")
    print("-"*100)

    pedidos_verificar = [24637, 23832, 24905, 54216, 23234]

    print(f"{'CODIGO':<10} {'VLR_PRODUTOS':<20} {'SOMA ITENS':<20} {'STATUS'}")
    print("-"*100)

    for codigo in pedidos_verificar:
        cur.execute("SELECT VLR_PRODUTOS FROM PEDIDOS WHERE CODIGO = ?", [codigo])
        row = cur.fetchone()

        if row:
            vlr_prod = float(row[0]) / 100 if row[0] else 0

            if codigo in soma_por_pedido:
                soma = float(soma_por_pedido[codigo]) / 100
                diferenca = abs(vlr_prod - soma)

                status = "OK" if diferenca < 0.01 else f"DIF R$ {diferenca:.2f}"
                print(f"{codigo:<10} R$ {vlr_prod:>15,.2f} R$ {soma:>15,.2f}  {status}")

    # Reexecutar análise para confirmar
    print("\n>> Reexecutando análise para confirmar correção...")

    pedidos_ainda_com_problema = 0

    cur.execute("SELECT CODIGO, VLR_PRODUTOS FROM PEDIDOS WHERE VLR_PRODUTOS > 0")
    for codigo, vlr_produtos in cur.fetchall():
        vlr_prod_real = float(vlr_produtos) / 100 if vlr_produtos else 0

        if codigo in soma_por_pedido:
            soma_itens = float(soma_por_pedido[codigo]) / 100
            diferenca = abs(vlr_prod_real - soma_itens)

            if diferenca > 1.00:
                pedidos_ainda_com_problema += 1

    print(f"  Pedidos ainda com diferença > R$ 1,00: {pedidos_ainda_com_problema}")

    con.close()

    print("\n" + "="*100)
    print("CORRECAO CONCLUIDA!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
