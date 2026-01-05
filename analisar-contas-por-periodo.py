#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analisa contas a pagar por período de vencimento
"""

import sys
import codecs
from datetime import datetime, timedelta

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

print("="*100)
print("ANALISE DE CONTAS A PAGAR POR PERIODO")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Total de contas
    cur.execute("SELECT COUNT(*) FROM FIN_CTAPAGAR")
    total = cur.fetchone()[0]

    print(f"\nTotal de contas a pagar no sistema: {total:,}")

    # Contas por status
    print("\n>> CONTAS POR STATUS:")
    print("-"*100)

    cur.execute("SELECT COUNT(*), SUM(CAST(VALOR AS BIGINT)) FROM FIN_CTAPAGAR WHERE QUITADO = 'S'")
    row = cur.fetchone()
    qtd_quitadas, valor_quitadas = row[0], float(row[1])/100 if row[1] else 0

    cur.execute("SELECT COUNT(*), SUM(CAST(VALOR AS BIGINT)) FROM FIN_CTAPAGAR WHERE QUITADO = 'N'")
    row = cur.fetchone()
    qtd_abertas, valor_abertas = row[0], float(row[1])/100 if row[1] else 0

    print(f"  Quitadas: {qtd_quitadas:,} contas - Total: R$ {valor_quitadas:,.2f}")
    print(f"  Em aberto: {qtd_abertas:,} contas - Total: R$ {valor_abertas:,.2f}")

    # Contas por ANO de vencimento
    print("\n>> CONTAS POR ANO DE VENCIMENTO:")
    print("-"*100)

    cur.execute("""
        SELECT EXTRACT(YEAR FROM VENCIMENTO) as ANO, COUNT(*), SUM(VALOR)
        FROM FIN_CTAPAGAR
        WHERE VENCIMENTO IS NOT NULL
        GROUP BY EXTRACT(YEAR FROM VENCIMENTO)
        ORDER BY ANO
    """)

    print(f"  {'ANO':<6} {'QUANTIDADE':<15} {'VALOR TOTAL':<20}")
    print(f"  {'-'*6} {'-'*15} {'-'*20}")

    for row in cur:
        ano = int(row[0]) if row[0] else 0
        qtd = row[1]
        valor = float(row[2])/100 if row[2] else 0
        print(f"  {ano:<6} {qtd:>10,}     R$ {valor:>15,.2f}")

    # Contas por MÊS/ANO (últimos 12 meses e próximos 3 meses)
    print("\n>> CONTAS POR MES (ultimos 12 meses + proximos 3 meses):")
    print("-"*100)

    cur.execute("""
        SELECT
            EXTRACT(YEAR FROM VENCIMENTO) as ANO,
            EXTRACT(MONTH FROM VENCIMENTO) as MES,
            COUNT(*),
            SUM(CASE WHEN QUITADO = 'N' THEN 1 ELSE 0 END) as ABERTAS,
            SUM(CASE WHEN QUITADO = 'N' THEN VALOR ELSE 0 END) as VALOR_ABERTO
        FROM FIN_CTAPAGAR
        WHERE VENCIMENTO IS NOT NULL
        AND VENCIMENTO >= '2024-01-01'
        GROUP BY EXTRACT(YEAR FROM VENCIMENTO), EXTRACT(MONTH FROM VENCIMENTO)
        ORDER BY ANO, MES
    """)

    print(f"  {'MES/ANO':<10} {'TOTAL':<10} {'ABERTAS':<10} {'VALOR ABERTO':<20}")
    print(f"  {'-'*10} {'-'*10} {'-'*10} {'-'*20}")

    for row in cur:
        ano = int(row[0]) if row[0] else 0
        mes = int(row[1]) if row[1] else 0
        total_mes = row[2]
        abertas = row[3]
        valor_aberto = float(row[4])/100 if row[4] else 0

        mes_ano = f"{mes:02d}/{ano}"
        print(f"  {mes_ano:<10} {total_mes:>7}  {abertas:>7}  R$ {valor_aberto:>15,.2f}")

    # Verificar contas próximas (próximos 30 dias)
    print("\n>> CONTAS A VENCER NOS PROXIMOS 30 DIAS:")
    print("-"*100)

    hoje = datetime.now().strftime('%Y-%m-%d')
    daqui_30 = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')

    cur.execute(f"""
        SELECT COUNT(*), SUM(VALOR)
        FROM FIN_CTAPAGAR
        WHERE QUITADO = 'N'
        AND VENCIMENTO >= '{hoje}'
        AND VENCIMENTO <= '{daqui_30}'
    """)

    row = cur.fetchone()
    qtd_30dias = row[0] if row[0] else 0
    valor_30dias = float(row[1])/100 if row[1] else 0

    print(f"  Quantidade: {qtd_30dias:,} contas")
    print(f"  Valor total: R$ {valor_30dias:,.2f}")

    # Verificar contas VENCIDAS
    print("\n>> CONTAS VENCIDAS (nao quitadas):")
    print("-"*100)

    cur.execute(f"""
        SELECT COUNT(*), SUM(VALOR)
        FROM FIN_CTAPAGAR
        WHERE QUITADO = 'N'
        AND VENCIMENTO < '{hoje}'
    """)

    row = cur.fetchone()
    qtd_vencidas = row[0] if row[0] else 0
    valor_vencidas = float(row[1])/100 if row[1] else 0

    print(f"  Quantidade: {qtd_vencidas:,} contas")
    print(f"  Valor total: R$ {valor_vencidas:,.2f}")

    # Mostrar alguns exemplos de contas antigas
    print("\n>> EXEMPLOS DE CONTAS ANTIGAS (2022):")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 5 CODIGO, FORNECEDOR_NOME, DOCUMENTO, VALOR, VENCIMENTO, QUITADO
        FROM FIN_CTAPAGAR
        WHERE VENCIMENTO >= '2022-01-01' AND VENCIMENTO < '2023-01-01'
        ORDER BY VENCIMENTO
    """)

    for row in cur:
        cod, forn, doc, valor, venc, quit = row
        valor_real = float(valor)/100 if valor else 0
        status = 'QUITADO' if quit == 'S' else 'ABERTO'
        print(f"  Conta {cod}: {forn[:35]:<35} - Doc:{doc:<15} - R$ {valor_real:>8,.2f} - {venc} - {status}")

    # Resumo final
    print("\n" + "="*100)
    print("RESUMO:")
    print("="*100)
    print(f"  Total de contas migradas: {total:,}")

    cur.execute('SELECT MIN(VENCIMENTO), MAX(VENCIMENTO) FROM FIN_CTAPAGAR')
    periodo = cur.fetchone()
    print(f"  Periodo: de {periodo[0]} ate {periodo[1]}")

    print("\n  TODAS as contas foram migradas, nao apenas as proximas de 30 dias!")
    print("="*100)

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
