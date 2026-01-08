import mysql from 'mysql2/promise';
import fs from 'fs';

async function exportExercisesLibrary() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'academia_db'
  });

  try {
    console.log('📚 Exportando biblioteca de exercícios...\n');

    // Get all exercises
    const [exercises] = await connection.execute(`
      SELECT
        e.*,
        u.name as creatorName,
        u.email as creatorEmail
      FROM exercises e
      LEFT JOIN users u ON e.createdBy = u.id
      ORDER BY e.id
    `);

    console.log(`✓ Encontrados ${exercises.length} exercícios`);

    // Get all exercise photos
    const [exercisePhotos] = await connection.execute(`
      SELECT * FROM exercise_photos
      ORDER BY exerciseId, orderIndex
    `);

    console.log(`✓ Encontradas ${exercisePhotos.length} fotos de exercícios`);

    // Get all exercise videos (if table exists)
    let exerciseVideos = [];
    try {
      const [videos] = await connection.execute(`
        SELECT * FROM exercise_videos
        ORDER BY exerciseId
      `);
      exerciseVideos = videos;
      console.log(`✓ Encontrados ${exerciseVideos.length} vídeos de exercícios`);
    } catch (error) {
      console.log(`⚠️  Tabela exercise_videos não encontrada ou vazia`);
    }

    // Organize data
    const exportData = {
      exportDate: new Date().toISOString(),
      totalExercises: exercises.length,
      totalPhotos: exercisePhotos.length,
      totalVideos: exerciseVideos.length,
      exercises: exercises.map(ex => ({
        ...ex,
        // Convert dates to ISO strings for JSON
        createdAt: ex.createdAt?.toISOString(),
        updatedAt: ex.updatedAt?.toISOString(),
      })),
      exercisePhotos: exercisePhotos.map(photo => ({
        ...photo,
        createdAt: photo.createdAt?.toISOString(),
      })),
      exerciseVideos: exerciseVideos.map(video => ({
        ...video,
        createdAt: video.createdAt?.toISOString(),
      })),
    };

    // Save to JSON file
    const filename = 'exercises_library_export.json';
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));

    console.log(`\n✅ Biblioteca exportada com sucesso para: ${filename}`);
    console.log(`\n📊 Resumo:`);
    console.log(`   Exercícios: ${exportData.totalExercises}`);
    console.log(`   Fotos: ${exportData.totalPhotos}`);
    console.log(`   Vídeos: ${exportData.totalVideos}`);
    console.log(`\n💡 Próximo passo: Copie o arquivo ${filename} para a VPS e execute import_exercises_library.js`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

exportExercisesLibrary();
