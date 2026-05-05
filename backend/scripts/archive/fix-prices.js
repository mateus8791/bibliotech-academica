// Script para corrigir preços dos livros
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixPrices() {
  const client = await pool.connect();

  try {
    console.log('💰 Atualizando preços dos livros...\n');

    // Atualizar todos os livros com preço 0 para ter um preço mínimo
    const result = await client.query(`
      UPDATE livro
      SET preco = 2.50
      WHERE preco = 0 OR preco IS NULL
    `);

    console.log(`✅ ${result.rowCount} livros atualizados com preço mínimo de R$ 2.50\n`);

    // Verificar livros atualizados
    const livros = await client.query(`
      SELECT titulo, preco, quantidade_disponivel
      FROM livro
      ORDER BY titulo
    `);

    console.log('📚 Preços atualizados:');
    livros.rows.forEach(livro => {
      console.log(`   ${livro.titulo}: R$ ${parseFloat(livro.preco).toFixed(2)} - ${livro.quantidade_disponivel} disponíveis`);
    });

    console.log('\n🎉 Preços corrigidos com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro ao atualizar preços:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixPrices().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
