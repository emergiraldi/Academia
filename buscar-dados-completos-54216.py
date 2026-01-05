#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Busca TODOS os dados do pedido 54216 no PostgreSQL
"""

import sys, codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

print("="*100)
print("DADOS COMPLETOS DO PEDIDO 54216 NO POSTGRESQL")
print("="*100)

try:
    with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
        conteudo = f.read()

    linhas = conteudo.split('\n')

    # Buscar estrutura e dados
    lendo_pedidos = False
    campos_nomes = []

    for linha in linhas:
        if 'COPY public.pedidos (' in linha:
            # Extrair nomes dos campos
            campos_str = linha.replace('COPY public.pedidos (', '').replace(') FROM stdin;', '')
            campos_nomes = [c.strip() for c in campos_str.split(',')]

            print("\n>> Estrutura da tabela pedidos:")
            for i, campo in enumerate(campos_nomes[:20]):
                print(f"  {i:2d}. {campo}")

            lendo_pedidos = True
            continue

        if linha.strip() == '\\.':
            lendo_pedidos = False
            break

        if lendo_pedidos and linha.strip():
            campos = linha.split('\t')
            if campos[0] == '54216':
                print("\n\n>> PEDIDO 54216 - TODOS OS VALORES:")
                print("="*100)

                for i, valor in enumerate(campos):
                    nome_campo = campos_nomes[i] if i < len(campos_nomes) else f'campo_{i}'
                    print(f"  {i:2d}. {nome_campo:<25} = {valor}")

                # Calcular valores
                print("\n\n>> VALORES CALCULADOS:")
                print("-"*100)

                try:
                    vlnota = float(campos[4]) if campos[4] not in ['\\N', ''] else 0
                    vlprod = float(campos[5]) if campos[5] not in ['\\N', ''] else 0
                    vlfrete = float(campos[6]) if campos[6] not in ['\\N', ''] else 0
                    vlicms = float(campos[7]) if len(campos) > 7 and campos[7] not in ['\\N', ''] else 0
                    vlipi = float(campos[8]) if len(campos) > 8 and campos[8] not in ['\\N', ''] else 0
                    vlsubtrib = float(campos[9]) if len(campos) > 9 and campos[9] not in ['\\N', ''] else 0
                    vldespesas = float(campos[10]) if len(campos) > 10 and campos[10] not in ['\\N', ''] else 0
                    vldescontos = float(campos[11]) if len(campos) > 11 and campos[11] not in ['\\N', ''] else 0

                    print(f"  VLNOTA (total nota)     : R$ {vlnota:>15,.2f}")
                    print(f"  VLPROD (valor produtos) : R$ {vlprod:>15,.2f}")
                    print(f"  VLFRETE                 : R$ {vlfrete:>15,.2f}")
                    print(f"  VLICMS                  : R$ {vlicms:>15,.2f}")
                    print(f"  VLIPI                   : R$ {vlipi:>15,.2f}")
                    print(f"  VLSUBTRIB               : R$ {vlsubtrib:>15,.2f}")
                    print(f"  VLDESPESAS              : R$ {vldespesas:>15,.2f}")
                    print(f"  VLDESCONTOS             : R$ {vldescontos:>15,.2f}")

                    print("\n>> O QUE DEVERIA ESTAR NO FIREBIRD:")
                    print("-"*100)

                    # VLR_TOTAL = VLNOTA (se > 0) senão VLPROD
                    vlr_total_correto = vlnota if vlnota > 0 else vlprod

                    # VLR_PRODUTOS = VLNOTA - VLFRETE (se VLNOTA > 0)
                    vlr_produtos_correto = (vlnota - vlfrete) if vlnota > 0 else vlprod

                    print(f"  VLR_TOTAL (FB)   : R$ {vlr_total_correto:>15,.2f}")
                    print(f"  VLR_PRODUTOS (FB): R$ {vlr_produtos_correto:>15,.2f}")

                except Exception as e:
                    print(f"  Erro ao calcular: {e}")

                break

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
