#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Compara valores dos pedidos entre PostgreSQL e Firebird
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
print("COMPARACAO DE VALORES: POSTGRESQL vs FIREBIRD")
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
        print(f"Estrutura: {linha[:150]}...")
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

    # Buscar estatísticas dos pedidos no Firebird
    print("\n>> ESTATISTICAS DOS PEDIDOS NO FIREBIRD:")
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

    # Buscar pedidos com valores muito altos (acima de 100.000)
    print("\n>> PEDIDOS COM VALORES EXORBITANTES (> R$ 100.000):")
    print("-"*100)

    cur.execute("""
        SELECT
            CODIGO, DATA, VLR_TOTAL, VLR_PRODUTOS, QTDE_TOTAL
        FROM PEDIDOS
        WHERE CAST(VLR_TOTAL AS BIGINT) > 10000000
        ORDER BY VLR_TOTAL DESC
    """)

    pedidos_altos = cur.fetchall()

    print(f"{'CODIGO':<10} {'DATA':<12} {'VLR_TOTAL':<20} {'VLR_PRODUTOS':<20} {'QTDE':<10} {'PG_VLNOTA'}")
    print("-"*100)

    for row in pedidos_altos:
        codigo, data, vlr_total, vlr_produtos, qtde = row
        vlr_total_real = float(vlr_total) / 100 if vlr_total else 0
        vlr_prod_real = float(vlr_produtos) / 100 if vlr_produtos else 0

        # Buscar valor no PostgreSQL
        vlr_pg = pedidos_pg.get(codigo, {}).get('vlnota', 0) if codigo in pedidos_pg else None
        vlr_pg_str = f"R$ {vlr_pg:,.2f}" if vlr_pg is not None else "NAO ENCONTRADO"

        print(f"{codigo:<10} {str(data):<12} R$ {vlr_total_real:>15,.2f} R$ {vlr_prod_real:>15,.2f} {qtde:>8.2f}  {vlr_pg_str}")

    print(f"\nTotal de pedidos com valores > R$ 100.000: {len(pedidos_altos):,}")

    # Comparar alguns pedidos específicos
    print("\n>> COMPARACAO DETALHADA (primeiros 20 pedidos):")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 20
            CODIGO, DATA, VLR_TOTAL, VLR_PRODUTOS
        FROM PEDIDOS
        ORDER BY CODIGO
    """)

    print(f"{'CODIGO':<10} {'FIREBIRD VLR_TOTAL':<20} {'POSTGRES VLNOTA':<20} {'DIFERENCA'}")
    print("-"*100)

    diferencas = []

    for row in cur.fetchall():
        codigo, data, vlr_total_fb, vlr_prod_fb = row
        vlr_fb = float(vlr_total_fb) / 100 if vlr_total_fb else 0

        if codigo in pedidos_pg:
            vlr_pg = pedidos_pg[codigo]['vlnota']
            diferenca = abs(vlr_fb - vlr_pg)
            diferencas.append(diferenca)

            status = "OK" if diferenca < 0.01 else "DIFERENTE!"
            print(f"{codigo:<10} R$ {vlr_fb:>15,.2f} R$ {vlr_pg:>15,.2f} R$ {diferenca:>10,.2f} {status}")
        else:
            print(f"{codigo:<10} R$ {vlr_fb:>15,.2f} NAO ENCONTRADO NO PG")

    # Verificar se há pedidos com VLR_TOTAL em centavos quando deveria estar em reais
    print("\n>> VERIFICANDO SE VALORES ESTAO EM CENTAVOS OU REAIS:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            P.CODIGO, P.VLR_TOTAL,
            (SELECT SUM(I.VLR_TOTAL) FROM PEDIDOS_ITENS I WHERE I.CODIGO = P.CODIGO)
        FROM PEDIDOS P
        WHERE P.CODIGO IN (
            SELECT FIRST 10 CODIGO FROM PEDIDOS ORDER BY CODIGO
        )
    """)

    print(f"{'CODIGO':<10} {'PEDIDO.VLR_TOTAL':<25} {'SOMA ITENS':<25} {'STATUS'}")
    print("-"*100)

    for row in cur.fetchall():
        codigo, vlr_pedido, soma_itens = row
        vlr_ped = float(vlr_pedido) if vlr_pedido else 0
        soma_it = float(soma_itens) if soma_itens else 0

        # Verificar se estão em centavos
        vlr_ped_centavos = vlr_ped / 100
        soma_it_centavos = soma_it / 100

        diferenca_centavos = abs(vlr_ped_centavos - soma_it_centavos)
        diferenca_direta = abs(vlr_ped - soma_it)

        if diferenca_centavos < 0.01:
            status = "VALORES EM CENTAVOS - OK"
        elif diferenca_direta < 0.01:
            status = "PROBLEMA: PEDIDO EM REAIS, ITENS EM CENTAVOS!"
        else:
            status = "VERIFICAR"

        print(f"{codigo:<10} R$ {vlr_ped_centavos:>18,.2f} R$ {soma_it_centavos:>18,.2f}  {status}")

    # Verificar os top 10 maiores valores
    print("\n>> TOP 10 MAIORES VALORES NO FIREBIRD:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            CODIGO, DATA, VLR_TOTAL, VLR_PRODUTOS, QTDE_TOTAL
        FROM PEDIDOS
        ORDER BY CAST(VLR_TOTAL AS BIGINT) DESC
    """)

    print(f"{'CODIGO':<10} {'DATA':<12} {'VLR_TOTAL FB':<20} {'VLR_TOTAL PG':<20} {'QTDE'}")
    print("-"*100)

    for row in cur.fetchall():
        codigo, data, vlr_total, vlr_produtos, qtde = row
        vlr_fb = float(vlr_total) / 100 if vlr_total else 0

        vlr_pg = pedidos_pg.get(codigo, {}).get('vlnota', 0) if codigo in pedidos_pg else None
        vlr_pg_str = f"R$ {vlr_pg:>14,.2f}" if vlr_pg is not None else "NAO ENCONTRADO"

        print(f"{codigo:<10} {str(data):<12} R$ {vlr_fb:>15,.2f} {vlr_pg_str:<20} {qtde:>6.2f}")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
