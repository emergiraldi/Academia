#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ver todos os campos do pedido no PostgreSQL
"""

import sys, codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

def parse_linha(linha):
    return linha.split('\t')

print("="*100)
print("CAMPOS COMPLETOS DO PEDIDO 23043 NO POSTGRESQL")
print("="*100)

with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
    conteudo = f.read()

linhas = conteudo.split('\n')

lendo_pedidos = False
campos_nomes = []

for linha in linhas:
    if 'COPY public.pedidos (' in linha:
        # Extrair nomes dos campos
        campos_str = linha.replace('COPY public.pedidos (', '').replace(') FROM stdin;', '')
        campos_nomes = [c.strip() for c in campos_str.split(',')]

        print("\nCampos da tabela pedidos:")
        for i, campo in enumerate(campos_nomes):
            print(f"  {i}: {campo}")

        lendo_pedidos = True
        continue

    if linha.strip() == '\\.':
        lendo_pedidos = False
        break

    if lendo_pedidos and linha.strip():
        campos = parse_linha(linha.strip())
        if campos[0] == '23043':
            print("\n\nPedido 23043 - TODOS OS CAMPOS:")
            print("-"*100)

            for i, valor in enumerate(campos):
                nome_campo = campos_nomes[i] if i < len(campos_nomes) else f'campo_{i}'
                print(f"  {i:2d}. {nome_campo:<20} = {valor}")

            # Calcular o total
            print("\n\nCALCULO DO TOTAL:")
            print("-"*100)

            try:
                vlnota = float(campos[4]) if campos[4] not in ['\\N', ''] else 0
                vlprod = float(campos[5]) if campos[5] not in ['\\N', ''] else 0
                vlfrete = float(campos[6]) if campos[6] not in ['\\N', ''] else 0
                vlicms = float(campos[7]) if campos[7] not in ['\\N', ''] else 0
                vlipi = float(campos[8]) if campos[8] not in ['\\N', ''] else 0
                vlsubtrib = float(campos[9]) if campos[9] not in ['\\N', ''] else 0
                vldespesas = float(campos[10]) if campos[10] not in ['\\N', ''] else 0
                vldescontos = float(campos[11]) if campos[11] not in ['\\N', ''] else 0

                print(f"  VLNOTA      : R$ {vlnota:>12,.2f} (total da nota)")
                print(f"  VLPROD      : R$ {vlprod:>12,.2f} (valor dos produtos)")
                print(f"  VLFRETE     : R$ {vlfrete:>12,.2f}")
                print(f"  VLICMS      : R$ {vlicms:>12,.2f}")
                print(f"  VLIPI       : R$ {vlipi:>12,.2f}")
                print(f"  VLSUBTRIB   : R$ {vlsubtrib:>12,.2f}")
                print(f"  VLDESPESAS  : R$ {vldespesas:>12,.2f}")
                print(f"  VLDESCONTOS : R$ {vldescontos:>12,.2f}")

                # Tentar descobrir a fórmula
                print("\n  Tentando descobrir a fórmula:")
                print(f"    VLPROD + VLFRETE + VLDESPESAS - VLDESCONTOS = R$ {vlprod + vlfrete + vldespesas - vldescontos:,.2f}")
                print(f"    VLPROD + VLFRETE + VLDESPESAS + VLICMS - VLDESCONTOS = R$ {vlprod + vlfrete + vldespesas + vlicms - vldescontos:,.2f}")
                print(f"    VLPROD + VLFRETE + VLDESPESAS + VLIPI - VLDESCONTOS = R$ {vlprod + vlfrete + vldespesas + vlipi - vldescontos:,.2f}")

                diferenca = vlnota - vlprod
                print(f"\n  Diferença entre VLNOTA e VLPROD: R$ {diferenca:,.2f}")
                print(f"  Isso corresponde a: VLFRETE({vlfrete:.2f}) + VLDESPESAS({vldespesas:.2f}) - VLDESCONTOS({vldescontos:.2f}) ?")
                print(f"  = R$ {vlfrete + vldespesas - vldescontos:,.2f}")

            except Exception as e:
                print(f"  Erro ao calcular: {e}")

            break

print("\n" + "="*100)
