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

    # Fazer UPDATE direto com subquery
    print("\n>> Atualizando quantidades totais...")

    cur.execute("""
        UPDATE PEDIDOS P
        SET P.QTDE_TOTAL = (
            SELECT COALESCE(SUM(I.QTDE), 0)
            FROM PEDIDOS_ITENS I
            WHERE I.CODIGO = P.CODIGO
        )
    """)

    con.commit()

    print("  Atualização concluída!")

    # Mostrar exemplos após correção
    print(f"\n>> EXEMPLOS APÓS CORREÇÃO:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            P.CODIGO, P.DATA, P.VLR_TOTAL, P.QTDE_TOTAL
        FROM PEDIDOS P
        WHERE P.CODIGO > 20000
        ORDER BY P.CODIGO
    """)

    print(f"{'CODIGO':<10} {'DATA':<12} {'VLR_TOTAL':<15} {'QTDE_TOTAL'}")
    print("-"*100)

    for row in cur.fetchall():
        codigo, data, vlr_total, qtde = row
        vlr_real = float(vlr_total) / 100 if vlr_total else 0
        print(f"{codigo:<10} {str(data):<12} R$ {vlr_real:>11,.2f} {qtde:>10.2f}")

    # Verificar estatísticas
    print(f"\n>> ESTATISTICAS:")
    print("-"*100)

    cur.execute("""
        SELECT
            COUNT(*),
            SUM(QTDE_TOTAL),
            AVG(QTDE_TOTAL),
            MIN(QTDE_TOTAL),
            MAX(QTDE_TOTAL)
        FROM PEDIDOS
    """)

    row = cur.fetchone()
    if row:
        total, soma, media, minimo, maximo = row
        print(f"  Total de pedidos: {total:,}")
        print(f"  Soma das quantidades: {soma:,.2f}")
        print(f"  Média de itens por pedido: {media:,.2f}")
        print(f"  Mínimo: {minimo:,.2f}")
        print(f"  Máximo: {maximo:,.2f}")

    con.close()

    print("\n" + "="*100)
    print("CORRECAO CONCLUIDA!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
