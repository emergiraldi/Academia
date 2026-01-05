#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lista todas as tabelas disponíveis no backup PostgreSQL
"""

import sys
import codecs
import subprocess

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

print("=== LISTANDO TABELAS DO BACKUP POSTGRESQL ===\n")

pg_restore = r'c:\Projeto\Academia\pg-tools\pgsql\bin\pg_restore.exe'
backup_file = r'C:\Mac\Home\Documents\bkp brabancia\bmcmdb.bkp'

try:
    # Executar pg_restore --list
    result = subprocess.run(
        [pg_restore, '--list', backup_file],
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='ignore'
    )

    # Filtrar linhas que contêm TABLE DATA
    linhas = result.stdout.split('\n')
    tabelas = []

    for linha in linhas:
        if 'TABLE DATA' in linha and 'public' in linha:
            # Extrair nome da tabela
            partes = linha.split()
            for i, parte in enumerate(partes):
                if parte == 'public':
                    if i + 1 < len(partes):
                        tabela = partes[i + 1]
                        if tabela not in tabelas:
                            tabelas.append(tabela)

    print(f"Total de tabelas encontradas: {len(tabelas)}\n")

    # Procurar por tabelas relevantes
    print(">>> TABELAS RELEVANTES:")
    relevantes = ['fornec', 'cliente', 'pessoa', 'produto', 'conta', 'documento', 'credito']

    for palavra in relevantes:
        print(f"\nTabelas com '{palavra}':")
        encontradas = [t for t in tabelas if palavra.lower() in t.lower()]
        if encontradas:
            for t in encontradas:
                print(f"  - {t}")
        else:
            print(f"  (nenhuma)")

    print("\n>>> TODAS AS TABELAS:")
    for t in sorted(tabelas):
        print(f"  - {t}")

except Exception as e:
    print(f"[ERRO] {e}")
    import traceback
    traceback.print_exc()
