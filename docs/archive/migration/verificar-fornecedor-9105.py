#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificar fornecedor 9105 e outros fornecedores problemáticos
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
    print("VERIFICACAO DE FORNECEDORES PROBLEMATICOS")
    print("="*100)

    # Verificar se o fornecedor 9105 existe
    print("\n>> Verificando fornecedor 9105:")
    print("-"*100)

    cur.execute("SELECT CODIGO, NOME, TIPO FROM CAD_PESSOA WHERE CODIGO = 9105")
    row = cur.fetchone()

    if row:
        print(f"  CODIGO: {row[0]}")
        print(f"  NOME: [{row[1]}]")
        print(f"  TIPO: {row[2]}")
    else:
        print("  FORNECEDOR 9105 NAO ENCONTRADO EM CAD_PESSOA!")

    # Verificar contas a pagar do fornecedor 9105
    print("\n>> Contas do fornecedor 9105:")
    print("-"*100)

    cur.execute("""
        SELECT CODIGO, FORNECEDOR, FORNECEDOR_NOME, DOCUMENTO, VALOR, VENCIMENTO
        FROM FIN_CTAPAGAR
        WHERE FORNECEDOR = 9105
    """)

    contas = cur.fetchall()
    print(f"  Total de contas: {len(contas)}")

    for row in contas[:5]:
        print(f"  Conta {row[0]}: Fornecedor={row[1]}, Nome=[{row[2]}], Doc={row[3]}, Valor={float(row[4])/100:.2f}, Venc={row[5]}")

    # Buscar todos os fornecedores que aparecem em contas a pagar mas não existem em CAD_PESSOA
    print("\n>> Fornecedores em FIN_CTAPAGAR que NAO existem em CAD_PESSOA:")
    print("-"*100)

    cur.execute("""
        SELECT DISTINCT c.FORNECEDOR
        FROM FIN_CTAPAGAR c
        WHERE NOT EXISTS (SELECT 1 FROM CAD_PESSOA p WHERE p.CODIGO = c.FORNECEDOR)
        ORDER BY c.FORNECEDOR
    """)

    forn_nao_encontrados = [row[0] for row in cur.fetchall()]
    print(f"  Total de fornecedores nao encontrados: {len(forn_nao_encontrados)}")
    if forn_nao_encontrados:
        print(f"  IDs: {forn_nao_encontrados[:20]}")

    # Buscar fornecedores com nome "SEM NOME" ou vazio
    print("\n>> Fornecedores com nome problematico:")
    print("-"*100)

    cur.execute("""
        SELECT CODIGO, NOME, TIPO
        FROM CAD_PESSOA
        WHERE CODIGO IN (SELECT DISTINCT FORNECEDOR FROM FIN_CTAPAGAR)
        AND (NOME IS NULL OR NOME = '' OR NOME = 'SEM NOME')
        ORDER BY CODIGO
    """)

    forn_sem_nome = cur.fetchall()
    print(f"  Total: {len(forn_sem_nome)}")
    for row in forn_sem_nome[:10]:
        print(f"  Codigo {row[0]}: Nome=[{row[1]}], Tipo={row[2]}")

    # Verificar de onde veio o fornecedor 9105 no PostgreSQL
    print("\n>> Buscando fornecedor 9105 no dump do PostgreSQL:")
    print("-"*100)

    import re

    try:
        with open(r'c:\Projeto\Academia\fornecedores-clientes.sql', 'r', encoding='latin1') as f:
            conteudo = f.read()

        linhas = conteudo.split('\n')
        lendo_fornecedores = False
        colunas = []

        for linha in linhas:
            if 'COPY public.fornecedores' in linha:
                match = re.match(r'COPY public\.fornecedores \((.*?)\) FROM stdin;', linha)
                if match:
                    colunas = [c.strip() for c in match.group(1).split(',')]
                lendo_fornecedores = True
                continue

            if linha.strip() == '\\.':
                lendo_fornecedores = False
                continue

            if lendo_fornecedores and linha:
                valores = linha.split('\t')
                if len(valores) > 0:
                    try:
                        id_forn = int(valores[0]) if valores[0] != '\\N' else None
                        if id_forn == 9105:
                            print("  ENCONTRADO no dump do PostgreSQL!")
                            fornecedor = {}
                            for idx, col in enumerate(colunas):
                                if idx < len(valores):
                                    fornecedor[col] = None if valores[idx] == '\\N' else valores[idx]

                            print(f"  idfornecedor: {fornecedor.get('idfornecedor')}")
                            print(f"  nome: [{fornecedor.get('nome')}]")
                            print(f"  fantasia: [{fornecedor.get('fantasia')}]")
                            print(f"  cnpj: {fornecedor.get('cnpj')}")
                            print(f"  cidade: {fornecedor.get('cidade')}")
                            break
                    except:
                        pass

    except Exception as e:
        print(f"  Erro ao ler dump: {e}")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
