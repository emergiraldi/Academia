import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function importExercisesLibrary() {
  // Read export file
  const filename = 'exercises_library_export.json';

  if (!fs.existsSync(filename)) {
    console.error(`❌ Arquivo ${filename} não encontrado!`);
    console.log('💡 Certifique-se de copiar o arquivo de exportação para este diretório.');
    process.exit(1);
  }

  const exportData = JSON.parse(fs.readFileSync(filename, 'utf8'));

  console.log('📚 Importando biblioteca de exercícios...\n');
  console.log(`📊 Dados exportados em: ${exportData.exportDate}`);
  console.log(`   Exercícios: ${exportData.totalExercises}`);
  console.log(`   Fotos: ${exportData.totalPhotos}`);
  console.log(`   Vídeos: ${exportData.totalVideos}\n`);

  // Database connection
  const databaseUrl = process.env.DATABASE_URL;
  let config;

  if (databaseUrl && databaseUrl.includes('@')) {
    console.log('📋 Using DATABASE_URL');
    let match = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match) {
      const [, user, password, host, port, database] = match;
      config = { host, port: parseInt(port), user, password, database };
    } else {
      match = databaseUrl.match(/mysql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!match) {
        console.error('❌ Invalid DATABASE_URL format');
        process.exit(1);
      }
      const [, user, host, port, database] = match;
      config = { host, port: parseInt(port), user, password: '', database };
    }
  } else {
    console.log('📋 Using localhost config');
    config = {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'academia_db'
    };
  }

  const conn = await mysql.createConnection(config);

  try {
    // Get gym ID (assuming first gym)
    const [gyms] = await conn.execute('SELECT id FROM gyms LIMIT 1');
    if (gyms.length === 0) {
      throw new Error('Nenhuma academia encontrada no banco de dados');
    }
    const gymId = gyms[0].id;
    console.log(`🏋️  Importando para gym ID: ${gymId}`);

    // Get or create a default user for exercises
    const [users] = await conn.execute('SELECT id FROM users WHERE role = "professor" OR role = "gym_admin" LIMIT 1');
    if (users.length === 0) {
      throw new Error('Nenhum usuário professor ou admin encontrado para associar aos exercícios');
    }
    const createdBy = users[0].id;
    console.log(`👤 Exercícios serão associados ao usuário ID: ${createdBy}\n`);

    // Map old exercise IDs to new ones
    const exerciseIdMap = new Map();

    // Import exercises
    console.log('📝 Importando exercícios...');
    for (const exercise of exportData.exercises) {
      const [result] = await conn.execute(`
        INSERT INTO exercises (
          gymId, createdBy, name, description, muscleGroup, equipment, imageUrl, videoUrl, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        gymId,
        createdBy,
        exercise.name,
        exercise.description,
        exercise.muscleGroup,
        exercise.equipment,
        exercise.imageUrl,
        exercise.videoUrl,
        exercise.createdAt,
        exercise.updatedAt
      ]);

      exerciseIdMap.set(exercise.id, result.insertId);
      console.log(`  ✓ ${exercise.name} (ID: ${exercise.id} → ${result.insertId})`);
    }

    // Import exercise photos
    if (exportData.exercisePhotos.length > 0) {
      console.log('\n📸 Importando fotos de exercícios...');
      for (const photo of exportData.exercisePhotos) {
        const newExerciseId = exerciseIdMap.get(photo.exerciseId);
        if (newExerciseId) {
          await conn.execute(`
            INSERT INTO exercise_photos (
              exerciseId, photoUrl, caption, orderIndex, createdAt
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            newExerciseId,
            photo.photoUrl,
            photo.caption,
            photo.orderIndex,
            photo.createdAt
          ]);
          console.log(`  ✓ Foto adicionada para exercício ID ${newExerciseId}`);
        }
      }
    }

    // Import exercise videos
    if (exportData.exerciseVideos.length > 0) {
      console.log('\n🎥 Importando vídeos de exercícios...');
      for (const video of exportData.exerciseVideos) {
        const newExerciseId = exerciseIdMap.get(video.exerciseId);
        if (newExerciseId) {
          await conn.execute(`
            INSERT INTO exercise_videos (
              exerciseId, videoUrl, thumbnailUrl, title, description, duration, orderIndex, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            newExerciseId,
            video.videoUrl,
            video.thumbnailUrl,
            video.title,
            video.description,
            video.duration,
            video.orderIndex,
            video.createdAt
          ]);
          console.log(`  ✓ Vídeo adicionado para exercício ID ${newExerciseId}`);
        }
      }
    }

    console.log('\n✅ Importação concluída com sucesso!');
    console.log(`\n📊 Resumo Final:`);
    console.log(`   Exercícios importados: ${exportData.totalExercises}`);
    console.log(`   Fotos importadas: ${exportData.totalPhotos}`);
    console.log(`   Vídeos importados: ${exportData.totalVideos}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

importExercisesLibrary();
