const pool = require('./src/config/database');

async function testAvaliacoes() {
  try {
    console.log('\n=== TESTE DE AVALIAÇÕES ===\n');

    // 1. Buscar um livro existente
    const livrosResult = await pool.query('SELECT id, titulo FROM livro LIMIT 1');
    if (livrosResult.rows.length === 0) {
      console.log('❌ Nenhum livro encontrado no banco de dados');
      process.exit(1);
    }

    const livro = livrosResult.rows[0];
    console.log('✅ Livro encontrado:', livro.titulo);
    console.log('   ID:', livro.id);

    // 2. Buscar o usuário aluno de teste
    const usuarioResult = await pool.query(
      "SELECT id, nome FROM usuario WHERE tipo_usuario = 'aluno' LIMIT 1"
    );
    if (usuarioResult.rows.length === 0) {
      console.log('❌ Nenhum aluno encontrado no banco de dados');
      process.exit(1);
    }

    const usuario = usuarioResult.rows[0];
    console.log('✅ Usuário encontrado:', usuario.nome);
    console.log('   ID:', usuario.id);

    // 3. Verificar se já existe avaliação
    const existingResult = await pool.query(
      'SELECT * FROM avaliacoes WHERE usuario_id = $1 AND livro_id = $2',
      [usuario.id, livro.id]
    );

    if (existingResult.rows.length > 0) {
      console.log('\n⚠️  Avaliação já existe!');
      console.log('   Nota:', existingResult.rows[0].nota);
      console.log('   Comentário:', existingResult.rows[0].comentario);
    } else {
      // 4. Criar uma avaliação de teste
      console.log('\n📝 Criando avaliação de teste...');
      const avaliacaoResult = await pool.query(
        `INSERT INTO avaliacoes (livro_id, usuario_id, nota, comentario)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [livro.id, usuario.id, 5, 'Livro excelente! Recomendo muito!']
      );

      console.log('✅ Avaliação criada com sucesso!');
      console.log('   ID:', avaliacaoResult.rows[0].id);
      console.log('   Nota:', avaliacaoResult.rows[0].nota);
      console.log('   Comentário:', avaliacaoResult.rows[0].comentario);
    }

    // 5. Buscar livros lidos do usuário (testar a query da rota)
    console.log('\n📚 Buscando livros lidos do usuário...');
    const meusLivrosResult = await pool.query(
      `SELECT
        l.id,
        l.titulo,
        STRING_AGG(DISTINCT aut.nome, ', ') as autor,
        l.capa_url,
        l.isbn,
        a.id as minha_avaliacao_id,
        a.nota as minha_nota,
        a.comentario as meu_comentario,
        a.data_criacao as minha_data_avaliacao,
        ROUND(AVG(a_all.nota)::numeric, 1) as media_notas,
        COUNT(DISTINCT a_all.id) as total_avaliacoes
      FROM avaliacoes a
      INNER JOIN livro l ON a.livro_id = l.id
      LEFT JOIN livro_autor la ON l.id = la.livro_id
      LEFT JOIN autor aut ON la.autor_id = aut.id
      LEFT JOIN avaliacoes a_all ON a_all.livro_id = l.id
      WHERE a.usuario_id = $1
      GROUP BY l.id, l.titulo, l.capa_url, l.isbn,
               a.id, a.nota, a.comentario, a.data_criacao
      ORDER BY a.data_criacao DESC`,
      [usuario.id]
    );

    console.log(`✅ Encontrados ${meusLivrosResult.rows.length} livro(s) lido(s)`);
    meusLivrosResult.rows.forEach((row, index) => {
      console.log(`\n   Livro ${index + 1}:`);
      console.log('   - Título:', row.titulo);
      console.log('   - Autor:', row.autor || 'Não informado');
      console.log('   - Minha nota:', row.minha_nota);
      console.log('   - Média geral:', row.media_notas);
      console.log('   - Total de avaliações:', row.total_avaliacoes);
    });

    console.log('\n=== TESTE CONCLUÍDO COM SUCESSO ===\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro no teste:', err.message);
    console.error('Detalhes:', err);
    process.exit(1);
  }
}

testAvaliacoes();
