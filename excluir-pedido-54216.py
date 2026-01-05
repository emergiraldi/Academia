#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Exclui o pedido 54216 e seus itens
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
print("EXCLUINDO PEDIDO 54216")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Verificar se o pedido existe
    cur.execute("SELECT CODIGO, DATA, VLR_TOTAL FROM PEDIDOS WHERE CODIGO = 54216")
    row = cur.fetchone()

    if row:
        codigo, data, vlr_total = row
        vlr = float(vlr_total) / 100 if vlr_total else 0
        print(f"\nPedido encontrado:")
        print(f"  Código: {codigo}")
        print(f"  Data: {data}")
        print(f"  Valor: R$ {vlr:,.2f}")

        # Verificar itens
        cur.execute("SELECT COUNT(*) FROM PEDIDOS_ITENS WHERE CODIGO = 54216")
        total_itens = cur.fetchone()[0]
        print(f"  Itens: {total_itens}")

        # Excluir itens primeiro
        print("\n>> Excluindo itens do pedido...")
        cur.execute("DELETE FROM PEDIDOS_ITENS WHERE CODIGO = 54216")
        itens_excluidos = cur.rowcount
        print(f"  {itens_excluidos} itens excluídos")

        # Excluir pedido
        print("\n>> Excluindo pedido...")
        cur.execute("DELETE FROM PEDIDOS WHERE CODIGO = 54216")
        pedidos_excluidos = cur.rowcount
        print(f"  {pedidos_excluidos} pedido excluído")

        # Commit
        con.commit()

        print("\n" + "="*100)
        print("PEDIDO 54216 EXCLUIDO COM SUCESSO!")
        print("="*100)

    else:
        print("\nPedido 54216 não encontrado!")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
