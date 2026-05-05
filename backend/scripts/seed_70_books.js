const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function executeSeed() {
  const client = await pool.connect();

  try {
    console.log('🚀 Iniciando importação de 70 novos livros...\n');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '../migrations/seed_70_new_books.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📖 Arquivo SQL carregado com sucesso!');
    console.log('📊 Executando script...\n');

    // Executar o SQL
    await client.query(sql);

    console.log('✅ Script executado com sucesso!\n');

    // Verificar resultados
    console.log('📊 Verificando resultados...\n');

    const livrosCount = await client.query('SELECT COUNT(*) as total FROM livro');
    const autoresCount = await client.query('SELECT COUNT(*) as total FROM autor');
    const categoriasCount = await client.query('SELECT COUNT(*) as total FROM categoria');

    console.log(`📚 Total de livros no banco: ${livrosCount.rows[0].total}`);
    console.log(`👥 Total de autores no banco: ${autoresCount.rows[0].total}`);
    console.log(`🏷️  Total de categorias no banco: ${categoriasCount.rows[0].total}\n`);

    // Mostrar alguns livros adicionados
    console.log('📖 Alguns livros adicionados:\n');

    const livrosAdicionados = await client.query(`
      SELECT l.titulo, a.nome as autor, c.nome as categoria
      FROM livro l
      LEFT JOIN livro_autor la ON l.id = la.livro_id
      LEFT JOIN autor a ON la.autor_id = a.id
      LEFT JOIN livro_categoria lc ON l.id = lc.livro_id
      LEFT JOIN categoria c ON lc.categoria_id = c.id
      WHERE l.titulo LIKE '%Harry Potter%'
         OR l.titulo LIKE '%Stephen King%'
         OR l.titulo LIKE '%Alquimista%'
      LIMIT 10
    `);

    livrosAdicionados.rows.forEach((livro, index) => {
      console.log(`  ${index + 1}. "${livro.titulo}" - ${livro.autor} (${livro.categoria})`);
    });

    console.log('\n✨ Importação concluída com sucesso!');
    console.log('🌐 Acesse http://localhost:3000/loja para ver os novos livros!\n');

  } catch (error) {
    console.error('❌ Erro ao executar o seed:', error.message);
    console.error('\n🔍 Detalhes do erro:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

executeSeed();
