#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica os pedidos que aparecem no relatório
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
print("VERIFICANDO PEDIDOS DO RELATORIO")
print("="*100)

fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # Pedidos do relatório
    pedidos_verificar = [54216, 54224, 54223, 54222, 54224, 54228, 54226, 54227,
                         54225, 54231, 54230, 54242, 54240, 54237, 54235, 54239,
                         54257, 54248, 54246, 54244, 54245, 54258, 54247, 54250,
                         54251, 54243, 54253, 54255, 54254, 54259, 54256, 54275,
                         54276, 54261, 54267, 54268, 54263, 54272, 54265, 54270,
                         54274, 54262, 54271, 54284, 54286]

    print("\n>> Verificando valores no Firebird:")
    print("-"*100)

    print(f"{'CODIGO':<10} {'VLR_TOTAL (BRUTO)':<20} {'VLR_TOTAL (R$)':<20} {'RELATORIO MOSTRA'}")
    print("-"*100)

    for codigo in pedidos_verificar[:20]:  # Primeiros 20
        cur.execute("""
            SELECT CODIGO, VLR_TOTAL
            FROM PEDIDOS
            WHERE CODIGO = ?
        """, [codigo])

        row = cur.fetchone()
        if row:
            cod, vlr_total_bruto = row
            vlr_total_reais = float(vlr_total_bruto) / 100 if vlr_total_bruto else 0

            # O relatório está mostrando o valor bruto (em centavos) como se fosse em reais
            vlr_relatorio = vlr_total_bruto  # Sem divisão!

            print(f"{cod:<10} {vlr_total_bruto:<20,} R$ {vlr_total_reais:>15,.2f}  R$ {float(vlr_relatorio):>,.2f}")

    print("\n>> PROBLEMA IDENTIFICADO:")
    print("-"*100)
    print("  O relatório está exibindo VLR_TOTAL SEM dividir por 100!")
    print("  Os valores no banco estão CORRETOS (em centavos)")
    print("  Mas o relatório mostra eles como se fossem reais")
    print("\n  Exemplo:")
    print("    Banco: 1131201 centavos = R$ 11.312,01")
    print("    Relatório mostra: R$ 1.131.201,00 (ERRADO!)")

    print("\n>> SOLUCAO:")
    print("-"*100)
    print("  O problema está no código do relatório!")
    print("  Precisa dividir VLR_TOTAL por 100 antes de exibir")
    print("  Ou usar CAST(VLR_TOTAL AS DECIMAL(15,2)) / 100")

    # Verificar onde está o código do relatório
    print("\n>> Procurando código do relatório...")

    import os

    # Procurar arquivo do servidor
    servidor_path = r'c:\Projeto\Academia\server'

    if os.path.exists(servidor_path):
        print(f"  Diretório do servidor encontrado: {servidor_path}")

        # Procurar arquivos relacionados a relatórios ou pedidos
        for root, dirs, files in os.walk(servidor_path):
            for file in files:
                if any(keyword in file.lower() for keyword in ['relatorio', 'pedido', 'venda', 'report']):
                    filepath = os.path.join(root, file)
                    relpath = os.path.relpath(filepath, r'c:\Projeto\Academia')
                    print(f"    - {relpath}")

    con.close()

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*100)
