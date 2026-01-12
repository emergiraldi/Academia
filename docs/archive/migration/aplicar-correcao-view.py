#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Aplica a correção na view VW_RPT_PEDIDOSVENDAS
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
print("APLICANDO CORREÇÃO NA VIEW VW_RPT_PEDIDOSVENDAS")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

sql_alter_view = """
CREATE OR ALTER VIEW VW_RPT_PEDIDOSVENDAS AS
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
  LEFT JOIN cad_preco prc ON ((prc.codigo = ped.tabela)))
"""

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    print("\n>> Aplicando alteração na view...")
    print("   (Dividindo VLR_TOTAL, VLR_PRODUTOS, VLR_DESCONTO e VLRFRETE por 100)")

    cur.execute(sql_alter_view)
    con.commit()

    print("   ✓ View alterada com sucesso!")

    # Verificar os valores após a alteração
    print("\n>> Verificando valores após a correção:")
    print("-"*100)

    pedidos_teste = [54216, 54257, 54261, 54272, 54276]

    print(f"{'CODIGO':<10} {'ANTES (centavos)':<20} {'DEPOIS (reais)':<20} {'STATUS'}")
    print("-"*100)

    for codigo in pedidos_teste:
        cur.execute("""
            SELECT VLR_TOTAL FROM VW_RPT_PEDIDOSVENDAS WHERE CODIGO = ?
        """, [codigo])

        row = cur.fetchone()
        if row:
            vlr_total_view = row[0] if row[0] else 0

            # Buscar valor original da tabela (em centavos)
            cur.execute("SELECT VLR_TOTAL FROM PEDIDOS WHERE CODIGO = ?", [codigo])
            row_orig = cur.fetchone()
            vlr_total_orig = row_orig[0] if row_orig and row_orig[0] else 0

            vlr_orig_reais = float(vlr_total_orig) / 100

            # Verificar se está correto
            diferenca = abs(vlr_total_view - vlr_orig_reais)
            status = "✓ OK" if diferenca < 0.01 else "✗ ERRO"

            print(f"{codigo:<10} {vlr_total_orig:>15,}     R$ {vlr_total_view:>15,.2f}  {status}")

    con.close()

    print("\n" + "="*100)
    print("CORREÇÃO APLICADA COM SUCESSO!")
    print("="*100)
    print("\nAgora o relatório vai exibir os valores corretos em REAIS.")
    print("Teste abrindo o relatório no sistema QRSistema.")

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
