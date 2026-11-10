const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://neondb_owner:npg_TrQNCm0d1JFL@ep-hidden-credit-b6775np9.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require";

async function seedNeon() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Neon PostgreSQL cloud database...');
    await client.connect();
    console.log('Connected! Reading backend/seed-postgres.sql...');

    const sqlPath = path.join(__dirname, '..', 'backend', 'seed-postgres.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`Executing SQL script (${(sql.length / 1024).toFixed(1)} KB) into Neon...`);
    await client.query(sql);

    console.log('✅ Seed SQL executed successfully!');

    // Verify tables and row counts
    const tables = ['Teacher', 'Student', 'Department', 'Course', 'Exam', 'ExamQuestion', 'StudentExam'];
    for (const t of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM "${t}";`);
      console.log(`- Table "${t}": ${res.rows[0].count} rows`);
    }

    console.log('\n🎉 NEON CLOUD DATABASE FULLY SEEDED & READY FOR PRODUCTION!');
  } catch (err) {
    console.error('❌ Error seeding Neon:', err.message);
  } finally {
    await client.end();
  }
}

seedNeon();
