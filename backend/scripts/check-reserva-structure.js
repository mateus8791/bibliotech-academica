// Script para verificar estrutura da tabela reserva
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkStructure() {
  const client = await pool.connect();

  try {
    // Verificar constraint de status
    const { rows } = await client.query(`
      SELECT
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'reserva'::regclass
      AND contype = 'c';
    `);

    console.log('📋 Constraints da tabela reserva:');
    rows.forEach(row => {
      console.log(`\n${row.constraint_name}:`);
      console.log(`  ${row.constraint_definition}`);
    });

    // Verificar colunas
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'reserva'
      ORDER BY ordinal_position;
    `);

    console.log('\n\n📋 Colunas da tabela reserva:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkStructure();
