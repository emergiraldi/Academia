#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Investiga por que apenas alguns fornecedores aparecem no sistema
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

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

# Códigos que aparecem na tela
codigos_visiveis = [16, 22, 26, 32, 34, 44]

print("="*100)
print("INVESTIGACAO: POR QUE SO ALGUNS FORNECEDORES APARECEM?")
print("="*100)

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    print("\n>> Fornecedores que APARECEM no sistema:")
    print("-"*100)

    for cod in codigos_visiveis:
        cur.execute("""
            SELECT CODIGO, NOME, TIPO, ATIVO, EMPRESA, DATA
            FROM CAD_PESSOA
            WHERE CODIGO = ?
        """, [cod])

        row = cur.fetchone()
        if row:
            codigo, nome, tipo, ativo, empresa, data = row
            print(f"\nCodigo {codigo}:")
            print(f"  Nome: {nome}")
            print(f"  Tipo: {tipo}")
            print(f"  Ativo: {ativo}")
            print(f"  Empresa: {empresa}")
            print(f"  Data: {data}")

    print("\n\n>> Fornecedores que NAO APARECEM (exemplos):")
    print("-"*100)

    # Pegar alguns fornecedores que não aparecem
    cur.execute("""
        SELECT CODIGO, NOME, TIPO, ATIVO, EMPRESA, DATA
        FROM CAD_PESSOA
        WHERE TIPO = 'F'
        AND CODIGO NOT IN (16, 22, 26, 32, 34, 44)
        ORDER BY CODIGO
        ROWS 5
    """)

    for row in cur:
        codigo, nome, tipo, ativo, empresa, data = row
        print(f"\nCodigo {codigo}:")
        print(f"  Nome: {nome}")
        print(f"  Tipo: {tipo}")
        print(f"  Ativo: {ativo}")
        print(f"  Empresa: {empresa}")
        print(f"  Data: {data}")

    # Comparar diferenças
    print("\n\n>> ANALISE DAS DIFERENCAS:")
    print("-"*100)

    # Verificar se há diferença no campo DATA
    cur.execute("""
        SELECT MIN(DATA), MAX(DATA)
        FROM CAD_PESSOA
        WHERE TIPO = 'F' AND CODIGO IN (16, 22, 26, 32, 34, 44)
    """)
    data_visiveis = cur.fetchone()

    cur.execute("""
        SELECT MIN(DATA), MAX(DATA)
        FROM CAD_PESSOA
        WHERE TIPO = 'F' AND CODIGO NOT IN (16, 22, 26, 32, 34, 44)
    """)
    data_invisiveis = cur.fetchone()

    print(f"  Data dos VISIVEIS: {data_visiveis[0]} ate {data_visiveis[1]}")
    print(f"  Data dos INVISIVEIS: {data_invisiveis[0]} ate {data_invisiveis[1]}")

    # Verificar todos os campos para ver diferenças
    print("\n\n>> TODOS OS CAMPOS DO PRIMEIRO FORNECEDOR VISIVEL (16):")
    print("-"*100)

    cur.execute("SELECT * FROM CAD_PESSOA WHERE CODIGO = 16")
    row = cur.fetchone()

    cur.execute("""
        SELECT RDB$FIELD_NAME
        FROM RDB$RELATION_FIELDS
        WHERE RDB$RELATION_NAME = 'CAD_PESSOA'
        ORDER BY RDB$FIELD_POSITION
    """)
    campos = [r[0].strip() for r in cur.fetchall()]

    if row:
        for i, campo in enumerate(campos):
            if i < len(row):
                valor = row[i]
                if valor is not None:
                    print(f"  {campo:<30} = {valor}")

    print("\n\n>> TODOS OS CAMPOS DO PRIMEIRO FORNECEDOR INVISIVEL (19):")
    print("-"*100)

    cur.execute("SELECT * FROM CAD_PESSOA WHERE CODIGO = 19")
    row = cur.fetchone()

    if row:
        for i, campo in enumerate(campos):
            if i < len(row):
                valor = row[i]
                if valor is not None:
                    print(f"  {campo:<30} = {valor}")

    con.close()

    print("\n" + "="*100)
    print("CONCLUSAO: Comparar os dois registros acima para encontrar a diferenca!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
