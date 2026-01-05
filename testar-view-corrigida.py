#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Testa a view corrigida VW_RPT_PEDIDOSVENDAS
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
print("TESTANDO VIEW CORRIGIDA VW_RPT_PEDIDOSVENDAS")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    print("\n>> Testando valores após a correção:")
    print("-"*100)

    # Buscar diretamente alguns pedidos
    pedidos_teste = [54216, 54257, 54261, 54272, 54276]

    print(f"{'CODIGO':<10} {'TABELA (centavos)':<20} {'VIEW (reais)':<20} {'STATUS'}")
    print("-"*100)

    for codigo in pedidos_teste:
        # Valor da tabela PEDIDOS (em centavos)
        cur.execute("SELECT VLR_TOTAL FROM PEDIDOS WHERE CODIGO = ?", [codigo])
        row_tab = cur.fetchone()
        vlr_tabela = row_tab[0] if row_tab and row_tab[0] else 0

        # Valor da VIEW (deve estar em reais agora)
        cur.execute("""
            SELECT CODIGO, VLR_TOTAL, VLR_PRODUTO, VLR_FRETE
            FROM VW_RPT_PEDIDOSVENDAS
            WHERE CODIGO = ?
        """, [codigo])

        rows = cur.fetchall()

        if rows and len(rows) > 0:
            row_view = rows[0]
            cod, vlr_view, vlr_prod, vlr_frete = row_view

            vlr_esperado = float(vlr_tabela) / 100
            diferenca = abs(vlr_view - vlr_esperado) if vlr_view else 999999

            status = "✓ OK" if diferenca < 0.01 else "✗ ERRO"

            print(f"{codigo:<10} {vlr_tabela:>15,}     R$ {vlr_view if vlr_view else 0:>15,.2f}  {status}")

    # Buscar todos os pedidos e comparar
    print("\n>> Verificação completa (amostra de 20 pedidos):")
    print("-"*100)

    cur.execute("""
        SELECT CODIGO, VLR_TOTAL
        FROM PEDIDOS
        WHERE VLR_TOTAL > 0
        ORDER BY CODIGO DESC
    """)

    pedidos_tabela = {}
    for row in cur.fetchmany(20):
        pedidos_tabela[row[0]] = row[1]

    cur.execute("""
        SELECT CODIGO, VLR_TOTAL
        FROM VW_RPT_PEDIDOSVENDAS
        WHERE VLR_TOTAL > 0
        ORDER BY CODIGO DESC
    """)

    pedidos_view = cur.fetchall()

    ok_count = 0
    erro_count = 0

    for codigo, vlr_view in pedidos_view[:20]:
        if codigo in pedidos_tabela:
            vlr_tabela = pedidos_tabela[codigo]
            vlr_esperado = float(vlr_tabela) / 100

            diferenca = abs(vlr_view - vlr_esperado) if vlr_view else 999999

            if diferenca < 0.01:
                ok_count += 1
            else:
                erro_count += 1
                print(f"  ✗ Pedido {codigo}: Esperado R$ {vlr_esperado:,.2f}, VIEW retornou R$ {vlr_view:,.2f}")

    print(f"\n  Pedidos OK: {ok_count}")
    print(f"  Pedidos com erro: {erro_count}")

    if erro_count == 0 and ok_count > 0:
        print("\n" + "="*100)
        print("✓ CORREÇÃO APLICADA COM SUCESSO!")
        print("="*100)
        print("\nTodos os valores estão corretos!")
        print("\n>> PRÓXIMO PASSO:")
        print("  1. Abra o sistema QRSistema.exe")
        print("  2. Acesse o Relatório de Pedidos de Venda")
        print("  3. Verifique se os valores estão corretos")
        print()
        print("  Exemplos:")
        print("    • Pedido 54216 deve mostrar R$ 11.312,01")
        print("    • Pedido 54257 deve mostrar R$ 42.082,02")
        print("    • Pedido 54261 deve mostrar R$ 27.767,63")
    else:
        print("\n⚠️  Alguns pedidos ainda apresentam divergência.")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
