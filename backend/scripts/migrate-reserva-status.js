// Script para atualizar a constraint de status da tabela reserva
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrateStatus() {
  const client = await pool.connect();

  try {
    console.log('🔄 Atualizando constraint de status da tabela reserva...\n');

    // 1. Remover constraint antiga
    console.log('1️⃣  Removendo constraint antiga...');
    await client.query(`
      ALTER TABLE reserva DROP CONSTRAINT IF EXISTS reserva_status_check;
    `);
    console.log('   ✅ Constraint antiga removida\n');

    // 2. Adicionar nova constraint com todos os status
    console.log('2️⃣  Adicionando nova constraint...');
    await client.query(`
      ALTER TABLE reserva ADD CONSTRAINT reserva_status_check
      CHECK (status IN ('ativa', 'cancelada', 'atendida', 'aguardando', 'disponivel', 'cancelado', 'concluido', 'expirado'));
    `);
    console.log('   ✅ Nova constraint adicionada\n');

    // 3. Mostrar status aceitos
    console.log('📋 Status aceitos agora:');
    console.log('   - ativa (status antigo)');
    console.log('   - cancelada (status antigo)');
    console.log('   - atendida (status antigo)');
    console.log('   - aguardando (novo)');
    console.log('   - disponivel (novo)');
    console.log('   - cancelado (novo)');
    console.log('   - concluido (novo)');
    console.log('   - expirado (novo)');

    console.log('\n✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao migrar:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
