#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica fornecedores específicos que aparecem no PostgreSQL
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

# Fornecedores que aparecem nas primeiras contas do PostgreSQL
fornecedores_pg = [5916, 5753, 10979, 13071, 442, 9784, 19, 3905]

print("="*100)
print("VERIFICACAO DE FORNECEDORES DO POSTGRESQL NO FIREBIRD")
print("="*100)

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    for id_forn in fornecedores_pg:
        print(f"\n>> Fornecedor {id_forn}:")
        print("-"*100)

        # Verificar se existe
        cur.execute("SELECT CODIGO, NOME, TIPO, NOME_FANTASIA FROM CAD_PESSOA WHERE CODIGO = ?", [id_forn])
        row = cur.fetchone()

        if row:
            print(f"  Existe: SIM")
            print(f"  Nome: [{row[1]}]")
            print(f"  Fantasia: [{row[3] if row[3] else '(vazio)'}]")
            print(f"  Tipo: {row[2]}")

            # Verificar contas a pagar
            cur.execute("""
                SELECT COUNT(*), MIN(VENCIMENTO), MAX(VENCIMENTO)
                FROM FIN_CTAPAGAR
                WHERE FORNECEDOR = ?
            """, [id_forn])

            conta_info = cur.fetchone()
            if conta_info and conta_info[0] > 0:
                print(f"  Contas a pagar: {conta_info[0]:,}")
                print(f"  Periodo: {conta_info[1]} ate {conta_info[2]}")

                # Mostrar algumas contas
                cur.execute("""
                    SELECT FIRST 3 CODIGO, FORNECEDOR_NOME, DOCUMENTO, VALOR, VENCIMENTO
                    FROM FIN_CTAPAGAR
                    WHERE FORNECEDOR = ?
                    ORDER BY VENCIMENTO
                """, [id_forn])

                print("  Exemplos de contas:")
                for conta in cur:
                    cod, nome, doc, valor, venc = conta
                    valor_real = float(valor)/100 if valor else 0
                    print(f"    Conta {cod}: Nome=[{nome[:35]}] Doc={doc} R$ {valor_real:,.2f} Venc={venc}")
            else:
                print(f"  Contas a pagar: 0")
        else:
            print(f"  Existe: NAO")

    con.close()

    print("\n" + "="*100)
    print("[OK] Verificacao concluida!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
