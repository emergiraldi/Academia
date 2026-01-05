#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lista todas as tabelas disponíveis no dump do PostgreSQL
"""

import sys
import codecs
import re

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

print("="*100)
print("TABELAS DISPONIVEIS NO DUMP DO POSTGRESQL")
print("="*100)

try:
    with open(r'c:\Projeto\Academia\dados-extraidos.sql', 'r', encoding='latin1') as f:
        conteudo = f.read()

    linhas = conteudo.split('\n')
    tabelas = set()

    for linha in linhas:
        # Procurar por linhas COPY public.TABELA
        match = re.match(r'COPY public\.(\w+)', linha)
        if match:
            tabela = match.group(1)
            tabelas.add(tabela)

    print(f"\nTotal de tabelas encontradas: {len(tabelas)}\n")

    tabelas_ordenadas = sorted(tabelas)
    for i, tabela in enumerate(tabelas_ordenadas, 1):
        print(f"  {i:2}. {tabela}")

    # Verificar especificamente se tem vendedores/funcionários
    print("\n" + "="*100)
    print("VERIFICACAO ESPECIFICA:")
    print("="*100)

    tabelas_interesse = []
    for tabela in tabelas_ordenadas:
        if any(palavra in tabela.lower() for palavra in ['vendedor', 'funcionario', 'colaborador', 'usuario', 'user']):
            tabelas_interesse.append(tabela)

    if tabelas_interesse:
        print(f"\nTabelas relacionadas a vendedores/funcionarios/usuarios:")
        for tabela in tabelas_interesse:
            print(f"  - {tabela}")

            # Contar quantos registros tem
            lendo_dados = False
            total_registros = 0

            for linha in linhas:
                if f'COPY public.{tabela}' in linha:
                    lendo_dados = True
                    continue

                if linha.strip() == '\\.':
                    lendo_dados = False
                    if total_registros > 0:
                        break

                if lendo_dados and linha.strip():
                    total_registros += 1

            print(f"    Total de registros: {total_registros:,}")
    else:
        print("\n  Nao ha tabelas de vendedores/funcionarios/usuarios no dump")

    print("\n" + "="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
