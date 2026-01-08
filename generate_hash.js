import bcrypt from 'bcryptjs';

const password = '935559Em@';
const hash = await bcrypt.hash(password, 10);

console.log('Senha:', password);
console.log('Hash:', hash);
console.log('\nSQL para executar na VPS:');
console.log(`UPDATE users SET password = '${hash}' WHERE email = 'emerson.student@giralditelecom.com.br' AND role = 'student';`);
