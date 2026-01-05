#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analisa o formato do dump PostgreSQL
"""

import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

arquivo_dump = r'C:\Mac\Home\Documents\bkp brabancia\dump-bmcmdb-202512221903.sql'

print("=== ANALISE DO DUMP POSTGRESQL ===\n")
print(f"Arquivo: {arquivo_dump}\n")

try:
    with open(arquivo_dump, 'r', encoding='latin1') as f:
        linhas = f.readlines()

    total_linhas = len(linhas)
    print(f"Total de linhas: {total_linhas:,}\n")

    # Procurar por COPY statements
    print(">>> Procurando por COPY statements:")
    print("-" * 60)

    copy_statements = []
    for i, linha in enumerate(linhas):
        if 'COPY public.' in linha and 'FROM stdin' in linha:
            copy_statements.append((i, linha.strip()))

    print(f"Encontrados {len(copy_statements)} COPY statements:\n")
    for num_linha, statement in copy_statements:
        print(f"Linha {num_linha:,}: {statement[:80]}")

    # Analisar a primeira secao de dados
    if copy_statements:
        print("\n>>> Analisando primeira secao de dados:")
        print("-" * 60)

        primeira_copy_linha = copy_statements[0][0]
        print(f"\nInicio da secao: linha {primeira_copy_linha:,}")
        print(f"Statement: {copy_statements[0][1]}\n")

        # Ler as proximas 20 linhas apos o COPY
        print("Proximas 20 linhas:")
        for i in range(primeira_copy_linha + 1, min(primeira_copy_linha + 21, total_linhas)):
            linha = linhas[i]

            # Verificar se e linha de dados (com tabs)
            tem_tabs = '\t' in linha

            # Verificar se e fim de dados
            e_fim = linha.strip() == '\\.'

            # Mostrar informacoes
            preview = linha[:80].replace('\t', '[TAB]').replace('\n', '')
            if len(linha) > 80:
                preview += '...'

            status = ''
            if e_fim:
                status = ' <- FIM DE DADOS'
            elif tem_tabs:
                status = f' <- DADOS (contém {linha.count(chr(9))} tabs)'

            print(f"  {i:,}: {preview}{status}")

    # Procurar por backslash-ponto
    print("\n>>> Procurando por terminadores (backslash-ponto):")
    print("-" * 60)

    terminadores = []
    for i, linha in enumerate(linhas):
        if linha.strip() == '\\.':
            terminadores.append(i)

    print(f"Encontrados {len(terminadores)} terminadores\n")
    if terminadores:
        print("Primeiros 5 terminadores nas linhas:")
        for num_linha in terminadores[:5]:
            print(f"  - Linha {num_linha:,}")

    # Verificar encoding
    print("\n>>> Verificando encoding:")
    print("-" * 60)

    # Tentar ler com diferentes encodings
    encodings = ['latin1', 'utf-8', 'cp1252', 'iso-8859-1']
    for enc in encodings:
        try:
            with open(arquivo_dump, 'r', encoding=enc) as f:
                primeira_linha = f.readline()
            print(f"  {enc}: OK")
        except Exception as e:
            print(f"  {enc}: ERRO - {e}")

    # Verificar se tem caracteres binarios
    print("\n>>> Verificando caracteres binarios:")
    print("-" * 60)

    with open(arquivo_dump, 'rb') as f:
        primeiros_1000_bytes = f.read(1000)

    binarios = sum(1 for b in primeiros_1000_bytes if b < 32 and b not in [9, 10, 13])
    print(f"Caracteres binarios nos primeiros 1000 bytes: {binarios}")

    if binarios > 0:
        print("AVISO: Arquivo pode conter dados binarios!")

except Exception as e:
    print(f"ERRO: {e}")
    import traceback
    traceback.print_exc()
