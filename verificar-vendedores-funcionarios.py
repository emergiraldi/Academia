#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica vendedores e funcionários no banco de dados
"""

import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

print("="*100)
print("VERIFICACAO DE VENDEDORES E FUNCIONARIOS")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Verificar todos os tipos de pessoa
    print("\n>> TIPOS DE PESSOA NO BANCO:")
    print("-"*100)

    cur.execute("""
        SELECT TIPO, COUNT(*)
        FROM CAD_PESSOA
        GROUP BY TIPO
        ORDER BY TIPO
    """)

    for row in cur:
        tipo = row[0] or '(NULL)'
        qtd = row[1]
        print(f"  TIPO '{tipo}': {qtd:,} registros")

    # Verificar se existe tabela de vendedores
    print("\n>> TABELAS RELACIONADAS A VENDEDORES:")
    print("-"*100)

    cur.execute("""
        SELECT RDB$RELATION_NAME
        FROM RDB$RELATIONS
        WHERE RDB$SYSTEM_FLAG = 0
        AND (RDB$RELATION_NAME LIKE '%VEND%' OR RDB$RELATION_NAME LIKE '%FUNC%' OR RDB$RELATION_NAME LIKE '%COLABOR%')
        ORDER BY RDB$RELATION_NAME
    """)

    tabelas = [row[0].strip() for row in cur.fetchall()]
    if tabelas:
        for tabela in tabelas:
            cur.execute(f"SELECT COUNT(*) FROM {tabela}")
            total = cur.fetchone()[0]
            print(f"  {tabela}: {total:,} registros")
    else:
        print("  Nenhuma tabela específica de vendedores/funcionários encontrada")

    # Mostrar vendedores se existirem
    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'VENDEDOR'")
    total_vendedores = cur.fetchone()[0]

    if total_vendedores > 0:
        print(f"\n>> VENDEDORES (TIPO='VENDEDOR'):")
        print("-"*100)
        print(f"  Total: {total_vendedores}")

        cur.execute("""
            SELECT CODIGO, NOME, CPF_CNPJ, FONE, EMAIL, ATIVO
            FROM CAD_PESSOA
            WHERE TIPO = 'VENDEDOR'
            ORDER BY CODIGO
        """)

        print(f"\n  {'CODIGO':<8} {'NOME':<40} {'CPF/CNPJ':<18} {'ATIVO'}")
        print(f"  {'-'*8} {'-'*40} {'-'*18} {'-'*5}")

        for row in cur:
            codigo, nome, cpf, fone, email, ativo = row
            nome_trunc = (nome or '')[:38]
            cpf_str = (cpf or '')[:16]
            print(f"  {codigo:<8} {nome_trunc:<40} {cpf_str:<18} {ativo}")

    # Verificar no PostgreSQL se tem vendedores/funcionários
    print("\n>> VERIFICANDO DUMP DO POSTGRESQL:")
    print("-"*100)

    import re

    try:
        with open(r'c:\Projeto\Academia\dados-extraidos.sql', 'r', encoding='latin1') as f:
            conteudo = f.read()

        # Procurar por tabela de vendedores
        if 'vendedores' in conteudo.lower():
            print("  Encontrada referencia a 'vendedores' no dump")

            # Tentar contar vendedores
            linhas = conteudo.split('\n')
            lendo_vendedores = False
            total_vendedores_pg = 0

            for linha in linhas:
                if 'COPY public.vendedores' in linha or 'COPY public.vendedor' in linha:
                    lendo_vendedores = True
                    print(f"  Encontrada tabela de vendedores no PostgreSQL")
                    continue

                if linha.strip() == '\\.':
                    lendo_vendedores = False
                    if total_vendedores_pg > 0:
                        break

                if lendo_vendedores and linha.strip() and linha.strip() != '\\.':
                    total_vendedores_pg += 1

            if total_vendedores_pg > 0:
                print(f"  Total de vendedores no PostgreSQL: {total_vendedores_pg:,}")
        else:
            print("  Nao encontrada tabela de vendedores no dump do PostgreSQL")

        # Procurar por tabela de funcionários
        if 'funcionarios' in conteudo.lower() or 'colaboradores' in conteudo.lower():
            print("  Encontrada referencia a 'funcionarios' ou 'colaboradores' no dump")
        else:
            print("  Nao encontrada tabela de funcionarios no dump do PostgreSQL")

    except Exception as e:
        print(f"  Erro ao ler dump: {e}")

    con.close()

    print("\n" + "="*100)
    print("RESUMO:")
    print("="*100)
    if total_vendedores > 0:
        print(f"  ✓ Encontrados {total_vendedores} vendedores no sistema")
    else:
        print(f"  ✗ Nao ha vendedores cadastrados")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
