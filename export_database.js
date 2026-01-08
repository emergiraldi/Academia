import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function exportDatabase() {
  console.log('📦 Exportando banco de dados local...\\n');

  const dumpFile = 'academia_db_backup.sql';

  // MySQL dump command
  const mysqldumpPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe'; // Adjust if needed
  const command = `"${mysqldumpPath}" -u root --databases academia_db --skip-comments --no-tablespaces > ${dumpFile}`;

  try {
    console.log('⏳ Criando backup...');
    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes('Warning')) {
      console.error('Avisos:', stderr);
    }

    // Check if file was created
    if (fs.existsSync(dumpFile)) {
      const stats = fs.statSync(dumpFile);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(`\\n✅ Backup criado com sucesso!`);
      console.log(`📄 Arquivo: ${dumpFile}`);
      console.log(`📊 Tamanho: ${fileSizeMB} MB`);
      console.log(`\\n💡 Próximo passo: Execute deploy_with_database_restore.sh para restaurar na VPS`);
    } else {
      console.error('❌ Arquivo de backup não foi criado!');
    }

  } catch (error) {
    console.error('❌ Erro ao exportar:', error.message);
    console.log('\\n💡 Dica: Verifique se o MySQL está instalado e o caminho do mysqldump está correto');
    console.log('   Caminhos comuns:');
    console.log('   - C:\\\\xampp\\\\mysql\\\\bin\\\\mysqldump.exe');
    console.log('   - C:\\\\Program Files\\\\MySQL\\\\MySQL Server 8.0\\\\bin\\\\mysqldump.exe');
  }
}

exportDatabase();
