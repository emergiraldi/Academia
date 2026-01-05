import mysql from 'mysql2/promise';
import fs from 'fs';

(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const sql = fs.readFileSync('create_tables.sql', 'utf8');
  const statements = sql.split(';').filter(s => {
    const trimmed = s.trim();
    return trimmed && !trimmed.startsWith('--');
  });
  
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        await conn.execute(stmt);
        const preview = stmt.trim().substring(0, 60).replace(/\n/g, ' ');
        console.log('✓', preview);
      } catch (e) {
        console.error('✗', stmt.trim().substring(0, 60), e.message);
      }
    }
  }
  
  await conn.end();
  console.log('\n✅ Database created successfully!');
})();
