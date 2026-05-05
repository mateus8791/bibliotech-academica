require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function run() {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'migrations', '006_populate_num_emprestimos.sql'),
    'utf8'
  );

  console.log('🚀 Executando migration 006...');
  await pool.query(sql);
  console.log('✅ Migration concluída!');

  // Mostra os 10 livros com mais empréstimos para validar
  const { rows } = await pool.query(
    'SELECT titulo, num_emprestimos FROM livro ORDER BY num_emprestimos DESC LIMIT 10'
  );
  console.log('\n📊 Top 10 livros mais emprestados:');
  rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.titulo} — ${r.num_emprestimos} empréstimos`));

  await pool.end();
}

run().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
