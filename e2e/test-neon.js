const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_TrQNCm0d1JFL@ep-hidden-credit-b6775np9.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require";

async function testNeon() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Neon PostgreSQL cloud database...');
    await client.connect();
    console.log('✅ Successfully connected to Neon cloud!');
    
    const res = await client.query('SELECT version();');
    console.log('PostgreSQL Version:', res.rows[0].version);

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Existing tables in Neon:', tablesRes.rows.map(r => r.table_name));

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

testNeon();
