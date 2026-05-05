const pool = require('./src/config/database');

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n=== TABELAS NO BANCO DE DADOS ===');
    result.rows.forEach(row => {
      console.log(' -', row.table_name);
    });
    console.log('=================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Erro ao buscar tabelas:', err.message);
    process.exit(1);
  }
}

checkTables();
