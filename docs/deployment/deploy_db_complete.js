import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function deployDatabase() {
  console.log('========================================');
  console.log('🚀 Deploy Completo do Banco de Dados');
  console.log('========================================\n');

  const backupFile = 'academia_db_backup.sql';
  const vpsHost = '72.60.2.237';
  const vpsUser = 'root';
  const vpsPath = '/var/www/academia';

  // Check if backup exists
  if (!fs.existsSync(backupFile)) {
    console.error('❌ Arquivo de backup não encontrado!');
    console.log('💡 Execute primeiro: node export_database.js');
    process.exit(1);
  }

  console.log('📊 Arquivo de backup encontrado');
  const stats = fs.statSync(backupFile);
  console.log(`   Tamanho: ${(stats.size / (1024 * 1024)).toFixed(2)} MB\n`);

  try {
    // Step 1: Upload backup file
    console.log('📤 1. Fazendo upload do backup para VPS...');
    const scpCmd = `scp -o StrictHostKeyChecking=no ${backupFile} ${vpsUser}@${vpsHost}:${vpsPath}/`;
    console.log('   Executando SCP...');
    console.log('   ⚠️  Se pedir senha, digite: 935559Emerson@\n');

    await execAsync(scpCmd);
    console.log('✅ Upload concluído!\n');

    // Step 2: Execute restoration on VPS
    console.log('🔄 2. Executando restauração na VPS...\n');

    const sshCommands = [
      'cd /var/www/academia',
      'echo "📥 Atualizando código do GitHub..."',
      'git pull origin main',
      'echo ""',
      'echo "🗄️  Dropando banco existente..."',
      'mysql -u root -e "DROP DATABASE IF EXISTS academia_db;"',
      'echo "✓ Banco removido"',
      'echo ""',
      'echo "📦 Restaurando backup..."',
      'mysql -u root < academia_db_backup.sql',
      'echo "✓ Backup restaurado"',
      'echo ""',
      'echo "🧹 Removendo arquivo de backup..."',
      'rm academia_db_backup.sql',
      'echo "✓ Arquivo removido"',
      'echo ""',
      'echo "🏗️  Compilando projeto..."',
      'npm run build',
      'echo ""',
      'echo "🔄 Reiniciando PM2..."',
      'pm2 restart academia-api',
      'echo ""',
      'echo "⏳ Aguardando 3 segundos..."',
      'sleep 3',
      'echo ""',
      'echo "📋 Logs do PM2:"',
      'pm2 logs academia-api --lines 30 --nostream',
      'echo ""',
      'echo "📊 Status do PM2:"',
      'pm2 status',
      'echo ""',
      'echo "========================================"',
      'echo "✅ Restauração concluída com sucesso!"',
      'echo "========================================"',
      'echo ""',
      'echo "🌐 Site: https://www.sysfitpro.com.br"'
    ].join(' && ');

    const sshCmd = `ssh -o StrictHostKeyChecking=no ${vpsUser}@${vpsHost} "${sshCommands}"`;
    console.log('   Executando comandos na VPS...');
    console.log('   ⚠️  Se pedir senha, digite: 935559Emerson@\n');

    const { stdout, stderr } = await execAsync(sshCmd, { maxBuffer: 10 * 1024 * 1024 });

    console.log(stdout);
    if (stderr) {
      console.error('Avisos:', stderr);
    }

    console.log('\n✅ Deploy concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro durante o deploy:', error.message);
    console.log('\n💡 Tente executar manualmente os comandos que foram fornecidos anteriormente.');
    process.exit(1);
  }
}

deployDatabase();
