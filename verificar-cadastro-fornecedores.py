#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica cadastro de fornecedores no Firebird
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
print("VERIFICACAO DO CADASTRO DE FORNECEDORES")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Total de pessoas por tipo
    print("\n>> TOTAL DE PESSOAS POR TIPO:")
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
        tipo_desc = {
            'F': 'Fornecedor',
            'C': 'Cliente',
            'CLIENTE': 'Cliente',
            'FORNECEDOR': 'Fornecedor',
            'VENDEDOR': 'Vendedor'
        }.get(tipo, tipo)
        print(f"  Tipo '{tipo}' ({tipo_desc}): {qtd:,} registros")

    # Total de fornecedores
    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'F'")
    total_fornecedores = cur.fetchone()[0]

    print(f"\n  Total de FORNECEDORES (TIPO='F'): {total_fornecedores:,}")

    # Verificar campos da tabela CAD_PESSOA
    print("\n>> ESTRUTURA DA TABELA CAD_PESSOA:")
    print("-"*100)

    cur.execute("""
        SELECT RDB$FIELD_NAME
        FROM RDB$RELATION_FIELDS
        WHERE RDB$RELATION_NAME = 'CAD_PESSOA'
        ORDER BY RDB$FIELD_POSITION
    """)

    campos = [row[0].strip() for row in cur.fetchall()]
    campos_importantes = [c for c in campos if c in ['CODIGO', 'TIPO', 'NOME', 'NOME_FANTASIA', 'CPF_CNPJ', 'ATIVO', 'EMPRESA']]
    print(f"  Campos principais: {', '.join(campos_importantes)}")

    # Mostrar exemplos de fornecedores
    print("\n>> EXEMPLOS DE FORNECEDORES (TIPO='F'):")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 20
            CODIGO, TIPO, NOME, NOME_FANTASIA, CPF_CNPJ, ATIVO, EMPRESA
        FROM CAD_PESSOA
        WHERE TIPO = 'F'
        ORDER BY CODIGO
    """)

    print(f"  {'CODIGO':<8} {'TIPO':<6} {'NOME':<35} {'ATIVO':<6} {'EMPRESA'}")
    print(f"  {'-'*8} {'-'*6} {'-'*35} {'-'*6} {'-'*7}")

    for row in cur:
        codigo, tipo, nome, fantasia, cpf_cnpj, ativo, empresa = row
        nome_exibir = (nome or '')[:33]
        print(f"  {codigo:<8} {tipo:<6} {nome_exibir:<35} {ativo:<6} {empresa}")

    # Verificar se há algum filtro que poderia esconder fornecedores
    print("\n>> FORNECEDORES INATIVOS:")
    print("-"*100)

    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'F' AND ATIVO = 'N'")
    inativos = cur.fetchone()[0]
    print(f"  Fornecedores inativos: {inativos:,}")

    # Verificar fornecedores por empresa
    print("\n>> FORNECEDORES POR EMPRESA:")
    print("-"*100)

    cur.execute("""
        SELECT EMPRESA, COUNT(*)
        FROM CAD_PESSOA
        WHERE TIPO = 'F'
        GROUP BY EMPRESA
        ORDER BY EMPRESA
    """)

    for row in cur:
        empresa = row[0]
        qtd = row[1]
        print(f"  Empresa {empresa}: {qtd:,} fornecedores")

    # Verificar se o sistema pode estar filtrando por outro campo
    print("\n>> VERIFICACAO DE CAMPOS QUE PODEM ESTAR SENDO USADOS COMO FILTRO:")
    print("-"*100)

    # Verificar se existe campo FORNECEDOR ou similar
    campos_fornecedor = [c for c in campos if 'FORN' in c]
    if campos_fornecedor:
        print(f"  Campos com 'FORN': {campos_fornecedor}")

    # Verificar valores únicos no campo TIPO
    cur.execute("SELECT DISTINCT TIPO FROM CAD_PESSOA ORDER BY TIPO")
    tipos = [row[0] for row in cur.fetchall()]
    print(f"  Valores únicos em TIPO: {tipos}")

    # Verificar se há alguma VIEW ou tabela específica para fornecedores
    print("\n>> VERIFICANDO VIEWS/TABELAS RELACIONADAS:")
    print("-"*100)

    cur.execute("""
        SELECT RDB$RELATION_NAME
        FROM RDB$RELATIONS
        WHERE RDB$SYSTEM_FLAG = 0
        AND (RDB$RELATION_NAME LIKE '%FORN%' OR RDB$RELATION_NAME LIKE '%PESSOA%')
        ORDER BY RDB$RELATION_NAME
    """)

    tabelas = [row[0].strip() for row in cur.fetchall()]
    print(f"  Tabelas/Views relacionadas: {tabelas}")

    con.close()

    print("\n" + "="*100)
    print("RESUMO:")
    print("="*100)
    print(f"  Total de fornecedores no banco: {total_fornecedores:,}")
    print(f"  Os fornecedores ESTAO no banco de dados!")
    print(f"  Se nao aparecem no sistema, pode ser:")
    print(f"    1. Cache do sistema")
    print(f"    2. Filtro por EMPRESA")
    print(f"    3. Sistema usando TIPO diferente")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
