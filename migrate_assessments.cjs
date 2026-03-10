const mysql = require('mysql2/promise');

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.log('DATABASE_URL not set'); process.exit(1); }

  const conn = await mysql.createConnection(url);

  const alterStatements = [
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS assessmentNumber INT DEFAULT 1",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS protocol VARCHAR(100) DEFAULT 'jackson_pollock_7'",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS shoulder DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS abdomen DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS rightForearm DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS leftForearm DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS bust DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS bicepsSkinfold DECIMAL(4,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS calfSkinfold DECIMAL(4,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS humerusDiameter DECIMAL(4,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS wristDiameter DECIMAL(4,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS femurDiameter DECIMAL(4,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS systolicBP INT",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS diastolicBP INT",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS restingHR INT",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS abdominalReps INT",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS pushupReps INT",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS cooperDistance DECIMAL(6,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS cooperSpeed DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS flexiteste TEXT",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS posturalAssessment TEXT",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS parq TEXT",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS bmi DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS rcq DECIMAL(5,4)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS fatMass DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS leanMass DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS residualMass DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS boneMass DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS bmr DECIMAL(7,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS somatotype VARCHAR(100)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS endomorphy DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS mesomorphy DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS ectomorphy DECIMAL(5,2)",
    "ALTER TABLE physical_assessments ADD COLUMN IF NOT EXISTS considerations TEXT",
  ];

  for (const sql of alterStatements) {
    try {
      await conn.execute(sql);
      console.log('OK: ' + sql.substring(0, 80));
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('SKIP (exists): ' + sql.substring(50, 80));
      } else {
        console.log('ERR: ' + e.message);
      }
    }
  }

  // Rename pushups to pushupReps if needed
  try {
    await conn.execute("ALTER TABLE physical_assessments CHANGE COLUMN pushups pushupReps INT");
    console.log('OK: Renamed pushups -> pushupReps');
  } catch(e) {
    console.log('SKIP rename: ' + e.message.substring(0, 60));
  }

  // Rename plankSeconds to abdominalReps if plankSeconds exists
  // Actually plankSeconds is different from abdominalReps, skip

  await conn.end();
  console.log('\nMigration complete!');
}

migrate().catch(console.error);
