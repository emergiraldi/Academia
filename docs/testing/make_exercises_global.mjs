#!/usr/bin/env node
/**
 * Script para tornar exercícios existentes GLOBAIS
 * Exercícios globais (gymId = NULL) aparecem para TODAS as academias
 * Exercícios futuros criados por professores ficam específicos da academia (gymId = X)
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

async function main() {
  console.log('🏋️  Tornando biblioteca de exercícios GLOBAL...\n');

  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'academia',
    password: 'Academia2026Secure',
    database: 'academia_db'
  });

  try {
    // 1. Verificar quantos exercícios existem
    const [currentExercises] = await conn.execute(`
      SELECT gymId, COUNT(*) as total
      FROM exercises
      GROUP BY gymId
    `);

    console.log('📊 Exercícios por academia (ANTES):');
    currentExercises.forEach(row => {
      console.log(`   Academia ${row.gymId}: ${row.total} exercícios`);
    });

    // 2. Modificar tabela para permitir gymId = NULL
    console.log('\n🔧 Alterando estrutura da tabela exercises...');
    await conn.execute(`
      ALTER TABLE exercises
      MODIFY COLUMN gymId INT NULL
    `);
    console.log('   ✅ gymId agora permite NULL');

    // 3. Transformar exercícios da academia 1 em globais
    console.log('\n🌍 Tornando exercícios GLOBAIS (gymId = NULL)...');
    const [updateResult] = await conn.execute(`
      UPDATE exercises
      SET gymId = NULL
      WHERE gymId = 1
    `);
    console.log(`   ✅ ${updateResult.affectedRows} exercícios agora são GLOBAIS`);

    // 4. Verificar resultado
    const [globalCount] = await conn.execute(`
      SELECT COUNT(*) as total FROM exercises WHERE gymId IS NULL
    `);
    const [specificCount] = await conn.execute(`
      SELECT gymId, COUNT(*) as total
      FROM exercises
      WHERE gymId IS NOT NULL
      GROUP BY gymId
    `);

    console.log('\n📊 Resultado FINAL:');
    console.log(`   🌍 Exercícios Globais (todas academias): ${globalCount[0].total}`);
    if (specificCount.length > 0) {
      console.log('   🏠 Exercícios Específicos:');
      specificCount.forEach(row => {
        console.log(`      Academia ${row.gymId}: ${row.total} exercícios`);
      });
    } else {
      console.log('   🏠 Exercícios Específicos: 0 (novos exercícios criados pelos professores aparecerão aqui)');
    }

    console.log('\n✅ CONCLUÍDO!');
    console.log('\n📝 COMPORTAMENTO:');
    console.log('   • Biblioteca Global (873 exercícios): TODAS as academias veem');
    console.log('   • Exercícios novos criados por professores: Apenas a academia dele vê');
    console.log('   • Ao listar: Mostra exercícios globais + exercícios da própria academia\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
