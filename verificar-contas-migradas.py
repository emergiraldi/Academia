#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica contas a pagar que vieram da migração do PostgreSQL
"""

import sys
import codecs
import re

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

print("="*100)
print("VERIFICACAO DE CONTAS A PAGAR MIGRADAS DO POSTGRESQL")
print("="*100)

# Primeiro, ler IDs de contas do PostgreSQL
print("\nLendo contas do dump do PostgreSQL...")

contas_pg = []
try:
    with open(r'c:\Projeto\Academia\dados-extraidos.sql', 'r', encoding='latin1') as f:
        conteudo = f.read()

    linhas = conteudo.split('\n')
    lendo_contas = False
    colunas = []

    for linha in linhas:
        if 'COPY public.conta_pagar' in linha:
            match = re.match(r'COPY public\.conta_pagar \((.*?)\) FROM stdin;', linha)
            if match:
                colunas = [c.strip() for c in match.group(1).split(',')]
            lendo_contas = True
            continue

        if linha.strip() == '\\.':
            lendo_contas = False
            continue

        if lendo_contas and linha:
            valores = linha.split('\t')
            if len(valores) > 0:
                conta = {}
                for idx, col in enumerate(colunas):
                    if idx < len(valores):
                        conta[col] = None if valores[idx] == '\\N' else valores[idx]
                contas_pg.append(conta)

    print(f"  Total de contas no dump do PostgreSQL: {len(contas_pg):,}")

except Exception as e:
    print(f"  [ERRO] ao ler dump: {e}")
    contas_pg = []

# Conectar ao Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

con = fdb.connect(**fbConfig)
cur = con.cursor()

# Se conseguimos ler as contas do PostgreSQL, vamos verificar algumas delas
if contas_pg:
    print("\n>> EXEMPLOS DE CONTAS DO POSTGRESQL:")
    print("-"*100)

    # Mostrar primeiras 10 contas do dump
    print("\nPrimeiras 10 contas no dump do PostgreSQL:")
    for i, conta in enumerate(contas_pg[:10], 1):
        id_conta = conta.get('idconta_pagar', 'N/A')
        id_forn = conta.get('idfornecedor', 'N/A')
        documento = conta.get('documento', 'N/A')
        valor = conta.get('valor', '0')
        vencimento = conta.get('vencimento', 'N/A')
        print(f"  {i}. ID={id_conta}, Fornecedor={id_forn}, Doc={documento}, Valor={valor}, Venc={vencimento[:10] if vencimento != 'N/A' else 'N/A'}")

    # Pegar alguns IDs de fornecedores do PostgreSQL
    fornecedores_pg = set()
    for conta in contas_pg[:100]:
        id_forn = conta.get('idfornecedor')
        if id_forn and id_forn != '\\N':
            try:
                fornecedores_pg.add(int(id_forn))
            except:
                pass

    print(f"\n  Fornecedores únicos nas primeiras 100 contas: {sorted(fornecedores_pg)[:20]}")

    # Verificar se esses fornecedores existem no Firebird
    print("\n>> VERIFICANDO FORNECEDORES NO FIREBIRD:")
    print("-"*100)

    for id_forn in sorted(fornecedores_pg)[:10]:
        cur.execute("SELECT CODIGO, NOME, TIPO FROM CAD_PESSOA WHERE CODIGO = ?", [id_forn])
        row = cur.fetchone()
        if row:
            print(f"  Fornecedor {id_forn}: {row[1][:50]} (Tipo: {row[2]})")
        else:
            print(f"  Fornecedor {id_forn}: NAO ENCONTRADO!")

    # Verificar se existem contas desses fornecedores
    print("\n>> CONTAS A PAGAR DESSES FORNECEDORES NO FIREBIRD:")
    print("-"*100)

    for id_forn in sorted(fornecedores_pg)[:5]:
        cur.execute("""
            SELECT COUNT(*), MIN(VENCIMENTO), MAX(VENCIMENTO)
            FROM FIN_CTAPAGAR
            WHERE FORNECEDOR = ?
        """, [id_forn])

        row = cur.fetchone()
        if row and row[0] > 0:
            print(f"  Fornecedor {id_forn}: {row[0]:,} contas - Periodo: {row[1]} ate {row[2]}")

            # Mostrar algumas contas
            cur.execute("""
                SELECT FIRST 3 CODIGO, FORNECEDOR_NOME, DOCUMENTO, VALOR, VENCIMENTO, QUITADO
                FROM FIN_CTAPAGAR
                WHERE FORNECEDOR = ?
                ORDER BY VENCIMENTO
            """, [id_forn])

            for conta in cur:
                cod, nome, doc, valor, venc, quit = conta
                valor_real = float(valor)/100 if valor else 0
                status = 'QUITADO' if quit == 'S' else 'ABERTO'
                print(f"    Conta {cod}: Nome=[{nome[:40]}] Doc={doc} R$ {valor_real:.2f} {venc} {status}")
        else:
            print(f"  Fornecedor {id_forn}: SEM CONTAS")

# Estatísticas gerais
print("\n" + "="*100)
print("ESTATISTICAS GERAIS:")
print("="*100)

cur.execute("SELECT COUNT(*) FROM FIN_CTAPAGAR")
total_fb = cur.fetchone()[0]

cur.execute("SELECT MIN(VENCIMENTO), MAX(VENCIMENTO) FROM FIN_CTAPAGAR")
periodo = cur.fetchone()

print(f"  Total de contas no Firebird: {total_fb:,}")
print(f"  Total de contas no PostgreSQL: {len(contas_pg):,}")
print(f"  Periodo no Firebird: de {periodo[0]} ate {periodo[1]}")

cur.execute("""
    SELECT COUNT(*)
    FROM FIN_CTAPAGAR
    WHERE FORNECEDOR_NOME IS NOT NULL AND FORNECEDOR_NOME != 'SEM NOME'
""")
com_nome = cur.fetchone()[0]

print(f"  Contas com nome de fornecedor preenchido: {com_nome:,} ({100*com_nome/total_fb:.1f}%)")

con.close()

print("\n[OK] Verificacao concluida!")
print("="*100)
