// Arquivo: backend/src/controllers/preferenciasController.js

const pool = require('../config/database');
const { invalidarCache } = require('./recomendacoesController');

// GET /api/preferencias
// Retorna preferências do aluno autenticado
const getPreferencias = async (req, res) => {
  const alunoId = req.usuario.id;

  try {
    const { rows } = await pool.query(
      'SELECT tipo, valor FROM preferencias_aluno WHERE aluno_id = $1 ORDER BY tipo, valor',
      [alunoId]
    );

    const categorias = rows.filter(r => r.tipo === 'categoria').map(r => r.valor);
    const autores = rows.filter(r => r.tipo === 'autor').map(r => r.valor);

    return res.status(200).json({
      categorias,
      autores,
      total: rows.length,
    });
  } catch (error) {
    console.error('[preferenciasController] Erro ao buscar preferências:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

// POST /api/preferencias
// Salva preferências do aluno (substitui as anteriores)
// Body: { categorias: [...], autores: [...] }
const salvarPreferencias = async (req, res) => {
  const alunoId = req.usuario.id;
  const { categorias = [], autores = [] } = req.body;

  if (!Array.isArray(categorias) || !Array.isArray(autores)) {
    return res.status(400).json({ mensagem: 'categorias e autores devem ser arrays.' });
  }

  const total = categorias.length + autores.length;
  if (total < 3) {
    return res.status(400).json({
      mensagem: 'Selecione pelo menos 3 preferências no total (categorias + autores).',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove preferências anteriores
    await client.query('DELETE FROM preferencias_aluno WHERE aluno_id = $1', [alunoId]);

    // Insere novas categorias
    for (const valor of categorias) {
      const v = String(valor).trim();
      if (v) {
        await client.query(
          'INSERT INTO preferencias_aluno (aluno_id, tipo, valor) VALUES ($1, $2, $3)',
          [alunoId, 'categoria', v]
        );
      }
    }

    // Insere novos autores
    for (const valor of autores) {
      const v = String(valor).trim();
      if (v) {
        await client.query(
          'INSERT INTO preferencias_aluno (aluno_id, tipo, valor) VALUES ($1, $2, $3)',
          [alunoId, 'autor', v]
        );
      }
    }

    await client.query('COMMIT');

    // Invalida cache de recomendações para refletir novas preferências
    invalidarCache(alunoId);

    return res.status(200).json({ ok: true, total });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[preferenciasController] Erro ao salvar preferências:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  } finally {
    client.release();
  }
};

// DELETE /api/preferencias/:tipo/:valor
// Remove uma preferência específica
const removerPreferencia = async (req, res) => {
  const alunoId = req.usuario.id;
  const { tipo, valor } = req.params;

  if (!['categoria', 'autor'].includes(tipo)) {
    return res.status(400).json({ mensagem: 'Tipo inválido. Use "categoria" ou "autor".' });
  }

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM preferencias_aluno WHERE aluno_id = $1 AND tipo = $2 AND valor = $3',
      [alunoId, tipo, decodeURIComponent(valor)]
    );

    if (rowCount === 0) {
      return res.status(404).json({ mensagem: 'Preferência não encontrada.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[preferenciasController] Erro ao remover preferência:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = { getPreferencias, salvarPreferencias, removerPreferencia };
