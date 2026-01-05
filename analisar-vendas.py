#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analisa estrutura de vendas/pedidos no PostgreSQL e Firebird
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
print("ANALISE DE VENDAS/PEDIDOS")
print("="*100)

# Analisar PostgreSQL
print("\n>> ESTRUTURA DOS PEDIDOS NO POSTGRESQL:")
print("-"*100)

with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
    conteudo = f.read()

linhas = conteudo.split('\n')

# Encontrar estrutura
for linha in linhas:
    if 'COPY public.pedidos' in linha:
        print(f"Estrutura: {linha}")
        break

# Pegar exemplos de pedidos
lendo_pedidos = False
pedidos_exemplos = []

for linha in linhas:
    if 'COPY public.pedidos' in linha:
        lendo_pedidos = True
        continue
    if linha.strip() == '\\.':
        lendo_pedidos = False
        if pedidos_exemplos:
            break
    if lendo_pedidos and linha.strip():
        pedidos_exemplos.append(linha.strip())
        if len(pedidos_exemplos) >= 5:
            break

print(f"\nExemplos de pedidos (primeiros 5):")
print("-"*100)
for i, ped in enumerate(pedidos_exemplos, 1):
    print(f"\n{i}. {ped[:200]}...")

# Analisar Firebird
print("\n\n>> ESTRUTURA DA TABELA PEDIDOS NO FIREBIRD:")
print("-"*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    cur.execute("""
        SELECT RDB$FIELD_NAME
        FROM RDB$RELATION_FIELDS
        WHERE RDB$RELATION_NAME = 'PEDIDOS'
        ORDER BY RDB$FIELD_POSITION
    """)

    campos = [row[0].strip() for row in cur.fetchall()]
    print(f"Campos ({len(campos)}): ")
    for i, campo in enumerate(campos):
        if i % 4 == 0:
            print("")
        print(f"  {campo:<25}", end='')
    print("\n")

    # Mostrar exemplo de pedido existente
    cur.execute("SELECT FIRST 1 * FROM PEDIDOS")
    row = cur.fetchone()

    if row:
        print("\nExemplo de pedido no Firebird:")
        for i, campo in enumerate(campos):
            if i < len(row) and row[i] is not None:
                valor = str(row[i])[:50]
                print(f"  {campo:<25} = {valor}")

    con.close()

except Exception as e:
    print(f"Erro: {e}")

print("\n" + "="*100)
