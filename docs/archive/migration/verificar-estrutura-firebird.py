#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica estrutura de tabelas de funcionários, usuários e vendas no Firebird
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

print("="*100)
print("ESTRUTURA DAS TABELAS NO FIREBIRD")
print("="*100)

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Buscar tabelas relacionadas a funcionários, usuários e vendas
    print("\n>> TABELAS RELACIONADAS A FUNCIONARIOS/USUARIOS/VENDAS:")
    print("-"*100)

    cur.execute("""
        SELECT RDB$RELATION_NAME
        FROM RDB$RELATIONS
        WHERE RDB$SYSTEM_FLAG = 0
        AND (
            RDB$RELATION_NAME LIKE '%FUNC%' OR
            RDB$RELATION_NAME LIKE '%COLABOR%' OR
            RDB$RELATION_NAME LIKE '%USUARIO%' OR
            RDB$RELATION_NAME LIKE '%USER%' OR
            RDB$RELATION_NAME LIKE '%VEND%' OR
            RDB$RELATION_NAME LIKE '%DOC%' OR
            RDB$RELATION_NAME LIKE '%CARGO%'
        )
        ORDER BY RDB$RELATION_NAME
    """)

    tabelas_importantes = [row[0].strip() for row in cur.fetchall()]

    for tabela in tabelas_importantes:
        print(f"\n  Tabela: {tabela}")

        # Contar registros
        try:
            cur.execute(f"SELECT COUNT(*) FROM {tabela}")
            total = cur.fetchone()[0]
            print(f"    Total de registros: {total:,}")
        except:
            print(f"    (erro ao contar)")

    # Estrutura da tabela CAD_PESSOA (já sabemos que armazena clientes/fornecedores)
    print("\n\n>> TIPOS DE PESSOA EM CAD_PESSOA:")
    print("-"*100)

    cur.execute("""
        SELECT DISTINCT TIPO
        FROM CAD_PESSOA
        ORDER BY TIPO
    """)

    tipos = [row[0] for row in cur.fetchall() if row[0]]
    print(f"  Tipos existentes: {', '.join(tipos)}")

    # Verificar se CAD_PESSOA tem funcionários
    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'FUNCIONARIO'")
    total_func = cur.fetchone()[0]
    print(f"\n  Funcionários em CAD_PESSOA: {total_func:,}")

    # Verificar tabelas de documentos/vendas
    print("\n\n>> ANALISANDO TABELAS DE VENDAS/DOCUMENTOS:")
    print("-"*100)

    # Buscar tabelas que podem conter vendas
    cur.execute("""
        SELECT RDB$RELATION_NAME
        FROM RDB$RELATIONS
        WHERE RDB$SYSTEM_FLAG = 0
        ORDER BY RDB$RELATION_NAME
    """)

    todas_tabelas = [row[0].strip() for row in cur.fetchall()]

    # Filtrar tabelas que parecem ser de vendas/documentos
    tabelas_vendas = [t for t in todas_tabelas if any(palavra in t for palavra in
        ['DOC', 'VENDA', 'PEDIDO', 'ORCAMENTO', 'COMANDA', 'NFE', 'CUPOM'])]

    for tabela in tabelas_vendas[:20]:  # Limitar para não sobrecarregar
        try:
            cur.execute(f"SELECT COUNT(*) FROM {tabela}")
            total = cur.fetchone()[0]
            if total > 0:
                print(f"  {tabela}: {total:,} registros")
        except:
            pass

    # Verificar estrutura de uma tabela de documentos (se existir)
    if 'DOCUMENTOS' in todas_tabelas:
        print("\n\n>> ESTRUTURA DA TABELA DOCUMENTOS:")
        print("-"*100)

        cur.execute("""
            SELECT RDB$FIELD_NAME
            FROM RDB$RELATION_FIELDS
            WHERE RDB$RELATION_NAME = 'DOCUMENTOS'
            ORDER BY RDB$FIELD_POSITION
        """)

        campos = [row[0].strip() for row in cur.fetchall()]
        print(f"  Campos: {', '.join(campos[:20])}")

        cur.execute("SELECT COUNT(*) FROM DOCUMENTOS")
        total = cur.fetchone()[0]
        print(f"\n  Total de documentos: {total:,}")

    # Verificar se existe tabela de usuários
    tabelas_usuario = [t for t in todas_tabelas if 'USUARIO' in t or 'USER' in t]
    if tabelas_usuario:
        print("\n\n>> TABELAS DE USUARIOS:")
        print("-"*100)
        for tabela in tabelas_usuario:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {tabela}")
                total = cur.fetchone()[0]
                print(f"  {tabela}: {total:,} registros")

                # Mostrar estrutura
                cur.execute(f"""
                    SELECT RDB$FIELD_NAME
                    FROM RDB$RELATION_FIELDS
                    WHERE RDB$RELATION_NAME = '{tabela}'
                    ORDER BY RDB$FIELD_POSITION
                """)
                campos = [row[0].strip() for row in cur.fetchall()]
                print(f"    Campos: {', '.join(campos[:15])}")
            except Exception as e:
                print(f"  {tabela}: erro - {e}")

    con.close()

    print("\n" + "="*100)
    print("FIM DA ANALISE")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
