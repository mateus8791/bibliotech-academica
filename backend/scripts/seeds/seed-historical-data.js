// Arquivo: backend/scripts/seed-historical-data.js
// FINALIDADE: Adicionar autores, relacionamentos e um histórico de empréstimos antigos. (VERSÃO CORRIGIDA)

const pool = require('../src/config/database');

async function seedHistoricalData() {
  const client = await pool.connect();
  console.log('Conexão com o banco de dados estabelecida.');

  try {
    await client.query('BEGIN');
    console.log('Iniciando script para adicionar dados históricos...');

    // --- PASSO 1: Listar todos os usuários e livros existentes para referência ---
    console.log('Buscando IDs de usuários e livros...');
    const usuariosResult = await client.query('SELECT id, email FROM usuario');
    const userMap = usuariosResult.rows.reduce((map, user) => ({ ...map, [user.email]: user.id }), {});

    const livrosResult = await client.query('SELECT id, titulo FROM livro');
    const bookMap = livrosResult.rows.reduce((map, book) => ({ ...map, [book.titulo]: book.id }), {});
    console.log('Usuários e livros carregados.');

    // --- PASSO 2: Definir e inserir todos os autores necessários (sem duplicar) ---
    console.log('Verificando e inserindo autores necessários...');
    const autoresParaAdicionar = [
      { nome: 'George Orwell', nacionalidade: 'Inglesa' }, { nome: 'José de Alencar', nacionalidade: 'Brasileira' },
      { nome: 'Aluísio Azevedo', nacionalidade: 'Brasileira' }, { nome: 'Anne Frank', nacionalidade: 'Alemã' },
      { nome: 'Bram Stoker', nacionalidade: 'Irlandesa' }, { nome: 'Mary Shelley', nacionalidade: 'Britânica' },
      { nome: 'Jane Austen', nacionalidade: 'Britânica' }, { nome: 'Emily Brontë', nacionalidade: 'Britânica' },
      { nome: 'Jorge Amado', nacionalidade: 'Brasileira' }, { nome: 'Paulo Coelho', nacionalidade: 'Brasileira' },
      { nome: 'Clarice Lispector', nacionalidade: 'Ucraniana/Brasileira' }, { nome: 'Thomas Harris', nacionalidade: 'Americana' },
      { nome: 'Markus Zusak', nacionalidade: 'Australiana' },
      { nome: 'Antoine de Saint-Exupéry', nacionalidade: 'Francesa' }, { nome: 'Machado de Assis', nacionalidade: 'Brasileira' },
      { nome: 'Franz Kafka', nacionalidade: 'Tcheca' }, { nome: 'J.R.R. Tolkien', nacionalidade: 'Britânica' },
    ];

    const autorValues = autoresParaAdicionar.flatMap(a => [a.nome, a.nacionalidade]);
    const autorPlaceholders = autoresParaAdicionar.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(',');

    const autoresResult = await client.query(`
      INSERT INTO autor (nome, nacionalidade) VALUES ${autorPlaceholders}
      ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome
      RETURNING id, nome;
    `, autorValues);
    
    const authorMap = autoresResult.rows.reduce((map, author) => ({...map, [author.nome]: author.id }), {});
    console.log('Autores verificados/inseridos com sucesso.');

    // --- PASSO 3: Mapear e criar as associações Livro <-> Autor (sem duplicar) ---
    console.log('Criando associações entre livros e autores...');
    const mapeamentoLivroAutor = {
      '1984': ['George Orwell'], 'O Pequeno Príncipe': ['Antoine de Saint-Exupéry'],
      'Dom Casmurro': ['Machado de Assis'], 'A Revolução dos Bichos': ['George Orwell'],
      'Capitães da Areia': ['Jorge Amado'], 'A Metamorfose': ['Franz Kafka'],
      'O Alquimista': ['Paulo Coelho'], 'A Menina que Roubava Livros': ['Markus Zusak'],
      'Frankenstein': ['Mary Shelley'], 'Drácula': ['Bram Stoker'],
      'Orgulho e Preconceito': ['Jane Austen'], 'O Diário de Anne Frank': ['Anne Frank'],
      'O Cortiço': ['Aluísio Azevedo'], 'O Hobbit': ['J.R.R. Tolkien'],
      'O Morro dos Ventos Uivantes': ['Emily Brontë'], 'O Silêncio dos Inocentes': ['Thomas Harris'],
      'Senhora': ['José de Alencar']
    };

    const relacoesValues = [];
    for (const [titulo, autores] of Object.entries(mapeamentoLivroAutor)) {
      const livroId = bookMap[titulo];
      if (livroId) {
        for (const nomeAutor of autores) {
          const autorId = authorMap[nomeAutor] || (await client.query('SELECT id FROM autor WHERE nome = $1', [nomeAutor])).rows[0]?.id;
          if (autorId) relacoesValues.push(livroId, autorId);
        }
      }
    }

    if (relacoesValues.length > 0) {
      const relacoesPlaceholders = relacoesValues.map((_, i) => i % 2 === 0 ? `($${i + 1}, $${i + 2})` : null).filter(Boolean).join(',');
      await client.query(`
        INSERT INTO livro_autor (livro_id, autor_id) VALUES ${relacoesPlaceholders}
        ON CONFLICT (livro_id, autor_id) DO NOTHING;
      `, relacoesValues);
      console.log('Associações criadas/verificadas com sucesso.');
    }

    // --- PASSO 4: Adicionar histórico de empréstimos (COM DATA PREVISTA) ---
    console.log('Criando histórico de empréstimos...');
    const emprestimosHistoricos = [
      { email: 'ana.marques@email.com', titulo: 'O Pequeno Príncipe', emprestimo: '2024-01-10', devolucao: '2024-01-23' },
      { email: 'carlos.lima@email.com', titulo: 'O Pequeno Príncipe', emprestimo: '2024-02-15', devolucao: '2024-02-28' },
      { email: 'fernanda.rocha@email.com', titulo: 'O Pequeno Príncipe', emprestimo: '2024-03-05', devolucao: '2024-03-18' },
      { email: 'lucas.alves@email.com', titulo: 'O Pequeno Príncipe', emprestimo: '2024-04-20', devolucao: '2024-05-02' },
      { email: 'mariana.freitas@email.com', titulo: 'A Revolução dos Bichos', emprestimo: '2024-05-01', devolucao: '2024-05-15' },
      { email: 'aluno.teste@email.com', titulo: 'O Hobbit', emprestimo: '2024-06-01', devolucao: '2024-06-14' },
      { email: 'ana.marques@email.com', titulo: 'Orgulho e Preconceito', emprestimo: '2024-07-11', devolucao: '2024-07-25' },
    ];

    const emprestimosValues = [];
    for (const emp of emprestimosHistoricos) {
      const usuarioId = userMap[emp.email];
      const livroId = bookMap[emp.titulo];
      if (usuarioId && livroId) {
        // CORREÇÃO: Calcula a data prevista (14 dias após o empréstimo)
        const dataEmprestimo = new Date(emp.emprestimo);
        const dataPrevista = new Date(dataEmprestimo.setDate(dataEmprestimo.getDate() + 14));
        const dataPrevistaFormatada = dataPrevista.toISOString().split('T')[0]; // Formata para 'YYYY-MM-DD'
        
        emprestimosValues.push(usuarioId, livroId, emp.emprestimo, dataPrevistaFormatada, emp.devolucao, 'devolvido');
      }
    }
    
    if (emprestimosValues.length > 0) {
      const emprestimosPlaceholders = emprestimosValues.map((_, i) => i % 6 === 0 ? `($${i+1}, $${i+2}, $${i+3}, $${i+4}, $${i+5}, $${i+6})` : null).filter(Boolean).join(',');
      
      // CORREÇÃO: Adicionada a coluna 'data_devolucao_prevista' no INSERT
      await client.query(`
        INSERT INTO emprestimo (usuario_id, livro_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status)
        VALUES ${emprestimosPlaceholders};
      `, emprestimosValues);
      console.log('Histórico de empréstimos criado com sucesso.');
    }

    await client.query('COMMIT');
    console.log('✅ Script de dados históricos finalizado com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao executar o script de dados históricos:', error);
  } finally {
    await client.release();
    await pool.end();
    console.log('Conexão com o banco de dados encerrada.');
  }
}

seedHistoricalData();