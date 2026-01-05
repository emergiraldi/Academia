#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica a view VW_RPT_PEDIDOSVENDAS que está sendo usada no relatório
"""

import sys, codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

print("="*100)
print("VERIFICANDO VIEW VW_RPT_PEDIDOSVENDAS")
print("="*100)

fbConfig = {
    'database': r'C:\\QRSistema\\db\\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Verificar se a view existe
    print("\n>> Verificando se a view existe...")
    cur.execute("""
        SELECT RDB$VIEW_SOURCE
        FROM RDB$RELATIONS
        WHERE RDB$RELATION_NAME = 'VW_RPT_PEDIDOSVENDAS'
    """)

    row = cur.fetchone()

    if row and row[0]:
        view_source = row[0]
        print("  ✓ View encontrada!")
        print("\n>> DEFINIÇÃO DA VIEW:")
        print("-"*100)
        print(view_source)
        print("-"*100)
    else:
        print("  ✗ View VW_RPT_PEDIDOSVENDAS não encontrada!")

        # Listar views disponíveis
        print("\n>> Listando views disponíveis:")
        cur.execute("""
            SELECT RDB$RELATION_NAME
            FROM RDB$RELATIONS
            WHERE RDB$SYSTEM_FLAG = 0
            AND RDB$VIEW_BLR IS NOT NULL
            ORDER BY RDB$RELATION_NAME
        """)

        for row in cur.fetchall():
            view_name = row[0].strip()
            if 'PEDIDO' in view_name.upper() or 'VENDA' in view_name.upper():
                print(f"  • {view_name}")

    # Tentar selecionar alguns dados da view para ver a estrutura
    print("\n>> Tentando buscar 3 registros da view...")
    try:
        cur.execute("""
            SELECT FIRST 3 *
            FROM VW_RPT_PEDIDOSVENDAS
            WHERE EMPRESA = 1
            ORDER BY DATA_ENTREGA DESC
        """)

        # Mostrar nomes das colunas
        print("\n>> COLUNAS DA VIEW:")
        print("-"*100)
        for idx, desc in enumerate(cur.description, 1):
            print(f"  {idx}. {desc[0]}")

        print("\n>> DADOS (3 primeiros registros):")
        print("-"*100)

        rows = cur.fetchall()
        for row in rows:
            print("\nRegistro:")
            for idx, desc in enumerate(cur.description):
                col_name = desc[0]
                value = row[idx]

                # Se for uma coluna de valor, mostrar formatado
                if 'VLR' in col_name or 'VALOR' in col_name or 'TOTAL' in col_name:
                    if value:
                        print(f"  {col_name}: {value:,} (raw) = R$ {float(value)/100:,.2f}")
                    else:
                        print(f"  {col_name}: NULL")
                elif 'DATA' in col_name:
                    print(f"  {col_name}: {value}")
                elif 'CODIGO' in col_name or 'NUMERO' in col_name:
                    print(f"  {col_name}: {value}")

    except Exception as e:
        print(f"  Erro ao buscar dados: {e}")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
