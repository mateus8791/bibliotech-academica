// Arquivo: backend/scripts/seed-extra-data.js (VERSÃO FINAL E CORRIGIDA)

const pool = require('../src/config/database');

async function seedExtraData() {
  const client = await pool.connect();
  console.log('Conexão com o banco de dados estabelecida.');

  try {
    await client.query('BEGIN');
    console.log('Iniciando o processo de adição de dados...');

    // --- PASSO 1: Buscar IDs dos usuários existentes que usaremos ---
    console.log('Buscando IDs de usuários existentes...');
    const usuariosResult = await client.query(`
      SELECT id, nome, email FROM usuario WHERE email IN (
        'aluno.teste@email.com',
        'ana.marques@email.com',
        'carlos.lima@email.com',
        'fernanda.rocha@email.com'
      );
    `);

    // Mapeia os emails para os IDs para fácil acesso
    const userMap = usuariosResult.rows.reduce((map, user) => {
        map[user.email] = user.id;
        return map;
    }, {});

    const alunoTesteId = userMap['aluno.teste@email.com'];
    const anaMarquesId = userMap['ana.marques@email.com'];
    const carlosLimaId = userMap['carlos.lima@email.com'];
    const fernandaRochaId = userMap['fernanda.rocha@email.com'];

    if (!alunoTesteId || !anaMarquesId || !carlosLimaId) {
        throw new Error('Não foi possível encontrar todos os IDs de usuários necessários. Verifique os e-mails no script e no banco de dados.');
    }
    console.log('IDs de usuários encontrados com sucesso.');


    // --- PASSO 2: Buscar IDs dos livros existentes que usaremos ---
    console.log('Buscando IDs de livros existentes...');
    const livrosResult = await client.query(`
      SELECT id, titulo FROM livro WHERE titulo IN (
        'O Pequeno Príncipe',
        'Dom Casmurro',
        'A Metamorfose',
        'O Hobbit'
      );
    `);
    
    // Mapeia os títulos para os IDs
    const bookMap = livrosResult.rows.reduce((map, book) => {
        map[book.titulo] = book.id;
        return map;
    }, {});

    const pequenoPrincipeId = bookMap['O Pequeno Príncipe'];
    const domCasmurroId = bookMap['Dom Casmurro'];
    const aMetamorfoseId = bookMap['A Metamorfose'];
    const oHobbitId = bookMap['O Hobbit'];

    if (!pequenoPrincipeId || !domCasmurroId || !aMetamorfoseId || !oHobbitId) {
        throw new Error('Não foi possível encontrar todos os IDs de livros necessários. Verifique os títulos no script e no banco de dados.');
    }
    console.log('IDs de livros encontrados com sucesso.');

    
    // --- PASSO 3: Inserir autores (se ainda não existirem) ---
    console.log('Inserindo novos autores...');
    const autoresResult = await client.query(`
        INSERT INTO autor (nome, nacionalidade) VALUES
        ('Antoine de Saint-Exupéry', 'Francesa'),
        ('Machado de Assis', 'Brasileira'),
        ('Franz Kafka', 'Tcheca'),
        ('J.R.R. Tolkien', 'Britânica')
        ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome -- Ação para garantir que RETURNING funcione mesmo em conflito
        RETURNING id, nome;
    `);

    // Mapeia os nomes dos autores para os IDs
    const authorMap = autoresResult.rows.reduce((map, author) => {
        map[author.nome] = author.id;
        return map;
    }, {});

    const saintExuperyId = authorMap['Antoine de Saint-Exupéry'];
    const machadoDeAssisId = authorMap['Machado de Assis'];
    const kafkaId = authorMap['Franz Kafka'];
    const tolkienId = authorMap['J.R.R. Tolkien'];
    console.log('Autores inseridos ou já existentes.');


    // --- PASSO 4: Relacionar livros e autores (com segurança) ---
    console.log('Criando relacionamento entre livros e autores...');
    await client.query(`
      INSERT INTO livro_autor (livro_id, autor_id) VALUES
        ($1, $2),
        ($3, $4),
        ($5, $6),
        ($7, $8)
      ON CONFLICT (livro_id, autor_id) DO NOTHING;
    `, [pequenoPrincipeId, saintExuperyId, domCasmurroId, machadoDeAssisId, aMetamorfoseId, kafkaId, oHobbitId, tolkienId]);
    console.log('Relacionamentos livro-autor criados ou verificados.');


    // --- PASSO 5: Criar novos empréstimos ---
    console.log('Inserindo novos registros de empréstimo...');
    await client.query(`
      INSERT INTO emprestimo (usuario_id, livro_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status) VALUES
        -- Empréstimo ativo para Ana, com status 'ativo'
        ($1, $2, NOW(), NOW() + interval '14 days', NULL, 'ativo'),
        -- Empréstimo já devolvido por Carlos, com status 'devolvido'
        ($3, $4, '2025-05-10', '2025-05-24', '2025-05-22', 'devolvido');
    `, [anaMarquesId, domCasmurroId, carlosLimaId, aMetamorfoseId]);
    console.log('Novos empréstimos criados.');


    // --- PASSO 6: Criar novas reservas ---
    console.log('Inserindo novos registros de reserva...');
    await client.query(`
      INSERT INTO reserva (usuario_id, livro_id, data_reserva, status, data_expiracao) VALUES
        ($1, $2, NOW(), 'ativa', NOW() + interval '3 days');
    `, [alunoTesteId, domCasmurroId]);
    console.log('Novas reservas criadas.');


    await client.query('COMMIT');
    console.log('✅ Banco de dados populado com sucesso com dados extras!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao adicionar dados extras no banco de dados:', error);
  } finally {
    await client.release();
    await pool.end();
    console.log('Conexão com o banco de dados encerrada.');
  }
}

seedExtraData();