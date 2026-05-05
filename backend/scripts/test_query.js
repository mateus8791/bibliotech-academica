const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testQuery() {
  try {
    const query = `
      SELECT
        l.id,
        l.titulo,
        l.preco,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', a.id, 'nome', a.nome)
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS autores,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', c.id, 'nome', c.nome)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS categorias
      FROM
        livro l
      LEFT JOIN
        livro_autor la ON l.id = la.livro_id
      LEFT JOIN
        autor a ON la.autor_id = a.id
      LEFT JOIN
        livro_categoria lc ON l.id = lc.livro_id
      LEFT JOIN
        categoria c ON lc.categoria_id = c.id
      GROUP BY
        l.id
      ORDER BY
        l.data_cadastro DESC, l.titulo ASC;
    `;

    const result = await pool.query(query);
    console.log('✅ Total de livros retornados pela query:', result.rows.length);
    console.log('\n📚 Primeiros 5 livros:');
    result.rows.slice(0, 5).forEach((livro, index) => {
      console.log(`  ${index + 1}. "${livro.titulo}" - Preço: R$ ${livro.preco}`);
      console.log(`     Autores:`, JSON.stringify(livro.autores));
      console.log(`     Categorias:`, JSON.stringify(livro.categorias));
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

testQuery();
