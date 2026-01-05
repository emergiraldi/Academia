const Firebird = require('node-firebird');

// Tentar conexão local sem network (embedded mode)
const fbConfig = {
  database: 'C:\\QRSistema\\db\\QRSISTEMA.FDB',
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false,
  role: null,
  pageSize: 4096
};

console.log('=== VERIFICAÇÃO DA ESTRUTURA DO FIREBIRD ===\n');
console.log('Conectando ao banco Firebird...');

Firebird.attach(fbConfig, (err, db) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err.message);
    console.error('\nVerifique:');
    console.error('1. Se o Firebird está rodando');
    console.error('2. Se o caminho do arquivo .FDB está correto');
    console.error('3. Se o usuário e senha estão corretos');
    return;
  }

  console.log('✓ Conectado com sucesso!\n');

  // Listar todas as tabelas
  db.query(`
    SELECT RDB$RELATION_NAME
    FROM RDB$RELATIONS
    WHERE RDB$SYSTEM_FLAG = 0
    AND RDB$VIEW_BLR IS NULL
    ORDER BY RDB$RELATION_NAME
  `, [], (err, tabelas) => {
    if (err) {
      console.error('Erro ao listar tabelas:', err);
      db.detach();
      return;
    }

    console.log('📋 TABELAS ENCONTRADAS:');
    console.log('========================\n');

    const nomesTabelas = tabelas.map(t => t.RDB$RELATION_NAME.trim());
    nomesTabelas.forEach((nome, idx) => {
      console.log(`${idx + 1}. ${nome}`);
    });

    console.log(`\nTotal: ${nomesTabelas.length} tabelas\n`);

    // Procurar tabelas relacionadas à migração
    const tabelasRelevantes = nomesTabelas.filter(nome => {
      const n = nome.toLowerCase();
      return n.includes('produto') ||
             n.includes('conta') ||
             n.includes('pagar') ||
             n.includes('receber') ||
             n.includes('credito');
    });

    if (tabelasRelevantes.length > 0) {
      console.log('🎯 TABELAS RELEVANTES PARA MIGRAÇÃO:');
      console.log('====================================\n');
      tabelasRelevantes.forEach(nome => {
        console.log(`• ${nome}`);
      });
      console.log('');

      // Verificar estrutura de cada tabela relevante
      let processadas = 0;
      const total = tabelasRelevantes.length;

      tabelasRelevantes.forEach((nomeTabela) => {
        db.query(`
          SELECT
            RDB$FIELD_NAME,
            RDB$FIELD_SOURCE
          FROM RDB$RELATION_FIELDS
          WHERE RDB$RELATION_NAME = ?
          ORDER BY RDB$FIELD_POSITION
        `, [nomeTabela], (err, colunas) => {
          if (err) {
            console.error(`Erro ao consultar ${nomeTabela}:`, err);
          } else {
            console.log(`\n📊 Estrutura da tabela: ${nomeTabela}`);
            console.log('─'.repeat(60));

            colunas.forEach((col, idx) => {
              const nome = col.RDB$FIELD_NAME.trim();
              const tipo = col.RDB$FIELD_SOURCE.trim();
              console.log(`  ${idx + 1}. ${nome.padEnd(30)} (${tipo})`);
            });
          }

          processadas++;
          if (processadas === total) {
            // Quando terminar de processar todas as tabelas
            console.log('\n' + '='.repeat(60));
            console.log('\n💡 PRÓXIMOS PASSOS:\n');
            console.log('1. Compare as estruturas acima com o script migracao-dados.js');
            console.log('2. Ajuste os nomes das tabelas e colunas no script');
            console.log('3. Faça backup do banco Firebird');
            console.log('4. Execute: node migracao-dados.js\n');

            db.detach();
          }
        });
      });
    } else {
      console.log('⚠️  Nenhuma tabela relevante encontrada.\n');
      console.log('Procure manualmente pelas tabelas corretas nas listadas acima.');
      db.detach();
    }
  });
});
