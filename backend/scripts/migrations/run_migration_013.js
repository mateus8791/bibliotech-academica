// Script para executar a migration 013 (coluna status em avaliacoes)
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const pool = require('../../src/config/database');

async function run() {
  const file = '013_add_status_avaliacoes.sql';
  const filePath = path.join(__dirname, '../../migrations', file);

  console.log(`\n📝 Executando migration: ${file}`);

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    await pool.query(sql);
    console.log(`✅ Migration ${file} executada com sucesso!\n`);
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('column') && error.message.includes('already exists')) {
      console.log(`ℹ️  Coluna já existe — migration já foi aplicada anteriormente.`);
    } else {
      console.error(`❌ Erro:`, error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

run();
