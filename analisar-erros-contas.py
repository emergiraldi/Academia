#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analisa erros na migração de contas a pagar
"""

import sys
import codecs
import re
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

print("=== ANALISE DE ERROS - CONTAS A PAGAR ===\n")

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

def limpar_data(data_str):
    if not data_str or data_str == '\\N':
        return None
    data_limpa = re.sub(r'([0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2})[-+][0-9]{2}', r'\1', data_str)
    if ' ' in data_limpa:
        return data_limpa.split(' ')[0]
    return data_limpa

# Ler dados do dump
arquivo_dump = r'c:\Projeto\Academia\dados-extraidos.sql'
print("Lendo dump SQL...")

with open(arquivo_dump, 'r', encoding='latin1') as f:
    conteudo = f.read()

linhas = conteudo.split('\n')
contas = []
lendo_dados = False
colunas_atuais = []

for linha in linhas:
    if 'COPY public.conta_pagar' in linha and 'FROM stdin' in linha:
        match = re.search(r'COPY public\.conta_pagar\s+\((.*?)\)', linha)
        if match:
            colunas_atuais = [c.strip() for c in match.group(1).split(',')]
            lendo_dados = True
        continue

    if linha.strip() == '\\.' and lendo_dados:
        break

    if lendo_dados and linha:
        valores = linha.split('\t')
        if len(valores) == len(colunas_atuais):
            conta = {}
            for idx, col in enumerate(colunas_atuais):
                conta[col] = None if valores[idx] == '\\N' else valores[idx]
            contas.append(conta)

print(f"Total de contas a pagar no dump: {len(contas)}\n")

# Analisar problemas
print(">>> ANALISANDO PROBLEMAS:\n")

erros_tipo = {
    'sem_fornecedor': 0,
    'sem_vencimento': 0,
    'sem_valor': 0,
    'data_invalida': 0,
    'valor_invalido': 0
}

amostras = {
    'sem_fornecedor': [],
    'sem_vencimento': [],
    'data_invalida': [],
    'valor_invalido': []
}

for conta in contas[:1000]:  # Analisar primeiras 1000
    # Verificar fornecedor
    if not conta.get('fornecedor_id') or conta.get('fornecedor_id') == '\\N':
        erros_tipo['sem_fornecedor'] += 1
        if len(amostras['sem_fornecedor']) < 3:
            amostras['sem_fornecedor'].append(conta.get('id'))

    # Verificar vencimento
    if not conta.get('data_vencimento') or conta.get('data_vencimento') == '\\N':
        erros_tipo['sem_vencimento'] += 1
        if len(amostras['sem_vencimento']) < 3:
            amostras['sem_vencimento'].append(conta.get('id'))
    else:
        # Testar limpeza de data
        try:
            data_limpa = limpar_data(conta.get('data_vencimento'))
            if not data_limpa:
                erros_tipo['data_invalida'] += 1
                if len(amostras['data_invalida']) < 3:
                    amostras['data_invalida'].append((conta.get('id'), conta.get('data_vencimento')))
        except:
            erros_tipo['data_invalida'] += 1

    # Verificar valor
    if not conta.get('valor') or conta.get('valor') == '\\N':
        erros_tipo['sem_valor'] += 1
    else:
        try:
            float(conta.get('valor'))
        except:
            erros_tipo['valor_invalido'] += 1
            if len(amostras['valor_invalido']) < 3:
                amostras['valor_invalido'].append((conta.get('id'), conta.get('valor')))

print("PROBLEMAS ENCONTRADOS (primeiras 1000 contas):")
print("-" * 60)
for tipo, qtd in erros_tipo.items():
    if qtd > 0:
        print(f"  {tipo}: {qtd}")
        if tipo in amostras and amostras[tipo]:
            print(f"    Exemplos: {amostras[tipo]}")

# Conectar ao Firebird e verificar fornecedores
print("\n>>> VERIFICANDO FORNECEDORES NO FIREBIRD:\n")

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Contar fornecedores
    cur.execute("SELECT COUNT(*) FROM CAD_FORNECEDORES")
    total_fornec = cur.fetchone()[0]
    print(f"Total de fornecedores no Firebird: {total_fornec}")

    # Verificar se existe tabela de fornecedores
    if total_fornec == 0:
        print("\n[!] PROBLEMA: Nenhum fornecedor no Firebird!")
        print("    As contas a pagar precisam de fornecedores cadastrados.")
        print("    Solucao: Migrar fornecedores primeiro.")

    # Testar inserção de uma conta
    print("\n>>> TESTANDO INSERCAO DE 1 CONTA:")

    conta_teste = contas[0]
    quitado = 'S' if conta_teste.get('pago') in ['t', 'true', True] else 'N'
    valor = int(float(conta_teste.get('valor') or 0) * 100)
    data_atual = datetime.now().strftime('%Y-%m-%d')

    try:
        cur.execute("""
            INSERT INTO FIN_CTAPAGAR (
                EMPRESA, FORNECEDOR, DOCUMENTO, VENCIMENTO,
                VALOR, QUITADO, DATA_EMISSAO, DATA,
                HISTORICO, VALOR_SALDO, SITUACAO
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            1,
            int(conta_teste.get('fornecedor_id') or 1),
            (conta_teste.get('documento') or '')[:30],
            limpar_data(conta_teste.get('data_vencimento')),
            valor,
            quitado,
            limpar_data(conta_teste.get('data_emissao')) or data_atual,
            data_atual,
            (conta_teste.get('observacao') or '')[:5000],
            0 if quitado == 'S' else valor,
            'QUITADA' if quitado == 'S' else 'ABERTA'
        ])
        con.rollback()  # Não commitar, apenas testar
        print("  [OK] Insercao de teste funcionou!")

    except Exception as e:
        print(f"  [ERRO] Falha no teste: {e}")
        con.rollback()

    con.close()

except Exception as e:
    print(f"[ERRO] {e}")

print("\n" + "=" * 60)
