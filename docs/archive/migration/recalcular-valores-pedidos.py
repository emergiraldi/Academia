#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Recalcula VLR_TOTAL e VLR_PRODUTOS baseado nos itens dos pedidos
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
print("RECALCULANDO VALORES DOS PEDIDOS")
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
    print("\n>> Buscando todos os pedidos...")
    cur.execute("SELECT CODIGO FROM PEDIDOS")
    pedidos = [row[0] for row in cur.fetchall()]

    print(f"Total de pedidos: {len(pedidos):,}")

    pedidos_atualizados = 0
    pedidos_sem_itens = 0
    pedidos_erro = 0

    print("\n>> Recalculando valores...")

    for codigo_pedido in pedidos:
        try:
            # Calcular soma dos valores dos itens
            cur.execute("""
                SELECT SUM(VLR_TOTAL)
                FROM PEDIDOS_ITENS
                WHERE CODIGO = ?
            """, [codigo_pedido])

            row = cur.fetchone()
            vlr_total_itens = row[0] if (row and row[0]) else 0

            # Calcular soma das quantidades dos itens
            cur.execute("""
                SELECT SUM(QTDE)
                FROM PEDIDOS_ITENS
                WHERE CODIGO = ?
            """, [codigo_pedido])

            row = cur.fetchone()
            qtde_total_itens = row[0] if (row and row[0]) else 0

            if vlr_total_itens > 0:
                # Atualizar o pedido
                cur.execute("""
                    UPDATE PEDIDOS
                    SET VLR_TOTAL = ?,
                        VLR_PRODUTOS = ?,
                        QTDE_TOTAL = ?
                    WHERE CODIGO = ?
                """, [vlr_total_itens, vlr_total_itens, qtde_total_itens, codigo_pedido])

                pedidos_atualizados += 1

                # Mostrar primeiros 10
                if pedidos_atualizados <= 10:
                    vlr_real = float(vlr_total_itens) / 100 if vlr_total_itens else 0
                    print(f"  Pedido {codigo_pedido}: R$ {vlr_real:,.2f} ({qtde_total_itens:.2f} itens)")

            else:
                # Pedido sem itens - zerar valores
                cur.execute("""
                    UPDATE PEDIDOS
                    SET VLR_TOTAL = 0,
                        VLR_PRODUTOS = 0,
                        QTDE_TOTAL = 0
                    WHERE CODIGO = ?
                """, [codigo_pedido])

                pedidos_sem_itens += 1

            # Commit a cada 100 pedidos
            if (pedidos_atualizados + pedidos_sem_itens) % 100 == 0:
                con.commit()
                print(f"  {pedidos_atualizados:,} pedidos atualizados, {pedidos_sem_itens:,} sem itens...")

        except Exception as e:
            pedidos_erro += 1
            if pedidos_erro <= 5:
                print(f"  Erro ao processar pedido {codigo_pedido}: {e}")

    # Commit final
    con.commit()

    print(f"\n>> RESULTADO:")
    print("-"*100)
    print(f"  Pedidos atualizados: {pedidos_atualizados:,}")
    print(f"  Pedidos sem itens: {pedidos_sem_itens:,}")
    print(f"  Erros: {pedidos_erro:,}")

    # Verificar pedidos que tinham valores absurdos
    print("\n>> VERIFICANDO PEDIDOS QUE TINHAM VALORES ABSURDOS:")
    print("-"*100)

    pedidos_verificar = [54088, 54266, 54362, 54360, 54361, 54116, 54363, 54371, 54288, 54339]

    print(f"{'CODIGO':<10} {'VLR_TOTAL':<20} {'QTDE_TOTAL'}")
    print("-"*100)

    for codigo in pedidos_verificar:
        cur.execute("""
            SELECT VLR_TOTAL, QTDE_TOTAL
            FROM PEDIDOS
            WHERE CODIGO = ?
        """, [codigo])

        row = cur.fetchone()
        if row:
            vlr_total, qtde = row
            vlr_real = float(vlr_total) / 100 if vlr_total else 0
            print(f"{codigo:<10} R$ {vlr_real:>15,.2f} {qtde:>10.2f}")

    # Estatísticas finais
    print("\n>> ESTATISTICAS FINAIS:")
    print("-"*100)

    cur.execute("""
        SELECT
            COUNT(*),
            MIN(CAST(VLR_TOTAL AS BIGINT)),
            MAX(CAST(VLR_TOTAL AS BIGINT)),
            AVG(CAST(VLR_TOTAL AS BIGINT))
        FROM PEDIDOS
    """)

    row = cur.fetchone()
    total = row[0]
    minimo = float(row[1]) / 100 if row[1] else 0
    maximo = float(row[2]) / 100 if row[2] else 0
    media = float(row[3]) / 100 if row[3] else 0

    print(f"  Total de pedidos: {total:,}")
    print(f"  Valor mínimo: R$ {minimo:,.2f}")
    print(f"  Valor máximo: R$ {maximo:,.2f}")
    print(f"  Valor médio: R$ {media:,.2f}")

    # Verificar se ainda há valores > 1 milhão
    cur.execute("""
        SELECT COUNT(*)
        FROM PEDIDOS
        WHERE CAST(VLR_TOTAL AS BIGINT) > 100000000
    """)

    valores_altos = cur.fetchone()[0]
    print(f"\n  Pedidos com valores > R$ 1.000.000: {valores_altos:,}")

    con.close()

    print("\n" + "="*100)
    print("RECALCULO CONCLUIDO!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
