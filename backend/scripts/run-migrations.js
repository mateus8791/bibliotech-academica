// Script para executar migrations no banco de dados
// Arquivo: backend/scripts/run-migrations.js

const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function runMigrations() {
  console.log('🚀 Iniciando execução das migrations...\n');

  const migrationsDir = path.join(__dirname, '../migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql')).sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`📝 Executando migration: ${file}`);

    try {
      await pool.query(sql);
      console.log(`✅ Migration ${file} executada com sucesso!\n`);
    } catch (error) {
      console.error(`❌ Erro ao executar migration ${file}:`, error.message);
      console.error('Detalhes:', error);
      process.exit(1);
    }
  }

  console.log('🎉 Todas as migrations foram executadas com sucesso!');
  process.exit(0);
}

runMigrations();
