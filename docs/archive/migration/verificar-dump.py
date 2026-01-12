#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

arquivo = r'C:\Mac\Home\Documents\bkp brabancia\dump-bmcmdb-202512221903.sql'

print("Verificando dump SQL...")

with open(arquivo, 'r', encoding='latin1') as f:
    conteudo = f.read()

# Procurar seção de produtos
match = re.search(r'COPY public\.produtos.*?FROM stdin;(.*?)\\\\\\.', conteudo, re.DOTALL)

if match:
    dados = match.group(1).strip()
    linhas = dados.split('\n')
    print(f"\nSecao produtos encontrada!")
    print(f"Numero de linhas de dados: {len([l for l in linhas if l.strip()])}")
    print(f"\nPrimeiras 5 linhas:")
    for i, linha in enumerate(linhas[:5]):
        if linha.strip():
            print(f"  {i+1}. {linha[:100]}")
else:
    print("Secao produtos NAO encontrada")

# Contar todas as seções COPY
secoes = re.findall(r'COPY public\.(\w+).*?FROM stdin;', conteudo)
print(f"\nTotal de secoes COPY encontradas: {len(secoes)}")
print("Tabelas:", ', '.join(secoes[:20]), "...")
