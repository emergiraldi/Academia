#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Investiga por que há diferenças nos valores dos pedidos
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
print("INVESTIGACAO: POR QUE HA DIFERENCAS NOS VALORES?")
print("="*100)

# Ler pedidos do PostgreSQL
with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
    conteudo = f.read()

linhas = conteudo.split('\n')

# Buscar detalhes do pedido 23043 no PostgreSQL
print("\n>> Buscando detalhes do Pedido 23043 no PostgreSQL:")
print("-"*100)

lendo_pedidos = False
for linha in linhas:
    if 'COPY public.pedidos' in linha:
        print(f"Estrutura dos pedidos:")
        campos_pedido = linha.replace('COPY public.pedidos (', '').replace(') FROM stdin;', '').split(', ')
        for i, campo in enumerate(campos_pedido):
            print(f"  Campo {i}: {campo}")
        lendo_pedidos = True
        continue
    if linha.strip() == '\\.':
        lendo_pedidos = False
        break
    if lendo_pedidos and linha.strip():
        campos = parse_linha(linha.strip())
        if campos[0] == '23043':
            print(f"\nPedido 23043 encontrado:")
            for i, valor in enumerate(campos[:20]):  # Primeiros 20 campos
                print(f"  Campo {i}: {valor}")
            break

# Ler itens do pedido no PostgreSQL
print("\n>> Buscando itens do Pedido 23043 no PostgreSQL:")
print("-"*100)

lendo_itens = False
itens_pg = []

for linha in linhas:
    if 'COPY public.pedidos_itens' in linha:
        print(f"Estrutura dos itens:")
        campos_item = linha.replace('COPY public.pedidos_itens (', '').replace(') FROM stdin;', '').split(', ')
        for i, campo in enumerate(campos_item):
            print(f"  Campo {i}: {campo}")
        lendo_itens = True
        continue
    if linha.strip() == '\\.':
        lendo_itens = False
        if itens_pg:
            break
    if lendo_itens and linha.strip():
        campos = parse_linha(linha.strip())
        if campos[1] == '23043':  # Campo 1 é idpedido
            itens_pg.append(campos)

print(f"\nItens encontrados: {len(itens_pg)}")

soma_itens_pg = 0
print(f"\n{'PRODUTO':<12} {'QTDE':<10} {'PRECO UNIT':<15} {'TOTAL'}")
print("-"*100)

for item in itens_pg:
    idproduto = item[2]  # Campo 2: idproduto
    qtde = float(item[4]) if item[4] != '\\N' else 0  # Campo 4: qtdrec
    preco = float(item[6]) if item[6] != '\\N' else 0  # Campo 6: preco
    total = qtde * preco
    soma_itens_pg += total
    print(f"{idproduto:<12} {qtde:<10.2f} R$ {preco:>11,.2f} R$ {total:>12,.2f}")

print(f"\nSoma dos itens PG: R$ {soma_itens_pg:,.2f}")

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
    print("\n>> Pedido 23043 no Firebird:")
    print("-"*100)

    cur.execute("""
        SELECT
            CODIGO, DATA, VLR_TOTAL, VLR_PRODUTOS, VLR_DESCONTO, QTDE_TOTAL
        FROM PEDIDOS
        WHERE CODIGO = 23043
    """)

    row = cur.fetchone()
    if row:
        codigo, data, vlr_total, vlr_prod, vlr_desc, qtde = row
        vlr_t = float(vlr_total) / 100 if vlr_total else 0
        vlr_p = float(vlr_prod) / 100 if vlr_prod else 0
        vlr_d = float(vlr_desc) / 100 if vlr_desc else 0

        print(f"  Código: {codigo}")
        print(f"  Data: {data}")
        print(f"  VLR_TOTAL: R$ {vlr_t:,.2f}")
        print(f"  VLR_PRODUTOS: R$ {vlr_p:,.2f}")
        print(f"  VLR_DESCONTO: R$ {vlr_d:,.2f}")
        print(f"  QTDE_TOTAL: {qtde}")

    # Buscar itens no Firebird
    print("\n>> Itens do Pedido 23043 no Firebird:")
    print("-"*100)

    cur.execute("""
        SELECT
            IDPRODUTO, QTDE, VLR_UNIT, VLR_TOTAL
        FROM PEDIDOS_ITENS
        WHERE CODIGO = 23043
        ORDER BY IDPRODUTO
    """)

    itens_fb = cur.fetchall()
    soma_itens_fb = 0

    print(f"{'PRODUTO':<12} {'QTDE':<10} {'PRECO UNIT':<15} {'TOTAL'}")
    print("-"*100)

    for item in itens_fb:
        idprod, qtde, vlr_unit, vlr_total = item
        vlr_u = float(vlr_unit) / 100 if vlr_unit else 0
        vlr_t = float(vlr_total) / 100 if vlr_total else 0
        soma_itens_fb += vlr_t

        print(f"{idprod:<12} {qtde:<10.2f} R$ {vlr_u:>11,.2f} R$ {vlr_t:>12,.2f}")

    print(f"\nSoma dos itens FB: R$ {soma_itens_fb:,.2f}")

    print("\n>> RESUMO DA COMPARACAO:")
    print("-"*100)
    print(f"  Soma itens PostgreSQL: R$ {soma_itens_pg:,.2f}")
    print(f"  Soma itens Firebird: R$ {soma_itens_fb:,.2f}")
    print(f"  Diferença: R$ {abs(soma_itens_pg - soma_itens_fb):,.2f}")

    print(f"\n  Total pedido PostgreSQL (VLNOTA): R$ 4,297.94")
    print(f"  Total pedido Firebird (VLR_TOTAL): R$ {vlr_t:,.2f}")
    print(f"  Diferença: R$ {abs(4297.94 - vlr_t):,.2f}")

    # Verificar se algum item não foi migrado
    produtos_pg = set([item[2] for item in itens_pg])
    produtos_fb = set([str(item[0]) for item in itens_fb])

    itens_faltando = produtos_pg - produtos_fb
    if itens_faltando:
        print(f"\n  ITENS QUE ESTAO NO PG MAS NAO NO FB: {itens_faltando}")

        # Calcular valor dos itens faltando
        valor_faltando = 0
        for item in itens_pg:
            if item[2] in itens_faltando:
                qtde = float(item[4]) if item[4] != '\\N' else 0
                preco = float(item[6]) if item[6] != '\\N' else 0
                valor_faltando += qtde * preco

        print(f"  Valor dos itens faltando: R$ {valor_faltando:,.2f}")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
