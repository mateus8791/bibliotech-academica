const pool = require('./src/config/database');

async function createTestAvaliacao() {
  try {
    console.log('\n=== CRIANDO AVALIAÇÃO PARA ALUNO TESTE ===\n');

    // Buscar o usuário "Aluno Teste"
    const alunoId = '00000000-0000-0000-0000-000000000002';

    // Buscar um livro
    const livrosResult = await pool.query('SELECT id, titulo FROM livro LIMIT 3');

    console.log('Criando avaliações para Aluno Teste...\n');

    for (const livro of livrosResult.rows) {
      try {
        // Verificar se já existe
        const exists = await pool.query(
          'SELECT id FROM avaliacoes WHERE usuario_id = $1 AND livro_id = $2',
          [alunoId, livro.id]
        );

        if (exists.rows.length > 0) {
          console.log(`⚠️  Avaliação já existe para "${livro.titulo}"`);
          continue;
        }

        // Criar avaliação
        const nota = Math.floor(Math.random() * 2) + 4; // Nota entre 4 e 5
        const comentarios = [
          'Livro excelente! Recomendo muito!',
          'Adorei a leitura, muito inspirador!',
          'Uma obra-prima da literatura!'
        ];
        const comentario = comentarios[Math.floor(Math.random() * comentarios.length)];

        await pool.query(
          `INSERT INTO avaliacoes (livro_id, usuario_id, nota, comentario)
           VALUES ($1, $2, $3, $4)`,
          [livro.id, alunoId, nota, comentario]
        );

        console.log(`✅ Avaliação criada para "${livro.titulo}" - Nota: ${nota}`);
      } catch (err) {
        console.log(`❌ Erro ao criar avaliação para "${livro.titulo}":`, err.message);
      }
    }

    console.log('\n=== CONCLUÍDO ===\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

createTestAvaliacao();
