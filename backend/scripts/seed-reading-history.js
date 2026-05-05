// Arquivo: backend/scripts/seed-reading-history.js
// FINALIDADE: Criar um histórico de leitura detalhado para 3 alunos e adicionar novas reservas.

const pool = require('../src/config/database');

// Função auxiliar para embaralhar um array
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

async function seedReadingHistory() {
  const client = await pool.connect();
  console.log('Conexão com o banco de dados estabelecida.');

  try {
    await client.query('BEGIN');
    console.log('Iniciando script para criar histórico de leitura e novas reservas...');

    // --- PASSO 1: Carregar todos os usuários e livros ---
    console.log('Buscando todos os usuários e livros...');
    const usuariosResult = await client.query('SELECT id, email FROM usuario');
    const userMap = usuariosResult.rows.reduce((map, user) => ({ ...map, [user.email]: user.id }), {});

    const livrosResult = await client.query('SELECT id, titulo FROM livro');
    const allBooks = livrosResult.rows;
    console.log(`Carregados ${usuariosResult.rowCount} usuários e ${livrosResult.rowCount} livros.`);

    // --- PASSO 2: Criar histórico de leitura para 3 alunos ---
    console.log('Gerando histórico de leitura...');

    const readingHistories = [
      { email: 'fernanda.rocha@email.com', livrosLidos: 7 }, // Aluna que mais leu
      { email: 'ana.marques@email.com', livrosLidos: 5 },
      { email: 'lucas.alves@email.com', livrosLidos: 3 },
    ];

    // Embaralha a lista de livros para garantir variedade a cada execução (se necessário)
    let availableBooks = shuffleArray([...allBooks]);
    
    // Lista para armazenar todos os dados de empréstimos a serem inseridos
    const emprestimosParaInserir = [];
    let dataEmprestimoAtual = new Date('2023-01-15'); // Começamos com uma data no passado

    for (const history of readingHistories) {
      const usuarioId = userMap[history.email];
      if (!usuarioId) {
        console.warn(`Usuário ${history.email} não encontrado. Pulando.`);
        continue;
      }

      const livrosParaEsteUsuario = availableBooks.splice(0, history.livrosLidos);

      for (const livro of livrosParaEsteUsuario) {
        // Simula o avanço do tempo entre os empréstimos
        dataEmprestimoAtual.setDate(dataEmprestimoAtual.getDate() + (15 + Math.floor(Math.random() * 30))); // Avança entre 15 e 45 dias
        
        const dataEmprestimoFormatada = dataEmprestimoAtual.toISOString().split('T')[0];
        
        const dataPrevista = new Date(dataEmprestimoAtual);
        dataPrevista.setDate(dataPrevista.getDate() + 14);
        const dataPrevistaFormatada = dataPrevista.toISOString().split('T')[0];
        
        const dataDevolucao = new Date(dataPrevista);
        dataDevolucao.setDate(dataDevolucao.getDate() - Math.floor(Math.random() * 5)); // Devolveu um pouco antes ou no dia
        const dataDevolucaoFormatada = dataDevolucao.toISOString().split('T')[0];

        emprestimosParaInserir.push({
          usuarioId,
          livroId: livro.id,
          data_emprestimo: dataEmprestimoFormatada,
          data_devolucao_prevista: dataPrevistaFormatada,
          data_devolucao_real: dataDevolucaoFormatada,
          status: 'devolvido',
        });
      }
    }

    // *** VERIFICAÇÃO DE SEGURANÇA CONTRA DUPLICAÇÃO ***
    if (emprestimosParaInserir.length > 0) {
      const primeiroEmprestimo = emprestimosParaInserir[0];
      const checkResult = await client.query(
        `SELECT 1 FROM emprestimo WHERE usuario_id = $1 AND livro_id = $2 AND data_emprestimo = $3`,
        [primeiroEmprestimo.usuarioId, primeiroEmprestimo.livroId, primeiroEmprestimo.data_emprestimo]
      );

      if (checkResult.rowCount === 0) {
        const emprestimosValues = emprestimosParaInserir.flatMap(e => [e.usuarioId, e.livroId, e.data_emprestimo, e.data_devolucao_prevista, e.data_devolucao_real, e.status]);
        const emprestimosPlaceholders = emprestimosParaInserir.map((_, i) => `($${i*6+1}, $${i*6+2}, $${i*6+3}, $${i*6+4}, $${i*6+5}, $${i*6+6})`).join(',');
        
        await client.query(`
          INSERT INTO emprestimo (usuario_id, livro_id, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status)
          VALUES ${emprestimosPlaceholders};
        `, emprestimosValues);
        console.log(`${emprestimosParaInserir.length} registros de histórico de leitura foram criados.`);
      } else {
        console.log('Verificação de segurança: Histórico de leitura já parece existir. Nenhum registro foi inserido.');
      }
    }

    // --- PASSO 3: Adicionar novas reservas ativas ---
    console.log('Adicionando novas reservas...');
    const reservasParaInserir = [
      { email: 'mariana.freitas@email.com', titulo: '1984' },
      { email: 'carlos.lima@email.com', titulo: 'O Silêncio dos Inocentes' },
    ];
    
    for (const res of reservasParaInserir) {
      const usuarioId = userMap[res.email];
      const livroId = allBooks.find(b => b.titulo === res.titulo)?.id;

      if(usuarioId && livroId) {
        // Insere a reserva APENAS SE não houver uma reserva ativa para o mesmo usuário e livro
        await client.query(`
          INSERT INTO reserva (usuario_id, livro_id, data_reserva, status, data_expiracao)
          SELECT $1, $2, NOW(), 'ativa', NOW() + interval '3 days'
          WHERE NOT EXISTS (
            SELECT 1 FROM reserva 
            WHERE usuario_id = $1 AND livro_id = $2 AND status = 'ativa'
          );
        `, [usuarioId, livroId]);
      }
    }
    console.log('Novas reservas verificadas/inseridas.');

    await client.query('COMMIT');
    console.log('✅ Script de histórico de leitura e reservas finalizado com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao executar o script:', error);
  } finally {
    await client.release();
    await pool.end();
    console.log('Conexão com o banco de dados encerrada.');
  }
}

seedReadingHistory();