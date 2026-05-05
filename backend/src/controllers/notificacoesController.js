// Arquivo: backend/src/controllers/notificacoesController.js

const pool = require('../config/database');

// GET /api/notificacoes — só as não lidas do usuário logado
const getNaoLidas = async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notificacoes
       WHERE usuario_id = $1 AND lida = FALSE
       ORDER BY criada_em DESC
       LIMIT 50`,
      [usuarioId]
    );
    res.json(rows);
  } catch (error) {
    console.error('[notificacoes] Erro ao buscar não lidas:', error.message);
    res.status(500).json({ mensagem: 'Erro ao buscar notificações.' });
  }
};

// GET /api/notificacoes/todas — todas (lidas + não lidas) do usuário logado
const getTodas = async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM notificacoes
       WHERE usuario_id = $1
       ORDER BY criada_em DESC
       LIMIT 50`,
      [usuarioId]
    );
    res.json(rows);
  } catch (error) {
    console.error('[notificacoes] Erro ao buscar todas:', error.message);
    res.status(500).json({ mensagem: 'Erro ao buscar notificações.' });
  }
};

// PUT /api/notificacoes/todas/lidas — marca TODAS como lidas
const marcarTodasLidas = async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    await pool.query(
      `UPDATE notificacoes SET lida = TRUE
       WHERE usuario_id = $1 AND lida = FALSE`,
      [usuarioId]
    );
    res.json({ mensagem: 'Todas as notificações marcadas como lidas.' });
  } catch (error) {
    console.error('[notificacoes] Erro ao marcar todas como lidas:', error.message);
    res.status(500).json({ mensagem: 'Erro ao atualizar notificações.' });
  }
};

// PUT /api/notificacoes/:id/lida — marca UMA como lida
const marcarLida = async (req, res) => {
  const usuarioId = req.usuario.id;
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      `UPDATE notificacoes SET lida = TRUE
       WHERE id = $1 AND usuario_id = $2`,
      [id, usuarioId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ mensagem: 'Notificação não encontrada.' });
    }
    res.json({ mensagem: 'Notificação marcada como lida.' });
  } catch (error) {
    console.error('[notificacoes] Erro ao marcar como lida:', error.message);
    res.status(500).json({ mensagem: 'Erro ao atualizar notificação.' });
  }
};

// DELETE /api/notificacoes/:id — remove uma notificação
const deletar = async (req, res) => {
  const usuarioId = req.usuario.id;
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM notificacoes WHERE id = $1 AND usuario_id = $2`,
      [id, usuarioId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ mensagem: 'Notificação não encontrada.' });
    }
    res.json({ mensagem: 'Notificação removida.' });
  } catch (error) {
    console.error('[notificacoes] Erro ao deletar:', error.message);
    res.status(500).json({ mensagem: 'Erro ao remover notificação.' });
  }
};

module.exports = {
  getNaoLidas,
  getTodas,
  marcarTodasLidas,
  marcarLida,
  deletar,
};
