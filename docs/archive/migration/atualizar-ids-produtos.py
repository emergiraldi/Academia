#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Atualiza UNIDADE_ID e IDNCM dos produtos migrados
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
print("ATUALIZANDO IDS DE UNIDADE E NCM NOS PRODUTOS")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Primeiro, criar um mapa de unidades (sigla -> id)
    print("\nCarregando tabela de unidades...")
    cur.execute("SELECT UNIDADE_ID, SIGLA FROM CAD_UNIDADE")
    unidades_map = {row[1].strip().upper(): row[0] for row in cur.fetchall()}
    print(f"  Unidades disponiveis: {list(unidades_map.keys())}")

    # Criar um mapa de NCMs (ncm -> codigo)
    print("\nCarregando tabela de NCMs...")
    cur.execute("SELECT CODIGO, NCM FROM CAD_NCM")
    ncm_map = {}
    for row in cur.fetchall():
        codigo = row[0]
        ncm = row[1].strip() if row[1] else ''
        if ncm:
            # Remover pontos e espaços do NCM
            ncm_limpo = ncm.replace('.', '').replace(' ', '').replace('-', '')
            ncm_map[ncm_limpo] = codigo
    print(f"  Total de NCMs cadastrados: {len(ncm_map):,}")

    # Buscar todos os produtos migrados que precisam de atualização
    print("\nBuscando produtos para atualizar...")
    cur.execute("""
        SELECT CODIGO, UNIDADE, TABELA_NCM
        FROM CAD_PRODUTOS
        WHERE CODIGO >= 1000
        AND (UNIDADE_ID IS NULL OR IDNCM IS NULL)
    """)

    produtos = cur.fetchall()
    print(f"  Produtos para atualizar: {len(produtos):,}")

    atualizados_unidade = 0
    atualizados_ncm = 0
    nao_encontrados_unidade = set()
    nao_encontrados_ncm = set()

    for produto in produtos:
        codigo, unidade_sigla, ncm_codigo = produto

        unidade_id = None
        ncm_id = None

        # Buscar ID da unidade
        if unidade_sigla:
            unidade_upper = unidade_sigla.strip().upper()
            if unidade_upper in unidades_map:
                unidade_id = unidades_map[unidade_upper]
            else:
                nao_encontrados_unidade.add(unidade_upper)

        # Buscar ID do NCM
        if ncm_codigo:
            ncm_limpo = str(ncm_codigo).strip().replace('.', '').replace(' ', '').replace('-', '')
            if ncm_limpo in ncm_map:
                ncm_id = ncm_map[ncm_limpo]
            else:
                nao_encontrados_ncm.add(ncm_limpo)

        # Atualizar produto
        if unidade_id or ncm_id:
            updates = []
            params = []

            if unidade_id:
                updates.append("UNIDADE_ID = ?")
                params.append(unidade_id)
                atualizados_unidade += 1

            if ncm_id:
                updates.append("IDNCM = ?")
                params.append(ncm_id)
                atualizados_ncm += 1

            params.append(codigo)

            sql = f"UPDATE CAD_PRODUTOS SET {', '.join(updates)} WHERE CODIGO = ?"
            cur.execute(sql, params)

        if (atualizados_unidade + atualizados_ncm) % 1000 == 0:
            print(f"  Processados: {atualizados_unidade + atualizados_ncm}...")
            con.commit()

    con.commit()

    print("\n" + "="*100)
    print("RESULTADO DA ATUALIZACAO:")
    print("="*100)
    print(f"  Produtos com UNIDADE_ID atualizado: {atualizados_unidade:,}")
    print(f"  Produtos com IDNCM atualizado: {atualizados_ncm:,}")

    if nao_encontrados_unidade:
        print(f"\n  Unidades NAO encontradas ({len(nao_encontrados_unidade)}): {sorted(nao_encontrados_unidade)[:10]}")

    if nao_encontrados_ncm:
        print(f"\n  NCMs NAO encontrados ({len(nao_encontrados_ncm)}): {sorted(nao_encontrados_ncm)[:10]}")

    # Verificar produto 81115
    print("\n" + "="*100)
    print("VERIFICACAO DO PRODUTO 81115:")
    print("="*100)

    cur.execute("""
        SELECT p.CODIGO, p.NOME, p.UNIDADE, p.UNIDADE_ID, u.DESCRICAO,
               p.TABELA_NCM, p.IDNCM, n.DESCRICAO
        FROM CAD_PRODUTOS p
        LEFT JOIN CAD_UNIDADE u ON p.UNIDADE_ID = u.UNIDADE_ID
        LEFT JOIN CAD_NCM n ON p.IDNCM = n.CODIGO
        WHERE p.CODIGO = 81115
    """)

    row = cur.fetchone()
    if row:
        print(f"  CODIGO: {row[0]}")
        print(f"  NOME: {row[1][:50]}")
        print(f"  UNIDADE (texto): [{row[2]}]")
        print(f"  UNIDADE_ID: {row[3]} -> {row[4] if row[4] else '(nao encontrado)'}")
        print(f"  TABELA_NCM (texto): [{row[5]}]")
        print(f"  IDNCM: {row[6]} -> {row[7][:50] if row[7] else '(nao encontrado)'}")

    con.close()

    print("\n[OK] Atualizacao concluida! Agora o sistema deve mostrar os dados corretamente!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
