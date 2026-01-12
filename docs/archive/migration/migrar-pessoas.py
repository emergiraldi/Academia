#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migração de Fornecedores e Clientes para CAD_PESSOA no Firebird
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
    print("       Instale com: pip install fdb")
    exit(1)

print("=== MIGRACAO FORNECEDORES E CLIENTES -> CAD_PESSOA ===\n")

# Configuração Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

def limpar_data(data_str):
    """Remove timezone de strings de data"""
    if not data_str or data_str == '\\N':
        return None
    data_limpa = re.sub(r'([0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2})[-+][0-9]{2}', r'\1', data_str)
    if ' ' in data_limpa:
        return data_limpa.split(' ')[0]
    return data_limpa

def parsear_dump():
    """Le e parseia o dump de fornecedores e clientes"""
    print("Lendo dump SQL de fornecedores e clientes...")

    with open(r'c:\Projeto\Academia\fornecedores-clientes.sql', 'r', encoding='latin1') as f:
        conteudo = f.read()

    dados = {
        'fornecedores': [],
        'clientes': []
    }

    linhas = conteudo.split('\n')
    tabela_atual = None
    colunas_atuais = []
    lendo_dados = False

    for linha in linhas:
        # Detectar início de COPY
        match_copy = re.match(r'COPY public\.(fornecedores|clientes)\s+\((.*?)\)\s+FROM stdin;', linha)
        if match_copy:
            tabela_atual = match_copy.group(1)
            colunas_atuais = [c.strip() for c in match_copy.group(2).split(',')]
            lendo_dados = True
            print(f"Encontrado: {tabela_atual} com {len(colunas_atuais)} colunas")
            continue

        # Detectar fim de dados
        if linha == '\\.' or linha.strip() == '\\.':
            if lendo_dados and tabela_atual:
                print(f"  -> {tabela_atual}: {len(dados[tabela_atual])} registros lidos")
            lendo_dados = False
            tabela_atual = None
            colunas_atuais = []
            continue

        # Ler dados
        if lendo_dados and tabela_atual and linha:
            valores = linha.split('\t')
            registro = {}
            for idx, col in enumerate(colunas_atuais):
                if idx < len(valores):
                    registro[col] = None if valores[idx] == '\\N' else valores[idx]
            dados[tabela_atual].append(registro)

    return dados

def migrar_fornecedores(con, fornecedores):
    """Migra fornecedores para CAD_PESSOA"""
    print(f"\nIniciando migracao de {len(fornecedores)} fornecedores...")
    cur = con.cursor()
    sucesso = 0
    erros = 0
    erros_detalhes = []

    for forn in fornecedores:
        try:
            # Determinar natureza baseado no documento
            cnpj = forn.get('cnpj') or ''
            cpf = forn.get('cpf') or ''

            # Se tem CNPJ com mais de 11 dígitos = pessoa jurídica
            # Se tem CPF ou documento menor = pessoa física
            if cnpj and len(cnpj.replace('.', '').replace('/', '').replace('-', '')) > 11:
                natureza = 'J'  # Jurídica
                documento = cnpj
            else:
                natureza = 'F'  # Física
                documento = cpf or cnpj

            # Preparar dados
            codigo = int(forn.get('idfornecedor') or 0)
            nome = (forn.get('nome') or 'SEM NOME')[:100]
            fantasia = (forn.get('fantasia') or nome)[:100]
            telefone = (forn.get('telefone') or '')[:20]
            celular = (forn.get('celular') or '')[:20]
            email = (forn.get('email') or '')[:100]
            endereco = (forn.get('endereco') or '')[:100]
            numero = (forn.get('numero') or '')[:10]
            bairro = (forn.get('bairro') or '')[:50]
            cidade = (forn.get('cidade') or '')[:50]
            uf = (forn.get('uf') or 'SP')[:2]
            cep = (forn.get('cep') or '')[:10]
            ativo = 'S' if forn.get('deleted') in [None, 'f', 'false', False] else 'N'

            cur.execute("""
                INSERT INTO CAD_PESSOA (
                    CODIGO, EMPRESA, TIPO, NATUREZA, NOME, NOME_FANTASIA,
                    CPF_CNPJ, FONE, CELULAR, EMAIL,
                    ENDERECO, NUMERO, BAIRRO, NOMECIDADE, UF, CEP,
                    ATIVO, DATA
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                codigo, 1, 'F', natureza, nome, fantasia,
                documento[:20], telefone, celular, email,
                endereco, numero, bairro, cidade, uf, cep,
                ativo, datetime.now().strftime('%Y-%m-%d')
            ])

            sucesso += 1
            if sucesso % 100 == 0:
                print(f"{sucesso} fornecedores migrados...")

        except Exception as erro:
            erros += 1
            if erros <= 5:  # Mostrar apenas os primeiros 5 erros
                erros_detalhes.append(f"Fornecedor {forn.get('idfornecedor')}: {erro}")

    con.commit()
    print(f"Fornecedores: {sucesso} migrados, {erros} erros")
    if erros_detalhes:
        print("\nPrimeiros erros:")
        for erro in erros_detalhes:
            print(f"  - {erro}")

def migrar_clientes(con, clientes):
    """Migra clientes para CAD_PESSOA"""
    print(f"\nIniciando migracao de {len(clientes)} clientes...")
    cur = con.cursor()
    sucesso = 0
    erros = 0
    erros_detalhes = []

    for cli in clientes:
        try:
            # Determinar natureza
            cnpj = cli.get('cnpj') or ''
            cpf = cli.get('cpf') or ''

            if cnpj and len(cnpj.replace('.', '').replace('/', '').replace('-', '')) > 11:
                natureza = 'J'
                documento = cnpj
            else:
                natureza = 'F'
                documento = cpf or cnpj

            # Preparar dados
            codigo = int(cli.get('idcliente') or 0) + 100000  # Offset para não conflitar com fornecedores
            nome = (cli.get('nome') or 'SEM NOME')[:100]
            fantasia = (cli.get('fantasia') or nome)[:100]
            telefone = (cli.get('telefone') or '')[:20]
            celular = (cli.get('celular') or '')[:20]
            email = (cli.get('email') or '')[:100]
            endereco = (cli.get('endereco') or '')[:100]
            numero = (cli.get('numero') or '')[:10]
            bairro = (cli.get('bairro') or '')[:50]
            cidade = (cli.get('cidade') or '')[:50]
            uf = (cli.get('uf') or 'SP')[:2]
            cep = (cli.get('cep') or '')[:10]
            ativo = 'S' if cli.get('deleted') in [None, 'f', 'false', False] else 'N'

            cur.execute("""
                INSERT INTO CAD_PESSOA (
                    CODIGO, EMPRESA, TIPO, NATUREZA, NOME, NOME_FANTASIA,
                    CPF_CNPJ, FONE, CELULAR, EMAIL,
                    ENDERECO, NUMERO, BAIRRO, NOMECIDADE, UF, CEP,
                    ATIVO, DATA
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                codigo, 1, 'C', natureza, nome, fantasia,
                documento[:20], telefone, celular, email,
                endereco, numero, bairro, cidade, uf, cep,
                ativo, datetime.now().strftime('%Y-%m-%d')
            ])

            sucesso += 1
            if sucesso % 500 == 0:
                print(f"{sucesso} clientes migrados...")

        except Exception as erro:
            erros += 1
            if erros <= 5:
                erros_detalhes.append(f"Cliente {cli.get('idcliente')}: {erro}")

    con.commit()
    print(f"Clientes: {sucesso} migrados, {erros} erros")
    if erros_detalhes:
        print("\nPrimeiros erros:")
        for erro in erros_detalhes:
            print(f"  - {erro}")

def executar_migracao():
    try:
        # Parsear dump
        dados = parsear_dump()

        print(f"\nDados encontrados:")
        print(f"- Fornecedores: {len(dados['fornecedores']):,}")
        print(f"- Clientes: {len(dados['clientes']):,}")

        # Conectar ao Firebird
        print("\nConectando ao Firebird...")
        con = fdb.connect(**fbConfig)
        print("[OK] Conectado!\n")

        # Migrar
        if dados['fornecedores']:
            migrar_fornecedores(con, dados['fornecedores'])

        if dados['clientes']:
            migrar_clientes(con, dados['clientes'])

        # Verificar total
        cur = con.cursor()
        cur.execute("SELECT COUNT(*) FROM CAD_PESSOA")
        total = cur.fetchone()[0]
        print(f"\n[OK] Total de pessoas na tabela CAD_PESSOA: {total:,}")

        con.close()
        print("\n=== MIGRACAO DE PESSOAS CONCLUIDA ===")

    except Exception as erro:
        print(f"\n[ERRO] {erro}")
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == '__main__':
    executar_migracao()
