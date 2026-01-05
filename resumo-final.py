#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Resumo final da migração
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

print("=" * 70)
print("RESUMO FINAL DA MIGRACAO POSTGRESQL -> FIREBIRD")
print("=" * 70)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Contar registros
    cur.execute("SELECT COUNT(*) FROM CAD_PRODUTOS")
    total_produtos = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM FIN_CTAPAGAR")
    total_contas_pagar = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM FIN_CTARECEBER WHERE VALOR >= 0")
    total_contas_receber = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM FIN_CTARECEBER WHERE VALOR < 0")
    total_creditos = cur.fetchone()[0]

    print("\n>>> DADOS MIGRADOS PARA O FIREBIRD")
    print("-" * 70)
    print(f"Produtos (CAD_PRODUTOS):              {total_produtos:>10,}")
    print(f"Contas a Pagar (FIN_CTAPAGAR):        {total_contas_pagar:>10,}")
    print(f"Contas a Receber (FIN_CTARECEBER):    {total_contas_receber:>10,}")
    print(f"Creditos (FIN_CTARECEBER negativo):   {total_creditos:>10,}")
    print("-" * 70)
    print(f"TOTAL GERAL:                          {total_produtos + total_contas_pagar + total_contas_receber + total_creditos:>10,}")
    print("=" * 70)

    # Dados esperados do PostgreSQL
    print("\n>>> COMPARACAO COM DADOS DO POSTGRESQL")
    print("-" * 70)
    print("Tabela                    | PostgreSQL | Firebird  | Diferenca")
    print("-" * 70)
    print(f"Produtos                  | {24226:>10,} | {total_produtos:>9,} | {24226-total_produtos:>9,}")
    print(f"Contas a Pagar            | {26339:>10,} | {total_contas_pagar:>9,} | {26339-total_contas_pagar:>9,}")
    print(f"Contas a Receber          | {140250:>10,} | {total_contas_receber:>9,} | {140250-total_contas_receber:>9,}")
    print(f"Creditos                  | {25936:>10,} | {total_creditos:>9,} | {25936-total_creditos:>9,}")
    print("-" * 70)

    # Observações
    print("\n>>> OBSERVACOES")
    print("-" * 70)

    if total_produtos < 24226:
        print(f"! {24226-total_produtos:,} produtos nao foram migrados (duplicados)")
    else:
        print("✓ Todos os produtos foram migrados")

    if total_contas_pagar < 26339:
        print(f"! {26339-total_contas_pagar:,} contas a pagar nao foram migradas")
        print("  (provavel erro de formato de data ou foreign key)")
    else:
        print("✓ Todas as contas a pagar foram migradas")

    if total_contas_receber < 140250:
        print(f"! {140250-total_contas_receber:,} contas a receber nao foram migradas")
        print("  (provavel erro de formato de data ou foreign key)")
    else:
        print("✓ Todas as contas a receber foram migradas")

    if total_creditos < 25936:
        print(f"! {25936-total_creditos:,} creditos nao foram migrados")
        print("  (provavel erro de formato de data ou foreign key)")
    else:
        print("✓ Todos os creditos foram migrados")

    print("=" * 70)

    con.close()

except Exception as e:
    print(f"[ERRO] {e}")
    import traceback
    traceback.print_exc()
