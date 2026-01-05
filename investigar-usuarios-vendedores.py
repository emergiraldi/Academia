#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Investiga problemas com cadastro de usuários e vendedores
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
print("INVESTIGACAO: USUARIOS E VENDEDORES")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Verificar estrutura da tabela USUARIO
    print("\n>> ESTRUTURA DA TABELA USUARIO:")
    print("-"*100)
    cur.execute("""
        SELECT r.RDB$FIELD_NAME
        FROM RDB$RELATION_FIELDS r
        WHERE r.RDB$RELATION_NAME = 'USUARIO'
        ORDER BY r.RDB$FIELD_POSITION
    """)

    print("Campos da tabela USUARIO:")
    for row in cur.fetchall():
        print(f"  - {row[0].strip()}")

    # Ver exemplos de usuários no Firebird
    print("\n>> USUARIOS NO FIREBIRD (primeiros 10):")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            CODIGO, NOME, USERNAME, NOMEABREVIADO, CARGO
        FROM USUARIO
        ORDER BY CODIGO
    """)

    print(f"{'CODIGO':<10} {'NOME':<30} {'USERNAME':<20} {'NOME_ABREV':<20} {'CARGO'}")
    print("-"*100)

    for row in cur.fetchall():
        codigo, nome, username, nomeabrev, cargo = row
        nome_str = nome[:30] if nome else ""
        user_str = username[:20] if username else ""
        abrev_str = nomeabrev[:20] if nomeabrev else ""
        cargo_str = str(cargo) if cargo else ""
        print(f"{codigo:<10} {nome_str:<30} {user_str:<20} {abrev_str:<20} {cargo_str}")

    # Contar usuários
    cur.execute("SELECT COUNT(*) FROM USUARIO")
    total_usuarios = cur.fetchone()[0]
    print(f"\nTotal de usuarios: {total_usuarios:,}")

    # Verificar pessoas com TIPO='VENDEDOR'
    print("\n>> VENDEDORES NO CAD_PESSOA:")
    print("-"*100)

    cur.execute("""
        SELECT CODIGO, NOME, TIPO
        FROM CAD_PESSOA
        WHERE TIPO = 'VENDEDOR'
        ORDER BY CODIGO
    """)

    vendedores = cur.fetchall()
    if vendedores:
        for row in vendedores:
            print(f"  Codigo {row[0]}: {row[1]} (TIPO={row[2]})")
    else:
        print("  Nenhum vendedor encontrado!")

    print(f"\nTotal de vendedores: {len(vendedores):,}")

    # Verificar pessoas com TIPO='FUNCIONARIO'
    print("\n>> FUNCIONARIOS NO CAD_PESSOA:")
    print("-"*100)

    cur.execute("""
        SELECT COUNT(*)
        FROM CAD_PESSOA
        WHERE TIPO = 'FUNCIONARIO'
    """)
    total_func = cur.fetchone()[0]
    print(f"Total de funcionarios: {total_func:,}")

    # Verificar relação entre funcionários e usuários
    print("\n>> VERIFICANDO RELACAO FUNCIONARIOS X USUARIOS:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            P.CODIGO, P.NOME, U.USERNAME, U.CARGO
        FROM CAD_PESSOA P
        LEFT JOIN USUARIO U ON U.CODIGO = P.CODIGO
        WHERE P.TIPO = 'FUNCIONARIO'
        ORDER BY P.CODIGO
    """)

    print(f"{'COD_FUNC':<10} {'NOME':<30} {'USERNAME':<20} {'CARGO'}")
    print("-"*100)

    for row in cur.fetchall():
        cod, nome, username, cargo = row
        username_str = username[:20] if username else "(sem usuario)"
        cargo_str = str(cargo) if cargo else ""
        print(f"{cod:<10} {nome[:30]:<30} {username_str:<20} {cargo_str}")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

# Agora verificar o PostgreSQL
print("\n\n>> VERIFICANDO POSTGRESQL:")
print("="*100)

try:
    with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
        conteudo = f.read()

    linhas = conteudo.split('\n')

    # Verificar estrutura de usuários no PostgreSQL
    print("\n>> ESTRUTURA DOS USUARIOS NO POSTGRESQL:")
    print("-"*100)

    lendo_usuarios = False
    usuarios_pg = []

    for linha in linhas:
        if 'COPY public.usuarios' in linha:
            print(f"Estrutura: {linha}")
            lendo_usuarios = True
            continue
        if linha.strip() == '\\.':
            lendo_usuarios = False
            if usuarios_pg:
                break
        if lendo_usuarios and linha.strip():
            usuarios_pg.append(linha.strip())
            if len(usuarios_pg) >= 10:
                break

    print(f"\nExemplos de usuarios (primeiros 5):")
    for i, usuario in enumerate(usuarios_pg[:5], 1):
        campos = usuario.split('\t')
        print(f"\n{i}. Usuario completo:")
        for j, campo in enumerate(campos):
            print(f"   Campo {j}: {campo}")

    # Verificar se há vendedores nos funcionários do PostgreSQL
    print("\n\n>> VERIFICANDO FUNCIONARIOS NO POSTGRESQL:")
    print("-"*100)

    lendo_funcionarios = False
    funcionarios_pg = []

    for linha in linhas:
        if 'COPY public.funcionarios' in linha:
            print(f"Estrutura: {linha}")
            lendo_funcionarios = True
            continue
        if linha.strip() == '\\.':
            lendo_funcionarios = False
            if funcionarios_pg:
                break
        if lendo_funcionarios and linha.strip():
            funcionarios_pg.append(linha.strip())

    print(f"\nTotal de funcionarios no PostgreSQL: {len(funcionarios_pg):,}")

    # Ver se algum campo indica vendedor
    print(f"\nExemplos de funcionarios (primeiros 3):")
    for i, func in enumerate(funcionarios_pg[:3], 1):
        campos = func.split('\t')
        print(f"\n{i}. Funcionario completo:")
        for j, campo in enumerate(campos[:15]):  # Primeiros 15 campos
            print(f"   Campo {j}: {campo}")

except Exception as e:
    print(f"\n[ERRO ao ler PostgreSQL] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
