#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica pedidos específicos através da view VW_RPT_PEDIDOSVENDAS
"""

import sys, codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

print("="*100)
print("VERIFICANDO PEDIDOS ATRAVÉS DA VIEW VW_RPT_PEDIDOSVENDAS")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

# Pedidos que aparecem no relatório
pedidos_verificar = [54216, 54257, 54261, 54272, 54276]

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    print("\n>> Buscando pedidos através da view (como o relatório faz):")
    print("-"*100)

    print(f"{'CODIGO':<10} {'VLR_TOTAL (VIEW)':<20} {'VLR_TOTAL (R$)':<20} {'RELATORIO MOSTRA'}")
    print("-"*100)

    for codigo in pedidos_verificar:
        cur.execute("""
            SELECT CODIGO, VLR_TOTAL, VLR_PRODUTO, VLR_FRETE
            FROM VW_RPT_PEDIDOSVENDAS
            WHERE CODIGO = ?
        """, [codigo])

        row = cur.fetchone()

        if row:
            cod, vlr_total, vlr_produto, vlr_frete = row

            # Valor bruto (como vem da view)
            vlr_total_bruto = vlr_total if vlr_total else 0
            vlr_total_reais = float(vlr_total_bruto) / 100

            # O relatório FastReport está mostrando o valor bruto SEM dividir por 100
            vlr_relatorio_errado = vlr_total_bruto

            print(f"{cod:<10} {vlr_total_bruto:<20,} R$ {vlr_total_reais:>15,.2f}  R$ {float(vlr_relatorio_errado):>,.2f}")

    print("\n>> PROBLEMA IDENTIFICADO:")
    print("-"*100)
    print("  A VIEW retorna VLR_TOTAL em CENTAVOS (correto)")
    print("  O relatório FastReport (.fr3) está exibindo esse valor DIRETAMENTE")
    print("  SEM fazer a divisão por 100!")
    print()
    print(">> SOLUÇÃO:")
    print("-"*100)
    print("  Opção 1: MODIFICAR A VIEW para já retornar em reais")
    print("           ALTER VIEW VW_RPT_PEDIDOSVENDAS ...")
    print("           COALESCE(ped.vlr_total, 0) / 100.0 AS VLR_TOTAL")
    print()
    print("  Opção 2: MODIFICAR O TEMPLATE FASTREPORT (.fr3)")
    print("           Editar o arquivo .fr3 para dividir os valores por 100")
    print("           [VLR_TOTAL] / 100")
    print()
    print("  Recomendação: OPÇÃO 1 (modificar a view)")
    print("  Motivo: Mais simples, afeta todos os relatórios automaticamente")

    # Criar script SQL para corrigir a view
    print("\n>> Gerando script SQL de correção...")

    sql_correcao = """-- SCRIPT DE CORREÇÃO DA VIEW VW_RPT_PEDIDOSVENDAS
-- Este script modifica a view para retornar valores em REAIS ao invés de CENTAVOS

ALTER VIEW VW_RPT_PEDIDOSVENDAS AS
SELECT
  ped.codigo AS CODIGO,
  ped.empresa AS EMPRESA,
  ped.data AS DATA,
  ped.data_entrega AS DATA_ENTREGA,
  ped.faturadodata AS FATURADODATA,
  ped.hora AS HORA,
  ped.hora_entrega AS HORA_ENTREGA,
  ped.tipo AS TIPO,
  ped.aprovado AS APROVADO,
  ped.situacao AS SITUACAO,
  ped.faturado AS FATURADO,
  ped.cliente AS CLIENTE,
  cli.nome AS NOME,
  cli.cpf_cnpj AS CPF_CNPJ,
  cli.rg_ie AS RG_IE,
  cli.endereco AS ENDERECO,
  cli.numero AS NUMERO,
  cli.bairro AS BAIRRO,
  cli.cep AS CEP,
  cli.nomecidade AS NOMECIDADE,
  cli.uf AS UF,
  cli.fone AS FONE,
  cli.contato AS CONTATO,
  cli.email AS EMAIL,
  cli.site AS SITE,
  ped.vendedor AS VENDEDOR,
  ved.nome AS NOME,
  ped.transportadora AS TRANSPORTADORA,
  tra.nome AS NOME,
  ped.contato_entrega AS CONTATO_ENTREGA,
  ped.formapagto AS FORMAPAGTO,
  pag.nome AS NOME,
  pag.idgrupopagto AS IDGRUPOPAGTO,
  ped.tabela AS TABELA,
  prc.nome AS NOME,
  COALESCE((SELECT COUNT(pitem.codigo) FROM pedidos_itens pitem WHERE pitem.codigo = ped.codigo), 0) AS Name_exp_36,
  COALESCE(ped.vlr_produtos, 0) / 100.0 AS VLR_PRODUTOS,
  COALESCE(ped.vlr_desconto, 0) / 100.0 AS VLR_DESCONTO,
  COALESCE(ped.vlrfrete, 0) / 100.0 AS VLRFRETE,
  COALESCE(ped.vlr_total, 0) / 100.0 AS VLR_TOTAL,
  ped.observacao AS OBSERVACAO,
  ped.idusuario_origem AS IDUSUARIO_ORIGEM,
  ped.idusuario_alterou AS IDUSUARIO_ALTEROU,
  'PEDIDO: '||CAST(PED.CODIGO AS VARCHAR(15)) ||' (CLIENTE: '||CLI.NOME||' - CNPJ: '||CLI.CPF_CNPJ||')'  AS TITULO
FROM (((((pedidos ped
  LEFT JOIN cad_pessoa cli ON ((cli.codigo = ped.cliente)))
  LEFT JOIN cad_pessoa ved ON ((ved.codigo = ped.vendedor)))
  LEFT JOIN cad_pessoa tra ON ((tra.codigo = ped.transportadora)))
  LEFT JOIN cad_finalizadorpagto pag ON ((pag.codigo = ped.formapagto)))
  LEFT JOIN cad_preco prc ON ((prc.codigo = ped.tabela)));
"""

    # Salvar script
    with open(r'c:\Projeto\Academia\corrigir-view-pedidos.sql', 'w', encoding='utf-8') as f:
        f.write(sql_correcao)

    print("  ✓ Script salvo em: c:\\Projeto\\Academia\\corrigir-view-pedidos.sql")
    print()
    print(">> COMO APLICAR A CORREÇÃO:")
    print("-"*100)
    print("  1. Abra o IBExpert ou FlameRobin")
    print("  2. Conecte no banco C:\\QRSistema\\db\\QRSISTEMA.FDB")
    print("  3. Execute o script corrigir-view-pedidos.sql")
    print("  4. Teste o relatório novamente")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
