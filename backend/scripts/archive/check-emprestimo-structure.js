// Script para verificar a estrutura atual da tabela emprestimo
const { Pool } = require('pg');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'bibliotech_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkStructure() {
  try {
    console.log('\n========================================');
    console.log('VERIFICANDO ESTRUTURA DA TABELA EMPRESTIMO');
    console.log('========================================\n');

    // Verificar colunas da tabela emprestimo
    const result = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'emprestimo'
      ORDER BY ordinal_position;
    `);

    console.log('Colunas encontradas na tabela emprestimo:');
    console.log('-------------------------------------------');
    result.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name.padEnd(30)} | ${col.data_type.padEnd(20)} | ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n========================================');
    console.log('VERIFICANDO ESTRUTURA DA TABELA RESERVA');
    console.log('========================================\n');

    // Verificar colunas da tabela reserva
    const result2 = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'reserva'
      ORDER BY ordinal_position;
    `);

    console.log('Colunas encontradas na tabela reserva:');
    console.log('-------------------------------------------');
    result2.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name.padEnd(30)} | ${col.data_type.padEnd(20)} | ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n========================================\n');

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkStructure();
