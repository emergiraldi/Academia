#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cria unidades faltantes na tabela CAD_UNIDADE
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
print("CRIANDO UNIDADES FALTANTES")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

# Unidades faltantes com suas descrições
unidades_faltantes = {
    'BD': 'Balde',
    'BR': 'Barra',
    'CJ': 'Conjunto',
    'CT': 'Cartela',
    'GL': 'Galao',
    'HR': 'Hora',
    'JG': 'Jogo',
    'KT': 'Kit',
    'LA': 'Lata',
    'M²': 'Metro Quadrado',
    'M2': 'Metro Quadrado',
    'ML': 'Metro Linear',
    'RL': 'Rolo',
    'TB': 'Tubo',
    'VD': 'Vidro'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Pegar o maior ID atual
    cur.execute("SELECT MAX(UNIDADE_ID) FROM CAD_UNIDADE")
    max_id = cur.fetchone()[0] or 10

    print(f"\nMaior ID atual: {max_id}")
    print(f"\nCriando {len(unidades_faltantes)} novas unidades...")

    criadas = 0
    for sigla, descricao in unidades_faltantes.items():
        # Verificar se já existe
        cur.execute("SELECT UNIDADE_ID FROM CAD_UNIDADE WHERE SIGLA = ?", [sigla])
        if cur.fetchone():
            print(f"  {sigla} - JA EXISTE")
            continue

        max_id += 1
        try:
            cur.execute("""
                INSERT INTO CAD_UNIDADE (UNIDADE_ID, SIGLA, DESCRICAO, APLICACAO, FATOR)
                VALUES (?, ?, ?, ?, ?)
            """, [max_id, sigla, descricao, None, 1])
            criadas += 1
            print(f"  {sigla} - CRIADA (ID: {max_id})")
        except Exception as e:
            print(f"  {sigla} - ERRO: {e}")

    con.commit()

    print(f"\n[OK] {criadas} unidades criadas!")

    # Agora atualizar os produtos com as novas unidades
    print("\nAtualizando produtos com novas unidades...")

    # Recarregar mapa de unidades
    cur.execute("SELECT UNIDADE_ID, SIGLA FROM CAD_UNIDADE")
    unidades_map = {row[1].strip().upper(): row[0] for row in cur.fetchall()}

    cur.execute("""
        SELECT CODIGO, UNIDADE
        FROM CAD_PRODUTOS
        WHERE CODIGO >= 1000 AND UNIDADE_ID IS NULL AND UNIDADE IS NOT NULL
    """)

    produtos = cur.fetchall()
    atualizados = 0

    for produto in produtos:
        codigo, unidade = produto
        if unidade:
            unidade_upper = unidade.strip().upper()
            if unidade_upper in unidades_map:
                unidade_id = unidades_map[unidade_upper]
                cur.execute("UPDATE CAD_PRODUTOS SET UNIDADE_ID = ? WHERE CODIGO = ?", [unidade_id, codigo])
                atualizados += 1

    con.commit()
    print(f"  {atualizados} produtos atualizados com novas unidades!")

    con.close()

    print("\n" + "="*100)
    print("[OK] Processo concluido!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
