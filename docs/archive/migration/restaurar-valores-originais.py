#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Restaura os valores originais dos pedidos migrados do PostgreSQL
e recalcula apenas os pedidos novos
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
print("RESTAURANDO VALORES ORIGINAIS DOS PEDIDOS MIGRADOS")
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
            vlnota = safe_float(campos[4])  # VLNOTA
            vlprod = safe_float(campos[5])  # VLPROD
            vlfrete = safe_float(campos[6])
            vldescontos = safe_float(campos[11])

            # Calcular total (mesma lógica da migração original)
            vlr_total = vlnota if vlnota > 0 else vlprod

            pedidos_pg[idpedido] = {
                'vlnota': vlnota,
                'vlprod': vlprod,
                'vlfrete': vlfrete,
                'vldescontos': vldescontos,
                'vlr_total': vlr_total
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

    # Restaurar valores dos pedidos migrados
    print("\n>> Restaurando valores originais dos pedidos migrados...")

    pedidos_restaurados = 0
    pedidos_novos_recalculados = 0

    cur.execute("SELECT CODIGO FROM PEDIDOS")
    todos_pedidos = [row[0] for row in cur.fetchall()]

    for codigo_pedido in todos_pedidos:
        if codigo_pedido in pedidos_pg:
            # Pedido migrado - restaurar valor original
            ped_pg = pedidos_pg[codigo_pedido]
            vlr_total_centavos = int(ped_pg['vlr_total'] * 100)
            vlr_prod_centavos = int((ped_pg['vlnota'] - ped_pg['vlfrete']) * 100) if ped_pg['vlnota'] > 0 else vlr_total_centavos

            cur.execute("""
                UPDATE PEDIDOS
                SET VLR_TOTAL = ?,
                    VLR_PRODUTOS = ?
                WHERE CODIGO = ?
            """, [vlr_total_centavos, vlr_prod_centavos, codigo_pedido])

            pedidos_restaurados += 1

            if pedidos_restaurados <= 10:
                vlr_real = vlr_total_centavos / 100
                print(f"  Pedido {codigo_pedido}: R$ {vlr_real:,.2f} (restaurado)")

        else:
            # Pedido novo - recalcular pela soma dos itens
            cur.execute("""
                SELECT SUM(VLR_TOTAL)
                FROM PEDIDOS_ITENS
                WHERE CODIGO = ?
            """, [codigo_pedido])

            row = cur.fetchone()
            vlr_itens = row[0] if (row and row[0]) else 0

            if vlr_itens > 0:
                cur.execute("""
                    UPDATE PEDIDOS
                    SET VLR_TOTAL = ?,
                        VLR_PRODUTOS = ?
                    WHERE CODIGO = ?
                """, [vlr_itens, vlr_itens, codigo_pedido])

                pedidos_novos_recalculados += 1

                if pedidos_novos_recalculados <= 10:
                    vlr_real = vlr_itens / 100
                    print(f"  Pedido {codigo_pedido}: R$ {vlr_real:,.2f} (recalculado - novo)")

        # Commit a cada 100 pedidos
        if (pedidos_restaurados + pedidos_novos_recalculados) % 100 == 0:
            con.commit()
            print(f"  {pedidos_restaurados:,} restaurados, {pedidos_novos_recalculados:,} recalculados...")

    # Commit final
    con.commit()

    print(f"\n>> RESULTADO:")
    print("-"*100)
    print(f"  Pedidos restaurados (do PostgreSQL): {pedidos_restaurados:,}")
    print(f"  Pedidos recalculados (novos): {pedidos_novos_recalculados:,}")

    # Verificar alguns pedidos específicos
    print("\n>> VERIFICANDO PEDIDOS ESPECIFICOS:")
    print("-"*100)

    pedidos_verificar = [23043, 23142, 23199, 54088, 54266]

    print(f"{'CODIGO':<10} {'FIREBIRD':<20} {'POSTGRES':<20} {'STATUS'}")
    print("-"*100)

    for codigo in pedidos_verificar:
        cur.execute("SELECT VLR_TOTAL FROM PEDIDOS WHERE CODIGO = ?", [codigo])
        row = cur.fetchone()

        if row:
            vlr_fb = float(row[0]) / 100 if row[0] else 0

            if codigo in pedidos_pg:
                vlr_pg = pedidos_pg[codigo]['vlr_total']
                status = "OK" if abs(vlr_fb - vlr_pg) < 0.01 else "DIFERENTE"
                print(f"{codigo:<10} R$ {vlr_fb:>15,.2f} R$ {vlr_pg:>15,.2f}  {status}")
            else:
                print(f"{codigo:<10} R$ {vlr_fb:>15,.2f} (pedido novo)")

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
