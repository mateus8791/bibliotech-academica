// Arquivo: backend/src/controllers/loanController.js

const pool = require('../config/database');

// Função para buscar todos os empréstimos e reservas de um usuário específico (usando apenas tabela emprestimo)
const getMyBooks = async (req, res) => {
  // O ID do usuário vem do nosso middleware de segurança
  const usuarioId = req.usuario.id;

  try {
    // --- Query Unificada para Empréstimos e Reservas ---
    // Busca tanto empréstimos quanto reservas da tabela emprestimo
    const query = `
      SELECT
        e.id,
        e.tipo,
        l.titulo,
        l.capa_url,
        a.nome as autor_nome,
        e.data_emprestimo,
        e.data_devolucao_prevista,
        e.data_reserva,
        e.data_expiracao,
        e.status
      FROM emprestimo e
      JOIN livro l ON e.livro_id = l.id
      LEFT JOIN livro_autor la ON l.id = la.livro_id
      LEFT JOIN autor a ON la.autor_id = a.id
      WHERE e.usuario_id = $1
        AND (
          (e.tipo = 'emprestimo' AND e.status = 'ativo')
          OR
          (e.tipo = 'reserva' AND e.status IN ('aguardando', 'disponivel'))
        )
      GROUP BY e.id, l.id, a.nome
      ORDER BY e.created_at DESC;
    `;

    const result = await pool.query(query, [usuarioId]);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Erro ao buscar 'Meus Livros':", error);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = {
  getMyBooks,
};
