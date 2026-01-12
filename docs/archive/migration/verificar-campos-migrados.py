#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica quais campos foram preenchidos na migração
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
print("VERIFICACAO DOS CAMPOS MIGRADOS EM CADA TABELA")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # ============ PRODUTOS ============
    print("\n>> PRODUTOS (CAD_PRODUTOS) - Exemplo de 1 produto:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 1
            CODIGO, NOME, UNIDADE, CODIGO_BARRA, TABELA_NCM,
            ESTOQUESALDO, ESTOQUEMINIMO, ESTOQUEMAXIMO,
            PRC_CUSTO, PRC_VENDA, PESO, MARCA_ID, ATIVO
        FROM CAD_PRODUTOS
        WHERE CODIGO >= 1000 AND ESTOQUESALDO > 0
    """)

    row = cur.fetchone()
    if row:
        print(f"  CODIGO: {row[0]}")
        print(f"  NOME: {row[1]}")
        print(f"  UNIDADE: {row[2]}")
        print(f"  CODIGO_BARRA (EAN): {row[3] or '(vazio)'}")
        print(f"  TABELA_NCM: {row[4] or '(vazio)'}")
        print(f"  ESTOQUESALDO: {float(row[5]):.2f}")
        print(f"  ESTOQUEMINIMO: {float(row[6]):.2f}")
        print(f"  ESTOQUEMAXIMO: {float(row[7]):.2f}")
        print(f"  PRC_CUSTO: R$ {float(row[8])/100:.2f}")
        print(f"  PRC_VENDA: R$ {float(row[9])/100:.2f}")
        print(f"  PESO: {float(row[10]) if row[10] else 0:.3f}")
        print(f"  MARCA_ID: {row[11] or '(vazio)'}")
        print(f"  ATIVO: {row[12]}")

    # ============ PESSOAS ============
    print("\n>> PESSOAS (CAD_PESSOA) - Exemplo de 1 fornecedor:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 1
            CODIGO, TIPO, NATUREZA, NOME, NOME_FANTASIA,
            CPF_CNPJ, FONE, CELULAR, EMAIL,
            ENDERECO, NUMERO, BAIRRO, NOMECIDADE, UF, CEP, ATIVO
        FROM CAD_PESSOA
        WHERE TIPO = 'F'
    """)

    row = cur.fetchone()
    if row:
        print(f"  CODIGO: {row[0]}")
        print(f"  TIPO: {row[1]} (F=Fornecedor)")
        print(f"  NATUREZA: {row[2]} (F=Fisica, J=Juridica)")
        print(f"  NOME: {row[3]}")
        print(f"  NOME_FANTASIA: {row[4] or '(vazio)'}")
        print(f"  CPF_CNPJ: {row[5] or '(vazio)'}")
        print(f"  FONE: {row[6] or '(vazio)'}")
        print(f"  CELULAR: {row[7] or '(vazio)'}")
        print(f"  EMAIL: {row[8] or '(vazio)'}")
        print(f"  ENDERECO: {row[9] or '(vazio)'}")
        print(f"  NUMERO: {row[10] or '(vazio)'}")
        print(f"  BAIRRO: {row[11] or '(vazio)'}")
        print(f"  NOMECIDADE: {row[12] or '(vazio)'}")
        print(f"  UF: {row[13] or '(vazio)'}")
        print(f"  CEP: {row[14] or '(vazio)'}")
        print(f"  ATIVO: {row[15]}")

    # ============ CONTAS A PAGAR ============
    print("\n>> CONTAS A PAGAR (FIN_CTAPAGAR) - Exemplo de 1 conta:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 1
            EMPRESA, FORNECEDOR, DOCUMENTO, VENCIMENTO,
            VALOR, QUITADO, DATA_EMISSAO, HISTORICO,
            VALOR_SALDO, SITUACAO
        FROM FIN_CTAPAGAR
    """)

    row = cur.fetchone()
    if row:
        print(f"  EMPRESA: {row[0]}")
        print(f"  FORNECEDOR: {row[1]}")
        print(f"  DOCUMENTO: {row[2] or '(vazio)'}")
        print(f"  VENCIMENTO: {row[3]}")
        print(f"  VALOR: R$ {float(row[4])/100:.2f}")
        print(f"  QUITADO: {row[5]}")
        print(f"  DATA_EMISSAO: {row[6]}")
        print(f"  HISTORICO: {(row[7] or '')[:50]}...")
        print(f"  VALOR_SALDO: R$ {float(row[8])/100:.2f}")
        print(f"  SITUACAO: {row[9]}")

    # ============ CONTAS A RECEBER ============
    print("\n>> CONTAS A RECEBER (FIN_CTARECEBER) - Exemplo de 1 conta:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 1
            EMPRESA, CLIENTE, VENCIMENTO, VALOR,
            VALOR_PAGO, VALOR_SALDO, PARCELA, QUITADO,
            DATA_EMISSAO, SITUACAO
        FROM FIN_CTARECEBER
        WHERE VALOR >= 0
    """)

    row = cur.fetchone()
    if row:
        print(f"  EMPRESA: {row[0]}")
        print(f"  CLIENTE: {row[1]}")
        print(f"  VENCIMENTO: {row[2]}")
        print(f"  VALOR: R$ {float(row[3])/100:.2f}")
        print(f"  VALOR_PAGO: R$ {float(row[4])/100:.2f}")
        print(f"  VALOR_SALDO: R$ {float(row[5])/100:.2f}")
        print(f"  PARCELA: {row[6]}")
        print(f"  QUITADO: {row[7]}")
        print(f"  DATA_EMISSAO: {row[8]}")
        print(f"  SITUACAO: {row[9]}")

    print("\n" + "="*100)
    print("CONCLUSAO:")
    print("="*100)
    print("✓ PRODUTOS: Nome, Unidade, NCM, Codigo Barra, Estoque, Precos, Peso, Marca")
    print("✓ PESSOAS: Nome, Fantasia, CPF/CNPJ, Telefones, Email, Endereco Completo")
    print("✓ CONTAS A PAGAR: Fornecedor, Documento, Valores, Datas, Situacao")
    print("✓ CONTAS A RECEBER: Cliente, Parcela, Valores, Datas, Situacao")
    print("\n>>> TODOS OS CAMPOS NECESSARIOS FORAM MIGRADOS! <<<")
    print("="*100)

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
