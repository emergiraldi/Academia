#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Restaura valores dos pedidos (versão direta)
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
print("RESTAURANDO VALORES ORIGINAIS (V2)")
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
            vlprod = safe_float(campos[5])
            vlfrete = safe_float(campos[6])

            vlr_total = vlnota if vlnota > 0 else vlprod
            # VLR_PRODUTOS = VLNOTA - VLFRETE
            vlr_produtos = (vlnota - vlfrete) if vlnota > 0 else vlprod

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

    # Restaurar valores pedido por pedido (sem subquery no cursor)
    print("\n>> Restaurando valores...")

    pedidos_restaurados = 0

    for idpedido, valores in pedidos_pg.items():
        cur.execute("""
            UPDATE PEDIDOS
            SET VLR_TOTAL = ?,
                VLR_PRODUTOS = ?
            WHERE CODIGO = ?
        """, [valores['vlr_total'], valores['vlr_produtos'], idpedido])

        if cur.rowcount > 0:
            pedidos_restaurados += 1

            if pedidos_restaurados <= 10:
                vlr_real = valores['vlr_total'] / 100
                print(f"  Pedido {idpedido}: R$ {vlr_real:,.2f}")

        if pedidos_restaurados % 1000 == 0:
            con.commit()
            print(f"  {pedidos_restaurados:,} pedidos restaurados...")

    con.commit()

    print(f"\n>> Pedidos restaurados: {pedidos_restaurados:,}")

    # Verificar alguns pedidos específicos
    print("\n>> VERIFICANDO PEDIDOS ESPECIFICOS:")
    print("-"*100)

    pedidos_verificar = [23043, 23142, 23199, 23234, 23043]

    print(f"{'CODIGO':<10} {'FIREBIRD':<20} {'POSTGRES':<20} {'STATUS'}")
    print("-"*100)

    for codigo in pedidos_verificar:
        cur.execute("SELECT VLR_TOTAL FROM PEDIDOS WHERE CODIGO = ?", [codigo])
        row = cur.fetchone()

        if row:
            vlr_fb = float(row[0]) / 100 if row[0] else 0

            if codigo in pedidos_pg:
                vlr_pg = pedidos_pg[codigo]['vlr_total'] / 100
                diferenca = abs(vlr_fb - vlr_pg)
                status = "OK" if diferenca < 0.01 else f"DIF R$ {diferenca:.2f}"
                print(f"{codigo:<10} R$ {vlr_fb:>15,.2f} R$ {vlr_pg:>15,.2f}  {status}")

    # Estatísticas finais
    print("\n>> ESTATISTICAS FINAIS:")
    print("-"*100)

    cur.execute("""
        SELECT
            COUNT(*),
            MIN(CAST(VLR_TOTAL AS BIGINT)),
            MAX(CAST(VLR_TOTAL AS BIGINT)),
            AVG(CAST(VLR_TOTAL AS BIGINT))
        FROM PEDIDOS
    """)

    row = cur.fetchone()
    total = row[0]
    minimo = float(row[1]) / 100 if row[1] else 0
    maximo = float(row[2]) / 100 if row[2] else 0
    media = float(row[3]) / 100 if row[3] else 0

    print(f"  Total de pedidos: {total:,}")
    print(f"  Valor mínimo: R$ {minimo:,.2f}")
    print(f"  Valor máximo: R$ {maximo:,.2f}")
    print(f"  Valor médio: R$ {media:,.2f}")

    con.close()

    print("\n" + "="*100)
    print("RESTAURACAO CONCLUIDA!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
