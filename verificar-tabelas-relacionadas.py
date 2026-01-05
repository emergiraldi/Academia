#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificar tabelas relacionadas (Unidades e NCM)
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

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Listar todas as tabelas
    cur.execute("""
        SELECT RDB$RELATION_NAME
        FROM RDB$RELATIONS
        WHERE RDB$SYSTEM_FLAG = 0
        AND RDB$VIEW_BLR IS NULL
        ORDER BY RDB$RELATION_NAME
    """)

    tabelas = [row[0].strip() for row in cur.fetchall()]

    print("="*80)
    print("TABELAS RELACIONADAS A UNIDADE E NCM:")
    print("="*80)

    # Filtrar tabelas relevantes
    for tabela in tabelas:
        if 'UNIDADE' in tabela or 'NCM' in tabela or 'CEST' in tabela:
            print(f"\n>> TABELA: {tabela}")

            # Contar registros
            try:
                cur.execute(f"SELECT COUNT(*) FROM {tabela}")
                total = cur.fetchone()[0]
                print(f"   Total de registros: {total:,}")

                # Mostrar estrutura
                cur.execute(f"""
                    SELECT RDB$FIELD_NAME
                    FROM RDB$RELATION_FIELDS
                    WHERE RDB$RELATION_NAME = '{tabela}'
                    ORDER BY RDB$FIELD_POSITION
                """)
                campos = [row[0].strip() for row in cur.fetchall()]
                print(f"   Campos: {', '.join(campos[:5])}{'...' if len(campos) > 5 else ''}")

                # Mostrar alguns exemplos
                if total > 0 and total < 1000:
                    campos_select = ', '.join(campos[:5])
                    cur.execute(f"SELECT FIRST 5 {campos_select} FROM {tabela}")
                    print("   Exemplos:")
                    for row in cur:
                        valores = [str(v).strip() if isinstance(v, str) else str(v) for v in row[:3]]
                        print(f"     {' | '.join(valores)}")
            except Exception as e:
                print(f"   [ERRO] {e}")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
