// Arquivo: backend/src/controllers/rankingController.js
//
// Ranking de leitores ("Vença seus colegas").
// "Livro lido" = empréstimo (tipo='emprestimo') concluído/devolvido.
// Retorna o top N + a posição do próprio usuário (mesmo que fora do top).

const pool = require('../config/database');

// GET /api/ranking/leitores?limit=10
const getRankingLeitores = async (req, res) => {
  const usuarioId = req.usuario?.id || null;
  const limite = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  try {
    // CTE com o ranking de TODOS os alunos; depois filtramos top N + o próprio usuário.
    // LEFT JOIN garante que alunos sem leituras também entrem (livros_lidos = 0).
    const query = `
      WITH ranking AS (
        SELECT
          u.id,
          u.nome,
          u.foto_url,
          COUNT(e.id) AS livros_lidos,
          RANK() OVER (ORDER BY COUNT(e.id) DESC) AS posicao
        FROM usuario u
        LEFT JOIN emprestimo e
          ON e.usuario_id = u.id
          AND e.tipo = 'emprestimo'
          AND e.status IN ('devolvido', 'concluido')
        WHERE u.tipo_usuario = 'aluno'
        GROUP BY u.id, u.nome, u.foto_url
      )
      SELECT
        id,
        nome,
        foto_url,
        livros_lidos::int AS livros_lidos,
        posicao::int AS posicao,
        (id = $1) AS sou_eu
      FROM ranking
      WHERE posicao <= $2 OR id = $1
      ORDER BY posicao ASC, nome ASC;
    `;

    const { rows } = await pool.query(query, [usuarioId, limite]);

    // Separa o top N de uma eventual linha extra do próprio usuário (fora do top).
    const top = rows.filter((r) => r.posicao <= limite);
    const minhaLinha = rows.find((r) => r.sou_eu) || null;
    const meuRank =
      minhaLinha && minhaLinha.posicao > limite ? minhaLinha : null;

    res.status(200).json({
      ranking: top,
      meuRank, // null se o usuário já está no top ou não é aluno
      totalRanqueados: top.length,
    });
  } catch (error) {
    console.error('[ranking] Erro ao buscar ranking de leitores:', error.message);
    res.status(500).json({ mensagem: 'Erro ao buscar o ranking de leitores.' });
  }
};

module.exports = { getRankingLeitores };
