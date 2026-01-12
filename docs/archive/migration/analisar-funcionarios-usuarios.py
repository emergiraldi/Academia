#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analisa funcionários e usuários do PostgreSQL
"""

import sys
import codecs
import re

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

print("="*100)
print("ANALISE DE FUNCIONARIOS E USUARIOS DO POSTGRESQL")
print("="*100)

try:
    with open(r'c:\Projeto\Academia\funcionarios-usuarios.sql', 'r', encoding='latin1') as f:
        conteudo = f.read()

    linhas = conteudo.split('\n')

    # Analisar tabela FUNCIONARIOS
    print("\n>> TABELA FUNCIONARIOS:")
    print("-"*100)

    lendo_funcionarios = False
    funcionarios = []

    for linha in linhas:
        if 'COPY public.funcionarios' in linha:
            lendo_funcionarios = True
            print(f"Estrutura: {linha}")
            continue

        if linha.strip() == '\\.':
            lendo_funcionarios = False
            if funcionarios:
                break

        if lendo_funcionarios and linha.strip():
            funcionarios.append(linha.strip())

    print(f"\nTotal de funcionários encontrados: {len(funcionarios)}")

    if funcionarios:
        print(f"\nExemplos de funcionários (primeiros 10):")
        print("-"*100)
        for i, func in enumerate(funcionarios[:10], 1):
            campos = func.split('\t')
            print(f"\n{i}. Funcionário:")
            # Tentar identificar campos comuns
            if len(campos) >= 2:
                print(f"   Dados: {' | '.join(campos[:5])}")

    # Analisar tabela USUARIOS
    print("\n\n>> TABELA USUARIOS:")
    print("-"*100)

    lendo_usuarios = False
    usuarios = []

    for linha in linhas:
        if 'COPY public.usuarios' in linha:
            lendo_usuarios = True
            print(f"Estrutura: {linha}")
            continue

        if linha.strip() == '\\.':
            lendo_usuarios = False
            if usuarios:
                break

        if lendo_usuarios and linha.strip():
            usuarios.append(linha.strip())

    print(f"\nTotal de usuários encontrados: {len(usuarios)}")

    if usuarios:
        print(f"\nExemplos de usuários (primeiros 10):")
        print("-"*100)
        for i, user in enumerate(usuarios[:10], 1):
            campos = user.split('\t')
            print(f"\n{i}. Usuário:")
            if len(campos) >= 2:
                print(f"   Dados: {' | '.join(campos[:5])}")

    # Analisar tabela USER
    print("\n\n>> TABELA USER:")
    print("-"*100)

    lendo_user = False
    users = []

    for linha in linhas:
        if 'COPY public.user' in linha or 'COPY public."user"' in linha:
            lendo_user = True
            print(f"Estrutura: {linha}")
            continue

        if linha.strip() == '\\.':
            lendo_user = False
            if users:
                break

        if lendo_user and linha.strip():
            users.append(linha.strip())

    print(f"\nTotal de users encontrados: {len(users)}")

    if users:
        print(f"\nExemplos de users (primeiros 10):")
        print("-"*100)
        for i, user in enumerate(users[:10], 1):
            campos = user.split('\t')
            print(f"\n{i}. User:")
            if len(campos) >= 2:
                print(f"   Dados: {' | '.join(campos[:5])}")

    # Analisar tabela CARGOS
    print("\n\n>> TABELA CARGOS:")
    print("-"*100)

    lendo_cargos = False
    cargos = []

    for linha in linhas:
        if 'COPY public.cargos' in linha:
            lendo_cargos = True
            print(f"Estrutura: {linha}")
            continue

        if linha.strip() == '\\.':
            lendo_cargos = False
            if cargos:
                break

        if lendo_cargos and linha.strip():
            cargos.append(linha.strip())

    print(f"\nTotal de cargos encontrados: {len(cargos)}")

    if cargos:
        print(f"\nCargos cadastrados:")
        print("-"*100)
        for i, cargo in enumerate(cargos, 1):
            print(f"{i}. {cargo}")

    # Resumo
    print("\n" + "="*100)
    print("RESUMO:")
    print("="*100)
    print(f"  Funcionários no PostgreSQL: {len(funcionarios)}")
    print(f"  Usuários no PostgreSQL: {len(usuarios)}")
    print(f"  Users no PostgreSQL: {len(users)}")
    print(f"  Cargos no PostgreSQL: {len(cargos)}")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
