#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Corrige o campo QTDE_TOTAL dos pedidos baseado nos itens já migrados
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
print("CORRIGINDO QUANTIDADE TOTAL DOS PEDIDOS")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Buscar todos os pedidos
    print("\n>> Buscando pedidos...")
    cur.execute("SELECT CODIGO FROM PEDIDOS")
    pedidos = [row[0] for row in cur.fetchall()]

    print(f"Total de pedidos: {len(pedidos):,}")

    pedidos_atualizados = 0
    pedidos_sem_itens = 0

    print("\n>> Atualizando quantidades...")

    for codigo_pedido in pedidos:
        # Calcular soma das quantidades dos itens deste pedido
        cur.execute("""
            SELECT COALESCE(SUM(QTDE), 0)
            FROM PEDIDOS_ITENS
            WHERE CODIGO = ?
        """, [codigo_pedido])

        qtde_total = cur.fetchone()[0]

        if qtde_total > 0:
            # Atualizar o pedido
            cur.execute("""
                UPDATE PEDIDOS
                SET QTDE_TOTAL = ?
                WHERE CODIGO = ?
            """, [qtde_total, codigo_pedido])

            pedidos_atualizados += 1
        else:
            pedidos_sem_itens += 1

        # Commit a cada 100 pedidos
        if pedidos_atualizados % 100 == 0 and pedidos_atualizados > 0:
            con.commit()
            print(f"  {pedidos_atualizados:,} pedidos atualizados...")

    # Commit final
    con.commit()

    print(f"\n>> RESULTADO:")
    print("-"*100)
    print(f"  Pedidos atualizados: {pedidos_atualizados:,}")
    print(f"  Pedidos sem itens: {pedidos_sem_itens:,}")

    # Mostrar exemplos após correção
    print(f"\n>> EXEMPLOS APÓS CORREÇÃO:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            CODIGO, DATA, VLR_TOTAL, QTDE_TOTAL
        FROM PEDIDOS
        WHERE CODIGO > 20000
        ORDER BY CODIGO
    """)

    print(f"{'CODIGO':<10} {'DATA':<12} {'VLR_TOTAL':<15} {'QTDE_TOTAL'}")
    print("-"*100)

    for row in cur.fetchall():
        codigo, data, vlr_total, qtde = row
        vlr_real = float(vlr_total) / 100 if vlr_total else 0
        print(f"{codigo:<10} {str(data):<12} R$ {vlr_real:>11,.2f} {qtde:>10.2f}")

    con.close()

    print("\n" + "="*100)
    print("CORRECAO CONCLUIDA!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
