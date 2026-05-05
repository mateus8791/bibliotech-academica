const pool = require('./src/config/database');

async function checkStructure() {
  try {
    console.log('\n=== ESTRUTURA DA TABELA LIVRO ===');
    const livroResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'livro'
      ORDER BY ordinal_position
    `);
    livroResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n=== ESTRUTURA DA TABELA USUARIO ===');
    const usuarioResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'usuario'
      ORDER BY ordinal_position
    `);
    usuarioResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n=================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

checkStructure();
