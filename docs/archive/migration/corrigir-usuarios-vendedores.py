#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Corrige os nomes dos usuários e marca vendedores corretamente
"""

import sys, codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

try:
    import fdb
except ImportError:
    print("[ERRO] Biblioteca 'fdb' nao encontrada!")
    exit(1)

def parse_linha(linha):
    return linha.split('\t')

print("="*100)
print("CORRIGINDO USUARIOS E VENDEDORES")
print("="*100)

# Ler dados do PostgreSQL
with open(r'c:\Projeto\Academia\funcionarios-usuarios.sql', 'r', encoding='latin1') as f:
    conteudo = f.read()

linhas = conteudo.split('\n')

# Ler funcionarios do PostgreSQL
print("\n>> Lendo funcionarios do PostgreSQL...")
lendo_funcionarios = False
funcionarios_pg = {}

for linha in linhas:
    if 'COPY public.funcionarios' in linha:
        lendo_funcionarios = True
        continue
    if linha.strip() == '\\.':
        lendo_funcionarios = False
        if funcionarios_pg:
            break
    if lendo_funcionarios and linha.strip():
        campos = parse_linha(linha.strip())
        idfunc = int(campos[0])
        nome = campos[1] if campos[1] != '\\N' else None
        nome_completo = campos[2] if campos[2] != '\\N' else None
        idcargo = int(campos[3]) if campos[3] != '\\N' else None

        funcionarios_pg[idfunc] = {
            'nome': nome_completo or nome or f'Funcionario {idfunc}',
            'nome_curto': nome or nome_completo or f'Func {idfunc}',
            'idcargo': idcargo
        }

print(f"Total de funcionarios encontrados: {len(funcionarios_pg):,}")

# Ler usuarios do PostgreSQL
print("\n>> Lendo usuarios do PostgreSQL...")
lendo_usuarios = False
usuarios_pg = {}

for linha in linhas:
    if 'COPY public.usuarios' in linha:
        lendo_usuarios = True
        continue
    if linha.strip() == '\\.':
        lendo_usuarios = False
        if usuarios_pg:
            break
    if lendo_usuarios and linha.strip():
        campos = parse_linha(linha.strip())
        idusuario = int(campos[0])
        idfuncionario = int(campos[2]) if campos[2] != '\\N' else None

        usuarios_pg[idusuario] = {
            'idfuncionario': idfuncionario
        }

print(f"Total de usuarios encontrados: {len(usuarios_pg):,}")

# Conectar ao Firebird
fbConfig = {
    'database': r'C:\QRSistema\db\QRSISTEMA.FDB',
    'user': 'sysdba',
    'password': 'masterkey'
}

try:
    con = fdb.connect(**fbConfig)
    cur = con.cursor()

    # ==================== PASSO 1: CORRIGIR NOMES DOS USUARIOS ====================
    print("\n>> PASSO 1: CORRIGINDO NOMES DOS USUARIOS")
    print("-"*100)

    usuarios_corrigidos = 0
    usuarios_nao_encontrados = 0

    for idusuario, user_info in usuarios_pg.items():
        idfuncionario = user_info['idfuncionario']

        if not idfuncionario or idfuncionario not in funcionarios_pg:
            usuarios_nao_encontrados += 1
            continue

        func_info = funcionarios_pg[idfuncionario]
        nome_completo = func_info['nome'][:100]
        nome_abrev = func_info['nome_curto'][:20]

        # Atualizar o usuario
        cur.execute("""
            UPDATE USUARIO
            SET NOME = ?, NOMEABREVIADO = ?
            WHERE CODIGO = ?
        """, [nome_completo, nome_abrev, idusuario])

        if cur.rowcount > 0:
            usuarios_corrigidos += 1
            if usuarios_corrigidos <= 10:
                print(f"  Usuario {idusuario}: {nome_completo}")

    con.commit()
    print(f"\n  Usuarios corrigidos: {usuarios_corrigidos}")
    print(f"  Usuarios nao encontrados: {usuarios_nao_encontrados}")

    # ==================== PASSO 2: MARCAR VENDEDORES ====================
    print("\n>> PASSO 2: MARCANDO VENDEDORES (CARGO=6)")
    print("-"*100)

    # Primeiro, criar um mapeamento de funcionário PG -> Firebird
    # Precisamos verificar quais funcionários com cargo 6 existem no Firebird

    vendedores_marcados = 0

    for idfunc, func_info in funcionarios_pg.items():
        if func_info['idcargo'] == 6:  # VENDEDOR
            # Verificar se este funcionário existe no Firebird
            cur.execute("""
                SELECT CODIGO, NOME, TIPO
                FROM CAD_PESSOA
                WHERE CODIGO = ? AND TIPO = 'FUNCIONARIO'
            """, [idfunc])

            row = cur.fetchone()
            if row:
                codigo, nome, tipo_atual = row

                # Atualizar para VENDEDOR
                cur.execute("""
                    UPDATE CAD_PESSOA
                    SET TIPO = 'VENDEDOR'
                    WHERE CODIGO = ?
                """, [codigo])

                vendedores_marcados += 1
                if vendedores_marcados <= 10:
                    print(f"  {codigo}: {nome[:50]} -> VENDEDOR")

    con.commit()
    print(f"\n  Total de vendedores marcados: {vendedores_marcados}")

    # Mostrar estatísticas finais
    print("\n>> ESTATISTICAS FINAIS:")
    print("-"*100)

    # Usuários
    cur.execute("SELECT COUNT(*) FROM USUARIO WHERE NOME LIKE 'USUARIO_%'")
    usuarios_genericos = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM USUARIO WHERE NOME NOT LIKE 'USUARIO_%'")
    usuarios_com_nome = cur.fetchone()[0]

    print(f"\nUSUARIOS:")
    print(f"  Com nome generico (USUARIO_X): {usuarios_genericos}")
    print(f"  Com nome real: {usuarios_com_nome}")

    # Vendedores
    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'VENDEDOR'")
    total_vendedores = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM CAD_PESSOA WHERE TIPO = 'FUNCIONARIO'")
    total_funcionarios = cur.fetchone()[0]

    print(f"\nPESSOAS:")
    print(f"  Vendedores: {total_vendedores}")
    print(f"  Funcionarios: {total_funcionarios}")

    # Mostrar alguns exemplos de usuários corrigidos
    print("\n>> EXEMPLOS DE USUARIOS CORRIGIDOS:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            U.CODIGO, U.NOME, U.USERNAME, U.CARGO
        FROM USUARIO U
        WHERE U.NOME NOT LIKE 'USUARIO_%' AND U.NOME NOT LIKE 'Emerson%' AND U.NOME NOT LIKE 'PISOS%'
        ORDER BY U.CODIGO
    """)

    print(f"{'CODIGO':<10} {'NOME':<40} {'USERNAME':<15} {'CARGO'}")
    print("-"*100)

    for row in cur.fetchall():
        codigo, nome, username, cargo = row
        nome_str = nome[:40] if nome else ""
        user_str = username[:15] if username else ""
        cargo_str = str(cargo) if cargo else ""
        print(f"{codigo:<10} {nome_str:<40} {user_str:<15} {cargo_str}")

    # Mostrar alguns exemplos de vendedores
    print("\n>> EXEMPLOS DE VENDEDORES:")
    print("-"*100)

    cur.execute("""
        SELECT FIRST 10
            CODIGO, NOME
        FROM CAD_PESSOA
        WHERE TIPO = 'VENDEDOR'
        ORDER BY CODIGO
    """)

    for row in cur.fetchall():
        codigo, nome = row
        print(f"  {codigo}: {nome[:50]}")

    con.close()

    print("\n" + "="*100)
    print("CORRECAO CONCLUIDA!")
    print("="*100)

except Exception as e:
    print(f"\n[ERRO] {e}")
    import traceback
    traceback.print_exc()
