// Arquivo: backend/src/helpers/criarNotificacao.js
//
// Helper reutilizável para criar notificações em qualquer controller.
// Nunca lança exceção — se falhar, apenas loga o erro e retorna null,
// garantindo que o fluxo principal do controller não seja interrompido.
//
// Uso:
//   const criarNotificacao = require('../helpers/criarNotificacao');
//   await criarNotificacao(usuarioId, 'EMPRESTIMO_REALIZADO', 'Empréstimo realizado', 'Você pegou: Dom Quixote');

const pool = require('../config/database');

// Garante que a tabela existe antes de inserir (idempotente)
async function garantirTabela() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notificacoes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      titulo VARCHAR(120) NOT NULL,
      mensagem TEXT NOT NULL,
      lida BOOLEAN DEFAULT FALSE,
      criada_em TIMESTAMP DEFAULT NOW(),
      dados JSONB
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id)
  `);
}

let tabelaGarantida = false;

async function criarNotificacao(usuarioId, tipo, titulo, mensagem, dados = {}) {
  try {
    if (!tabelaGarantida) {
      await garantirTabela();
      tabelaGarantida = true;
    }

    const result = await pool.query(
      `INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, dados)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [usuarioId, tipo, titulo, mensagem, JSON.stringify(dados)]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[criarNotificacao] Falha ao criar notificação:', error.message);
    return null; // Nunca quebra o fluxo principal
  }
}

module.exports = criarNotificacao;
