const mysql = require('mysql2/promise');
const https = require('https');
require('dotenv').config();

// Mapeamento de nomes em inglês para português
const muscleGroupTranslation = {
  'biceps': 'Bíceps',
  'triceps': 'Tríceps',
  'chest': 'Peitoral',
  'back': 'Costas',
  'shoulders': 'Ombros',
  'legs': 'Pernas',
  'quadriceps': 'Quadríceps',
  'hamstrings': 'Posteriores de Coxa',
  'calves': 'Panturrilhas',
  'glutes': 'Glúteos',
  'abdominals': 'Abdômen',
  'forearms': 'Antebraços',
  'traps': 'Trapézio',
  'lats': 'Dorsal',
  'middle back': 'Costas (Meio)',
  'lower back': 'Lombar',
  'neck': 'Pescoço',
  'abductors': 'Abdutores',
  'adductors': 'Adutores',
};

const equipmentTranslation = {
  'barbell': 'Barra',
  'dumbbell': 'Halter',
  'machine': 'Máquina',
  'cable': 'Polia/Cabo',
  'body only': 'Peso Corporal',
  'bands': 'Elásticos',
  'kettlebells': 'Kettlebell',
  'medicine ball': 'Medicine Ball',
  'exercise ball': 'Bola Suíça',
  'foam roll': 'Rolo de Espuma',
  'e-z curl bar': 'Barra W',
  'other': 'Outros',
  'none': 'Nenhum',
};

// Tradução manual dos exercícios mais comuns
const exerciseNameTranslation = {
  // Peitoral
  'Barbell Bench Press - Medium Grip': 'Supino Reto com Barra',
  'Dumbbell Bench Press': 'Supino com Halteres',
  'Incline Dumbbell Press': 'Supino Inclinado com Halteres',
  'Decline Dumbbell Bench Press': 'Supino Declinado com Halteres',
  'Dumbbell Flyes': 'Crucifixo com Halteres',
  'Pushups': 'Flexão de Braço',
  'Push-Ups - Close Triceps Position': 'Flexão Fechada (Tríceps)',

  // Costas
  'Pull-Ups': 'Barra Fixa',
  'Wide-Grip Pull-Up': 'Barra Fixa Aberta',
  'Bent Over Barbell Row': 'Remada Curvada com Barra',
  'One-Arm Dumbbell Row': 'Remada Unilateral com Halter',
  'Seated Cable Rows': 'Remada Sentada',
  'Deadlift': 'Levantamento Terra',
  'Romanian Deadlift': 'Levantamento Terra Romeno',

  // Pernas
  'Barbell Squat': 'Agachamento com Barra',
  'Front Barbell Squat': 'Agachamento Frontal',
  'Leg Press': 'Leg Press',
  'Leg Extensions': 'Cadeira Extensora',
  'Leg Curls': 'Mesa Flexora',
  'Seated Leg Curl': 'Flexora Sentada',
  'Standing Calf Raises': 'Panturrilha em Pé',
  'Seated Calf Raise': 'Panturrilha Sentada',

  // Ombros
  'Barbell Shoulder Press': 'Desenvolvimento com Barra',
  'Dumbbell Shoulder Press': 'Desenvolvimento com Halteres',
  'Side Lateral Raise': 'Elevação Lateral',
  'Front Dumbbell Raise': 'Elevação Frontal',
  'Reverse Flyes': 'Crucifixo Inverso',
  'Upright Barbell Row': 'Remada Alta',

  // Bíceps
  'Barbell Curl': 'Rosca Direta com Barra',
  'Dumbbell Bicep Curl': 'Rosca com Halteres',
  'Hammer Curls': 'Rosca Martelo',
  'Concentration Curls': 'Rosca Concentrada',
  'Alternate Incline Dumbbell Curl': 'Rosca Inclinada Alternada',

  // Tríceps
  'Dips - Triceps Version': 'Paralelas (Tríceps)',
  'Tricep Dumbbell Kickback': 'Coice de Tríceps',
  'Lying Triceps Press': 'Tríceps Testa',
  'Close-Grip Barbell Bench Press': 'Supino Fechado',
  'Triceps Pushdown': 'Tríceps Pulley',

  // Abdômen
  'Plank': 'Prancha',
  'Side Plank': 'Prancha Lateral',
  'Crunches': 'Abdominal',
  'Ab Roller': 'Roda Abdominal',
  'Hanging Leg Raise': 'Elevação de Pernas Suspensa',
};

function translateExerciseName(englishName) {
  // Verifica se tem tradução manual
  if (exerciseNameTranslation[englishName]) {
    return exerciseNameTranslation[englishName];
  }

  // Senão, retorna o nome original (pode adicionar mais traduções depois)
  return englishName;
}

function translateMuscleGroup(englishMuscle) {
  return muscleGroupTranslation[englishMuscle.toLowerCase()] || englishMuscle;
}

function translateEquipment(englishEquipment) {
  return equipmentTranslation[englishEquipment.toLowerCase()] || englishEquipment;
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function importExercises() {
  console.log('🏋️  Importando exercícios do Free Exercise DB...\n');

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // URL do JSON com todos os exercícios
    const url = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
    const baseImageUrl = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

    console.log('📥 Baixando dados...');
    const exercises = await fetchJSON(url);
    console.log(`✓ ${exercises.length} exercícios encontrados\n`);

    // Busca o gymId (assumindo gym 1)
    const [gyms] = await connection.execute('SELECT id FROM gyms LIMIT 1');
    if (gyms.length === 0) {
      console.error('❌ Nenhuma academia encontrada. Crie uma academia primeiro.');
      process.exit(1);
    }
    const gymId = gyms[0].id;

    // Busca um usuário professor para ser o criador
    const [professors] = await connection.execute(
      "SELECT id FROM users WHERE role = 'professor' LIMIT 1"
    );
    if (professors.length === 0) {
      console.error('❌ Nenhum professor encontrado. Crie um usuário professor primeiro.');
      process.exit(1);
    }
    const professorId = professors[0].id;

    console.log(`🏢 Academia ID: ${gymId}`);
    console.log(`👤 Professor ID: ${professorId}\n`);

    let imported = 0;
    let skipped = 0;

    for (const exercise of exercises) {
      // Traduz informações
      const namePt = translateExerciseName(exercise.name);
      const primaryMuscle = exercise.primaryMuscles && exercise.primaryMuscles[0]
        ? translateMuscleGroup(exercise.primaryMuscles[0])
        : null;
      const equipmentPt = exercise.equipment
        ? translateEquipment(exercise.equipment)
        : null;

      // Monta URL da primeira imagem
      const imageUrl = exercise.images && exercise.images[0]
        ? baseImageUrl + exercise.images[0]
        : null;

      // Monta descrição com as instruções
      const description = exercise.instructions && exercise.instructions.length > 0
        ? exercise.instructions.join('\n')
        : null;

      try {
        // Verifica se já existe
        const [existing] = await connection.execute(
          'SELECT id FROM exercises WHERE name = ? AND gymId = ?',
          [namePt, gymId]
        );

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Insere exercício
        await connection.execute(
          `INSERT INTO exercises
           (gymId, createdBy, name, description, muscleGroup, equipment, imageUrl, videoUrl, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())`,
          [gymId, professorId, namePt, description, primaryMuscle, equipmentPt, imageUrl]
        );

        imported++;

        if (imported % 50 === 0) {
          console.log(`✓ ${imported} exercícios importados...`);
        }
      } catch (err) {
        console.error(`❌ Erro ao importar "${namePt}":`, err.message);
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`  ✅ Importados: ${imported}`);
    console.log(`  ⏭️  Ignorados (já existiam): ${skipped}`);
    console.log(`  📦 Total no banco: ${imported + skipped}`);
    console.log('\n🎉 Importação concluída!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

importExercises();
