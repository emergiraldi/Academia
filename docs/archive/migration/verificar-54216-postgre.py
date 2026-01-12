#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica se o pedido 54216 está no PostgreSQL
"""

import sys, codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

print("="*100)
print("VERIFICANDO PEDIDO 54216 NO POSTGRESQL")
print("="*100)

try:
    with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
        conteudo = f.read()

    linhas = conteudo.split('\n')

    # Primeiro, verificar o range de pedidos
    print("\n>> Verificando range de pedidos no arquivo:")
    print("-"*100)

    lendo_pedidos = False
    pedidos_ids = []

    for linha in linhas:
        if 'COPY public.pedidos' in linha:
            print(f"Estrutura encontrada: {linha[:100]}...")
            lendo_pedidos = True
            continue
        if linha.strip() == '\\.':
            lendo_pedidos = False
            if pedidos_ids:
                break
        if lendo_pedidos and linha.strip():
            campos = linha.split('\t')
            if campos[0].isdigit():
                pedidos_ids.append(int(campos[0]))

    if pedidos_ids:
        min_id = min(pedidos_ids)
        max_id = max(pedidos_ids)
        print(f"  Range de IDs: {min_id} até {max_id}")
        print(f"  Total de pedidos: {len(pedidos_ids):,}")

        # Verificar se 54216 está no range
        if 54216 >= min_id and 54216 <= max_id:
            print(f"\n  Pedido 54216 ESTÁ NO RANGE ({min_id} - {max_id})")

            # Procurar especificamente
            if 54216 in pedidos_ids:
                print(f"  ✓ Pedido 54216 CONFIRMADO no arquivo!")

                # Buscar os dados completos
                print("\n>> Dados do pedido 54216 no PostgreSQL:")
                print("-"*100)

                lendo_pedidos = False
                for linha in linhas:
                    if 'COPY public.pedidos' in linha:
                        lendo_pedidos = True
                        continue
                    if linha.strip() == '\\.':
                        break
                    if lendo_pedidos and linha.strip():
                        campos = linha.split('\t')
                        if campos[0] == '54216':
                            print(f"  ID: {campos[0]}")
                            print(f"  VLNOTA: {campos[4]}")
                            print(f"  VLPROD: {campos[5]}")
                            print(f"  VLFRETE: {campos[6] if len(campos) > 6 else 'N/A'}")
                            print(f"  DATA: {campos[12] if len(campos) > 12 else 'N/A'}")

                            # Mostrar todos os campos
                            print(f"\n  Todos os campos:")
                            for i, valor in enumerate(campos[:20]):
                                print(f"    Campo {i}: {valor}")
                            break
            else:
                print(f"  ✗ Pedido 54216 NÃO encontrado (mas está no range)")
        else:
            print(f"\n  Pedido 54216 está FORA DO RANGE ({min_id} - {max_id})")
            print(f"  Portanto, é um pedido NOVO criado após a migração")

    # Verificar itens também
    print("\n\n>> Verificando itens do pedido 54216 no PostgreSQL:")
    print("-"*100)

    lendo_itens = False
    itens_encontrados = []

    for linha in linhas:
        if 'COPY public.pedidos_itens' in linha:
            lendo_itens = True
            continue
        if linha.strip() == '\\.':
            lendo_itens = False
            if itens_encontrados:
                break
        if lendo_itens and linha.strip():
            campos = linha.split('\t')
            # Campo 1 é idpedido
            if len(campos) > 1 and campos[1] == '54216':
                itens_encontrados.append(campos)

    if itens_encontrados:
        print(f"  ✓ Encontrados {len(itens_encontrados)} itens para o pedido 54216")
        print("\n  Itens:")
        for i, item in enumerate(itens_encontrados, 1):
            idproduto = item[2] if len(item) > 2 else '?'
            qtde = item[4] if len(item) > 4 else '?'
            preco = item[6] if len(item) > 6 else '?'
            print(f"    {i}. Produto: {idproduto}, Qtde: {qtde}, Preço: {preco}")
    else:
        print(f"  ✗ Nenhum item encontrado para o pedido 54216")

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
print("CONCLUSAO:")
print("-"*100)

if pedidos_ids and 54216 in pedidos_ids:
    print("O pedido 54216 FOI MIGRADO DO POSTGRESQL!")
    print("NAO DEVE SER EXCLUIDO!")
else:
    print("O pedido 54216 NAO está no PostgreSQL")
    print("É um pedido novo que pode ser excluído se necessário")

print("="*100)
