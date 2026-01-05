#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Debug do dump - mostrar o que vem depois do COPY
"""

import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

arquivo_dump = r'C:\Mac\Home\Documents\bkp brabancia\dump-bmcmdb-202512221903.sql'

print("=== DEBUG DO DUMP ===\n")

with open(arquivo_dump, 'r', encoding='latin1', errors='ignore') as f:
    linhas = f.readlines()

# Encontrar COPY produtos
for i, linha in enumerate(linhas):
    if 'COPY public.produtos' in linha and 'FROM stdin' in linha:
        print(f">>> COPY produtos na linha {i:,}")
        print(f"Linha {i:,}: {linha.strip()}")
        print("\nProximas 100 linhas:")
        print("=" * 80)

        for j in range(i + 1, min(i + 101, len(linhas))):
            linha_debug = linhas[j]

            # Info sobre a linha
            tamanho = len(linha_debug)
            tem_tabs = '\t' in linha_debug
            num_tabs = linha_debug.count('\t')

            # Contar caracteres binários (controle)
            binarios = sum(1 for c in linha_debug if ord(c) < 32 and ord(c) not in [9, 10, 13])

            # Verificar se é backslash-ponto
            e_fim = linha_debug.strip() == '\\.'

            # Preview da linha
            preview = linha_debug[:100].replace('\t', '[TAB]').replace('\n', '[NL]')
            if len(linha_debug) > 100:
                preview += '...'

            # Status
            status = f"tam={tamanho:4} tabs={num_tabs:2} bin={binarios:3}"
            if e_fim:
                status += " <- FIM"
            elif tem_tabs and binarios < 10:
                status += " <- POSSIVEL DADO"

            print(f"{j:7,}: {status} | {preview}")

        break

# Agora verificar se existe alguma linha com muitos tabs (provavelmente dados)
print("\n\n>>> Procurando linhas com muitos tabs (provaveis dados)...")
print("=" * 80)

linhas_com_tabs = []
for i, linha in enumerate(linhas):
    num_tabs = linha.count('\t')
    if num_tabs >= 10:  # Produtos tem 31 colunas, então pelo menos 10 tabs
        linhas_com_tabs.append((i, num_tabs, linha[:100]))

print(f"Encontradas {len(linhas_com_tabs)} linhas com 10+ tabs\n")

if linhas_com_tabs:
    print("Primeiras 10 linhas:")
    for i, (num_linha, num_tabs, preview) in enumerate(linhas_com_tabs[:10]):
        preview_clean = preview.replace('\t', '[TAB]').replace('\n', '[NL]')
        print(f"{num_linha:7,}: {num_tabs:2} tabs | {preview_clean}...")
