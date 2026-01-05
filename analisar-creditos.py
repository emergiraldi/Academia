#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analisa por que alguns créditos não foram migrados
"""

import sys
import codecs
import re

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

print("=== ANALISE DE CREDITOS NAO MIGRADOS ===\n")

# Ler o dump SQL para pegar os IDs de clientes dos créditos
print("Lendo dump SQL...")
with open(r'c:\Projeto\Academia\dados-extraidos.sql', 'r', encoding='latin1') as f:
    conteudo = f.read()

linhas = conteudo.split('\n')
clientes_creditos = set()
total_creditos = 0

lendo_creditos = False
for linha in linhas:
    if 'COPY public.creditos' in linha:
        lendo_creditos = True
        continue
    if linha.strip() == '\\.':
        lendo_creditos = False
        continue

    if lendo_creditos and linha:
        total_creditos += 1
        valores = linha.split('\t')
        # O campo idcliente deve estar nas primeiras posições
        if len(valores) > 0:
            try:
                # Tentar extrair idcliente (geralmente é o primeiro campo depois do id)
                for val in valores[:5]:  # Verificar os primeiros 5 campos
                    if val and val != '\\N' and val.isdigit():
                        cliente_id = int(val)
                        if cliente_id < 50000:  # IDs de cliente geralmente são menores
                            clientes_creditos.add(cliente_id)
                            break
            except:
                pass

print(f"Total de creditos no dump: {total_creditos:,}")
print(f"Clientes unicos nos creditos: {len(clientes_creditos):,}")

# Conectar ao Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

con = fdb.connect(**fbConfig)
cur = con.cursor()

# Verificar quantos clientes existem no Firebird
cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'C'")
total_clientes_fb = cur.fetchone()[0]

print(f"\nClientes no Firebird: {total_clientes_fb:,}")

# Verificar alguns IDs de clientes que deveriam estar
print("\nVerificando se alguns clientes-chave existem no Firebird:")
exemplos = sorted(clientes_creditos)[:10]

for cliente_id in exemplos:
    codigo_fb = cliente_id + 100000
    cur.execute("SELECT CODIGO, NOME FROM CAD_PESSOA WHERE CODIGO = ?", [codigo_fb])
    row = cur.fetchone()
    if row:
        print(f"  Cliente {cliente_id} (codigo FB {codigo_fb}): OK - {row[1][:30]}")
    else:
        print(f"  Cliente {cliente_id} (codigo FB {codigo_fb}): NAO ENCONTRADO")

# Verificar quantos créditos foram migrados
cur.execute("SELECT COUNT(*) FROM FIN_CTARECEBER WHERE VALOR < 0")
creditos_migrados = cur.fetchone()[0]

print(f"\nCreditos migrados (VALOR < 0): {creditos_migrados:,}")
print(f"Esperado: {total_creditos:,}")
print(f"Diferenca: {total_creditos - creditos_migrados:,}")

con.close()

print("\n[OK] Analise concluida")
