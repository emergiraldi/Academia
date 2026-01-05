#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar a estrutura do banco Firebird
Requer: pip install fdb
"""

import sys
import codecs

# Forçar UTF-8 no Windows
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    print("       Instale com: pip install fdb")
    exit(1)

print("=== VERIFICACAO DA ESTRUTURA DO FIREBIRD ===\n")
print("Conectando ao banco Firebird...")

try:
    con = fdb.connect(
        database=r'C:\QRSistema\db\QRSISTEMA.FDB',
        user='sysdba',
        password='masterkey'
    )
    print("[OK] Conectado com sucesso!\n")
except Exception as e:
    print(f"[ERRO] Erro ao conectar: {e}")
    print("\nVerifique:")
    print("1. Se o caminho do arquivo .FDB esta correto")
    print("2. Se o usuario e senha estao corretos")
    print("3. Se o Firebird esta instalado")
    exit(1)

cur = con.cursor()

# Listar todas as tabelas
print(">>> LISTANDO TODAS AS TABELAS:")
print("=" * 60)

cur.execute("""
    SELECT RDB$RELATION_NAME
    FROM RDB$RELATIONS
    WHERE RDB$SYSTEM_FLAG = 0
    AND RDB$VIEW_BLR IS NULL
    ORDER BY RDB$RELATION_NAME
""")

tabelas = []
for i, row in enumerate(cur, 1):
    nome = row[0].strip()
    tabelas.append(nome)
    print(f"{i:3}. {nome}")

print(f"\n[OK] Total: {len(tabelas)} tabelas\n")

# Filtrar tabelas relevantes
print(">>> TABELAS RELEVANTES PARA MIGRACAO:")
print("=" * 60)

palavras_chave = ['PRODUTO', 'CONTA', 'PAGAR', 'RECEBER', 'CREDITO', 'CLIENTE', 'FORNECEDOR']
relevantes = []

for tabela in tabelas:
    for palavra in palavras_chave:
        if palavra in tabela.upper():
            relevantes.append(tabela)
            break

if relevantes:
    for tabela in relevantes:
        print(f"  * {tabela}")
else:
    print("  [!] Nenhuma tabela relevante encontrada automaticamente.")
    print("      Verifique a lista completa acima.")

print("\n")

# Mostrar estrutura de cada tabela relevante
if relevantes:
    print(">>> ESTRUTURA DAS TABELAS RELEVANTES:")
    print("=" * 60)

    for tabela in relevantes:
        print(f"\n>>> Tabela: {tabela}")
        print("-" * 60)

        cur.execute(f"""
            SELECT
                RF.RDB$FIELD_NAME,
                RF.RDB$FIELD_SOURCE,
                F.RDB$FIELD_TYPE,
                F.RDB$FIELD_LENGTH
            FROM RDB$RELATION_FIELDS RF
            LEFT JOIN RDB$FIELDS F ON RF.RDB$FIELD_SOURCE = F.RDB$FIELD_NAME
            WHERE RF.RDB$RELATION_NAME = '{tabela}'
            ORDER BY RF.RDB$FIELD_POSITION
        """)

        # Mapeamento de tipos do Firebird
        tipos_fb = {
            7: 'SMALLINT',
            8: 'INTEGER',
            10: 'FLOAT',
            12: 'DATE',
            13: 'TIME',
            14: 'CHAR',
            16: 'BIGINT',
            27: 'DOUBLE',
            35: 'TIMESTAMP',
            37: 'VARCHAR',
            261: 'BLOB'
        }

        colunas = []
        for i, col in enumerate(cur, 1):
            nome_col = col[0].strip() if col[0] else ''
            tipo_fonte = col[1].strip() if col[1] else ''
            tipo_num = col[2]
            tamanho = col[3]

            tipo_str = tipos_fb.get(tipo_num, f'TYPE_{tipo_num}')
            if tamanho and tipo_num in [14, 37]:  # CHAR ou VARCHAR
                tipo_str += f'({tamanho})'

            colunas.append((nome_col, tipo_str))
            print(f"  {i:2}. {nome_col.ljust(30)} {tipo_str}")

        # Salvar para usar depois
        if any(palavra in tabela.upper() for palavra in ['PRODUTO']):
            print("\n  [!] Sugestao de mapeamento para PRODUTOS:")
            print(f"      PostgreSQL idproduto -> {tabela}.{colunas[0][0] if colunas else 'ID'}")

con.close()

print("\n" + "=" * 60)
print("\n[OK] VERIFICACAO CONCLUIDA!\n")
print(">>> Proximos passos:")
print("1. Anote os nomes das tabelas e colunas acima")
print("2. Edite o arquivo migracao-dados.cjs")
print("3. Ajuste os nomes das tabelas/colunas para corresponder ao banco Firebird")
print("4. Execute: node migracao-dados.cjs\n")
