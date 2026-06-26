// Arquivo: backend/src/controllers/recomendacoesController.js

const pool = require('../config/database');

// Cache simples em memória: { [alunoId]: { data, cachedAt } }
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// GET /api/recomendacoes
// Chama a function SQL recomendar_livros e retorna lista com score e motivo
const getRecomendacoes = async (req, res) => {
  const alunoId = req.usuario.id;

  // Verificar cache
  const cached = cache.get(alunoId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return res.status(200).json(cached.data);
  }

  try {
    // Verificar se aluno tem preferências
    const { rows: prefRows } = await pool.query(
      'SELECT COUNT(*) FROM preferencias_aluno WHERE aluno_id = $1',
      [alunoId]
    );
    const totalPrefs = parseInt(prefRows[0].count);

    if (totalPrefs === 0) {
      const response = { livros: [], temPreferencias: false };
      cache.set(alunoId, { data: response, cachedAt: Date.now() });
      return res.status(200).json(response);
    }

    // Query direta em vez da função recomendar_livros que não existe no DB do usuário
    const recomendacaoQuery = `
      SELECT DISTINCT ON (l.id)
        l.id, l.titulo, l.capa_url,
        (SELECT a.nome FROM autor a JOIN livro_autor la ON la.autor_id = a.id WHERE la.livro_id = l.id LIMIT 1) AS autor_nome,
        (SELECT c.nome FROM categoria c JOIN livro_categoria lc ON lc.categoria_id = c.id WHERE lc.livro_id = l.id LIMIT 1) AS categoria_nome,
        (l.quantidade_disponivel > 0) AS disponivel,
        100 AS score,
        'Recomendado com base nas suas preferências'::VARCHAR AS motivo
      FROM livro l
      JOIN livro_categoria lc ON l.id = lc.livro_id
      JOIN livro_autor la ON l.id = la.livro_id
      WHERE (
        lc.categoria_id IN (SELECT categoria_id FROM preferencias_aluno WHERE aluno_id = $1 AND categoria_id IS NOT NULL)
        OR la.autor_id IN (SELECT autor_id FROM preferencias_aluno WHERE aluno_id = $1 AND autor_id IS NOT NULL)
      )
      AND l.id NOT IN (
        SELECT livro_id FROM emprestimo WHERE usuario_id = $1 AND tipo = 'emprestimo'
      )
      LIMIT $2
    `;

    const { rows: livros } = await pool.query(recomendacaoQuery, [alunoId, 10]);

    // Se menos de 5 resultados, complementar com mais populares não já incluídos
    if (livros.length < 5) {
      const idsJaIncluidos = livros.map(l => l.id);
      const placeholders = idsJaIncluidos.length > 0
        ? `AND l.id NOT IN (${idsJaIncluidos.map((_, i) => `$${i + 3}`).join(',')})`
        : '';

      const complementarQuery = `
        SELECT
          l.id,
          l.titulo,
          (SELECT a.nome FROM autor a JOIN livro_autor la ON la.autor_id = a.id WHERE la.livro_id = l.id LIMIT 1) AS autor_nome,
          (SELECT c.nome FROM categoria c JOIN livro_categoria lc ON lc.categoria_id = c.id WHERE lc.livro_id = l.id LIMIT 1) AS categoria_nome,
          l.capa_url,
          (l.quantidade_disponivel > 0) AS disponivel,
          0 AS score,
          'Popular na biblioteca'::VARCHAR AS motivo
        FROM livro l
        WHERE l.id NOT IN (
          SELECT livro_id FROM emprestimo WHERE usuario_id = $1 AND tipo = 'emprestimo'
        )
        ${placeholders}
        ORDER BY l.num_emprestimos DESC, l.titulo ASC
        LIMIT $2
      `;

      const params = [alunoId, 5 - livros.length, ...idsJaIncluidos];
      const { rows: extras } = await pool.query(complementarQuery, params);
      livros.push(...extras);
    }

    const response = { livros, temPreferencias: true };
    cache.set(alunoId, { data: response, cachedAt: Date.now() });

    return res.status(200).json(response);
  } catch (error) {
    console.error('[recomendacoesController] Erro ao buscar recomendações:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

// GET /api/recomendacoes/tem-preferencias
// Retorna se o aluno tem preferências cadastradas
const temPreferencias = async (req, res) => {
  const alunoId = req.usuario.id;

  try {
    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM preferencias_aluno WHERE aluno_id = $1',
      [alunoId]
    );
    const total = parseInt(rows[0].count);

    return res.status(200).json({ temPreferencias: total > 0, total });
  } catch (error) {
    console.error('[recomendacoesController] Erro ao verificar preferências:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

// Invalida o cache de um aluno (chamar após salvar novas preferências)
const invalidarCache = (alunoId) => {
  cache.delete(alunoId);
};

module.exports = { getRecomendacoes, temPreferencias, invalidarCache };
