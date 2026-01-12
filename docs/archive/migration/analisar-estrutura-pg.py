#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analisa a estrutura real dos dados do PostgreSQL
"""

import sys, codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

print("="*100)
print("ANALISE DA ESTRUTURA DO POSTGRESQL")
print("="*100)

try:
    with open(r'c:\Projeto\Academia\funcionarios-usuarios.sql', 'r', encoding='latin1') as f:
        conteudo = f.read()

    linhas = conteudo.split('\n')

    # Analisar funcionarios
    print("\n>> ESTRUTURA DOS FUNCIONARIOS:")
    print("-"*100)

    lendo_funcionarios = False
    funcionarios = []

    for linha in linhas:
        if 'COPY public.funcionarios' in linha:
            print(f"\nCabeçalho: {linha}")
            lendo_funcionarios = True
            continue
        if linha.strip() == '\\.':
            lendo_funcionarios = False
            if funcionarios:
                break
        if lendo_funcionarios and linha.strip():
            funcionarios.append(linha.strip())
            if len(funcionarios) >= 5:
                break

    print(f"\nPrimeiros 5 funcionarios (todos os campos):")
    for i, func in enumerate(funcionarios, 1):
        campos = func.split('\t')
        print(f"\n{i}. Funcionario ID {campos[0] if campos else '?'}:")
        for j, campo in enumerate(campos):
            print(f"   Campo {j}: {campo}")

    # Analisar usuarios
    print("\n\n>> ESTRUTURA DOS USUARIOS:")
    print("-"*100)

    lendo_usuarios = False
    usuarios = []

    for linha in linhas:
        if 'COPY public.usuarios' in linha:
            print(f"\nCabeçalho: {linha}")
            lendo_usuarios = True
            continue
        if linha.strip() == '\\.':
            lendo_usuarios = False
            if usuarios:
                break
        if lendo_usuarios and linha.strip():
            usuarios.append(linha.strip())
            if len(usuarios) >= 5:
                break

    print(f"\nPrimeiros 5 usuarios (todos os campos):")
    for i, user in enumerate(usuarios, 1):
        campos = user.split('\t')
        print(f"\n{i}. Usuario ID {campos[0] if campos else '?'}:")
        for j, campo in enumerate(campos):
            print(f"   Campo {j}: {campo}")

    # Analisar cargos
    print("\n\n>> ESTRUTURA DOS CARGOS:")
    print("-"*100)

    lendo_cargos = False
    cargos = []

    for linha in linhas:
        if 'COPY public.cargos' in linha:
            print(f"\nCabeçalho: {linha}")
            lendo_cargos = True
            continue
        if linha.strip() == '\\.':
            lendo_cargos = False
            if cargos:
                break
        if lendo_cargos and linha.strip():
            cargos.append(linha.strip())

    print(f"\nTodos os cargos ({len(cargos)} encontrados):")
    for i, cargo in enumerate(cargos, 1):
        campos = cargo.split('\t')
        print(f"{i}. ID:{campos[0] if len(campos) > 0 else '?'} - {campos[1] if len(campos) > 1 else '?'}")

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
