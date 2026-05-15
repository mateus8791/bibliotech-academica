// Arquivo: backend/src/controllers/avaliacoesController.js

const pool = require('../config/database');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/avaliacoes
// Filtros opcionais: livro_id, usuario_id, status (ativa|arquivada), nota_min
// Qualquer usuário autenticado pode listar. Aluno só vê avaliações 'ativa' por
// padrão; admin/bibliotecário podem filtrar por qualquer status.
// ─────────────────────────────────────────────────────────────────────────────
const listarAvaliacoes = async (req, res) => {
  const { livro_id, usuario_id, status, nota_min, ordem = 'recentes' } = req.query;
  const tipo = req.usuario.tipo_usuario;

  try {
    const condicoes = [];
    const valores = [];
    let idx = 1;

    if (livro_id) {
      condicoes.push(`a.livro_id = $${idx++}`);
      valores.push(livro_id);
    }

    if (usuario_id) {
      condicoes.push(`a.usuario_id = $${idx++}`);
      valores.push(usuario_id);
    }

    if (status) {
      condicoes.push(`a.status = $${idx++}`);
      valores.push(status);
    } else if (tipo === 'aluno') {
      // Aluno só vê avaliações ativas por padrão
      condicoes.push(`a.status = 'ativa'`);
    }

    if (nota_min) {
      const notaNum = parseInt(nota_min, 10);
      if (notaNum >= 1 && notaNum <= 5) {
        condicoes.push(`a.nota >= $${idx++}`);
        valores.push(notaNum);
      }
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

    const orderBy = ordem === 'nota_desc'
      ? 'a.nota DESC, a.data_criacao DESC'
      : ordem === 'nota_asc'
        ? 'a.nota ASC, a.data_criacao DESC'
        : 'a.data_criacao DESC'; // padrão: mais recentes

    const query = `
      SELECT
        a.id,
        a.livro_id,
        a.usuario_id,
        a.nota,
        a.comentario,
        a.status,
        a.data_criacao,
        u.nome AS usuario_nome,
        u.foto_url AS usuario_foto,
        l.titulo AS livro_titulo
      FROM avaliacoes a
      INNER JOIN usuario u ON a.usuario_id = u.id
      INNER JOIN livro l ON a.livro_id = l.id
      ${where}
      ORDER BY ${orderBy}
    `;

    const { rows } = await pool.query(query, valores);
    res.json(rows);
  } catch (error) {
    console.error('[avaliacoes] Erro ao listar:', error.message);
    res.status(500).json({ mensagem: 'Erro ao buscar avaliações.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/avaliacoes
// Cria uma avaliação. Apenas alunos podem criar (admin/bibliotecário não avaliam).
// Valida: nota obrigatória (1-5), máximo 1 avaliação por livro por usuário.
// ─────────────────────────────────────────────────────────────────────────────
const criarAvaliacao = async (req, res) => {
  const usuarioId = req.usuario.id;
  const tipo = req.usuario.tipo_usuario;
  const { livro_id, nota, comentario } = req.body;

  if (tipo !== 'aluno') {
    return res.status(403).json({ mensagem: 'Apenas alunos podem criar avaliações.' });
  }

  if (!livro_id || nota === undefined || nota === null) {
    return res.status(400).json({ mensagem: 'livro_id e nota são obrigatórios.' });
  }

  const notaNum = parseInt(nota, 10);
  if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
    return res.status(400).json({ mensagem: 'nota deve ser um número inteiro entre 1 e 5.' });
  }

  try {
    // Verificar se o livro existe
    const livroResult = await pool.query('SELECT id FROM livro WHERE id = $1', [livro_id]);
    if (livroResult.rowCount === 0) {
      return res.status(404).json({ mensagem: 'Livro não encontrado.' });
    }

    // Verificar se já avaliou este livro
    const existente = await pool.query(
      'SELECT id FROM avaliacoes WHERE livro_id = $1 AND usuario_id = $2',
      [livro_id, usuarioId]
    );
    if (existente.rowCount > 0) {
      return res.status(409).json({
        mensagem: 'Você já avaliou este livro. Use o endpoint de edição para atualizá-la.',
        avaliacao_id: existente.rows[0].id,
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO avaliacoes (livro_id, usuario_id, nota, comentario, status)
       VALUES ($1, $2, $3, $4, 'ativa')
       RETURNING *`,
      [livro_id, usuarioId, notaNum, comentario || null]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[avaliacoes] Erro ao criar:', error.message);
    res.status(500).json({ mensagem: 'Erro ao criar avaliação.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/avaliacoes/:id
// Edita nota e/ou comentário.
// Aluno: só pode editar a própria avaliação.
// Admin/Bibliotecário: pode editar qualquer avaliação.
// ─────────────────────────────────────────────────────────────────────────────
const editarAvaliacao = async (req, res) => {
  const usuarioId = req.usuario.id;
  const tipo = req.usuario.tipo_usuario;
  const { id } = req.params;
  const { nota, comentario } = req.body;

  if (nota === undefined && comentario === undefined) {
    return res.status(400).json({ mensagem: 'Informe ao menos nota ou comentario para atualizar.' });
  }

  if (nota !== undefined) {
    const notaNum = parseInt(nota, 10);
    if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
      return res.status(400).json({ mensagem: 'nota deve ser um número inteiro entre 1 e 5.' });
    }
  }

  try {
    // Buscar avaliação existente
    const { rows, rowCount } = await pool.query(
      'SELECT * FROM avaliacoes WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ mensagem: 'Avaliação não encontrada.' });
    }

    const avaliacao = rows[0];

    // Aluno só pode editar a própria avaliação
    if (tipo === 'aluno' && String(avaliacao.usuario_id) !== String(usuarioId)) {
      return res.status(403).json({ mensagem: 'Você não tem permissão para editar esta avaliação.' });
    }

    const novaNota = nota !== undefined ? parseInt(nota, 10) : avaliacao.nota;
    const novoComentario = comentario !== undefined ? comentario : avaliacao.comentario;

    const { rows: updated } = await pool.query(
      `UPDATE avaliacoes
       SET nota = $1, comentario = $2
       WHERE id = $3
       RETURNING *`,
      [novaNota, novoComentario, id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('[avaliacoes] Erro ao editar:', error.message);
    res.status(500).json({ mensagem: 'Erro ao editar avaliação.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/avaliacoes/:id/arquivar
// Alterna status entre 'ativa' e 'arquivada'.
// Somente bibliotecário ou admin.
// ─────────────────────────────────────────────────────────────────────────────
const arquivarAvaliacao = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      'SELECT id, status FROM avaliacoes WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ mensagem: 'Avaliação não encontrada.' });
    }

    const novoStatus = rows[0].status === 'ativa' ? 'arquivada' : 'ativa';

    const { rows: updated } = await pool.query(
      `UPDATE avaliacoes SET status = $1 WHERE id = $2 RETURNING *`,
      [novoStatus, id]
    );

    res.json({
      mensagem: `Avaliação ${novoStatus === 'arquivada' ? 'arquivada' : 'reativada'} com sucesso.`,
      avaliacao: updated[0],
    });
  } catch (error) {
    console.error('[avaliacoes] Erro ao arquivar:', error.message);
    res.status(500).json({ mensagem: 'Erro ao arquivar avaliação.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/avaliacoes/:id
// Aluno: só pode excluir a própria avaliação.
// Admin/Bibliotecário: pode excluir qualquer avaliação.
// ─────────────────────────────────────────────────────────────────────────────
const deletarAvaliacao = async (req, res) => {
  const usuarioId = req.usuario.id;
  const tipo = req.usuario.tipo_usuario;
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      'SELECT * FROM avaliacoes WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ mensagem: 'Avaliação não encontrada.' });
    }

    const avaliacao = rows[0];

    // Aluno só pode excluir a própria avaliação
    if (tipo === 'aluno' && String(avaliacao.usuario_id) !== String(usuarioId)) {
      return res.status(403).json({ mensagem: 'Você não tem permissão para excluir esta avaliação.' });
    }

    await pool.query('DELETE FROM avaliacoes WHERE id = $1', [id]);

    res.json({ mensagem: 'Avaliação excluída com sucesso.' });
  } catch (error) {
    console.error('[avaliacoes] Erro ao deletar:', error.message);
    res.status(500).json({ mensagem: 'Erro ao excluir avaliação.' });
  }
};

module.exports = {
  listarAvaliacoes,
  criarAvaliacao,
  editarAvaliacao,
  arquivarAvaliacao,
  deletarAvaliacao,
};
