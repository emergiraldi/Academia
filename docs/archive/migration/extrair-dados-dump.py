#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extrai dados do dump PostgreSQL em formato customizado
Procura por seções de dados em formato texto (tab-delimited)
"""

import sys
import codecs
import re

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

arquivo_dump = r'C:\Mac\Home\Documents\bkp brabancia\dump-bmcmdb-202512221903.sql'

print("=== EXTRACAO DE DADOS DO DUMP ===\n")

dados = {
    'produtos': [],
    'contas_pagar': [],
    'contas_receber': [],
    'creditos': []
}

try:
    with open(arquivo_dump, 'r', encoding='latin1', errors='ignore') as f:
        linhas = f.readlines()

    total_linhas = len(linhas)
    print(f"Total de linhas: {total_linhas:,}\n")

    # Procurar por seções específicas
    print("Procurando dados das tabelas...\n")

    # Função para verificar se uma linha parece conter dados tabulares
    def e_linha_dados(linha):
        # Deve ter tabs
        if '\t' not in linha:
            return False
        # Não deve ter muitos caracteres de controle binários
        controle = sum(1 for c in linha if ord(c) < 32 and ord(c) not in [9, 10, 13])
        return controle < 5  # Permite alguns caracteres de controle

    # Procurar por produtos
    print(">>> Procurando PRODUTOS...")
    for i, linha in enumerate(linhas):
        if 'COPY public.produtos' in linha and 'FROM stdin' in linha:
            print(f"  Encontrado COPY produtos na linha {i:,}")

            # Extrair nomes das colunas
            match = re.search(r'COPY public\.produtos\s+\((.*?)\)', linha)
            if match:
                colunas = [c.strip() for c in match.group(1).split(',')]
                print(f"  Colunas: {len(colunas)}")

                # Procurar dados nas próximas linhas
                for j in range(i + 1, min(i + 200000, total_linhas)):
                    linha_dado = linhas[j]

                    # Fim de dados
                    if linha_dado.strip() == '\\.':
                        print(f"  Fim dos dados na linha {j:,}")
                        break

                    # Se parece linha de dados
                    if e_linha_dados(linha_dado):
                        valores = linha_dado.rstrip('\n').split('\t')

                        # Se tem número correto de colunas
                        if len(valores) == len(colunas):
                            produto = {}
                            for idx, col in enumerate(colunas):
                                produto[col] = None if valores[idx] == '\\N' else valores[idx]
                            dados['produtos'].append(produto)

                            if len(dados['produtos']) % 1000 == 0:
                                print(f"    {len(dados['produtos'])} produtos extraidos...")

                print(f"  Total produtos: {len(dados['produtos'])}")
                break

    # Procurar por conta_pagar
    print("\n>>> Procurando CONTA_PAGAR...")
    for i, linha in enumerate(linhas):
        if 'COPY public.conta_pagar' in linha and 'FROM stdin' in linha:
            print(f"  Encontrado COPY conta_pagar na linha {i:,}")

            match = re.search(r'COPY public\.conta_pagar\s+\((.*?)\)', linha)
            if match:
                colunas = [c.strip() for c in match.group(1).split(',')]
                print(f"  Colunas: {len(colunas)}")

                for j in range(i + 1, min(i + 100000, total_linhas)):
                    linha_dado = linhas[j]

                    if linha_dado.strip() == '\\.':
                        print(f"  Fim dos dados na linha {j:,}")
                        break

                    if e_linha_dados(linha_dado):
                        valores = linha_dado.rstrip('\n').split('\t')

                        if len(valores) == len(colunas):
                            conta = {}
                            for idx, col in enumerate(colunas):
                                conta[col] = None if valores[idx] == '\\N' else valores[idx]
                            dados['contas_pagar'].append(conta)

                            if len(dados['contas_pagar']) % 100 == 0:
                                print(f"    {len(dados['contas_pagar'])} contas a pagar extraidas...")

                print(f"  Total contas a pagar: {len(dados['contas_pagar'])}")
                break

    # Procurar por documentos (contas a receber)
    print("\n>>> Procurando DOCUMENTOS...")
    for i, linha in enumerate(linhas):
        if 'COPY public.documentos' in linha and 'FROM stdin' in linha:
            print(f"  Encontrado COPY documentos na linha {i:,}")

            match = re.search(r'COPY public\.documentos\s+\((.*?)\)', linha)
            if match:
                colunas = [c.strip() for c in match.group(1).split(',')]
                print(f"  Colunas: {len(colunas)}")

                for j in range(i + 1, min(i + 200000, total_linhas)):
                    linha_dado = linhas[j]

                    if linha_dado.strip() == '\\.':
                        print(f"  Fim dos dados na linha {j:,}")
                        break

                    if e_linha_dados(linha_dado):
                        valores = linha_dado.rstrip('\n').split('\t')

                        if len(valores) == len(colunas):
                            doc = {}
                            for idx, col in enumerate(colunas):
                                doc[col] = None if valores[idx] == '\\N' else valores[idx]
                            dados['contas_receber'].append(doc)

                            if len(dados['contas_receber']) % 100 == 0:
                                print(f"    {len(dados['contas_receber'])} documentos extraidos...")

                print(f"  Total documentos: {len(dados['contas_receber'])}")
                break

    # Procurar por creditos
    print("\n>>> Procurando CREDITOS...")
    for i, linha in enumerate(linhas):
        if 'COPY public.creditos' in linha and 'FROM stdin' in linha:
            print(f"  Encontrado COPY creditos na linha {i:,}")

            match = re.search(r'COPY public\.creditos\s+\((.*?)\)', linha)
            if match:
                colunas = [c.strip() for c in match.group(1).split(',')]
                print(f"  Colunas: {len(colunas)}")

                for j in range(i + 1, min(i + 50000, total_linhas)):
                    linha_dado = linhas[j]

                    if linha_dado.strip() == '\\.':
                        print(f"  Fim dos dados na linha {j:,}")
                        break

                    if e_linha_dados(linha_dado):
                        valores = linha_dado.rstrip('\n').split('\t')

                        if len(valores) == len(colunas):
                            credito = {}
                            for idx, col in enumerate(colunas):
                                credito[col] = None if valores[idx] == '\\N' else valores[idx]
                            dados['creditos'].append(credito)

                            if len(dados['creditos']) % 100 == 0:
                                print(f"    {len(dados['creditos'])} creditos extraidos...")

                print(f"  Total creditos: {len(dados['creditos'])}")
                break

    # Salvar dados extraídos em arquivo pickle para usar depois
    print("\n>>> Salvando dados extraidos...")
    import pickle
    with open('c:/Projeto/Academia/dados_extraidos.pkl', 'wb') as f:
        pickle.dump(dados, f)

    print("\n=== RESUMO ===")
    print(f"Produtos: {len(dados['produtos'])}")
    print(f"Contas a pagar: {len(dados['contas_pagar'])}")
    print(f"Contas a receber: {len(dados['contas_receber'])}")
    print(f"Creditos: {len(dados['creditos'])}")
    print("\nDados salvos em: dados_extraidos.pkl")

except Exception as e:
    print(f"ERRO: {e}")
    import traceback
    traceback.print_exc()
