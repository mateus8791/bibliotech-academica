// Script para adicionar campo foto_url na tabela autor
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'bibliotech_db',
  password: String(process.env.DB_PASSWORD || ''),
  port: parseInt(process.env.DB_PORT) || 5432,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔧 Iniciando migration: adicionando campo foto_url na tabela autor...');

    // Adicionar coluna foto_url
    await client.query(`
      ALTER TABLE autor ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);
    `);

    console.log('✅ Campo foto_url adicionado com sucesso!');

    // Opcional: Adicionar fotos de exemplo para alguns autores
    console.log('\n📸 Adicionando fotos de exemplo aos autores...');

    const fotosExemplo = [
      {
        nome: 'Machado de Assis',
        foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Machado_de_Assis_1904.jpg/220px-Machado_de_Assis_1904.jpg'
      },
      {
        nome: 'J.K. Rowling',
        foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/J._K._Rowling_2010.jpg/220px-J._K._Rowling_2010.jpg'
      },
      {
        nome: 'George Orwell',
        foto: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/George_Orwell_press_photo.jpg/220px-George_Orwell_press_photo.jpg'
      }
    ];

    for (const autor of fotosExemplo) {
      const result = await client.query(
        'UPDATE autor SET foto_url = $1 WHERE nome = $2 RETURNING nome',
        [autor.foto, autor.nome]
      );

      if (result.rowCount > 0) {
        console.log(`   ✓ Foto adicionada para: ${autor.nome}`);
      }
    }

    console.log('\n🎉 Migration concluída com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Reinicie o backend (npm run dev)');
    console.log('   2. Acesse http://localhost:3000');
    console.log('   3. Clique em qualquer livro para testar o sistema de aluguel');

  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
