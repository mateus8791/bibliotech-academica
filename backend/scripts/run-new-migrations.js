// Script para executar apenas as novas migrations (003 e 004)
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function runNewMigrations() {
  console.log('🚀 Iniciando execução das novas migrations (003, 004)...\n');

  const migrations = [
    '003_create_rbac_system.sql',
    '004_create_access_logs.sql'
  ];

  for (const file of migrations) {
    const filePath = path.join(__dirname, '../migrations', file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Migration ${file} não encontrada, pulando...`);
      continue;
    }

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

  console.log('🎉 Todas as novas migrations foram executadas com sucesso!');
  process.exit(0);
}

runNewMigrations();
