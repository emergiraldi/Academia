/**
 * Adiciona campos de configuração de cobrança ao Super Admin Settings
 */
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function addBillingConfig() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
  const url = new URL(dbUrl);

  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.substring(1)
  });

  console.log('📊 Adicionando campos de configuração de cobrança...');

  // Adicionar campos se não existirem
  const fields = [
    {
      name: 'billingDueDay',
      sql: 'ALTER TABLE superAdminSettings ADD COLUMN billingDueDay INT DEFAULT 10 COMMENT "Dia do mês para vencimento (1-31)"'
    },
    {
      name: 'billingAdvanceDays',
      sql: 'ALTER TABLE superAdminSettings ADD COLUMN billingAdvanceDays INT DEFAULT 10 COMMENT "Dias antes do vencimento para enviar cobrança"'
    },
    {
      name: 'billingGracePeriodDays',
      sql: 'ALTER TABLE superAdminSettings ADD COLUMN billingGracePeriodDays INT DEFAULT 5 COMMENT "Dias após vencimento antes de bloquear"'
    },
    {
      name: 'billingEnabled',
      sql: 'ALTER TABLE superAdminSettings ADD COLUMN billingEnabled CHAR(1) DEFAULT "Y" COMMENT "Y=Ativo, N=Inativo"'
    },
    {
      name: 'billingLateFeePercentage',
      sql: 'ALTER TABLE superAdminSettings ADD COLUMN billingLateFeePercentage DECIMAL(5,2) DEFAULT 2.00 COMMENT "Multa por atraso em percentual (ex: 2.00 = 2%)"'
    },
    {
      name: 'billingLateFeeFixedCents',
      sql: 'ALTER TABLE superAdminSettings ADD COLUMN billingLateFeeFixedCents INT DEFAULT 0 COMMENT "Multa fixa em centavos (ex: 500 = R$ 5,00)"'
    },
    {
      name: 'billingInterestRatePerDay',
      sql: 'ALTER TABLE superAdminSettings ADD COLUMN billingInterestRatePerDay DECIMAL(5,2) DEFAULT 0.03 COMMENT "Juros por dia de atraso em % (ex: 0.03 = 0,03% ao dia)"'
    },
    {
      name: 'billingLateFeeType',
      sql: 'ALTER TABLE superAdminSettings ADD COLUMN billingLateFeeType ENUM("percentage", "fixed", "both") DEFAULT "percentage" COMMENT "Tipo de multa: percentage, fixed ou both"'
    }
  ];

  for (const field of fields) {
    try {
      await connection.query(field.sql);
      console.log(`✅ Campo ${field.name} adicionado`);
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log(`ℹ️  Campo ${field.name} já existe`);
      } else {
        throw error;
      }
    }
  }

  console.log('✅ Configuração de cobrança adicionada com sucesso!');

  await connection.end();
}

addBillingConfig().catch(error => {
  console.error('❌ Erro ao adicionar configuração:', error);
  process.exit(1);
});
