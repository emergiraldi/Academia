#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tenta ler dados do arquivo PGDMP (PostgreSQL Custom Format)
O formato PGDMP pode conter dados comprimidos com zlib
"""

import sys
import codecs
import struct
import zlib

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

arquivo_bkp = r'C:\Mac\Home\Documents\bkp brabancia\bmcmdb.bkp'

print("=== LENDO ARQUIVO PGDMP ===\n")

try:
    with open(arquivo_bkp, 'rb') as f:
        # Ler cabeçalho
        magic = f.read(5)
        if magic != b'PGDMP':
            print("[ERRO] Nao e um arquivo PGDMP valido")
            exit(1)

        print(f"[OK] Arquivo PGDMP detectado")

        # Ler versão do formato
        vmaj = struct.unpack('B', f.read(1))[0]
        vmin = struct.unpack('B', f.read(1))[0]
        vrev = struct.unpack('B', f.read(1))[0]
        print(f"Versao do formato: {vmaj}.{vmin}.{vrev}")

        # Ler informações do dump
        intSize = struct.unpack('B', f.read(1))[0]
        offSize = struct.unpack('B', f.read(1))[0]
        format = struct.unpack('B', f.read(1))[0]

        print(f"Tamanho inteiro: {intSize}")
        print(f"Tamanho offset: {offSize}")
        print(f"Formato: {format}")

        # Pular para procurar por seções de dados
        print("\nProcurando secoes de dados...")

        # Ler todo o conteúdo restante
        f.seek(0)
        conteudo = f.read()

        # Procurar por marcadores de tabelas
        tabelas_interesse = [b'produtos', b'conta_pagar', b'documentos', b'creditos']

        for tabela in tabelas_interesse:
            print(f"\n>>> Procurando por '{tabela.decode()}'...")

            # Encontrar todas as ocorrências
            pos = 0
            ocorrencias = []
            while True:
                pos = conteudo.find(tabela, pos)
                if pos == -1:
                    break
                ocorrencias.append(pos)
                pos += 1

            print(f"  Encontradas {len(ocorrencias)} referencias")

            if ocorrencias:
                # Tentar extrair dados próximos às referências
                for i, pos in enumerate(ocorrencias[:3]):  # Primeiras 3 ocorrências
                    print(f"\n  Ocorrencia {i+1} na posicao {pos:,}:")

                    # Tentar ler dados próximos (próximos 1000 bytes)
                    dados_proximos = conteudo[pos:pos+1000]

                    # Tentar descomprimir (pode estar comprimido com zlib)
                    try:
                        # Procurar por inicio de bloco comprimido zlib
                        # Blocos zlib geralmente começam com bytes 78 9C ou 78 01
                        for offset in range(0, len(dados_proximos) - 100, 1):
                            if dados_proximos[offset:offset+2] in [b'\x78\x9c', b'\x78\x01', b'\x78\xda']:
                                try:
                                    descomprimido = zlib.decompress(dados_proximos[offset:])
                                    if len(descomprimido) > 50:
                                        # Tentar decodificar como texto
                                        try:
                                            texto = descomprimido.decode('utf-8', errors='ignore')
                                            if '\t' in texto and len(texto) > 100:
                                                print(f"    [!] Encontrou dados descomprimidos (offset +{offset})!")
                                                print(f"    Primeiros 200 caracteres:")
                                                preview = texto[:200].replace('\t', '[TAB]').replace('\n', '[NL]')
                                                print(f"    {preview}...")
                                                break
                                        except:
                                            pass
                                except:
                                    continue
                    except Exception as e:
                        pass

        print("\n\n[!] Formato PGDMP e muito complexo para parser manual")
        print("    Precisa do pg_restore oficial do PostgreSQL")
        print("\nOpcoes:")
        print("1. Instalar PostgreSQL para usar pg_restore")
        print("2. Pedir um dump em formato texto: pg_dump -Fp")
        print("3. Conectar diretamente ao banco PostgreSQL original")

except Exception as e:
    print(f"ERRO: {e}")
    import traceback
    traceback.print_exc()
