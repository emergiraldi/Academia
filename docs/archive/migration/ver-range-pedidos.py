#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import codecs, sys

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

with open(r'c:\Projeto\Academia\vendas-extraidas.sql', 'r', encoding='latin1') as f:
    lines = f.readlines()

lendo = False
ids = []

for line in lines:
    if 'COPY public.pedidos' in line:
        lendo = True
        continue
    if line.strip() == '\\.':
        if ids:
            break
    if lendo and line.strip():
        campos = line.split('\t')
        if campos[0].isdigit():
            ids.append(int(campos[0]))
            if len(ids) <= 10:
                # Mostrar primeiros 10
                print(f"Pedido {campos[0]}: VLNOTA={campos[4]}, VLPROD={campos[5]}")

if ids:
    print(f"\nRange: {min(ids)} até {max(ids)}")
    print(f"Total: {len(ids)}")

    # Verificar se 23043 está no range
    if 23043 in ids:
        print(f"Pedido 23043 ESTÁ no arquivo!")
    else:
        print(f"Pedido 23043 NÃO está no arquivo (range: {min(ids)}-{max(ids)})")
