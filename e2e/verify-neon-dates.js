const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_TrQNCm0d1JFL@ep-hidden-credit-b6775np9.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  await client.query('UPDATE "Exam" SET "ExamDateStart" = NOW(), "ExamDateEnd" = NOW() + INTERVAL \'14 days\';');
  const res = await client.query('SELECT "Id", "Name", "ExamDateStart", "ExamDateEnd", "EnableNegativeMarking", "HasLiveVideo" FROM "Exam" ORDER BY "Id";');
  console.log('✅ Neon Exams are Active:');
  res.rows.forEach(r => {
    console.log(`[Exam #${r.Id}] ${r.Name} | NegMark: ${r.EnableNegativeMarking} | LiveVideo: ${r.HasLiveVideo} | Start: ${r.ExamDateStart} | End: ${r.ExamDateEnd}`);
  });
  await client.end();
}

check();
