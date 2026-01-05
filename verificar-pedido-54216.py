#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica detalhes do pedido 54216
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
print("VERIFICACAO DO PEDIDO 54216")
print("="*100)

# Verificar se está no PostgreSQL
print("\n>> Verificando no PostgreSQL:")
print("-"*100)

try:
    with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
        conteudo = f.read()

    linhas = conteudo.split('\n')
    lendo_pedidos = False
    encontrado_pg = False

    for linha in linhas:
        if 'COPY public.pedidos' in linha:
            lendo_pedidos = True
            continue
        if linha.strip() == '\\.':
            lendo_pedidos = False
            break
        if lendo_pedidos and linha.strip():
            campos = linha.split('\t')
            if campos[0] == '54216':
                print("  Pedido 54216 ENCONTRADO no PostgreSQL!")
                print(f"    VLNOTA: R$ {float(campos[4]) if campos[4] != '\\N' else 0:,.2f}")
                print(f"    VLPROD: R$ {float(campos[5]) if campos[5] != '\\N' else 0:,.2f}")
                print(f"    DATA: {campos[12]}")
                encontrado_pg = True
                break

    if not encontrado_pg:
        print("  Pedido 54216 NAO está no PostgreSQL (é um pedido novo)")

except Exception as e:
    print(f"  Erro ao ler PostgreSQL: {e}")

# Conectar ao Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Buscar pedido no Firebird
    print("\n>> Verificando no Firebird:")
    print("-"*100)

    cur.execute("""
        SELECT
            CODIGO, DATA, VLR_TOTAL, VLR_PRODUTOS, VLR_DESCONTO,
            QTDE_TOTAL, CLIENTE
        FROM PEDIDOS
        WHERE CODIGO = 54216
    """)

    row = cur.fetchone()
    if row:
        codigo, data, vlr_total, vlr_prod, vlr_desc, qtde, cliente = row
        vlr_t = float(vlr_total) / 100 if vlr_total else 0
        vlr_p = float(vlr_prod) / 100 if vlr_prod else 0
        vlr_d = float(vlr_desc) / 100 if vlr_desc else 0

        print(f"  Pedido 54216 ENCONTRADO no Firebird!")
        print(f"    Código: {codigo}")
        print(f"    Data: {data}")
        print(f"    Cliente: {cliente}")
        print(f"    VLR_TOTAL: R$ {vlr_t:,.2f}")
        print(f"    VLR_PRODUTOS: R$ {vlr_p:,.2f}")
        print(f"    VLR_DESCONTO: R$ {vlr_d:,.2f}")
        print(f"    QTDE_TOTAL: {qtde:.2f}")

        # Buscar itens
        print("\n>> Itens do pedido 54216:")
        print("-"*100)

        cur.execute("""
            SELECT
                IDPRODUTO, QTDE, VLR_UNIT, VLR_TOTAL
            FROM PEDIDOS_ITENS
            WHERE CODIGO = 54216
            ORDER BY IDPRODUTO
        """)

        itens = cur.fetchall()

        if itens:
            print(f"  Total de itens: {len(itens)}")
            print(f"\n  {'PRODUTO':<12} {'QTDE':<10} {'VLR_UNIT':<20} {'VLR_TOTAL'}")
            print("  " + "-"*80)

            soma_itens = 0
            for item in itens:
                idprod, qtde, vlr_unit, vlr_total_item = item
                vlr_u = float(vlr_unit) / 100 if vlr_unit else 0
                vlr_ti = float(vlr_total_item) / 100 if vlr_total_item else 0
                soma_itens += vlr_ti

                print(f"  {idprod:<12} {qtde:<10.2f} R$ {vlr_u:>15,.2f} R$ {vlr_ti:>15,.2f}")

            print(f"\n  Soma dos itens: R$ {soma_itens:,.2f}")

            # Comparar
            print(f"\n>> COMPARACAO:")
            print("-"*100)
            print(f"  Soma dos itens: R$ {soma_itens:,.2f}")
            print(f"  VLR_TOTAL pedido: R$ {vlr_t:,.2f}")

            if abs(soma_itens - vlr_t) < 0.01:
                print(f"  Status: OK - valores batem!")
            else:
                diferenca = vlr_t - soma_itens
                print(f"  Status: DIFERENÇA de R$ {diferenca:,.2f}")
                print(f"  Isso pode ser frete, impostos ou descontos")

        else:
            print("  Nenhum item encontrado!")

    else:
        print("  Pedido 54216 NAO está no Firebird!")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
