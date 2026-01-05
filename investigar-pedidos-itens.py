#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Investiga por que os itens dos pedidos não foram migrados
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
print("INVESTIGACAO: POR QUE ITENS NAO FORAM MIGRADOS?")
print("="*100)

# Ler itens do PostgreSQL
with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
    conteudo = f.read()

linhas = conteudo.split('\n')

# Pegar exemplos de itens
lendo_itens = False
itens_exemplos = []

for linha in linhas:
    if 'COPY public.pedidos_itens' in linha:
        print(f"Estrutura dos itens:")
        print(f"  {linha}")
        lendo_itens = True
        continue
    if linha.strip() == '\\.':
        lendo_itens = False
        if itens_exemplos:
            break
    if lendo_itens and linha.strip():
        itens_exemplos.append(linha.strip())
        if len(itens_exemplos) >= 10:
            break

print(f"\n>> EXEMPLOS DE ITENS NO POSTGRESQL:")
print("-"*100)
for i, item in enumerate(itens_exemplos, 1):
    campos = item.split('\t')
    idpedido = campos[1] if len(campos) > 1 else '?'
    idproduto = campos[2] if len(campos) > 2 else '?'
    qtd = campos[4] if len(campos) > 4 else '?'
    preco = campos[6] if len(campos) > 6 else '?'
    print(f"{i}. Pedido:{idproduto} Produto:{idproduto} Qtd:{qtd} Preço:{preco}")

# Conectar ao Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Verificar produtos no Firebird
    print(f"\n>> PRODUTOS NO FIREBIRD:")
    print("-"*100)

    cur.execute("SELECT MIN(CODIGO), MAX(CODIGO), COUNT(*) FROM CAD_PRODUTOS")
    row = cur.fetchone()
    print(f"  Range de códigos: {row[0]} até {row[1]}")
    print(f"  Total de produtos: {row[2]:,}")

    # Verificar alguns produtos específicos dos itens
    print(f"\n>> VERIFICANDO SE OS PRODUTOS DOS ITENS EXISTEM NO FIREBIRD:")
    print("-"*100)

    produtos_verificar = []
    for item in itens_exemplos[:5]:
        campos = item.split('\t')
        if len(campos) > 2:
            try:
                idproduto = int(campos[2])
                produtos_verificar.append(idproduto)
            except:
                pass

    for idprod in produtos_verificar:
        cur.execute("SELECT CODIGO, NOME FROM CAD_PRODUTOS WHERE CODIGO = ?", [idprod])
        row = cur.fetchone()
        if row:
            print(f"  Produto {idprod}: EXISTE - {row[1][:50]}")
        else:
            print(f"  Produto {idprod}: NAO EXISTE")

    # Ver estrutura real dos itens
    print(f"\n>> ANALISANDO ESTRUTURA REAL DOS ITENS:")
    print("-"*100)

    print(f"\nPrimeiro item completo:")
    if itens_exemplos:
        campos = itens_exemplos[0].split('\t')
        for i, campo in enumerate(campos):
            print(f"  Campo {i}: {campo}")

    # Verificar pedidos no Firebird
    print(f"\n>> PEDIDOS NO FIREBIRD:")
    print("-"*100)

    cur.execute("SELECT MIN(CODIGO), MAX(CODIGO), COUNT(*) FROM PEDIDOS")
    row = cur.fetchone()
    print(f"  Range de códigos: {row[0]} até {row[1]}")
    print(f"  Total de pedidos: {row[2]:,}")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
