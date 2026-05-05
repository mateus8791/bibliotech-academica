// Arquivo: backend/scripts/check_db.js
const pool = require('../src/config/database');

async function checkDatabase() {
  console.log('--- Iniciando Verificação do Banco de Dados ---');
  let client;
  try {
    client = await pool.connect();
    const dbNameResult = await client.query('SELECT current_database();');
    console.log(`✅ Conectado com sucesso ao banco de dados: "${dbNameResult.rows[0].current_database}"`);

    console.log('\nBuscando tabelas no schema "public"...');
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
    `);

    if (tablesResult.rows.length === 0) {
      console.log('❌ Nenhuma tabela encontrada no schema public deste banco de dados.');
    } else {
      console.log('📖 Tabelas encontradas:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.tablename}`);
      });
    }
  } catch (err) {
    console.error('🔥 ERRO DURANTE A VERIFICAÇÃO:', err);
  } finally {
    if (client) await client.release();
    await pool.end();
    console.log('\n--- Verificação Concluída ---');
  }
}

checkDatabase();