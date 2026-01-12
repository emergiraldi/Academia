import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
const url = new URL(dbUrl);

const connection = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username || 'root',
  password: url.password || '',
  database: url.pathname.substring(1)
});

const [users] = await connection.query(
  "SELECT id, email, role, name FROM users WHERE email = 'emerson@giralditelecom.com.br'"
);

console.log('Usuários encontrados:');
console.table(users);

await connection.end();
