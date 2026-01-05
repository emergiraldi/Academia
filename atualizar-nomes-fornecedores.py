#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Atualiza o campo FORNECEDOR_NOME nas contas a pagar
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
print("ATUALIZANDO NOMES DE FORNECEDORES NAS CONTAS A PAGAR")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Buscar todas as contas a pagar que não têm FORNECEDOR_NOME
    print("\nBuscando contas sem nome de fornecedor...")
    cur.execute("""
        SELECT COUNT(*)
        FROM FIN_CTAPAGAR
        WHERE FORNECEDOR_NOME IS NULL AND FORNECEDOR IS NOT NULL
    """)

    total = cur.fetchone()[0]
    print(f"  Contas a pagar sem nome de fornecedor: {total:,}")

    if total == 0:
        print("  Todas as contas ja tem nome de fornecedor!")
        con.close()
        exit(0)

    # Atualizar os nomes
    print("\nAtualizando nomes de fornecedores...")

    cur.execute("""
        SELECT DISTINCT FORNECEDOR
        FROM FIN_CTAPAGAR
        WHERE FORNECEDOR_NOME IS NULL AND FORNECEDOR IS NOT NULL
    """)

    fornecedores = [row[0] for row in cur.fetchall()]
    print(f"  Total de fornecedores distintos: {len(fornecedores)}")

    atualizados = 0
    nao_encontrados = 0

    for cod_fornecedor in fornecedores:
        # Buscar nome do fornecedor
        cur.execute("SELECT NOME FROM CAD_PESSOA WHERE CODIGO = ?", [cod_fornecedor])
        row = cur.fetchone()

        if row:
            nome = row[0][:100]  # Limitar a 100 caracteres

            # Atualizar todas as contas desse fornecedor
            cur.execute("""
                UPDATE FIN_CTAPAGAR
                SET FORNECEDOR_NOME = ?
                WHERE FORNECEDOR = ? AND FORNECEDOR_NOME IS NULL
            """, [nome, cod_fornecedor])

            contas_atualizadas = cur.rowcount
            atualizados += contas_atualizadas

            if atualizados % 1000 == 0:
                print(f"  {atualizados} contas atualizadas...")
                con.commit()
        else:
            nao_encontrados += 1
            if nao_encontrados <= 5:
                print(f"  AVISO: Fornecedor {cod_fornecedor} nao encontrado em CAD_PESSOA")

    con.commit()

    print("\n" + "="*100)
    print("RESULTADO:")
    print("="*100)
    print(f"  Contas atualizadas: {atualizados:,}")
    print(f"  Fornecedores nao encontrados: {nao_encontrados}")

    # Mostrar exemplos
    print("\n>> EXEMPLOS DE CONTAS ATUALIZADAS:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            c.CODIGO, c.DOCUMENTO, c.FORNECEDOR, c.FORNECEDOR_NOME, c.VALOR, c.VENCIMENTO
        FROM FIN_CTAPAGAR c
        WHERE c.FORNECEDOR_NOME IS NOT NULL
        ORDER BY c.CODIGO
    """)

    for row in cur:
        codigo, doc, cod_forn, nome_forn, valor, venc = row
        nome_trunc = (nome_forn or '')[:40]
        valor_real = float(valor) / 100.0 if valor else 0
        print(f"  Conta {codigo}: Forn={cod_forn} ({nome_trunc}) - Doc={doc} - R$ {valor_real:.2f} - Venc={venc}")

    con.close()

    print("\n[OK] Atualizacao concluida! Agora os fornecedores devem aparecer no sistema!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
