const db = require('../src/config/database');

async function checkTables() {
  try {
    const tables = ['usuario', 'livro', 'autor', 'avaliacoes', 'resumo_ia'];

    for (let table of tables) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`TABELA: ${table.toUpperCase()}`);
      console.log('='.repeat(60));

      const result = await db.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          column_default,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      if (result.rows.length === 0) {
        console.log(`⚠️  Tabela "${table}" não existe!`);
      } else {
        result.rows.forEach(col => {
          const type = col.character_maximum_length
            ? `${col.data_type}(${col.character_maximum_length})`
            : col.data_type;
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
          console.log(`  ${col.column_name.padEnd(30)} ${type.padEnd(20)} ${nullable.padEnd(10)} ${defaultVal}`);
        });
      }
    }

    // Verificar dados de exemplo
    console.log('\n' + '='.repeat(60));
    console.log('DADOS DE EXEMPLO - AUTORES');
    console.log('='.repeat(60));
    const autores = await db.query('SELECT * FROM autor LIMIT 5');
    console.log(JSON.stringify(autores.rows, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('DADOS DE EXEMPLO - RESUMO_IA');
    console.log('='.repeat(60));
    const resumos = await db.query('SELECT * FROM resumo_ia LIMIT 5');
    console.log(JSON.stringify(resumos.rows, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

checkTables();
