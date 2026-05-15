// Arquivo: backend/scripts/seed.js (Versão completa para popular o banco)

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' }); // Garante que o .env da pasta backend seja lido

// Configuração do Pool de Conexão
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function popularBanco() {
  const client = await pool.connect();
  try {
    console.log('Iniciando a população do banco de dados...');
    await client.query('BEGIN');

    // --- 1. LIMPAR DADOS ANTIGOS (na ordem correta de dependência) ---
    console.log('Limpando tabelas existentes...');
    await client.query('TRUNCATE TABLE "Auditoria_Acoes", "Transacao_Financeira", "Reserva", "Emprestimo", "Livro_Autor", "Livro_Categoria", "Livro", "Autor", "Categoria", "Usuario" RESTART IDENTITY CASCADE');
    console.log('Tabelas limpas com sucesso.');

    // --- 2. CRIAR DADOS BASE (Autores e Categorias) ---
    console.log('Criando autores e categorias...');
    const autoresResult = await client.query(`
      INSERT INTO "Autor" (nome, nacionalidade) VALUES
      ('Machado de Assis', 'Brasileiro'),
      ('J.K. Rowling', 'Britânica'),
      ('George Orwell', 'Britânico'),
      ('Isaac Asimov', 'Russo-Americano')
      RETURNING id, nome;
    `);
    const autores = autoresResult.rows;

    const categoriasResult = await client.query(`
      INSERT INTO "Categoria" (nome, descricao) VALUES
      ('Ficção Científica', 'Obras que exploram conceitos imaginativos baseados na ciência.'),
      ('Distopia', 'Sociedades futurísticas oplressivas.'),
      ('Fantasia', 'Mundos mágicos e criaturas fantásticas.'),
      ('Romance Brasileiro', 'Obras clássicas da literatura brasileira.')
      RETURNING id, nome;
    `);
    const categorias = categoriasResult.rows;
    console.log('Autores e categorias criados.');

    // --- 3. CRIAR USUÁRIOS ---
    console.log('Criando usuários...');
    const salt = await bcrypt.genSalt(10);
    const senhaPadraoHash = await bcrypt.hash('123456', salt);
    
    const usuariosResult = await client.query(`
      INSERT INTO "Usuario" (nome, email, senha_hash, tipo_usuario, foto_url) VALUES
      ('Admin Bibliotecário', 'admin@bibliotech.com', $1, 'admin', 'https://i.pravatar.cc/150?u=admin'),
      ('Ana Silva (Aluna)', 'ana.silva@email.com', $1, 'aluno', 'https://i.pravatar.cc/150?u=ana'),
      ('Bruno Costa (Aluno)', 'bruno.costa@email.com', $1, 'aluno', 'https://i.pravatar.cc/150?u=bruno'),
      ('Carla Dias (Bibliotecária)', 'carla.dias@bibliotech.com', $1, 'bibliotecario', 'https://i.pravatar.cc/150?u=carla')
      RETURNING id, nome, tipo_usuario;
    `, [senhaPadraoHash]);
    const usuarios = usuariosResult.rows;
    console.log('Usuários criados.');

    // --- 4. CRIAR LIVROS ---
    console.log('Criando livros...');
    const livrosResult = await client.query(`
      INSERT INTO "Livro" (titulo, isbn, ano_publicacao, quantidade_disponivel) VALUES
      ('1984', '978-85-359-0278-8', 1949, 3),
      ('Harry Potter e a Pedra Filosofal', '978-85-325-1101-0', 1997, 5),
      ('Dom Casmurro', '978-85-325-2644-7', 1899, 2),
      ('Eu, Robô', '978-85-7657-020-8', 1950, 4)
      RETURNING id, titulo;
    `);
    const livros = livrosResult.rows;
    console.log('Livros criados.');

    // --- 5. ASSOCIAR LIVROS A AUTORES E CATEGORIAS ---
    console.log('Associando livros...');
    const getAutorId = (nome) => autores.find(a => a.nome === nome).id;
    const getCategoriaId = (nome) => categorias.find(c => c.nome === nome).id;
    const getLivroId = (titulo) => livros.find(l => l.titulo === titulo).id;

    await client.query('INSERT INTO "Livro_Autor" (livro_id, autor_id) VALUES ($1, $2)', [getLivroId('1984'), getAutorId('George Orwell')]);
    await client.query('INSERT INTO "Livro_Categoria" (livro_id, categoria_id) VALUES ($1, $2)', [getLivroId('1984'), getCategoriaId('Distopia')]);
    
    await client.query('INSERT INTO "Livro_Autor" (livro_id, autor_id) VALUES ($1, $2)', [getLivroId('Harry Potter e a Pedra Filosofal'), getAutorId('J.K. Rowling')]);
    await client.query('INSERT INTO "Livro_Categoria" (livro_id, categoria_id) VALUES ($1, $2)', [getLivroId('Harry Potter e a Pedra Filosofal'), getCategoriaId('Fantasia')]);

    await client.query('INSERT INTO "Livro_Autor" (livro_id, autor_id) VALUES ($1, $2)', [getLivroId('Dom Casmurro'), getAutorId('Machado de Assis')]);
    await client.query('INSERT INTO "Livro_Categoria" (livro_id, categoria_id) VALUES ($1, $2)', [getLivroId('Dom Casmurro'), getCategoriaId('Romance Brasileiro')]);
    
    await client.query('INSERT INTO "Livro_Autor" (livro_id, autor_id) VALUES ($1, $2)', [getLivroId('Eu, Robô'), getAutorId('Isaac Asimov')]);
    await client.query('INSERT INTO "Livro_Categoria" (livro_id, categoria_id) VALUES ($1, $2)', [getLivroId('Eu, Robô'), getCategoriaId('Ficção Científica')]);
    console.log('Associações concluídas.');

    // --- 6. SIMULAR EMPRÉSTIMOS E RESERVAS ---
    console.log('Simulando empréstimos e reservas...');
    const getUsuarioId = (nome) => usuarios.find(u => u.nome.includes(nome)).id;

    // Empréstimo Ativo
    await client.query(`INSERT INTO "Emprestimo" (livro_id, usuario_id, data_devolucao_prevista, status) VALUES ($1, $2, NOW() + interval '14 days', 'ativo')`, [getLivroId('1984'), getUsuarioId('Ana')]);
    // Empréstimo Atrasado
    await client.query(`INSERT INTO "Emprestimo" (livro_id, usuario_id, data_emprestimo, data_devolucao_prevista, status) VALUES ($1, $2, NOW() - interval '20 days', NOW() - interval '6 days', 'atrasado')`, [getLivroId('Eu, Robô'), getUsuarioId('Bruno')]);
    // Empréstimo Devolvido (para histórico)
    await client.query(`INSERT INTO "Emprestimo" (livro_id, usuario_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status) VALUES ($1, $2, NOW() - interval '40 days', NOW() - interval '26 days', NOW() - interval '25 days', 'devolvido')`, [getLivroId('Dom Casmurro'), getUsuarioId('Ana')]);
    
    // Reserva Ativa
    await client.query(`INSERT INTO "Reserva" (livro_id, usuario_id, data_expiracao, status) VALUES ($1, $2, NOW() + interval '3 days', 'ativa')`, [getLivroId('Harry Potter e a Pedra Filosofal'), getUsuarioId('Bruno')]);
    console.log('Empréstimos e reservas simulados.');

    // --- 7. SIMULAR TRANSAÇÕES FINANCEIRAS ---
    console.log('Simulando transações financeiras...');
    await client.query(`INSERT INTO "Transacao_Financeira" (descricao, valor, tipo) VALUES ($1, $2, 'orcamento_acervo')`, ['Orçamento inicial para compra de livros', 5000.00]);
    await client.query(`INSERT INTO "Transacao_Financeira" (descricao, valor, tipo) VALUES ($1, $2, 'multa_atraso')`, ['Pagamento de multa por atraso - Livro "Cem Anos de Solidão"', 7.50]);
    console.log('Transações financeiras simuladas.');

    await client.query('COMMIT');
    console.log('\n✅ Banco de dados populado com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERRO AO POPULAR O BANCO DE DADOS:', error);
  } finally {
    client.release();
    pool.end();
    console.log('Conexão com o banco de dados finalizada.');
  }
}

popularBanco();