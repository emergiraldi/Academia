#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migra apenas os itens dos pedidos já migrados
"""

import sys, codecs, re

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
    """Converte string para float tratando erros"""
    if not valor_str or valor_str == '\\N' or valor_str == '':
        return 0.0
    try:
        valor_limpo = str(valor_str).strip().replace(',', '.')
        match = re.search(r'[-+]?\d*\.?\d+', valor_limpo)
        if match:
            return float(match.group())
        return 0.0
    except:
        return 0.0

def safe_int(valor_str):
    """Converte string para int tratando erros"""
    if not valor_str or valor_str == '\\N' or valor_str == '':
        return None
    try:
        return int(re.search(r'\d+', str(valor_str)).group())
    except:
        return None

print("="*100)
print("MIGRACAO DE ITENS DOS PEDIDOS")
print("="*100)

# Ler itens do PostgreSQL
with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
    conteudo = f.read()

linhas = conteudo.split('\n')

lendo_itens = False
pedidos_itens = []

for linha in linhas:
    if 'COPY public.pedidos_itens' in linha:
        lendo_itens = True
        print(f"Estrutura: {linha}")
        continue
    if linha.strip() == '\\.':
        lendo_itens = False
        if pedidos_itens:
            break
    if lendo_itens and linha.strip():
        pedidos_itens.append(parse_linha(linha.strip()))

print(f"\nTotal de itens encontrados: {len(pedidos_itens):,}")

# Conectar ao Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Verificar itens existentes
    cur.execute("SELECT COUNT(*) FROM PEDIDOS_ITENS")
    total_existente = cur.fetchone()[0]
    print(f"Itens já existentes no Firebird: {total_existente:,}")

    # Limpar itens existentes para reimportar
    print("\nLimpando itens existentes...")
    cur.execute("DELETE FROM PEDIDOS_ITENS")
    con.commit()
    print("Itens existentes removidos!")

    itens_inseridos = 0
    itens_ignorados = 0
    itens_erros = 0

    # Agrupar itens por pedido
    print("\n>> AGRUPANDO ITENS POR PEDIDO...")
    itens_por_pedido = {}
    for item_data in pedidos_itens:
        # Campo 0: idpedidoitem, Campo 1: idpedido, Campo 2: idproduto
        idpedido = safe_int(item_data[1])  # CORRIGIDO: Campo 1 é o idpedido
        if idpedido:
            if idpedido not in itens_por_pedido:
                itens_por_pedido[idpedido] = []
            itens_por_pedido[idpedido].append(item_data)

    print(f"Total de pedidos com itens: {len(itens_por_pedido):,}")

    # Verificar quais pedidos existem no Firebird
    print("\n>> VERIFICANDO PEDIDOS EXISTENTES NO FIREBIRD...")
    cur.execute("SELECT CODIGO FROM PEDIDOS")
    pedidos_firebird = set(row[0] for row in cur.fetchall())
    print(f"Pedidos no Firebird: {len(pedidos_firebird):,}")

    # Verificar quais produtos existem no Firebird
    print("\n>> VERIFICANDO PRODUTOS EXISTENTES NO FIREBIRD...")
    cur.execute("SELECT CODIGO FROM CAD_PRODUTOS")
    produtos_firebird = set(row[0] for row in cur.fetchall())
    print(f"Produtos no Firebird: {len(produtos_firebird):,}")

    # Migrar itens
    print("\n>> MIGRANDO ITENS...")
    pedidos_processados = 0

    for idpedido, itens in itens_por_pedido.items():
        if idpedido not in pedidos_firebird:
            itens_ignorados += len(itens)
            continue

        sequencia = 1
        for item_data in itens:
            try:
                # PostgreSQL: Campo 0=idpedidoitem, 1=idpedido, 2=idproduto, 3=referencia, 4=qtdrec, 5=qtdemb, 6=preco
                idproduto = safe_int(item_data[2])  # Campo 2: idproduto
                quantidade = safe_float(item_data[4])  # Campo 4: qtdrec (quantidade)
                vlunitario = safe_float(item_data[6])  # Campo 6: preco
                vltotal = quantidade * vlunitario

                if not idproduto or quantidade == 0:
                    itens_ignorados += 1
                    continue

                # Verificar se o produto existe
                if idproduto not in produtos_firebird:
                    itens_ignorados += 1
                    continue

                # Converter valores para centavos
                vlr_unit_int = int(vlunitario * 100)
                vlr_total_int = int(vltotal * 100)

                cur.execute("""
                    INSERT INTO PEDIDOS_ITENS (
                        CODIGO, IDPRODUTO, QTDE, VLR_UNIT, VLR_TOTAL
                    ) VALUES (?, ?, ?, ?, ?)
                """, [
                    idpedido, idproduto, quantidade, vlr_unit_int, vlr_total_int
                ])

                itens_inseridos += 1
                sequencia += 1

            except Exception as e:
                itens_erros += 1
                if itens_erros <= 5:
                    print(f"  Erro ao inserir item: {e}")

        pedidos_processados += 1

        # Commit a cada 100 pedidos
        if pedidos_processados % 100 == 0:
            con.commit()
            print(f"  {pedidos_processados:,} pedidos processados, {itens_inseridos:,} itens inseridos...")

    # Commit final
    con.commit()

    print(f"\n>> RESUMO:")
    print("-"*100)
    print(f"  Itens inseridos: {itens_inseridos:,}")
    print(f"  Itens ignorados: {itens_ignorados:,}")
    print(f"  Itens com erro: {itens_erros:,}")

    # Verificar total final
    cur.execute("SELECT COUNT(*) FROM PEDIDOS_ITENS")
    total_final = cur.fetchone()[0]
    print(f"\n  Total de itens no Firebird: {total_final:,}")

    con.close()

    print("\n" + "="*100)
    print("MIGRACAO DE ITENS CONCLUIDA!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
