#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Compara valores entre PostgreSQL e Firebird em uma mesma consulta
"""

import sys, codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

def parse_linha(linha):
    return linha.split('\t')

print("="*100)
print("COMPARACAO COMPLETA: POSTGRESQL vs FIREBIRD")
print("="*100)

# Ler pedidos do PostgreSQL
with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
    conteudo = f.read()

linhas = conteudo.split('\n')

print("\n>> Lendo pedidos do PostgreSQL...")
lendo_pedidos = False
pedidos_pg = {}

for linha in linhas:
    if 'COPY public.pedidos' in linha:
        lendo_pedidos = True
        continue
    if linha.strip() == '\\.':
        lendo_pedidos = False
        if pedidos_pg:
            break
    if lendo_pedidos and linha.strip():
        campos = parse_linha(linha.strip())
        if len(campos) >= 6:
            idpedido = int(campos[0])
            vlnota = float(campos[4]) if campos[4] not in ['\\N', ''] else 0
            vlprod = float(campos[5]) if campos[5] not in ['\\N', ''] else 0

            pedidos_pg[idpedido] = {
                'vlnota': vlnota,
                'vlprod': vlprod
            }

print(f"Total de pedidos do PostgreSQL: {len(pedidos_pg):,}")

# Conectar ao Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Buscar todos os pedidos do Firebird que também existem no PostgreSQL
    print("\n>> Comparando pedidos que existem em ambos os bancos...")
    print("-"*100)

    cur.execute("SELECT CODIGO, VLR_TOTAL FROM PEDIDOS ORDER BY CODIGO")
    pedidos_fb = cur.fetchall()

    print(f"Total de pedidos no Firebird: {len(pedidos_fb):,}")

    # Comparar valores
    comparacoes = []
    diferencas_encontradas = 0
    pedidos_so_fb = 0
    pedidos_ok = 0

    for codigo_fb, vlr_total_fb in pedidos_fb:
        vlr_fb = float(vlr_total_fb) / 100 if vlr_total_fb else 0

        if codigo_fb in pedidos_pg:
            vlr_pg = pedidos_pg[codigo_fb]['vlnota']
            diferenca = abs(vlr_fb - vlr_pg)

            comparacoes.append({
                'codigo': codigo_fb,
                'fb': vlr_fb,
                'pg': vlr_pg,
                'diferenca': diferenca
            })

            if diferenca > 0.01:  # Diferença maior que 1 centavo
                diferencas_encontradas += 1
            else:
                pedidos_ok += 1
        else:
            pedidos_so_fb += 1
            if pedidos_so_fb <= 5:
                comparacoes.append({
                    'codigo': codigo_fb,
                    'fb': vlr_fb,
                    'pg': None,
                    'diferenca': None
                })

    print(f"\nResultados da comparação:")
    print(f"  Pedidos em ambos os bancos: {len(pedidos_pg):,}")
    print(f"  Pedidos com valores OK (diferença < R$ 0,01): {pedidos_ok:,}")
    print(f"  Pedidos com diferenças: {diferencas_encontradas:,}")
    print(f"  Pedidos só no Firebird (novos): {pedidos_so_fb:,}")

    # Mostrar exemplos de comparação - pedidos OK
    print("\n>> EXEMPLOS DE PEDIDOS COM VALORES CORRETOS (primeiros 20):")
    print("-"*100)

    print(f"{'CODIGO':<10} {'FIREBIRD':<20} {'POSTGRES':<20} {'DIFERENCA':<15} {'STATUS'}")
    print("-"*100)

    count_ok = 0
    for comp in comparacoes:
        if comp['pg'] is not None and comp['diferenca'] < 0.01:
            print(f"{comp['codigo']:<10} R$ {comp['fb']:>15,.2f} R$ {comp['pg']:>15,.2f} R$ {comp['diferenca']:>10,.2f}  OK")
            count_ok += 1
            if count_ok >= 20:
                break

    # Mostrar pedidos com diferenças (se houver)
    if diferencas_encontradas > 0:
        print("\n>> PEDIDOS COM DIFERENCAS:")
        print("-"*100)

        print(f"{'CODIGO':<10} {'FIREBIRD':<20} {'POSTGRES':<20} {'DIFERENCA':<15} {'STATUS'}")
        print("-"*100)

        count_dif = 0
        for comp in comparacoes:
            if comp['pg'] is not None and comp['diferenca'] >= 0.01:
                print(f"{comp['codigo']:<10} R$ {comp['fb']:>15,.2f} R$ {comp['pg']:>15,.2f} R$ {comp['diferenca']:>10,.2f}  DIFERENTE")
                count_dif += 1
                if count_dif >= 20:
                    break

    # Mostrar alguns pedidos novos (só no Firebird)
    if pedidos_so_fb > 0:
        print(f"\n>> EXEMPLOS DE PEDIDOS NOVOS (só no Firebird - primeiros 10):")
        print("-"*100)

        print(f"{'CODIGO':<10} {'DATA':<12} {'FIREBIRD':<20} {'STATUS'}")
        print("-"*100)

        cur.execute("""
            SELECT FIRST 10
                CODIGO, DATA, VLR_TOTAL
            FROM PEDIDOS
            WHERE CODIGO > 50000
            ORDER BY CODIGO DESC
        """)

        for row in cur.fetchall():
            codigo, data, vlr_total = row
            vlr_fb = float(vlr_total) / 100 if vlr_total else 0

            if codigo not in pedidos_pg:
                print(f"{codigo:<10} {str(data):<12} R$ {vlr_fb:>15,.2f}  NOVO")

    # Estatísticas de diferenças
    if diferencas_encontradas > 0:
        print("\n>> ESTATISTICAS DAS DIFERENCAS:")
        print("-"*100)

        diferencas_valores = [c['diferenca'] for c in comparacoes if c['diferenca'] is not None and c['diferenca'] >= 0.01]

        if diferencas_valores:
            min_dif = min(diferencas_valores)
            max_dif = max(diferencas_valores)
            media_dif = sum(diferencas_valores) / len(diferencas_valores)

            print(f"  Diferença mínima: R$ {min_dif:,.2f}")
            print(f"  Diferença máxima: R$ {max_dif:,.2f}")
            print(f"  Diferença média: R$ {media_dif:,.2f}")

    # Percentual de acurácia
    print("\n>> ACURACIA DA MIGRACAO:")
    print("-"*100)

    total_comparados = pedidos_ok + diferencas_encontradas
    if total_comparados > 0:
        percentual = (pedidos_ok / total_comparados) * 100
        print(f"  Pedidos comparados: {total_comparados:,}")
        print(f"  Pedidos corretos: {pedidos_ok:,}")
        print(f"  Acurácia: {percentual:.2f}%")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
