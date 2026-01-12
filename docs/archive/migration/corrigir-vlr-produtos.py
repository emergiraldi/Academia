#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Corrige VLR_PRODUTOS usando o valor correto do PostgreSQL (VLPROD)
"""

import sys, codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

def parse_linha(linha):
    return linha.split('\t')

def safe_float(valor_str):
    if not valor_str or valor_str == '\\N' or valor_str == '':
        return 0.0
    try:
        return float(str(valor_str).strip())
    except:
        return 0.0

print("="*100)
print("CORRIGINDO VLR_PRODUTOS COM VALOR CORRETO DO POSTGRESQL")
print("="*100)

# Ler pedidos do PostgreSQL
with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
    conteudo = f.read()

linhas = conteudo.split('\n')

print("\n>> Lendo pedidos do PostgreSQL...")
lendo_pedidos = False
pedidos_pg = {}

for linha in linhas:
    if 'COPY public.pedidos' in linha:
        lendo_pedidos = True
        continue
    if linha.strip() == '\\.':
        lendo_pedidos = False
        if pedidos_pg:
            break
    if lendo_pedidos and linha.strip():
        campos = parse_linha(linha.strip())
        if len(campos) >= 12:
            idpedido = int(campos[0])
            vlnota = safe_float(campos[4])
            vlprod = safe_float(campos[5])  # Usar VLPROD diretamente!

            # VLR_TOTAL = VLNOTA (se > 0) senão VLPROD
            vlr_total = vlnota if vlnota > 0 else vlprod

            # VLR_PRODUTOS = VLPROD do PostgreSQL (não calcular!)
            vlr_produtos = vlprod if vlprod > 0 else vlnota

            pedidos_pg[idpedido] = {
                'vlr_total': int(vlr_total * 100),
                'vlr_produtos': int(vlr_produtos * 100)
            }

print(f"Total de pedidos do PostgreSQL: {len(pedidos_pg):,}")

# Conectar ao Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Atualizar VLR_PRODUTOS
    print("\n>> Atualizando VLR_PRODUTOS...")

    pedidos_atualizados = 0

    for idpedido, valores in pedidos_pg.items():
        cur.execute("""
            UPDATE PEDIDOS
            SET VLR_PRODUTOS = ?
            WHERE CODIGO = ?
        """, [valores['vlr_produtos'], idpedido])

        if cur.rowcount > 0:
            pedidos_atualizados += 1

            if pedidos_atualizados <= 10:
                vlr_real = valores['vlr_produtos'] / 100
                print(f"  Pedido {idpedido}: VLR_PRODUTOS = R$ {vlr_real:,.2f}")

        if pedidos_atualizados % 1000 == 0:
            con.commit()
            print(f"  {pedidos_atualizados:,} pedidos atualizados...")

    con.commit()

    print(f"\n>> Pedidos atualizados: {pedidos_atualizados:,}")

    # Verificar pedido 54216
    print("\n>> VERIFICANDO PEDIDO 54216 APOS CORRECAO:")
    print("-"*100)

    cur.execute("""
        SELECT CODIGO, VLR_TOTAL, VLR_PRODUTOS
        FROM PEDIDOS
        WHERE CODIGO = 54216
    """)

    row = cur.fetchone()
    if row:
        codigo, vlr_total, vlr_prod = row
        vlr_t = float(vlr_total) / 100
        vlr_p = float(vlr_prod) / 100

        print(f"  Código: {codigo}")
        print(f"  VLR_TOTAL: R$ {vlr_t:,.2f}")
        print(f"  VLR_PRODUTOS: R$ {vlr_p:,.2f}")

        print(f"\n  PostgreSQL:")
        print(f"    VLNOTA: R$ 11,312.01")
        print(f"    VLPROD: R$ 7,436.28")

        if abs(vlr_p - 7436.28) < 0.01:
            print(f"\n  ✓ VLR_PRODUTOS CORRETO!")
        else:
            print(f"\n  ✗ VLR_PRODUTOS ainda incorreto (diferença: R$ {abs(vlr_p - 7436.28):.2f})")

    con.close()

    print("\n" + "="*100)
    print("CORRECAO CONCLUIDA!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
