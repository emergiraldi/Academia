const mysql = require('mysql2/promise');

async function addColumns() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('Adicionando colunas à tabela gyms...\n');

    const columns = [
      {
        name: 'contactEmail',
        sql: "ALTER TABLE gyms ADD COLUMN IF NOT EXISTS contactEmail VARCHAR(320) NULL"
      },
      {
        name: 'contactPhone',
        sql: "ALTER TABLE gyms ADD COLUMN IF NOT EXISTS contactPhone VARCHAR(20) NULL"
      },
      {
        name: 'pixKey',
        sql: "ALTER TABLE gyms ADD COLUMN IF NOT EXISTS pixKey VARCHAR(255) NULL"
      },
      {
        name: 'pixKeyType',
        sql: "ALTER TABLE gyms ADD COLUMN IF NOT EXISTS pixKeyType ENUM('cpf', 'cnpj', 'email', 'phone', 'random') NULL"
      },
      {
        name: 'merchantName',
        sql: "ALTER TABLE gyms ADD COLUMN IF NOT EXISTS merchantName VARCHAR(200) NULL"
      },
      {
        name: 'merchantCity',
        sql: "ALTER TABLE gyms ADD COLUMN IF NOT EXISTS merchantCity VARCHAR(100) NULL"
      },
      {
        name: 'wellhubApiKey',
        sql: "ALTER TABLE gyms ADD COLUMN IF NOT EXISTS wellhubApiKey VARCHAR(255) NULL"
      },
      {
        name: 'wellhubWebhookSecret',
        sql: "ALTER TABLE gyms ADD COLUMN IF NOT EXISTS wellhubWebhookSecret VARCHAR(255) NULL"
      }
    ];

    for (const column of columns) {
      try {
        await connection.execute(column.sql);
        console.log(`✓ Coluna ${column.name} adicionada/verificada`);
      } catch (error) {
        // Se o erro for que a coluna já existe, está OK
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`✓ Coluna ${column.name} já existe`);
        } else {
          console.error(`❌ Erro ao adicionar ${column.name}:`, error.message);
        }
      }
    }

    console.log('\n✅ Processo concluído!\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

addColumns();
