#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Corrige nomes de fornecedores que estão como "SEM NOME" mas têm fantasia
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
print("CORRIGINDO NOMES DE FORNECEDORES")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Buscar fornecedores com nome "SEM NOME" que têm fantasia
    print("\nBuscando fornecedores com nome 'SEM NOME' mas que tem fantasia...")

    cur.execute("""
        SELECT CODIGO, NOME, NOME_FANTASIA
        FROM CAD_PESSOA
        WHERE TIPO = 'F'
        AND NOME = 'SEM NOME'
        AND NOME_FANTASIA IS NOT NULL
        AND NOME_FANTASIA != ''
        AND NOME_FANTASIA != 'SEM NOME'
    """)

    fornecedores = cur.fetchall()
    print(f"  Total de fornecedores a corrigir: {len(fornecedores)}")

    # Corrigir os nomes
    print("\nCorrigindo nomes dos fornecedores...")

    corrigidos = 0
    for forn in fornecedores:
        codigo, nome, fantasia = forn

        # Usar o nome fantasia como nome
        cur.execute("""
            UPDATE CAD_PESSOA
            SET NOME = ?
            WHERE CODIGO = ?
        """, [fantasia[:100], codigo])

        corrigidos += 1

        if corrigidos <= 5:
            print(f"  Fornecedor {codigo}: '{nome}' -> '{fantasia[:60]}'")

        if corrigidos % 100 == 0:
            con.commit()

    con.commit()

    print(f"\n  Total corrigido: {corrigidos}")

    # Agora atualizar os nomes nas contas a pagar
    print("\nAtualizando nomes nas contas a pagar...")

    cur.execute("""
        SELECT DISTINCT c.FORNECEDOR
        FROM FIN_CTAPAGAR c
        WHERE c.FORNECEDOR_NOME = 'SEM NOME'
    """)

    fornecedores_contas = [row[0] for row in cur.fetchall()]
    print(f"  Fornecedores com 'SEM NOME' nas contas: {len(fornecedores_contas)}")

    atualizados = 0
    for cod_forn in fornecedores_contas:
        # Buscar nome atualizado
        cur.execute("SELECT NOME FROM CAD_PESSOA WHERE CODIGO = ?", [cod_forn])
        row = cur.fetchone()

        if row and row[0] != 'SEM NOME':
            nome = row[0][:100]

            # Atualizar contas
            cur.execute("""
                UPDATE FIN_CTAPAGAR
                SET FORNECEDOR_NOME = ?
                WHERE FORNECEDOR = ? AND FORNECEDOR_NOME = 'SEM NOME'
            """, [nome, cod_forn])

            atualizados += cur.rowcount

            if atualizados % 1000 == 0:
                print(f"  {atualizados} contas atualizadas...")
                con.commit()

    con.commit()

    print(f"\n  Total de contas atualizadas: {atualizados}")

    # Verificar fornecedor 9105
    print("\n" + "="*100)
    print("VERIFICACAO DO FORNECEDOR 9105:")
    print("="*100)

    cur.execute("SELECT CODIGO, NOME, NOME_FANTASIA FROM CAD_PESSOA WHERE CODIGO = 9105")
    row = cur.fetchone()
    if row:
        print(f"  Codigo: {row[0]}")
        print(f"  Nome: [{row[1]}]")
        print(f"  Fantasia: [{row[2]}]")

    # Verificar contas
    cur.execute("""
        SELECT FIRST 3 CODIGO, FORNECEDOR_NOME, DOCUMENTO, VALOR
        FROM FIN_CTAPAGAR
        WHERE FORNECEDOR = 9105
        ORDER BY CODIGO
    """)

    print("\n  Contas a pagar:")
    for row in cur:
        print(f"    Conta {row[0]}: Nome=[{row[1]}], Doc={row[2]}, Valor=R$ {float(row[3])/100:.2f}")

    # Estatísticas finais
    print("\n" + "="*100)
    print("ESTATISTICAS FINAIS:")
    print("="*100)

    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'F' AND NOME = 'SEM NOME'")
    ainda_sem_nome = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM FIN_CTAPAGAR WHERE FORNECEDOR_NOME = 'SEM NOME'")
    contas_sem_nome = cur.fetchone()[0]

    print(f"  Fornecedores ainda com 'SEM NOME': {ainda_sem_nome}")
    print(f"  Contas a pagar com 'SEM NOME': {contas_sem_nome}")

    con.close()

    print("\n[OK] Correcao concluida!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
