#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Baixa PostgreSQL binaries
"""

import sys
import codecs
import urllib.request
import os

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

print("=== DOWNLOAD POSTGRESQL BINARIES ===\n")

# URL do PostgreSQL 14 Windows binaries (arquivo ZIP portátil)
url = "https://get.enterprisedb.com/postgresql/postgresql-14.13-1-windows-x64-binaries.zip"
destino = r'c:\Projeto\Academia\pg-tools\postgresql-14-windows-x64-binaries.zip'

print(f"Baixando de: {url}")
print(f"Destino: {destino}\n")

try:
    # Download com progresso
    def reporthook(blocknum, blocksize, totalsize):
        readsofar = blocknum * blocksize
        if totalsize > 0:
            percent = readsofar * 100 / totalsize
            s = "\r%5.1f%% %*d / %d" % (
                percent, len(str(totalsize)), readsofar, totalsize)
            sys.stderr.write(s)
            if readsofar >= totalsize:
                sys.stderr.write("\n")
        else:
            sys.stderr.write("read %d\n" % (readsofar,))

    urllib.request.urlretrieve(url, destino, reporthook)
    print("\n[OK] Download concluido!")

    # Verificar tamanho
    tamanho = os.path.getsize(destino)
    print(f"Tamanho: {tamanho:,} bytes ({tamanho / 1024 / 1024:.1f} MB)")

except Exception as e:
    print(f"\n[ERRO] Falha no download: {e}")
    print("\nTentando URL alternativa...")

    # Tentar URL alternativa
    url_alt = "https://sbp.enterprisedb.com/getfile.jsp?fileid=1258893"
    try:
        urllib.request.urlretrieve(url_alt, destino, reporthook)
        print("\n[OK] Download concluido (URL alternativa)!")
    except Exception as e2:
        print(f"\n[ERRO] Falha tambem na URL alternativa: {e2}")
        print("\n SOLUCAO: Baixe manualmente de https://www.enterprisedb.com/download-postgresql-binaries")
        exit(1)
