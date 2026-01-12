#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Identifica pedidos com problema (versão otimizada)
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
print("IDENTIFICANDO PEDIDOS COM VALORES INCORRETOS (V2)")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Primeiro, buscar soma dos itens por pedido
    print("\n>> Calculando soma dos itens por pedido...")
    cur.execute("""
        SELECT CODIGO, SUM(VLR_TOTAL), SUM(QTDE)
        FROM PEDIDOS_ITENS
        GROUP BY CODIGO
    """)

    soma_itens_por_pedido = {}
    for row in cur.fetchall():
        codigo, soma_vlr, soma_qtd = row
        soma_itens_por_pedido[codigo] = {
            'vlr_total': float(soma_vlr) / 100 if soma_vlr else 0,
            'qtde': float(soma_qtd) if soma_qtd else 0
        }

    print(f"  {len(soma_itens_por_pedido):,} pedidos com itens")

    # Buscar todos os pedidos
    print("\n>> Buscando dados dos pedidos...")
    cur.execute("SELECT CODIGO, VLR_PRODUTOS, VLR_TOTAL FROM PEDIDOS WHERE VLR_PRODUTOS > 0")
    pedidos = cur.fetchall()

    print(f"  {len(pedidos):,} pedidos")

    # Comparar
    print("\n>> Comparando valores...")
    pedidos_problema = []

    for codigo, vlr_produtos, vlr_total in pedidos:
        vlr_prod_real = float(vlr_produtos) / 100 if vlr_produtos else 0
        vlr_total_real = float(vlr_total) / 100 if vlr_total else 0

        if codigo in soma_itens_por_pedido:
            soma_itens = soma_itens_por_pedido[codigo]['vlr_total']
            diferenca = abs(vlr_prod_real - soma_itens)

            # Se diferença for maior que R$ 1,00
            if diferenca > 1.00:
                pedidos_problema.append({
                    'codigo': codigo,
                    'vlr_produtos': vlr_prod_real,
                    'vlr_total': vlr_total_real,
                    'soma_itens': soma_itens,
                    'diferenca': diferenca
                })

    print(f"\n>> RESULTADO:")
    print("-"*100)
    print(f"  Pedidos com diferença > R$ 1,00: {len(pedidos_problema):,}")

    if pedidos_problema:
        # Ordenar por diferença
        pedidos_problema.sort(key=lambda x: x['diferenca'], reverse=True)

        print(f"\n>> TOP 50 PEDIDOS COM MAIORES DIFERENCAS:")
        print("-"*100)

        print(f"{'CODIGO':<10} {'VLR_TOTAL':<20} {'VLR_PRODUTOS':<20} {'SOMA ITENS':<20} {'DIFERENCA'}")
        print("-"*100)

        for ped in pedidos_problema[:50]:
            print(f"{ped['codigo']:<10} R$ {ped['vlr_total']:>15,.2f} R$ {ped['vlr_produtos']:>15,.2f} R$ {ped['soma_itens']:>15,.2f} R$ {ped['diferenca']:>10,.2f}")

        # Estatísticas
        print(f"\n>> ESTATISTICAS:")
        print("-"*100)

        diferencas = [p['diferenca'] for p in pedidos_problema]
        total_dif = sum(diferencas)
        media_dif = total_dif / len(diferencas)

        print(f"  Total de diferenças: R$ {total_dif:,.2f}")
        print(f"  Diferença média: R$ {media_dif:,.2f}")
        print(f"  Diferença máxima: R$ {max(diferencas):,.2f}")
        print(f"  Diferença mínima: R$ {min(diferencas):,.2f}")

        # Salvar lista de pedidos com problema
        print(f"\n>> Salvando lista de pedidos com problema...")
        with open(r'c:\Projeto\Academia\pedidos-com-problema.txt', 'w') as f:
            f.write(f"Total: {len(pedidos_problema)}\n\n")
            for ped in pedidos_problema:
                f.write(f"{ped['codigo']}\t{ped['vlr_produtos']:.2f}\t{ped['soma_itens']:.2f}\t{ped['diferenca']:.2f}\n")

        print(f"  Lista salva em: pedidos-com-problema.txt")

    con.close()

    print("\n" + "="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
