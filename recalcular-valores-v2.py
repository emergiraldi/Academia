#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Recalcula VLR_TOTAL e VLR_PRODUTOS baseado nos itens (versão 2)
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
print("RECALCULANDO VALORES DOS PEDIDOS (VERSAO 2)")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Usar UPDATE direto com subquery (como fizemos com QTDE_TOTAL)
    print("\n>> Atualizando VLR_TOTAL e VLR_PRODUTOS...")

    # Primeiro, atualizar VLR_TOTAL
    cur.execute("""
        UPDATE PEDIDOS P
        SET P.VLR_TOTAL = (
            SELECT SUM(I.VLR_TOTAL)
            FROM PEDIDOS_ITENS I
            WHERE I.CODIGO = P.CODIGO
        )
        WHERE EXISTS (
            SELECT 1 FROM PEDIDOS_ITENS I WHERE I.CODIGO = P.CODIGO
        )
    """)

    pedidos_atualizados_1 = cur.rowcount
    con.commit()

    print(f"  VLR_TOTAL atualizado em {pedidos_atualizados_1:,} pedidos")

    # Atualizar VLR_PRODUTOS (igual ao VLR_TOTAL)
    cur.execute("""
        UPDATE PEDIDOS P
        SET P.VLR_PRODUTOS = P.VLR_TOTAL
        WHERE EXISTS (
            SELECT 1 FROM PEDIDOS_ITENS I WHERE I.CODIGO = P.CODIGO
        )
    """)

    pedidos_atualizados_2 = cur.rowcount
    con.commit()

    print(f"  VLR_PRODUTOS atualizado em {pedidos_atualizados_2:,} pedidos")

    # Zerar valores de pedidos sem itens
    print("\n>> Zerando valores de pedidos sem itens...")

    cur.execute("""
        UPDATE PEDIDOS P
        SET P.VLR_TOTAL = 0,
            P.VLR_PRODUTOS = 0,
            P.QTDE_TOTAL = 0
        WHERE NOT EXISTS (
            SELECT 1 FROM PEDIDOS_ITENS I WHERE I.CODIGO = P.CODIGO
        )
    """)

    pedidos_zerados = cur.rowcount
    con.commit()

    print(f"  {pedidos_zerados:,} pedidos sem itens foram zerados")

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

    # Mostrar TOP 10 maiores valores
    print("\n>> TOP 10 MAIORES VALORES APOS RECALCULO:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            CODIGO, DATA, VLR_TOTAL, QTDE_TOTAL
        FROM PEDIDOS
        ORDER BY CAST(VLR_TOTAL AS BIGINT) DESC
    """)

    print(f"{'CODIGO':<10} {'DATA':<12} {'VLR_TOTAL':<20} {'QTDE'}")
    print("-"*100)

    for row in cur.fetchall():
        codigo, data, vlr_total, qtde = row
        vlr_real = float(vlr_total) / 100 if vlr_total else 0
        print(f"{codigo:<10} {str(data):<12} R$ {vlr_real:>15,.2f} {qtde:>6.2f}")

    con.close()

    print("\n" + "="*100)
    print("RECALCULO CONCLUIDO!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
