// Arquivo: backend/src/controllers/dominiosController.js
// Controller para gerenciamento de domínios permitidos (APENAS ADMIN)

const pool = require('../config/database');

// Listar todos os domínios permitidos
const listarDominios = async (req, res) => {
  try {
    const { rows: dominios } = await pool.query(
      `SELECT d.*, u.nome as criado_por_nome
       FROM dominios_permitidos d
       LEFT JOIN usuario u ON d.criado_por = u.id
       ORDER BY d.criado_em DESC`
    );

    return res.status(200).json(dominios);
  } catch (error) {
    console.error('Erro ao listar domínios:', error);
    return res.status(500).json({ mensagem: 'Erro ao listar domínios' });
  }
};

// Buscar domínio por ID
const buscarDominioPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT d.*, u.nome as criado_por_nome
       FROM dominios_permitidos d
       LEFT JOIN usuario u ON d.criado_por = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensagem: 'Domínio não encontrado' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar domínio:', error);
    return res.status(500).json({ mensagem: 'Erro ao buscar domínio' });
  }
};

// Criar novo domínio permitido
const criarDominio = async (req, res) => {
  const { dominio, descricao, ativo = true } = req.body;
  const criado_por = req.user.id; // ID do admin logado

  // Validações
  if (!dominio) {
    return res.status(400).json({ mensagem: 'O domínio é obrigatório' });
  }

  // Garantir que o domínio começa com @
  const dominioFormatado = dominio.startsWith('@') ? dominio : `@${dominio}`;

  try {
    // Verificar se o domínio já existe
    const { rows: dominioExistente } = await pool.query(
      'SELECT * FROM dominios_permitidos WHERE dominio = $1',
      [dominioFormatado]
    );

    if (dominioExistente.length > 0) {
      return res.status(409).json({ mensagem: 'Este domínio já está cadastrado' });
    }

    // Inserir novo domínio
    const { rows: novoDominio } = await pool.query(
      `INSERT INTO dominios_permitidos (dominio, descricao, ativo, criado_por)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dominioFormatado, descricao, ativo, criado_por]
    );

    return res.status(201).json({
      mensagem: 'Domínio criado com sucesso',
      dominio: novoDominio[0]
    });

  } catch (error) {
    console.error('Erro ao criar domínio:', error);
    return res.status(500).json({ mensagem: 'Erro ao criar domínio' });
  }
};

// Atualizar domínio existente
const atualizarDominio = async (req, res) => {
  const { id } = req.params;
  const { dominio, descricao, ativo } = req.body;

  try {
    // Verificar se o domínio existe
    const { rows: dominioExistente } = await pool.query(
      'SELECT * FROM dominios_permitidos WHERE id = $1',
      [id]
    );

    if (dominioExistente.length === 0) {
      return res.status(404).json({ mensagem: 'Domínio não encontrado' });
    }

    // Construir query de atualização dinâmica
    const campos = [];
    const valores = [];
    let contador = 1;

    if (dominio !== undefined) {
      const dominioFormatado = dominio.startsWith('@') ? dominio : `@${dominio}`;
      campos.push(`dominio = $${contador}`);
      valores.push(dominioFormatado);
      contador++;
    }

    if (descricao !== undefined) {
      campos.push(`descricao = $${contador}`);
      valores.push(descricao);
      contador++;
    }

    if (ativo !== undefined) {
      campos.push(`ativo = $${contador}`);
      valores.push(ativo);
      contador++;
    }

    // Sempre atualizar data de modificação
    campos.push(`atualizado_em = CURRENT_TIMESTAMP`);

    if (campos.length === 1) { // Apenas atualizado_em
      return res.status(400).json({ mensagem: 'Nenhum campo para atualizar' });
    }

    valores.push(id);
    const query = `UPDATE dominios_permitidos SET ${campos.join(', ')} WHERE id = $${contador} RETURNING *`;

    const { rows: dominioAtualizado } = await pool.query(query, valores);

    return res.status(200).json({
      mensagem: 'Domínio atualizado com sucesso',
      dominio: dominioAtualizado[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar domínio:', error);
    return res.status(500).json({ mensagem: 'Erro ao atualizar domínio' });
  }
};

// Deletar domínio
const deletarDominio = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar se o domínio existe
    const { rows: dominioExistente } = await pool.query(
      'SELECT * FROM dominios_permitidos WHERE id = $1',
      [id]
    );

    if (dominioExistente.length === 0) {
      return res.status(404).json({ mensagem: 'Domínio não encontrado' });
    }

    // Deletar domínio
    await pool.query('DELETE FROM dominios_permitidos WHERE id = $1', [id]);

    return res.status(200).json({ mensagem: 'Domínio deletado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar domínio:', error);
    return res.status(500).json({ mensagem: 'Erro ao deletar domínio' });
  }
};

// Ativar/Desativar domínio
const toggleDominioAtivo = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: dominioExistente } = await pool.query(
      'SELECT * FROM dominios_permitidos WHERE id = $1',
      [id]
    );

    if (dominioExistente.length === 0) {
      return res.status(404).json({ mensagem: 'Domínio não encontrado' });
    }

    const novoStatus = !dominioExistente[0].ativo;

    const { rows: dominioAtualizado } = await pool.query(
      'UPDATE dominios_permitidos SET ativo = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [novoStatus, id]
    );

    return res.status(200).json({
      mensagem: `Domínio ${novoStatus ? 'ativado' : 'desativado'} com sucesso`,
      dominio: dominioAtualizado[0]
    });

  } catch (error) {
    console.error('Erro ao alterar status do domínio:', error);
    return res.status(500).json({ mensagem: 'Erro ao alterar status do domínio' });
  }
};

module.exports = {
  listarDominios,
  buscarDominioPorId,
  criarDominio,
  atualizarDominio,
  deletarDominio,
  toggleDominioAtivo
};
