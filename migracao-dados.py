#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de migração PostgreSQL -> Firebird
"""

import sys
import codecs
import re
from datetime import datetime

# Forçar UTF-8 no Windows
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    print("       Instale com: pip install fdb")
    exit(1)

print("=== MIGRACAO POSTGRESQL -> FIREBIRD ===\n")

# Configuração Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

# Função para limpar timezone das datas
def limpar_data(data_str):
    """Remove timezone de strings de data do PostgreSQL"""
    if not data_str or data_str == '\\N':
        return None
    # Remove timezone (ex: "2022-06-13 00:00:00-03" -> "2022-06-13 00:00:00")
    data_limpa = re.sub(r'([0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2})[-+][0-9]{2}', r'\1', data_str)
    # Remove apenas a data se tiver formato YYYY-MM-DD HH:MM:SS
    # Firebird DATE aceita apenas YYYY-MM-DD
    if ' ' in data_limpa:
        return data_limpa.split(' ')[0]
    return data_limpa

# Função para ler e parsear o dump SQL
def parsear_dump_sql(arquivo_dump):
    print("Lendo dump SQL...")

    with open(arquivo_dump, 'r', encoding='latin1') as f:
        conteudo = f.read()

    dados = {
        'produtos': [],
        'contas_pagar': [],
        'contas_receber': [],
        'creditos': []
    }

    # Processar linha por linha
    linhas = conteudo.split('\n')
    tabela_atual = None
    colunas_atuais = []
    lendo_dados = False
    linha_num = 0

    for linha in linhas:
        linha_num += 1

        # Detectar início de COPY
        match_copy = re.match(r'COPY public\.(\w+)\s+\((.*?)\)\s+FROM stdin;', linha)
        if match_copy:
            tabela_atual = match_copy.group(1)
            colunas_atuais = [c.strip() for c in match_copy.group(2).split(',')]
            lendo_dados = True
            print(f"Encontrado: {tabela_atual} com {len(colunas_atuais)} colunas (linha {linha_num})")
            continue

        # Detectar fim de dados - apenas backslash seguido de ponto
        if linha == '\\.' or linha.strip() == '\\.':
            if lendo_dados and tabela_atual:
                if tabela_atual == 'produtos':
                    print(f"  -> {tabela_atual}: {len(dados['produtos'])} registros lidos")
                elif tabela_atual == 'conta_pagar':
                    print(f"  -> {tabela_atual}: {len(dados['contas_pagar'])} registros lidos")
                elif tabela_atual == 'creditos':
                    print(f"  -> {tabela_atual}: {len(dados['creditos'])} registros lidos")
                elif tabela_atual == 'documentos':
                    print(f"  -> {tabela_atual}: {len(dados['contas_receber'])} registros lidos")
            lendo_dados = False
            tabela_atual = None
            colunas_atuais = []
            continue

        # Ler dados
        if lendo_dados and tabela_atual and linha:
            valores = linha.split('\t')

            if tabela_atual == 'produtos':
                produto = {}
                for idx, col in enumerate(colunas_atuais):
                    produto[col] = None if valores[idx] == '\\N' else valores[idx]
                dados['produtos'].append(produto)

            elif tabela_atual == 'conta_pagar':
                conta = {}
                for idx, col in enumerate(colunas_atuais):
                    conta[col] = None if valores[idx] == '\\N' else valores[idx]
                dados['contas_pagar'].append(conta)

            elif tabela_atual == 'creditos':
                credito = {}
                for idx, col in enumerate(colunas_atuais):
                    credito[col] = None if valores[idx] == '\\N' else valores[idx]
                dados['creditos'].append(credito)

            elif tabela_atual == 'documentos':
                documento = {}
                for idx, col in enumerate(colunas_atuais):
                    documento[col] = None if valores[idx] == '\\N' else valores[idx]
                dados['contas_receber'].append(documento)

    return dados

# Função para migrar produtos
def migrar_produtos(con, produtos):
    print(f"\nIniciando migracao de {len(produtos)} produtos...")
    cur = con.cursor()
    sucesso = 0
    erros = 0

    for produto in produtos:
        try:
            # Tabela: CAD_PRODUTOS no Firebird
            ativo = 'S' if produto.get('deleted') in [None, 'f', 'false'] else 'N'
            preco_venda = int(float(produto.get('prevenda') or 0) * 100)  # Centavos
            data_atual = datetime.now().strftime('%Y-%m-%d')

            # Unidade do produto
            unidade = (produto.get('unpro') or 'UN')[:3].upper()

            # NCM do produto
            ncm_valor = produto.get('idncm') or produto.get('ncm_id')
            if ncm_valor and ncm_valor != '\\N' and str(ncm_valor).strip():
                ncm = str(ncm_valor).replace('.', '').replace(' ', '')[:10]
            else:
                ncm = None

            # Outros campos importantes
            peso = float(produto.get('peso') or 0)
            marca_id = produto.get('marca_id')
            if marca_id and marca_id != '\\N':
                try:
                    marca_id = int(marca_id)
                except:
                    marca_id = None
            else:
                marca_id = None

            cur.execute("""
                INSERT INTO CAD_PRODUTOS (
                    CODIGO, EMPRESA, NOME, CODIGO_BARRA,
                    PRC_VENDA, PRC_CUSTO, ESTOQUESALDO, ATIVO,
                    DATA, UNIDADE, CONTROLAESTOQUE, TABELA_NCM,
                    PESO, MARCA_ID
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                int(produto['idproduto']),
                1,  # EMPRESA
                (produto.get('descricao') or '')[:200],
                (produto.get('ean') or '')[:30],
                preco_venda,
                0,  # PRC_CUSTO
                0,  # ESTOQUESALDO
                ativo,
                data_atual,
                unidade,
                'S',
                ncm,
                peso,
                marca_id
            ])

            sucesso += 1
            if sucesso % 100 == 0:
                print(f"{sucesso} produtos migrados...")

        except Exception as erro:
            erros += 1
            print(f"Erro ao migrar produto {produto.get('idproduto')}: {erro}")

    con.commit()
    print(f"Produtos: {sucesso} migrados com sucesso, {erros} erros")

# Função para migrar contas a pagar
def migrar_contas_pagar(con, contas):
    print(f"\nIniciando migracao de {len(contas)} contas a pagar...")
    cur = con.cursor()
    sucesso = 0
    erros = 0

    for conta in contas:
        try:
            quitado = 'S' if conta.get('pago') in ['t', 'true', True] else 'N'
            valor = int(float(conta.get('valor') or 0) * 100)
            data_atual = datetime.now().strftime('%Y-%m-%d')

            cur.execute("""
                INSERT INTO FIN_CTAPAGAR (
                    EMPRESA, FORNECEDOR, DOCUMENTO, VENCIMENTO,
                    VALOR, QUITADO, DATA_EMISSAO, DATA,
                    HISTORICO, VALOR_SALDO, SITUACAO
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                1,  # EMPRESA
                int(conta.get('fornecedor_id') or 0),
                (conta.get('documento') or '')[:30],
                limpar_data(conta.get('data_vencimento')),
                valor,
                quitado,
                limpar_data(conta.get('data_emissao')) or data_atual,
                data_atual,
                (conta.get('observacao') or '')[:5000],
                0 if quitado == 'S' else valor,
                'QUITADA' if quitado == 'S' else 'ABERTA'
            ])

            sucesso += 1
            if sucesso % 50 == 0:
                print(f"{sucesso} contas a pagar migradas...")

        except Exception as erro:
            erros += 1
            print(f"Erro ao migrar conta {conta.get('id')}: {erro}")

    con.commit()
    print(f"Contas a pagar: {sucesso} migradas com sucesso, {erros} erros")

# Função para migrar contas a receber
def migrar_contas_receber(con, documentos, creditos):
    print(f"\nIniciando migracao de {len(documentos)} contas a receber...")
    cur = con.cursor()
    sucesso = 0
    erros = 0

    for doc in documentos:
        try:
            quitado = 'S' if doc.get('status') == 'B' else 'N'
            valor = int(float(doc.get('valor') or 0) * 100)
            valor_pago = int(float(doc.get('valorpago') or 0) * 100)
            data_atual = datetime.now().strftime('%Y-%m-%d')

            cur.execute("""
                INSERT INTO FIN_CTARECEBER (
                    EMPRESA, CLIENTE, VENCIMENTO, VALOR,
                    VALOR_PAGO, VALOR_SALDO, PARCELA, QUITADO,
                    DATA, DATA_EMISSAO, SITUACAO
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                1,  # EMPRESA
                int(doc.get('idcliente') or 0) + 100000,  # Offset para clientes
                limpar_data(doc.get('vencimento')),
                valor,
                valor_pago,
                0 if quitado == 'S' else (valor - valor_pago),
                int(doc.get('parcela') or 1),
                quitado,
                data_atual,
                limpar_data(doc.get('data')) or data_atual,
                'QUITADA' if quitado == 'S' else 'ABERTA'
            ])

            sucesso += 1
            if sucesso % 50 == 0:
                print(f"{sucesso} contas a receber migradas...")

        except Exception as erro:
            erros += 1
            print(f"Erro ao migrar documento {doc.get('iddocumento')}: {erro}")

    con.commit()
    print(f"Contas a receber: {sucesso} migradas com sucesso, {erros} erros")

    # Migrar créditos
    if creditos:
        print(f"\nIniciando migracao de {len(creditos)} creditos...")
        print("Obs: Creditos serao migrados como contas a receber com historico especial")
        sucesso = 0
        erros = 0

        for credito in creditos:
            try:
                valor = int(float(credito.get('valor') or 0) * 100)
                saldo = int(float(credito.get('saldo') or 0) * 100)
                data_atual = datetime.now().strftime('%Y-%m-%d')

                cur.execute("""
                    INSERT INTO FIN_CTARECEBER (
                        EMPRESA, CLIENTE, DATA, VENCIMENTO, VALOR,
                        VALOR_SALDO, QUITADO, HISTORICO, SITUACAO
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, [
                    1,
                    int(credito.get('idcliente') or 0) + 100000,  # Offset para clientes
                    limpar_data(credito.get('data')) or data_atual,
                    limpar_data(credito.get('data')) or data_atual,
                    -valor,  # Negativo = crédito
                    -saldo,
                    'S' if saldo == 0 else 'N',
                    f"CREDITO: {credito.get('obs') or 'Migrado do sistema anterior'}"[:5000],
                    'QUITADA' if saldo == 0 else 'ABERTA'
                ])

                sucesso += 1

            except Exception as erro:
                erros += 1
                print(f"Erro ao migrar credito {credito.get('idcredito')}: {erro}")

        con.commit()
        print(f"Creditos: {sucesso} migrados com sucesso, {erros} erros")

# Função principal
def executar_migracao():
    try:
        # Ler dados do dump SQL extraído
        arquivo_dump = r'c:\Projeto\Academia\dados-extraidos.sql'
        print("Parseando dump SQL...")
        dados = parsear_dump_sql(arquivo_dump)

        print(f"\nDados encontrados no dump:")
        print(f"- Produtos: {len(dados['produtos'])}")
        print(f"- Contas a pagar: {len(dados['contas_pagar'])}")
        print(f"- Contas a receber: {len(dados['contas_receber'])}")
        print(f"- Creditos: {len(dados['creditos'])}")

        if not any([dados['produtos'], dados['contas_pagar'], dados['contas_receber'], dados['creditos']]):
            print("\nNenhum dado encontrado no dump. Verifique o arquivo.")
            return

        # Conectar ao Firebird
        print("\nConectando ao Firebird...")
        con = fdb.connect(**fbConfig)
        print("[OK] Conectado ao Firebird com sucesso!")

        # Executar migrações
        if dados['produtos']:
            migrar_produtos(con, dados['produtos'])

        if dados['contas_pagar']:
            migrar_contas_pagar(con, dados['contas_pagar'])

        if dados['contas_receber'] or dados['creditos']:
            migrar_contas_receber(con, dados['contas_receber'], dados['creditos'])

        # Fechar conexão
        con.close()
        print("\n=== MIGRACAO CONCLUIDA ===")

    except Exception as erro:
        print(f"\n[ERRO] Erro durante a migracao: {erro}")
        import traceback
        traceback.print_exc()
        exit(1)

# Executar
if __name__ == '__main__':
    executar_migracao()
