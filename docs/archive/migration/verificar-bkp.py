#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica formato do arquivo .bkp
"""

import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

arquivo_bkp = r'C:\Mac\Home\Documents\bkp brabancia\bmcmdb.bkp'

print("=== VERIFICACAO DO ARQUIVO .BKP ===\n")

try:
    # Ler primeiros bytes em modo binario
    with open(arquivo_bkp, 'rb') as f:
        primeiros_bytes = f.read(100)

    print("Primeiros 100 bytes (hexadecimal):")
    print(' '.join(f'{b:02x}' for b in primeiros_bytes))

    print("\n\nPrimeiros 100 bytes (ASCII quando possivel):")
    ascii_str = ''
    for b in primeiros_bytes:
        if 32 <= b < 127:
            ascii_str += chr(b)
        else:
            ascii_str += f'[{b:02x}]'
    print(ascii_str)

    # Tentar ler como texto
    print("\n\n>>> Tentando ler como texto...")
    try:
        with open(arquivo_bkp, 'r', encoding='latin1') as f:
            primeiras_linhas = [f.readline() for _ in range(10)]

        print("Primeiras 10 linhas:")
        for i, linha in enumerate(primeiras_linhas, 1):
            preview = linha[:80].replace('\t', '[TAB]').replace('\n', '[NL]')
            print(f"{i}: {preview}")
    except Exception as e:
        print(f"Erro ao ler como texto: {e}")

    # Verificar se e formato PostgreSQL custom
    if primeiros_bytes[:5] == b'PGDMP':
        print("\n\n[!] Formato: PostgreSQL Custom Format (binario comprimido)")
        print("    Precisa do pg_restore para extrair os dados")
    elif b'COPY ' in primeiros_bytes[:100]:
        print("\n\n[OK] Formato: Texto puro (plain SQL)")
        print("    Pode ser lido diretamente")
    else:
        print("\n\n[?] Formato desconhecido")

except Exception as e:
    print(f"ERRO: {e}")
    import traceback
    traceback.print_exc()
