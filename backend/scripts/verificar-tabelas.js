// Script para verificar quais tabelas existem no banco de dados
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function verificarTabelas() {
  console.log('\n🔍 Verificando tabelas no banco de dados...\n');

  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tabelas encontradas:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    console.log(`\n✅ Total: ${result.rows.length} tabelas\n`);

    // Verificar se as tabelas necessárias existem
    const tabelasNecessarias = ['livro', 'usuario', 'emprestimo'];
    const tabelasExistentes = result.rows.map(r => r.table_name);

    console.log('🔍 Verificando tabelas necessárias para o sistema de avaliações:');
    tabelasNecessarias.forEach(tabela => {
      const existe = tabelasExistentes.includes(tabela);
      console.log(`   ${existe ? '✅' : '❌'} ${tabela}`);
    });

    const todasExistem = tabelasNecessarias.every(t => tabelasExistentes.includes(t));

    if (todasExistem) {
      console.log('\n✅ Todas as tabelas necessárias existem!');
      console.log('💡 Você pode executar: node scripts/executar-sql-avaliacoes.js\n');
    } else {
      console.log('\n⚠️  Algumas tabelas necessárias não foram encontradas.');
      console.log('💡 Certifique-se de criar as tabelas: livro, usuario e emprestimo primeiro.\n');
    }

  } catch (error) {
    console.error('\n❌ Erro ao verificar tabelas:', error.message);
  } finally {
    await pool.end();
  }
}

verificarTabelas();
