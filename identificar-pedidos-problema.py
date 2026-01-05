#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Identifica todos os pedidos com diferença entre VLR_PRODUTOS e soma dos itens
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
print("IDENTIFICANDO PEDIDOS COM VALORES INCORRETOS")
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
    cur.execute("SELECT CODIGO, VLR_PRODUTOS FROM PEDIDOS WHERE VLR_PRODUTOS > 0 ORDER BY CODIGO")
    pedidos = cur.fetchall()

    print(f"Total de pedidos: {len(pedidos):,}")

    pedidos_problema = []
    verificados = 0

    print("\n>> Verificando diferenças entre VLR_PRODUTOS e soma dos itens...")

    for codigo_pedido, vlr_produtos in pedidos:
        # Calcular soma dos itens
        cur.execute("""
            SELECT SUM(VLR_TOTAL)
            FROM PEDIDOS_ITENS
            WHERE CODIGO = ?
        """, [codigo_pedido])

        row = cur.fetchone()
        soma_itens = row[0] if (row and row[0]) else 0

        if soma_itens > 0:
            vlr_prod_real = float(vlr_produtos) / 100
            soma_itens_real = float(soma_itens) / 100
            diferenca = abs(vlr_prod_real - soma_itens_real)

            # Se diferença for maior que R$ 1,00
            if diferenca > 1.00:
                pedidos_problema.append({
                    'codigo': codigo_pedido,
                    'vlr_produtos': vlr_prod_real,
                    'soma_itens': soma_itens_real,
                    'diferenca': diferenca
                })

        verificados += 1
        if verificados % 1000 == 0:
            print(f"  {verificados:,} pedidos verificados... ({len(pedidos_problema)} com problema)")

    print(f"\n>> RESULTADO:")
    print("-"*100)
    print(f"  Total de pedidos verificados: {verificados:,}")
    print(f"  Pedidos com diferença > R$ 1,00: {len(pedidos_problema):,}")

    if pedidos_problema:
        # Ordenar por diferença (maior primeiro)
        pedidos_problema.sort(key=lambda x: x['diferenca'], reverse=True)

        print(f"\n>> TOP 50 PEDIDOS COM MAIORES DIFERENCAS:")
        print("-"*100)

        print(f"{'CODIGO':<10} {'VLR_PRODUTOS':<20} {'SOMA ITENS':<20} {'DIFERENCA':<15}")
        print("-"*100)

        for i, ped in enumerate(pedidos_problema[:50], 1):
            print(f"{ped['codigo']:<10} R$ {ped['vlr_produtos']:>15,.2f} R$ {ped['soma_itens']:>15,.2f} R$ {ped['diferenca']:>10,.2f}")

        # Estatísticas
        print(f"\n>> ESTATISTICAS DAS DIFERENCAS:")
        print("-"*100)

        diferencas = [p['diferenca'] for p in pedidos_problema]
        total_diferenca = sum(diferencas)
        media_diferenca = total_diferenca / len(diferencas)
        max_diferenca = max(diferencas)
        min_diferenca = min(diferencas)

        print(f"  Diferença total: R$ {total_diferenca:,.2f}")
        print(f"  Diferença média: R$ {media_diferenca:,.2f}")
        print(f"  Diferença mínima: R$ {min_diferenca:,.2f}")
        print(f"  Diferença máxima: R$ {max_diferenca:,.2f}")

        # Verificar se são pedidos do PostgreSQL ou novos
        print(f"\n>> Verificando origem dos pedidos (primeiros 10):")
        print("-"*100)

        # Ler pedidos do PostgreSQL
        with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
            conteudo = f.read()

        linhas = conteudo.split('\n')
        pedidos_pg_ids = set()

        lendo = False
        for linha in linhas:
            if 'COPY public.pedidos' in linha:
                lendo = True
                continue
            if linha.strip() == '\\.':
                break
            if lendo and linha.strip():
                campos = linha.split('\t')
                if campos[0].isdigit():
                    pedidos_pg_ids.add(int(campos[0]))

        migrados = 0
        novos = 0

        for ped in pedidos_problema[:10]:
            origem = "MIGRADO" if ped['codigo'] in pedidos_pg_ids else "NOVO"
            print(f"  Pedido {ped['codigo']}: {origem} (diferença: R$ {ped['diferenca']:,.2f})")

            if origem == "MIGRADO":
                migrados += 1
            else:
                novos += 1

        print(f"\n  Dos 10 primeiros: {migrados} migrados, {novos} novos")

        # Contar total
        total_migrados = sum(1 for p in pedidos_problema if p['codigo'] in pedidos_pg_ids)
        total_novos = len(pedidos_problema) - total_migrados

        print(f"\n  TOTAL: {total_migrados:,} migrados, {total_novos:,} novos")

    con.close()

    print("\n" + "="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
