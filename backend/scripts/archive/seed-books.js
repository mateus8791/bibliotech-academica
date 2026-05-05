// Script para popular o banco de dados com livros de exemplo
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function seedBooks() {
  const client = await pool.connect();

  try {
    console.log('🔍 Verificando dados existentes...\n');

    // Verificar quantos livros existem
    const livrosCount = await client.query('SELECT COUNT(*) as total FROM livro');
    console.log(`📚 Total de livros: ${livrosCount.rows[0].total}`);

    const autoresCount = await client.query('SELECT COUNT(*) as total FROM autor');
    console.log(`✍️  Total de autores: ${autoresCount.rows[0].total}`);

    const categoriasCount = await client.query('SELECT COUNT(*) as total FROM categoria');
    console.log(`📂 Total de categorias: ${categoriasCount.rows[0].total}\n`);

    // Inserir categorias
    console.log('📂 Inserindo categorias...');
    await client.query(`
      INSERT INTO categoria (nome, descricao)
      VALUES
        ('Ficção Científica', 'Livros de ficção científica'),
        ('Romance', 'Livros de romance'),
        ('Literatura Clássica', 'Clássicos da literatura mundial'),
        ('Literatura Brasileira', 'Obras da literatura brasileira')
      ON CONFLICT DO NOTHING
    `);

    // Inserir autores
    console.log('✍️  Inserindo autores...');
    await client.query(`
      INSERT INTO autor (nome, biografia, nacionalidade)
      VALUES
        ('George Orwell', 'Escritor, jornalista e ensaísta político inglês', 'Britânico'),
        ('Isaac Asimov', 'Escritor e bioquímico americano', 'Russo-Americano'),
        ('Machado de Assis', 'Escritor brasileiro, considerado um dos maiores nomes da literatura brasileira', 'Brasileiro'),
        ('José de Alencar', 'Escritor e político brasileiro, um dos maiores representantes do Romantismo', 'Brasileiro'),
        ('Arthur Conan Doyle', 'Escritor britânico, criador do detetive Sherlock Holmes', 'Britânico')
      ON CONFLICT DO NOTHING
    `);

    // Inserir livros
    console.log('📚 Inserindo livros...');
    await client.query(`
      INSERT INTO livro (titulo, isbn, ano_publicacao, num_paginas, sinopse, capa_url, quantidade_disponivel, preco, preco_promocional, promocao_ativa)
      VALUES
        (
          '1984',
          '978-0451524935',
          1949,
          328,
          'Uma distopia sombria onde Big Brother observa tudo. Winston Smith luta contra a tirania totalitária que controla até os pensamentos.',
          'https://m.media-amazon.com/images/I/71rpa1-kyvL._AC_UF1000,1000_QL80_.jpg',
          5,
          3.50,
          2.50,
          true
        ),
        (
          'Fundação',
          '978-8576570646',
          1951,
          244,
          'Hari Seldon prevê a queda do Império Galáctico usando psicohistória. Cria duas Fundações para preservar o conhecimento.',
          'https://m.media-amazon.com/images/I/81gq-I9PE9L._AC_UF1000,1000_QL80_.jpg',
          3,
          4.00,
          NULL,
          false
        ),
        (
          'Dom Casmurro',
          '978-8535911664',
          1899,
          256,
          'Bentinho narra sua vida e o tormento do ciúme de Capitu. Será que ela o traiu com Escobar?',
          'https://m.media-amazon.com/images/I/71c7p6HZ3IL._AC_UF1000,1000_QL80_.jpg',
          7,
          2.50,
          NULL,
          false
        ),
        (
          'Iracema',
          '978-8508040407',
          1865,
          96,
          'Lenda do Ceará: o amor impossível entre a índia Iracema e o português Martim.',
          'https://m.media-amazon.com/images/I/81X1rRRt9hL._AC_UF1000,1000_QL80_.jpg',
          4,
          2.00,
          1.50,
          true
        ),
        (
          'Um Estudo em Vermelho',
          '978-8544001011',
          1887,
          176,
          'A primeira aventura de Sherlock Holmes e Dr. Watson investigando assassinatos misteriosos em Londres.',
          'https://m.media-amazon.com/images/I/81V8Em0GOHL._AC_UF1000,1000_QL80_.jpg',
          6,
          3.00,
          NULL,
          false
        ),
        (
          'A Revolução dos Bichos',
          '978-0451526342',
          1945,
          112,
          'Animais expulsam fazendeiro e criam sociedade igualitária. Porcos assumem poder e se tornam tão tiranos quanto humanos.',
          'https://m.media-amazon.com/images/I/91V69jmK48L._AC_UF1000,1000_QL80_.jpg',
          8,
          2.80,
          2.00,
          true
        )
      ON CONFLICT (isbn) DO NOTHING
    `);

    // Associar livros com autores
    console.log('🔗 Associando livros com autores...');
    const associacoes = [
      { livro: '1984', autor: 'George Orwell' },
      { livro: 'Fundação', autor: 'Isaac Asimov' },
      { livro: 'Dom Casmurro', autor: 'Machado de Assis' },
      { livro: 'Iracema', autor: 'José de Alencar' },
      { livro: 'Um Estudo em Vermelho', autor: 'Arthur Conan Doyle' },
      { livro: 'A Revolução dos Bichos', autor: 'George Orwell' }
    ];

    for (const assoc of associacoes) {
      await client.query(`
        INSERT INTO livro_autor (livro_id, autor_id)
        SELECT l.id, a.id
        FROM livro l, autor a
        WHERE l.titulo = $1 AND a.nome = $2
        ON CONFLICT DO NOTHING
      `, [assoc.livro, assoc.autor]);
    }

    // Associar livros com categorias
    console.log('🔗 Associando livros com categorias...');
    const categoriasAssoc = [
      { livro: '1984', categoria: 'Ficção Científica' },
      { livro: '1984', categoria: 'Literatura Clássica' },
      { livro: 'Fundação', categoria: 'Ficção Científica' },
      { livro: 'Dom Casmurro', categoria: 'Literatura Brasileira' },
      { livro: 'Dom Casmurro', categoria: 'Literatura Clássica' },
      { livro: 'Iracema', categoria: 'Literatura Brasileira' },
      { livro: 'Iracema', categoria: 'Romance' },
      { livro: 'Um Estudo em Vermelho', categoria: 'Literatura Clássica' },
      { livro: 'A Revolução dos Bichos', categoria: 'Literatura Clássica' }
    ];

    for (const assoc of categoriasAssoc) {
      await client.query(`
        INSERT INTO livro_categoria (livro_id, categoria_id)
        SELECT l.id, c.id
        FROM livro l, categoria c
        WHERE l.titulo = $1 AND c.nome = $2
        ON CONFLICT DO NOTHING
      `, [assoc.livro, assoc.categoria]);
    }

    // Verificar resultado final
    console.log('\n✅ Dados inseridos com sucesso!\n');
    console.log('📚 Livros cadastrados:');
    const livros = await client.query(`
      SELECT l.id, l.titulo, l.preco, l.quantidade_disponivel,
             STRING_AGG(DISTINCT a.nome, ', ') as autores,
             STRING_AGG(DISTINCT c.nome, ', ') as categorias
      FROM livro l
      LEFT JOIN livro_autor la ON l.id = la.livro_id
      LEFT JOIN autor a ON la.autor_id = a.id
      LEFT JOIN livro_categoria lc ON l.id = lc.livro_id
      LEFT JOIN categoria c ON lc.categoria_id = c.id
      GROUP BY l.id, l.titulo, l.preco, l.quantidade_disponivel
      ORDER BY l.titulo
    `);

    livros.rows.forEach(livro => {
      console.log(`\n📖 ${livro.titulo}`);
      console.log(`   Autor(es): ${livro.autores || 'N/A'}`);
      console.log(`   Categoria(s): ${livro.categorias || 'N/A'}`);
      console.log(`   Preço: R$ ${livro.preco}`);
      console.log(`   Disponíveis: ${livro.quantidade_disponivel}`);
    });

    console.log('\n🎉 Seed concluído com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedBooks().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
