/**
 * Cria tabela saasPlans para gerenciar planos SaaS das academias
 * Execute: node create_saas_plans_table.js
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function createSaasPlansTable() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/academia_db';
  const url = new URL(dbUrl);

  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.substring(1)
  });

  try {
    console.log('🏗️  Criando tabela saasPlans...\n');

    // Verificar se a tabela já existe
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'saasPlans'
    `);

    if (tables.length > 0) {
      console.log('✅ Tabela saasPlans já existe!');

      // Inserir planos padrão se não existirem
      const [existingPlans] = await connection.query('SELECT COUNT(*) as count FROM saasPlans');
      if (existingPlans[0].count === 0) {
        console.log('\n📦 Inserindo planos padrão...');

        await connection.query(`
          INSERT INTO saasPlans (
            name, slug, description, priceInCents,
            features,
            hasWellhub, hasControlId, hasAdvancedReports, hasWhatsappIntegration, hasPrioritySupport,
            featured, displayOrder, active
          ) VALUES
          (
            'Básico',
            'basic',
            'Ideal para academias que estão começando. Recursos essenciais para gestão.',
            14900,
            '["Gestão de alunos", "Gestão de pagamentos", "Treinos básicos"]',
            0, 0, 0, 0, 0,
            0, 1, 1
          ),
          (
            'Profissional',
            'professional',
            'Perfeito para academias em crescimento. Inclui Wellhub e relatórios avançados.',
            29900,
            '["Tudo do Básico", "Integração Wellhub", "Relatórios avançados", "WhatsApp"]',
            1, 0, 1, 1, 0,
            1, 2, 1
          ),
          (
            'Enterprise',
            'enterprise',
            'Solução completa com todos os recursos, Control ID e suporte prioritário.',
            59900,
            '["Tudo do Profissional", "Control ID biométrico", "Suporte prioritário", "API personalizada"]',
            1, 1, 1, 1, 1,
            0, 3, 1
          )
        `);

        console.log('✅ Planos padrão inseridos com sucesso!');
      }

      return;
    }

    // Criar tabela saasPlans
    await connection.query(`
      CREATE TABLE saasPlans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL COMMENT 'Nome do plano: Básico, Profissional, Enterprise',
        slug VARCHAR(50) UNIQUE NOT NULL COMMENT 'URL-friendly: basic, professional, enterprise',
        description TEXT COMMENT 'Descrição completa do plano',
        priceInCents INT NOT NULL COMMENT 'Preço mensal em centavos',

        features TEXT COMMENT 'JSON com lista de features incluídas',
        hasWellhub BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'Integração com Wellhub',
        hasControlId BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'Integração com Control ID',
        hasAdvancedReports BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'Relatórios avançados',
        hasWhatsappIntegration BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'Integração WhatsApp',
        hasPrioritySupport BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'Suporte prioritário',

        featured BOOLEAN DEFAULT FALSE NOT NULL COMMENT 'Destacar na landing page',
        displayOrder INT DEFAULT 0 NOT NULL COMMENT 'Ordem de exibição',
        active BOOLEAN DEFAULT TRUE NOT NULL COMMENT 'Plano ativo',

        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

        INDEX idx_slug (slug),
        INDEX idx_active (active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Planos SaaS para assinatura das academias'
    `);

    console.log('✅ Tabela saasPlans criada com sucesso!');

    // Inserir planos padrão
    console.log('\n📦 Inserindo planos padrão...');

    await connection.query(`
      INSERT INTO saasPlans (
        name, slug, description, priceInCents,
        maxStudents, maxProfessors, maxStaff,
        hasWellhub, hasControlId, hasAdvancedReports, hasWhatsappIntegration, hasPrioritySupport,
        featured, displayOrder, active
      ) VALUES
      (
        'Básico',
        'basic',
        'Ideal para academias pequenas que estão começando',
        14900,
        100,
        2,
        2,
        0, 0, 0, 0, 0,
        0, 1, 1
      ),
      (
        'Profissional',
        'professional',
        'Perfeito para academias em crescimento com integração Wellhub',
        29900,
        500,
        5,
        5,
        1, 0, 1, 1, 0,
        1, 2, 1
      ),
      (
        'Enterprise',
        'enterprise',
        'Solução completa com todos os recursos e suporte prioritário',
        59900,
        NULL,
        NULL,
        NULL,
        1, 1, 1, 1, 1,
        0, 3, 1
      )
    `);

    console.log('✅ Planos padrão inseridos com sucesso!');
    console.log('\n📋 Estrutura da tabela:');
    console.log('   - Plano Básico: R$ 149/mês - até 100 alunos');
    console.log('   - Plano Profissional: R$ 299/mês - até 500 alunos + Wellhub');
    console.log('   - Plano Enterprise: R$ 599/mês - alunos ilimitados + todos recursos');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Página Super Admin para gerenciar planos');
    console.log('   2. Academias escolhem plano no cadastro');
    console.log('   3. Sistema valida limites automaticamente');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createSaasPlansTable().catch(console.error);
