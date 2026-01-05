#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificar contas a pagar e relacionamento com fornecedores
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

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    print("="*100)
    print("VERIFICACAO DE CONTAS A PAGAR E FORNECEDORES")
    print("="*100)

    # Ver estrutura da tabela FIN_CTAPAGAR
    print("\n>> CAMPOS DA TABELA FIN_CTAPAGAR:")
    print("-"*100)

    cur.execute("""
        SELECT RDB$FIELD_NAME
        FROM RDB$RELATION_FIELDS
        WHERE RDB$RELATION_NAME = 'FIN_CTAPAGAR'
        ORDER BY RDB$FIELD_POSITION
    """)

    campos = [row[0].strip() for row in cur.fetchall()]
    for i, campo in enumerate(campos[:20], 1):
        print(f"  {i:2}. {campo}")

    # Ver alguns exemplos de contas a pagar
    print("\n>> EXEMPLOS DE CONTAS A PAGAR:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 5
            CODIGO, EMPRESA, FORNECEDOR, DOCUMENTO, VALOR, VENCIMENTO
        FROM FIN_CTAPAGAR
        ORDER BY CODIGO
    """)

    for row in cur:
        print(f"  Conta {row[0]}: Empresa={row[1]}, Fornecedor={row[2]}, Doc={row[3]}, Valor={row[4]}, Venc={row[5]}")

    # Verificar se os códigos de fornecedor existem em CAD_PESSOA
    print("\n>> VERIFICANDO SE FORNECEDORES EXISTEM:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10 DISTINCT FORNECEDOR
        FROM FIN_CTAPAGAR
        ORDER BY FORNECEDOR
    """)

    codigos_fornecedor = [row[0] for row in cur.fetchall()]
    print(f"  Primeiros 10 códigos de fornecedor usados: {codigos_fornecedor}")

    for cod_forn in codigos_fornecedor[:5]:
        cur.execute("SELECT CODIGO, NOME, TIPO FROM CAD_PESSOA WHERE CODIGO = ?", [cod_forn])
        row = cur.fetchone()
        if row:
            print(f"  Fornecedor {cod_forn}: {row[1][:40]} (Tipo: {row[2]})")
        else:
            print(f"  Fornecedor {cod_forn}: NAO ENCONTRADO!")

    # Ver se existe campo FORNECEDOR_ID ou similar
    print("\n>> VERIFICANDO CAMPOS RELACIONADOS A FORNECEDOR:")
    print("-"*100)

    campos_fornecedor = [c for c in campos if 'FORN' in c or 'PESSOA' in c or 'CLIENTE' in c]
    print(f"  Campos relacionados: {campos_fornecedor}")

    # Mostrar um exemplo completo de uma conta
    print("\n>> DADOS COMPLETOS DE UMA CONTA A PAGAR:")
    print("-"*100)

    campos_query = ", ".join(campos[:30])
    cur.execute(f"SELECT FIRST 1 {campos_query} FROM FIN_CTAPAGAR")

    row = cur.fetchone()
    if row:
        for i, campo in enumerate(campos[:30]):
            valor = row[i]
            if valor is not None:
                if isinstance(valor, str):
                    valor = f"[{valor.strip()}]"
                print(f"  {campo:<30} = {valor}")
            else:
                print(f"  {campo:<30} = [NULL]")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
