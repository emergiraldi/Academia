#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migra vendas/pedidos do PostgreSQL para Firebird
"""

import sys, codecs, re
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

def limpar_data(data_str):
    """Remove timezone e hora das datas"""
    if not data_str or data_str == '\\N':
        return None
    match = re.match(r'(\d{4}-\d{2}-\d{2})', str(data_str))
    if match:
        return match.group(1)
    return None

def parse_linha(linha):
    """Converte linha do PostgreSQL em lista de campos"""
    return linha.split('\t')

def safe_float(valor_str):
    """Converte string para float tratando erros"""
    if not valor_str or valor_str == '\\N' or valor_str == '':
        return 0.0
    try:
        # Remover espaços e trocar vírgula por ponto
        valor_limpo = str(valor_str).strip().replace(',', '.')
        # Tentar extrair apenas números e ponto
        import re
        match = re.search(r'[-+]?\d*\.?\d+', valor_limpo)
        if match:
            return float(match.group())
        return 0.0
    except:
        return 0.0

print("="*100)
print("MIGRACAO DE VENDAS/PEDIDOS")
print("="*100)

# Ler dados do PostgreSQL
with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
    conteudo = f.read()

linhas = conteudo.split('\n')

# Extrair PEDIDOS
print("\n>> EXTRAINDO PEDIDOS DO POSTGRESQL")
print("-"*100)

lendo_pedidos = False
pedidos = []

for linha in linhas:
    if 'COPY public.pedidos' in linha:
        lendo_pedidos = True
        continue
    if linha.strip() == '\\.':
        lendo_pedidos = False
        if pedidos:
            break
    if lendo_pedidos and linha.strip():
        pedidos.append(parse_linha(linha.strip()))

print(f"Total de pedidos encontrados: {len(pedidos)}")

# Extrair PEDIDOS_ITENS
print("\n>> EXTRAINDO ITENS DOS PEDIDOS")
print("-"*100)

lendo_itens = False
pedidos_itens = []

for linha in linhas:
    if 'COPY public.pedidos_itens' in linha:
        lendo_itens = True
        continue
    if linha.strip() == '\\.':
        lendo_itens = False
        if pedidos_itens:
            break
    if lendo_itens and linha.strip():
        pedidos_itens.append(parse_linha(linha.strip()))

print(f"Total de itens encontrados: {len(pedidos_itens)}")

# Conectar ao Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Verificar vendas existentes
    cur.execute("SELECT COUNT(*) FROM PEDIDOS")
    total_existente = cur.fetchone()[0]
    print(f"\nPedidos já existentes no Firebird: {total_existente}")

    pedidos_inseridos = 0
    pedidos_erros = 0
    itens_inseridos = 0
    itens_erros = 0

    print("\n>> MIGRANDO PEDIDOS")
    print("-"*100)

    # Mapear pedidos com seus itens
    itens_por_pedido = {}
    for item_data in pedidos_itens:
        idpedido = int(item_data[0]) if item_data[0] != '\\N' else None
        if idpedido:
            if idpedido not in itens_por_pedido:
                itens_por_pedido[idpedido] = []
            itens_por_pedido[idpedido].append(item_data)

    # Migrar pedidos
    for ped_data in pedidos:
        try:
            # PostgreSQL: idpedido, idfilial, idfornecedor, documento, vlnota, vlprod, vlfrete,
            #             vlicms, vlipi, vlsubtrib, vldespesas, vldescontos, data, lancado, datalan,
            #             idfuncionario, user_id, delivery_date, previsao_entrega, data_entrega,
            #             conferido_por, status

            idpedido = int(ped_data[0])
            idfilial = int(ped_data[1]) if ped_data[1] != '\\N' else 1
            idfornecedor = int(ped_data[2]) if ped_data[2] != '\\N' else None
            documento = (ped_data[3] or '')[:20]
            vlnota = safe_float(ped_data[4])
            vlprod = safe_float(ped_data[5])
            vlfrete = safe_float(ped_data[6])
            vldescontos = safe_float(ped_data[11])
            data = limpar_data(ped_data[12]) or datetime.now().strftime('%Y-%m-%d')
            lancado = 'S' if ped_data[13] == 't' else 'N'
            datalan = limpar_data(ped_data[14])
            idfuncionario = int(ped_data[15]) if ped_data[15] != '\\N' else None
            data_entrega = limpar_data(ped_data[19])

            # Verificar se já existe
            cur.execute("SELECT CODIGO FROM PEDIDOS WHERE CODIGO = ?", [idpedido])
            if cur.fetchone():
                continue  # Já existe

            # Calcular total
            vlr_total = vlnota if vlnota > 0 else vlprod
            if vlr_total == 0:
                # Calcular pela soma dos itens
                if idpedido in itens_por_pedido:
                    for item in itens_por_pedido[idpedido]:
                        qtd = safe_float(item[2]) if len(item) > 2 else 0
                        vlr = safe_float(item[3]) if len(item) > 3 else 0
                        vlr_total += qtd * vlr

            # Calcular quantidade total de itens
            qtde_total = 0
            if idpedido in itens_por_pedido:
                for item in itens_por_pedido[idpedido]:
                    qtd = safe_float(item[2]) if len(item) > 2 else 0
                    qtde_total += qtd

            # Firebird espera valores monetários em centavos (BIGINT)
            vlr_total_int = int(vlr_total * 100)
            vlr_produtos_int = int(vlprod * 100)
            vlr_desconto_int = int(vldescontos * 100)
            vlr_frete_int = int(vlfrete * 100)

            # Inserir pedido no Firebird
            cur.execute("""
                INSERT INTO PEDIDOS (
                    CODIGO, EMPRESA, DATA, TIPO, APROVADO, SITUACAO, FATURADO,
                    CLIENTE, DOCUMENTO, VLR_DESCONTO, QTDE_TOTAL, VLR_TOTAL,
                    VLRFRETE, VLR_PRODUTOS, DATA_ENTREGA, FATURADODATA, IDUSUARIO_ORIGEM
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                idpedido, idfilial, data, 'P',  # P = Pedido
                'S' if lancado == 'S' else 'N',  # Aprovado
                'F' if lancado == 'S' else 'A',  # Situação: F=Fechado, A=Aberto
                lancado,  # Faturado
                idfornecedor,  # Cliente (fornecedor no contexto de compra)
                documento,
                vlr_desconto_int, qtde_total, vlr_total_int,
                vlr_frete_int, vlr_produtos_int,
                data_entrega or data,
                datalan or data,
                idfuncionario or 1
            ])

            pedidos_inseridos += 1

            # Inserir itens do pedido
            if idpedido in itens_por_pedido:
                sequencia = 1
                for item_data in itens_por_pedido[idpedido]:
                    try:
                        # PostgreSQL pedidos_itens: idpedido, idproduto, quantidade, vlunitario, vltotal, ...
                        idproduto = int(item_data[1]) if len(item_data) > 1 and item_data[1] != '\\N' and item_data[1].isdigit() else None
                        quantidade = safe_float(item_data[2]) if len(item_data) > 2 else 0
                        vlunitario = safe_float(item_data[3]) if len(item_data) > 3 else 0
                        vltotal = safe_float(item_data[4]) if len(item_data) > 4 else quantidade * vlunitario

                        if not idproduto or quantidade == 0:
                            continue

                        # Converter valores para centavos
                        vlr_unit_int = int(vlunitario * 100)
                        vlr_total_int = int(vltotal * 100)

                        cur.execute("""
                            INSERT INTO PEDIDOS_ITENS (
                                PEDIDO, SEQUENCIA, PRODUTO, QUANTIDADE, VLR_UNITARIO, VLR_TOTAL
                            ) VALUES (?, ?, ?, ?, ?, ?)
                        """, [
                            idpedido, sequencia, idproduto, quantidade, vlr_unit_int, vlr_total_int
                        ])

                        itens_inseridos += 1
                        sequencia += 1

                    except Exception as e:
                        itens_erros += 1
                        if itens_erros <= 3:
                            print(f"  Erro ao inserir item: {e}")

            # Commit a cada 100 pedidos
            if pedidos_inseridos % 100 == 0:
                con.commit()
                print(f"  {pedidos_inseridos} pedidos migrados...")

        except Exception as e:
            pedidos_erros += 1
            if pedidos_erros <= 5:
                print(f"  Erro ao inserir pedido {ped_data[0]}: {e}")

    # Commit final
    con.commit()

    print(f"\n>> RESUMO DA MIGRACAO:")
    print("-"*100)
    print(f"  Pedidos inseridos: {pedidos_inseridos:,}")
    print(f"  Pedidos com erro: {pedidos_erros:,}")
    print(f"  Itens inseridos: {itens_inseridos:,}")
    print(f"  Itens com erro: {itens_erros:,}")

    # Verificar total final
    cur.execute("SELECT COUNT(*) FROM PEDIDOS")
    total_final = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM PEDIDOS_ITENS")
    total_itens_final = cur.fetchone()[0]

    print(f"\n  Total de pedidos no Firebird: {total_final:,}")
    print(f"  Total de itens no Firebird: {total_itens_final:,}")

    con.close()

    print("\n" + "="*100)
    print("MIGRACAO DE VENDAS CONCLUIDA!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
