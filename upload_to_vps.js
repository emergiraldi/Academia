import { spawn } from 'child_process';
import fs from 'fs';

const filename = 'exercises_library_export.json';
const remotePath = '/var/www/academia/' + filename;

console.log('📤 Enviando arquivo para VPS via SFTP...\n');

// Use SFTP via SSH with batch mode
const sftp = spawn('sftp', [
  '-o', 'StrictHostKeyChecking=no',
  '-o', 'PasswordAuthentication=yes',
  '-b', '-',  // Read commands from stdin
  'root@138.197.8.136'
]);

// Send SFTP commands
sftp.stdin.write(`cd /var/www/academia\n`);
sftp.stdin.write(`put ${filename}\n`);
sftp.stdin.write(`bye\n`);
sftp.stdin.end();

sftp.stdout.on('data', (data) => {
  console.log(data.toString());
});

sftp.stderr.on('data', (data) => {
  console.error(data.toString());
});

sftp.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Arquivo enviado com sucesso!');
  } else {
    console.error(`\n❌ Erro: processo terminou com código ${code}`);
  }
});
