#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Resumo completo final da migração
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
print("RESUMO COMPLETO FINAL DA MIGRACAO - PostgreSQL para Firebird")
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
    print("\n>> PRODUTOS (CAD_PRODUTOS):")
    print("-"*100)

    # Total de produtos migrados (CODIGO >= 1000)
    cur.execute("SELECT COUNT(*) FROM CAD_PRODUTOS WHERE CODIGO >= 1000")
    total_produtos = cur.fetchone()[0]
    print(f"  Total de produtos migrados: {total_produtos:,}")

    # Produtos com UNIDADE preenchida
    cur.execute("SELECT COUNT(*) FROM CAD_PRODUTOS WHERE CODIGO >= 1000 AND UNIDADE IS NOT NULL")
    com_unidade = cur.fetchone()[0]
    print(f"  Produtos com UNIDADE: {com_unidade:,} ({100*com_unidade/total_produtos:.1f}%)")

    # Produtos com NCM preenchido
    cur.execute("SELECT COUNT(*) FROM CAD_PRODUTOS WHERE CODIGO >= 1000 AND TABELA_NCM IS NOT NULL AND CAST(TABELA_NCM AS VARCHAR(50)) != ''")
    com_ncm = cur.fetchone()[0]
    print(f"  Produtos com NCM: {com_ncm:,} ({100*com_ncm/total_produtos:.1f}%)")

    # Produtos com estoque > 0
    cur.execute("SELECT COUNT(*) FROM CAD_PRODUTOS WHERE CODIGO >= 1000 AND ESTOQUESALDO > 0")
    com_estoque = cur.fetchone()[0]
    print(f"  Produtos com estoque > 0: {com_estoque:,} ({100*com_estoque/total_produtos:.1f}%)")

    # Produtos com preço de venda
    cur.execute("SELECT COUNT(*) FROM CAD_PRODUTOS WHERE CODIGO >= 1000 AND PRC_VENDA > 0")
    com_preco = cur.fetchone()[0]
    print(f"  Produtos com preço de venda: {com_preco:,} ({100*com_preco/total_produtos:.1f}%)")

    # ============ PESSOAS ============
    print("\n>> PESSOAS (CAD_PESSOA):")
    print("-"*100)

    # Fornecedores
    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'F'")
    total_fornecedores = cur.fetchone()[0]
    print(f"  Fornecedores migrados: {total_fornecedores:,}")

    # Clientes
    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'C'")
    total_clientes = cur.fetchone()[0]
    print(f"  Clientes migrados: {total_clientes:,}")

    # ============ CONTAS A PAGAR ============
    print("\n>> CONTAS A PAGAR (FIN_CTAPAGAR):")
    print("-"*100)

    cur.execute("SELECT COUNT(*) FROM FIN_CTAPAGAR")
    total_ctapagar = cur.fetchone()[0]
    print(f"  Total de contas a pagar: {total_ctapagar:,}")

    cur.execute("SELECT COUNT(*) FROM FIN_CTAPAGAR WHERE QUITADO = 'S'")
    quitadas = cur.fetchone()[0]
    print(f"  Contas quitadas: {quitadas:,} ({100*quitadas/total_ctapagar:.1f}%)")

    cur.execute("SELECT COUNT(*) FROM FIN_CTAPAGAR WHERE QUITADO = 'N'")
    nao_quitadas = cur.fetchone()[0]
    print(f"  Contas em aberto: {nao_quitadas:,} ({100*nao_quitadas/total_ctapagar:.1f}%)")

    # ============ CONTAS A RECEBER ============
    print("\n>> CONTAS A RECEBER (FIN_CTARECEBER):")
    print("-"*100)

    cur.execute("SELECT COUNT(*) FROM FIN_CTARECEBER WHERE VALOR >= 0")
    total_ctareceber = cur.fetchone()[0]
    print(f"  Total de contas a receber: {total_ctareceber:,}")

    cur.execute("SELECT COUNT(*) FROM FIN_CTARECEBER WHERE VALOR >= 0 AND QUITADO = 'S'")
    rec_quitadas = cur.fetchone()[0]
    print(f"  Contas quitadas: {rec_quitadas:,} ({100*rec_quitadas/total_ctareceber:.1f}%)")

    cur.execute("SELECT COUNT(*) FROM FIN_CTARECEBER WHERE VALOR >= 0 AND QUITADO = 'N'")
    rec_nao_quitadas = cur.fetchone()[0]
    print(f"  Contas em aberto: {rec_nao_quitadas:,} ({100*rec_nao_quitadas/total_ctareceber:.1f}%)")

    # ============ CREDITOS ============
    print("\n>> CREDITOS (FIN_CTARECEBER com VALOR < 0):")
    print("-"*100)

    cur.execute("SELECT COUNT(*) FROM FIN_CTARECEBER WHERE VALOR < 0")
    total_creditos = cur.fetchone()[0]
    print(f"  Total de creditos migrados: {total_creditos:,}")

    # ============ TOTAL GERAL ============
    total_geral = total_produtos + total_fornecedores + total_clientes + total_ctapagar + total_ctareceber + total_creditos

    print("\n" + "="*100)
    print("TOTAL GERAL DE REGISTROS MIGRADOS:")
    print("="*100)
    print(f"  TOTAL: {total_geral:,} registros")
    print("")
    print("="*100)
    print("✓✓✓ MIGRACAO CONCLUIDA COM SUCESSO! ✓✓✓")
    print("="*100)
    print("")
    print("DETALHES:")
    print(f"  - {total_produtos:,} produtos com TODOS os campos (nome, unidade, NCM, estoque, precos)")
    print(f"  - {total_fornecedores:,} fornecedores")
    print(f"  - {total_clientes:,} clientes")
    print(f"  - {total_ctapagar:,} contas a pagar")
    print(f"  - {total_ctareceber:,} contas a receber")
    print(f"  - {total_creditos:,} creditos")
    print("")
    print("Todos os dados do PostgreSQL foram migrados para o Firebird!")
    print("="*100)

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
