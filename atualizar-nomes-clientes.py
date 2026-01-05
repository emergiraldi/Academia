#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Atualiza o campo CLIENTE_NOME nas contas a receber
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
print("ATUALIZANDO NOMES DE CLIENTES NAS CONTAS A RECEBER")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Verificar estrutura da tabela
    cur.execute("""
        SELECT RDB$FIELD_NAME
        FROM RDB$RELATION_FIELDS
        WHERE RDB$RELATION_NAME = 'FIN_CTARECEBER'
        ORDER BY RDB$FIELD_POSITION
    """)

    campos = [row[0].strip() for row in cur.fetchall()]

    # Verificar se existe campo CLIENTE_NOME
    if 'CLIENTE_NOME' not in campos:
        print("  Campo CLIENTE_NOME nao existe na tabela FIN_CTARECEBER")
        print("  Campos relacionados a cliente:")
        campos_cliente = [c for c in campos if 'CLIENTE' in c or 'NOME' in c]
        print(f"  {campos_cliente}")
        con.close()
        exit(0)

    # Buscar contas sem nome de cliente
    print("\nBuscando contas sem nome de cliente...")
    cur.execute("""
        SELECT COUNT(*)
        FROM FIN_CTARECEBER
        WHERE CLIENTE_NOME IS NULL AND CLIENTE IS NOT NULL
    """)

    total = cur.fetchone()[0]
    print(f"  Contas a receber sem nome de cliente: {total:,}")

    if total == 0:
        print("  Todas as contas ja tem nome de cliente!")
        con.close()
        exit(0)

    # Atualizar os nomes
    print("\nAtualizando nomes de clientes...")

    cur.execute("""
        SELECT DISTINCT CLIENTE
        FROM FIN_CTARECEBER
        WHERE CLIENTE_NOME IS NULL AND CLIENTE IS NOT NULL
    """)

    clientes = [row[0] for row in cur.fetchall()]
    print(f"  Total de clientes distintos: {len(clientes)}")

    atualizados = 0
    nao_encontrados = 0

    for cod_cliente in clientes:
        # Buscar nome do cliente
        cur.execute("SELECT NOME FROM CAD_PESSOA WHERE CODIGO = ?", [cod_cliente])
        row = cur.fetchone()

        if row:
            nome = row[0][:100]  # Limitar a 100 caracteres

            # Atualizar todas as contas desse cliente
            cur.execute("""
                UPDATE FIN_CTARECEBER
                SET CLIENTE_NOME = ?
                WHERE CLIENTE = ? AND CLIENTE_NOME IS NULL
            """, [nome, cod_cliente])

            contas_atualizadas = cur.rowcount
            atualizados += contas_atualizadas

            if atualizados % 10000 == 0:
                print(f"  {atualizados} contas atualizadas...")
                con.commit()
        else:
            nao_encontrados += 1
            if nao_encontrados <= 5:
                print(f"  AVISO: Cliente {cod_cliente} nao encontrado em CAD_PESSOA")

    con.commit()

    print("\n" + "="*100)
    print("RESULTADO:")
    print("="*100)
    print(f"  Contas atualizadas: {atualizados:,}")
    print(f"  Clientes nao encontrados: {nao_encontrados}")

    # Mostrar exemplos
    print("\n>> EXEMPLOS DE CONTAS ATUALIZADAS:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            c.CODIGO, c.CLIENTE, c.CLIENTE_NOME, c.VALOR, c.VENCIMENTO, c.QUITADO
        FROM FIN_CTARECEBER c
        WHERE c.CLIENTE_NOME IS NOT NULL AND c.VALOR >= 0
        ORDER BY c.CODIGO
    """)

    for row in cur:
        codigo, cod_cli, nome_cli, valor, venc, quitado = row
        nome_trunc = (nome_cli or '')[:40]
        valor_real = float(valor) / 100.0 if valor else 0
        status = 'QUITADO' if quitado == 'S' else 'ABERTO'
        print(f"  Conta {codigo}: Cliente={cod_cli} ({nome_trunc}) - R$ {valor_real:.2f} - {venc} - {status}")

    con.close()

    print("\n[OK] Atualizacao concluida! Agora os clientes devem aparecer no sistema!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
