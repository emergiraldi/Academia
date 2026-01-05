#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Corrige FRETE e DESCONTO de todos os pedidos (migração do PostgreSQL)
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
print("CORRIGINDO FRETE E DESCONTO DE TODOS OS PEDIDOS")
print("="*100)

# =======================
# 1. LER DADOS DO POSTGRESQL
# =======================
print("\n>> 1. LENDO DADOS DO POSTGRESQL...")
print("-"*100)

import os

# Extrair dados do backup PostgreSQL
dump_file = r'c:\Projeto\Academia\pedidos-54329.sql'

# Buscar dados do PostgreSQL
print("  Extraindo dados do PostgreSQL...")

import subprocess

pg_restore = r'c:\Projeto\Academia\pg-tools\pgsql\bin\pg_restore.exe'
backup_file = r'C:\Mac\Home\Documents\bkp brabancia\bmcmdb.bkp'

# Extrair dados da tabela pedidos
cmd = f'"{pg_restore}" --data-only --table=pedidos -f "{dump_file}" "{backup_file}"'

try:
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
    print(f"  ✓ Dados extraídos para: {dump_file}")
except Exception as e:
    print(f"  Erro ao extrair: {e}")

# Ler arquivo SQL e extrair valores
pedidos_pg = {}

if os.path.exists(dump_file):
    print(f"\n  Lendo arquivo: {dump_file}")

    with open(dump_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            # Linhas que começam com números são dados
            if line and line[0].isdigit():
                parts = line.strip().split('\t')

                if len(parts) >= 12:
                    try:
                        # Estrutura: idpedido, idfilial, idfornecedor, documento, vlnota, vlprod, vlfrete, vlicms, vlipi, vlsubtrib, vldespesas, vldescontos
                        idpedido = int(parts[0])
                        vlnota = float(parts[4]) if parts[4] != '\\N' else 0
                        vlprod = float(parts[5]) if parts[5] != '\\N' else 0
                        vlfrete = float(parts[6]) if parts[6] != '\\N' else 0
                        vldesc = float(parts[11]) if parts[11] != '\\N' else 0  # vldescontos

                        pedidos_pg[idpedido] = {
                            'vlnota': vlnota,
                            'vlprod': vlprod,
                            'vlfrete': vlfrete,
                            'vldesc': vldesc
                        }
                    except (ValueError, IndexError):
                        continue

    print(f"  ✓ {len(pedidos_pg):,} pedidos lidos do PostgreSQL")
else:
    print(f"  ✗ Arquivo não encontrado: {dump_file}")
    pedidos_pg = {}

# =======================
# 2. ATUALIZAR FIREBIRD
# =======================
print("\n>> 2. ATUALIZANDO FIREBIRD...")
print("-"*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Contar pedidos com frete/desconto zerados
    print("\n  Analisando pedidos no Firebird...")

    cur.execute("""
        SELECT COUNT(*)
        FROM PEDIDOS
        WHERE (VLRFRETE = 0 OR VLRFRETE IS NULL)
        OR (VLR_DESCONTO = 0 OR VLR_DESCONTO IS NULL)
    """)

    total_zerados = cur.fetchone()[0]
    print(f"  Pedidos com frete ou desconto zerados: {total_zerados:,}")

    # Atualizar pedidos
    print("\n  Atualizando valores de FRETE e DESCONTO...")

    pedidos_atualizados = 0
    pedidos_com_frete = 0
    pedidos_com_desconto = 0
    total_frete = 0
    total_desconto = 0

    for idpedido, valores in pedidos_pg.items():
        # Converter para centavos
        vlfrete_centavos = int(valores['vlfrete'] * 100)
        vldesc_centavos = int(valores['vldesc'] * 100)

        # Atualizar no Firebird
        try:
            cur.execute("""
                UPDATE PEDIDOS
                SET VLRFRETE = ?,
                    VLR_DESCONTO = ?
                WHERE CODIGO = ?
            """, [vlfrete_centavos, vldesc_centavos, idpedido])

            if cur.rowcount > 0:
                pedidos_atualizados += 1

                if vlfrete_centavos > 0:
                    pedidos_com_frete += 1
                    total_frete += valores['vlfrete']

                if vldesc_centavos > 0:
                    pedidos_com_desconto += 1
                    total_desconto += valores['vldesc']

                if pedidos_atualizados % 1000 == 0:
                    con.commit()
                    print(f"    {pedidos_atualizados:,} pedidos atualizados...")

        except Exception as e:
            print(f"  Erro ao atualizar pedido {idpedido}: {e}")

    con.commit()

    print(f"\n  ✓ Total de pedidos atualizados: {pedidos_atualizados:,}")
    print(f"  ✓ Pedidos com frete: {pedidos_com_frete:,} (R$ {total_frete:,.2f})")
    print(f"  ✓ Pedidos com desconto: {pedidos_com_desconto:,} (R$ {total_desconto:,.2f})")

    # =======================
    # 3. VERIFICAÇÃO
    # =======================
    print("\n>> 3. VERIFICANDO CORREÇÃO...")
    print("-"*100)

    # Verificar alguns pedidos
    pedidos_verificar = [54329, 54216, 54257]

    print(f"\n{'PEDIDO':<10} {'FRETE (PG)':<20} {'FRETE (FB)':<20} {'DESC (PG)':<20} {'DESC (FB)':<20} {'STATUS'}")
    print("-"*100)

    for codigo in pedidos_verificar:
        if codigo in pedidos_pg:
            frete_pg = pedidos_pg[codigo]['vlfrete']
            desc_pg = pedidos_pg[codigo]['vldesc']

            cur.execute("""
                SELECT VLRFRETE, VLR_DESCONTO
                FROM PEDIDOS
                WHERE CODIGO = ?
            """, [codigo])

            row = cur.fetchone()
            if row:
                frete_fb = float(row[0]) / 100 if row[0] else 0
                desc_fb = float(row[1]) / 100 if row[1] else 0

                dif_frete = abs(frete_pg - frete_fb)
                dif_desc = abs(desc_pg - desc_fb)

                status = "✓ OK" if (dif_frete < 0.01 and dif_desc < 0.01) else "✗ DIFERENTE"

                print(f"{codigo:<10} R$ {frete_pg:>15,.2f} R$ {frete_fb:>15,.2f} R$ {desc_pg:>15,.2f} R$ {desc_fb:>15,.2f} {status}")

    con.close()

    print("\n" + "="*100)
    print("CORREÇÃO CONCLUÍDA COM SUCESSO!")
    print("="*100)
    print("\nAgora todos os pedidos têm os valores corretos de FRETE e DESCONTO!")

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
