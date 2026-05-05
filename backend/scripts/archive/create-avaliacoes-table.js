const pool = require('./src/config/database');

async function createAvaliacoesTable() {
  try {
    console.log('\n=== CRIANDO TABELA AVALIACOES ===\n');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS avaliacoes (
        id SERIAL PRIMARY KEY,
        livro_id UUID NOT NULL REFERENCES livro(id) ON DELETE CASCADE,
        usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
        nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
        comentario TEXT NOT NULL CHECK (LENGTH(comentario) <= 1000),
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_usuario_livro UNIQUE (usuario_id, livro_id)
      );
    `);

    console.log('✅ Tabela avaliacoes criada com sucesso!');

    // Criar índices para melhor performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_avaliacoes_livro_id ON avaliacoes(livro_id);
    `);
    console.log('✅ Índice idx_avaliacoes_livro_id criado');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_avaliacoes_usuario_id ON avaliacoes(usuario_id);
    `);
    console.log('✅ Índice idx_avaliacoes_usuario_id criado');

    console.log('\n=== TABELA CRIADA COM SUCESSO ===\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao criar tabela:', err.message);
    console.error('Detalhes:', err);
    process.exit(1);
  }
}

createAvaliacoesTable();
