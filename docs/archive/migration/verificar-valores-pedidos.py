#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica se os valores dos pedidos estão corretos
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
print("VERIFICACAO DOS VALORES DOS PEDIDOS")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Ver exemplos de pedidos no Firebird
    print("\n>> EXEMPLOS DE PEDIDOS NO FIREBIRD (primeiros 10):")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            CODIGO, DATA, VLR_TOTAL, VLR_PRODUTOS, VLR_DESCONTO, QTDE_TOTAL
        FROM PEDIDOS
        WHERE CODIGO > 10000
        ORDER BY CODIGO
    """)

    print(f"{'CODIGO':<10} {'DATA':<12} {'VLR_TOTAL':<15} {'VLR_PRODUTOS':<15} {'VLR_DESCONTO':<15} {'QTDE'}")
    print("-"*100)

    for row in cur.fetchall():
        codigo, data, vlr_total, vlr_produtos, vlr_desconto, qtde = row

        # Converter de centavos para reais
        vlr_total_real = float(vlr_total) / 100 if vlr_total else 0
        vlr_produtos_real = float(vlr_produtos) / 100 if vlr_produtos else 0
        vlr_desconto_real = float(vlr_desconto) / 100 if vlr_desconto else 0

        print(f"{codigo:<10} {str(data):<12} R$ {vlr_total_real:>11,.2f} R$ {vlr_produtos_real:>11,.2f} R$ {vlr_desconto_real:>11,.2f} {qtde:>6.2f}")

    # Comparar com PostgreSQL
    print("\n\n>> EXEMPLOS DE PEDIDOS NO POSTGRESQL (mesmos códigos):")
    print("-"*100)

    with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
        conteudo = f.read()

    linhas = conteudo.split('\n')

    # Pegar os mesmos pedidos do PostgreSQL
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
            campos = linha.strip().split('\t')
            idpedido = int(campos[0])
            if 24840 <= idpedido <= 24850:  # Pegar alguns exemplos
                pedidos_pg[idpedido] = {
                    'vlnota': campos[4],
                    'vlprod': campos[5],
                    'data': campos[12]
                }

    print(f"{'CODIGO':<10} {'DATA':<12} {'VLNOTA':<15} {'VLPROD':<15}")
    print("-"*100)
    for cod in sorted(pedidos_pg.keys()):
        ped = pedidos_pg[cod]
        print(f"{cod:<10} {ped['data']:<12} R$ {float(ped['vlnota']):>11,.2f} R$ {float(ped['vlprod']):>11,.2f}")

    # Verificar pedidos nos próximos 30 dias
    print("\n\n>> PEDIDOS DOS PROXIMOS 30 DIAS NO FIREBIRD:")
    print("-"*100)

    from datetime import datetime, timedelta
    hoje = datetime.now().strftime('%Y-%m-%d')
    daqui_30_dias = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')

    cur.execute(f"""
        SELECT
            COUNT(*),
            SUM(CAST(VLR_TOTAL AS BIGINT)),
            MIN(CAST(VLR_TOTAL AS BIGINT)),
            MAX(CAST(VLR_TOTAL AS BIGINT))
        FROM PEDIDOS
        WHERE DATA >= '{hoje}' AND DATA <= '{daqui_30_dias}'
    """)

    row = cur.fetchone()
    if row[0] > 0:
        qtd = row[0]
        soma = float(row[1]) / 100 if row[1] else 0
        minimo = float(row[2]) / 100 if row[2] else 0
        maximo = float(row[3]) / 100 if row[3] else 0

        print(f"  Total de pedidos: {qtd:,}")
        print(f"  Soma dos valores: R$ {soma:,.2f}")
        print(f"  Valor mínimo: R$ {minimo:,.2f}")
        print(f"  Valor máximo: R$ {maximo:,.2f}")

        # Mostrar alguns exemplos
        print(f"\n  Exemplos de pedidos:")
        cur.execute(f"""
            SELECT FIRST 5
                CODIGO, DATA, VLR_TOTAL, QTDE_TOTAL
            FROM PEDIDOS
            WHERE DATA >= '{hoje}' AND DATA <= '{daqui_30_dias}'
            ORDER BY VLR_TOTAL DESC
        """)

        for row in cur.fetchall():
            codigo, data, vlr_total, qtde = row
            vlr_real = float(vlr_total) / 100 if vlr_total else 0
            print(f"    Pedido {codigo}: R$ {vlr_real:,.2f} ({qtde:.2f} itens) - {data}")
    else:
        print("  Nenhum pedido encontrado nos próximos 30 dias")

    # Verificar todos os pedidos
    print("\n\n>> ESTATISTICAS GERAIS DOS PEDIDOS:")
    print("-"*100)

    cur.execute("""
        SELECT
            COUNT(*),
            SUM(CAST(VLR_TOTAL AS BIGINT)),
            AVG(CAST(VLR_TOTAL AS BIGINT)),
            MIN(CAST(VLR_TOTAL AS BIGINT)),
            MAX(CAST(VLR_TOTAL AS BIGINT))
        FROM PEDIDOS
    """)

    row = cur.fetchone()
    qtd = row[0]
    soma = float(row[1]) / 100 if row[1] else 0
    media = float(row[2]) / 100 if row[2] else 0
    minimo = float(row[3]) / 100 if row[3] else 0
    maximo = float(row[4]) / 100 if row[4] else 0

    print(f"  Total de pedidos: {qtd:,}")
    print(f"  Soma total: R$ {soma:,.2f}")
    print(f"  Valor médio: R$ {media:,.2f}")
    print(f"  Valor mínimo: R$ {minimo:,.2f}")
    print(f"  Valor máximo: R$ {maximo:,.2f}")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
