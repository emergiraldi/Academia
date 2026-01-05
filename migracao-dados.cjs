const { Client } = require('pg');
const Firebird = require('node-firebird');
const fs = require('fs');

// Configurações de conexão
const pgConfig = {
  // Vamos conectar ao dump SQL ao invés de um banco ativo
  // Usaremos o dump como fonte de dados
};

// Conexão local sem network (embedded mode)
const fbConfig = {
  database: 'C:\\QRSistema\\db\\QRSISTEMA.FDB',
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false,
  role: null,
  pageSize: 4096
};

// Função para ler dados do dump SQL
function parsearDumpSQL(arquivoDump) {
  console.log('Lendo dump SQL...');
  const conteudo = fs.readFileSync(arquivoDump, 'latin1');

  const dados = {
    produtos: [],
    contasPagar: [],
    contasReceber: [],
    creditos: []
  };

  // Processar linha por linha
  const linhas = conteudo.split('\n');
  let tabelaAtual = null;
  let colunasAtuais = [];
  let lendoDados = false;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];

    // Detectar início de COPY
    const matchCopy = linha.match(/COPY public\.(\w+)\s+\((.*?)\)\s+FROM stdin;/);
    if (matchCopy) {
      tabelaAtual = matchCopy[1];
      colunasAtuais = matchCopy[2].split(',').map(c => c.trim());
      lendoDados = true;
      console.log(`Encontrado: ${tabelaAtual} com ${colunasAtuais.length} colunas`);
      continue;
    }

    // Detectar fim de dados (backslash ponto)
    if (linha.trim() === '\\.') {
      lendoDados = false;
      tabelaAtual = null;
      colunasAtuais = [];
      continue;
    }

    // Ler dados
    if (lendoDados && tabelaAtual && linha.trim()) {
      const valores = linha.split('\t');

      if (tabelaAtual === 'produtos') {
        const produto = {};
        colunasAtuais.forEach((col, idx) => {
          produto[col] = valores[idx] === '\\N' ? null : valores[idx];
        });
        dados.produtos.push(produto);
      }
      else if (tabelaAtual === 'conta_pagar') {
        const conta = {};
        colunasAtuais.forEach((col, idx) => {
          conta[col] = valores[idx] === '\\N' ? null : valores[idx];
        });
        dados.contasPagar.push(conta);
      }
      else if (tabelaAtual === 'creditos') {
        const credito = {};
        colunasAtuais.forEach((col, idx) => {
          credito[col] = valores[idx] === '\\N' ? null : valores[idx];
        });
        dados.creditos.push(credito);
      }
      else if (tabelaAtual === 'documentos') {
        const documento = {};
        colunasAtuais.forEach((col, idx) => {
          documento[col] = valores[idx] === '\\N' ? null : valores[idx];
        });
        dados.contasReceber.push(documento);
      }
    }
  }

  return dados;
}

// Função para migrar produtos
async function migrarProdutos(db, produtos) {
  console.log(`\nIniciando migração de ${produtos.length} produtos...`);
  let sucesso = 0;
  let erros = 0;

  for (const produto of produtos) {
    try {
      // Tabela: CAD_PRODUTOS no Firebird
      const ativo = (produto.deleted === 'f' || produto.deleted === false) ? 'S' : 'N';
      const precoVenda = Math.round((parseFloat(produto.prevenda) || 0) * 100); // Converter para centavos
      const dataAtual = new Date().toISOString().split('T')[0];

      await new Promise((resolve, reject) => {
        db.query(`
          INSERT INTO CAD_PRODUTOS (
            CODIGO, EMPRESA, NOME, CODIGO_BARRA,
            PRC_VENDA, PRC_CUSTO, ESTOQUESALDO, ATIVO,
            DATA, UNIDADE, CONTROLAESTOQUE
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          produto.idproduto,
          1, // EMPRESA (fixo 1 - ajuste se necessário)
          (produto.descricao || '').substring(0, 200), // Limite 200 caracteres
          (produto.ean || '').substring(0, 30), // Limite 30 caracteres
          precoVenda,
          0, // PRC_CUSTO - será preenchido depois
          0, // ESTOQUESALDO inicial
          ativo,
          dataAtual,
          'UN', // UNIDADE padrão
          'S' // CONTROLAESTOQUE
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      sucesso++;
      if (sucesso % 100 === 0) {
        console.log(`${sucesso} produtos migrados...`);
      }
    } catch (erro) {
      erros++;
      console.error(`Erro ao migrar produto ${produto.idproduto}: ${erro.message}`);
    }
  }

  console.log(`Produtos: ${sucesso} migrados com sucesso, ${erros} erros`);
}

// Função para migrar contas a pagar
async function migrarContasPagar(db, contas) {
  console.log(`\nIniciando migração de ${contas.length} contas a pagar...`);
  let sucesso = 0;
  let erros = 0;

  for (const conta of contas) {
    try {
      // Tabela: FIN_CTAPAGAR no Firebird
      const quitado = (conta.pago === 't' || conta.pago === true) ? 'S' : 'N';
      const valor = Math.round((parseFloat(conta.valor) || 0) * 100); // Converter para centavos
      const dataAtual = new Date().toISOString().split('T')[0];

      await new Promise((resolve, reject) => {
        db.query(`
          INSERT INTO FIN_CTAPAGAR (
            EMPRESA, FORNECEDOR, DOCUMENTO, VENCIMENTO,
            VALOR, QUITADO, DATA_EMISSAO, DATA,
            HISTORICO, VALOR_SALDO, SITUACAO
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          1, // EMPRESA (fixo 1)
          conta.fornecedor_id,
          (conta.documento || '').substring(0, 30),
          conta.data_vencimento,
          valor,
          quitado,
          conta.data_emissao || dataAtual,
          dataAtual,
          (conta.observacao || '').substring(0, 5000),
          quitado === 'S' ? 0 : valor, // VALOR_SALDO
          quitado === 'S' ? 'QUITADA' : 'ABERTA'
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      sucesso++;
      if (sucesso % 50 === 0) {
        console.log(`${sucesso} contas a pagar migradas...`);
      }
    } catch (erro) {
      erros++;
      console.error(`Erro ao migrar conta ${conta.id}: ${erro.message}`);
    }
  }

  console.log(`Contas a pagar: ${sucesso} migradas com sucesso, ${erros} erros`);
}

// Função para migrar contas a receber/crediário
async function migrarContasReceber(db, documentos, creditos) {
  console.log(`\nIniciando migração de ${documentos.length} contas a receber...`);
  let sucesso = 0;
  let erros = 0;

  for (const doc of documentos) {
    try {
      // Tabela: FIN_CTARECEBER no Firebird
      const quitado = (doc.status === 'B') ? 'S' : 'N';
      const valor = Math.round((parseFloat(doc.valor) || 0) * 100); // Converter para centavos
      const valorPago = Math.round((parseFloat(doc.valorpago) || 0) * 100);
      const dataAtual = new Date().toISOString().split('T')[0];

      await new Promise((resolve, reject) => {
        db.query(`
          INSERT INTO FIN_CTARECEBER (
            EMPRESA, CLIENTE, VENCIMENTO, VALOR,
            VALOR_PAGO, VALOR_SALDO, PARCELA, QUITADO,
            DATA, DATA_EMISSAO, SITUACAO
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          1, // EMPRESA (fixo 1)
          doc.idcliente,
          doc.vencimento,
          valor,
          valorPago,
          quitado === 'S' ? 0 : (valor - valorPago), // VALOR_SALDO
          doc.parcela || 1,
          quitado,
          dataAtual,
          doc.data || dataAtual,
          quitado === 'S' ? 'QUITADA' : 'ABERTA'
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      sucesso++;
      if (sucesso % 50 === 0) {
        console.log(`${sucesso} contas a receber migradas...`);
      }
    } catch (erro) {
      erros++;
      console.error(`Erro ao migrar documento ${doc.iddocumento}: ${erro.message}`);
    }
  }

  console.log(`Contas a receber: ${sucesso} migradas com sucesso, ${erros} erros`);

  // Migrar créditos (como contas a receber com valor negativo ou histórico especial)
  if (creditos && creditos.length > 0) {
    console.log(`\nIniciando migração de ${creditos.length} créditos...`);
    console.log(`Obs: Créditos serão migrados como contas a receber com histórico especial`);
    sucesso = 0;
    erros = 0;

    for (const credito of creditos) {
      try {
        const valor = Math.round((parseFloat(credito.valor) || 0) * 100);
        const saldo = Math.round((parseFloat(credito.saldo) || 0) * 100);
        const dataAtual = new Date().toISOString().split('T')[0];

        await new Promise((resolve, reject) => {
          db.query(`
            INSERT INTO FIN_CTARECEBER (
              EMPRESA, CLIENTE, DATA, VENCIMENTO, VALOR,
              VALOR_SALDO, QUITADO, HISTORICO, SITUACAO
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            1, // EMPRESA
            credito.idcliente,
            credito.data || dataAtual,
            credito.data || dataAtual, // Vencimento igual à data
            -valor, // Valor negativo para indicar crédito
            -saldo, // Saldo negativo
            saldo === 0 ? 'S' : 'N',
            `CRÉDITO: ${credito.obs || 'Migrado do sistema anterior'}`.substring(0, 5000),
            saldo === 0 ? 'QUITADA' : 'ABERTA'
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        sucesso++;
      } catch (erro) {
        erros++;
        console.error(`Erro ao migrar crédito ${credito.idcredito}: ${erro.message}`);
      }
    }

    console.log(`Créditos: ${sucesso} migrados com sucesso, ${erros} erros`);
  }
}

// Função principal
async function executarMigracao() {
  console.log('=== MIGRAÇÃO POSTGRESQL -> FIREBIRD ===\n');

  try {
    // Ler dados do dump SQL
    const arquivoDump = 'C:\\Mac\\Home\\Documents\\bkp brabancia\\dump-bmcmdb-202512221903.sql';
    console.log('Parseando dump SQL...');
    const dados = parsearDumpSQL(arquivoDump);

    console.log(`\nDados encontrados no dump:`);
    console.log(`- Produtos: ${dados.produtos.length}`);
    console.log(`- Contas a pagar: ${dados.contasPagar.length}`);
    console.log(`- Contas a receber: ${dados.contasReceber.length}`);
    console.log(`- Créditos: ${dados.creditos.length}`);

    if (dados.produtos.length === 0 && dados.contasPagar.length === 0 &&
        dados.contasReceber.length === 0 && dados.creditos.length === 0) {
      console.log('\nNenhum dado encontrado no dump. Verifique o arquivo.');
      return;
    }

    // Conectar ao Firebird
    console.log('\nConectando ao Firebird...');
    const db = await new Promise((resolve, reject) => {
      Firebird.attach(fbConfig, (err, db) => {
        if (err) reject(err);
        else resolve(db);
      });
    });

    console.log('Conectado ao Firebird com sucesso!');

    // Executar migrações
    if (dados.produtos.length > 0) {
      await migrarProdutos(db, dados.produtos);
    }

    if (dados.contasPagar.length > 0) {
      await migrarContasPagar(db, dados.contasPagar);
    }

    if (dados.contasReceber.length > 0 || dados.creditos.length > 0) {
      await migrarContasReceber(db, dados.contasReceber, dados.creditos);
    }

    // Fechar conexão
    db.detach();
    console.log('\n=== MIGRAÇÃO CONCLUÍDA ===');

  } catch (erro) {
    console.error('\nErro durante a migração:', erro);
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  executarMigracao();
}

module.exports = { executarMigracao, parsearDumpSQL };
