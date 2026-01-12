#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Corrige o TIPO dos fornecedores de 'F' para 'FORNECEDOR'
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
print("CORRIGINDO TIPO DOS FORNECEDORES")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Verificar quantos fornecedores precisam ser corrigidos
    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'F'")
    total_f = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'FORNECEDOR'")
    total_fornecedor = cur.fetchone()[0]

    print(f"\nAntes da correção:")
    print(f"  Fornecedores com TIPO='F': {total_f:,}")
    print(f"  Fornecedores com TIPO='FORNECEDOR': {total_fornecedor:,}")

    # Atualizar TIPO de 'F' para 'FORNECEDOR'
    print(f"\nAtualizando TIPO de 'F' para 'FORNECEDOR'...")

    cur.execute("""
        UPDATE CAD_PESSOA
        SET TIPO = 'FORNECEDOR'
        WHERE TIPO = 'F'
    """)

    con.commit()

    print(f"  {total_f:,} registros atualizados!")

    # Verificar resultado
    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'F'")
    total_f_depois = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'FORNECEDOR'")
    total_fornecedor_depois = cur.fetchone()[0]

    print(f"\nDepois da correção:")
    print(f"  Fornecedores com TIPO='F': {total_f_depois:,}")
    print(f"  Fornecedores com TIPO='FORNECEDOR': {total_fornecedor_depois:,}")

    # Fazer o mesmo para clientes
    print(f"\n>> Corrigindo CLIENTES:")
    print("-"*100)

    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'C'")
    total_c = cur.fetchone()[0]

    print(f"  Clientes com TIPO='C': {total_c:,}")

    if total_c > 0:
        cur.execute("""
            UPDATE CAD_PESSOA
            SET TIPO = 'CLIENTE'
            WHERE TIPO = 'C'
        """)

        con.commit()

        print(f"  {total_c:,} clientes atualizados para TIPO='CLIENTE'!")

    # Verificar resultado final
    print(f"\n" + "="*100)
    print("RESULTADO FINAL:")
    print("="*100)

    cur.execute("""
        SELECT TIPO, COUNT(*)
        FROM CAD_PESSOA
        GROUP BY TIPO
        ORDER BY TIPO
    """)

    for row in cur:
        tipo, qtd = row
        print(f"  TIPO='{tipo}': {qtd:,} registros")

    # Mostrar exemplos
    print(f"\n>> Exemplos de fornecedores corrigidos:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10 CODIGO, NOME, TIPO
        FROM CAD_PESSOA
        WHERE TIPO = 'FORNECEDOR'
        AND CODIGO IN (19, 35, 51, 60, 78, 86, 93, 108, 116, 124)
        ORDER BY CODIGO
    """)

    for row in cur:
        print(f"  {row[0]}: {row[1][:50]} (TIPO={row[2]})")

    con.close()

    print(f"\n[OK] Correcao concluida! Agora os fornecedores devem aparecer no sistema!")
    print("="*100)
    print("IMPORTANTE: Feche e reabra o sistema QRSistema para ver as mudancas!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
