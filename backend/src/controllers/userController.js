// Arquivo: backend/src/controllers/userController.js (Com Auditoria)

const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { sendRegistrationEmail } = require('../services/emailService');
const { registrarAcao } = require('../services/auditoriaService'); // <-- IMPORTAMOS O SERVIÇO

// --- 1. BUSCAR TODOS OS USUÁRIOS ---
const getAllUsers = async (req, res) => {
  const { search, tipo, dataCadastro } = req.query;
  try {
    let whereClauses = [];
    let queryParams = [];
    let paramIndex = 1;
    if (search) {
      whereClauses.push(`u.nome ILIKE $${paramIndex++}`);
      queryParams.push(`%${search}%`);
    }
    if (tipo) {
      whereClauses.push(`u.tipo_usuario = $${paramIndex++}`);
      queryParams.push(tipo);
    }
    if (dataCadastro) {
      whereClauses.push(`u.data_cadastro::date = $${paramIndex++}`);
      queryParams.push(dataCadastro);
    }
    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `
      SELECT
        u.id, u.nome, u.email, u.tipo_usuario, u.foto_url,
        TO_CHAR(u.data_cadastro, 'DD/MM/YYYY') AS data_cadastro,
        EXISTS (SELECT 1 FROM reserva r WHERE r.usuario_id = u.id AND r.status = 'ativa') AS tem_reserva_ativa
      FROM usuario u ${whereString} GROUP BY u.id ORDER BY u.nome ASC;
    `;
    const { rows } = await pool.query(query, queryParams);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

// --- 2. CRIAR NOVO USUÁRIO ---
const createUser = async (req, res) => {
  const { nome, email, senha, tipo_usuario, foto_url } = req.body;
  if (!nome || !email || !senha || !tipo_usuario) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);
    const newUserQuery = `
      INSERT INTO usuario (nome, email, senha_hash, tipo_usuario, foto_url)
      VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email;
    `;
    const { rows } = await pool.query(newUserQuery, [nome, email, senha_hash, tipo_usuario, foto_url]);
    const novoUsuario = rows[0];
    await sendRegistrationEmail(novoUsuario.email, novoUsuario.nome, novoUsuario.id);
    
    // REGISTRA A AÇÃO DE AUDITORIA
    await registrarAcao(req.usuario.id, 'CADASTRO_USUARIO', `Cadastrou o usuário '${novoUsuario.nome}'`);

    res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: novoUsuario });
  } catch (error) {
    if (error.code === '23505') { 
      return res.status(409).json({ message: 'O email fornecido já está em uso.' });
    }
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// --- 3. BUSCAR UM USUÁRIO POR ID ---
const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query('SELECT id, nome, email, tipo_usuario, foto_url FROM usuario WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// --- 4. ATUALIZAR UM USUÁRIO ---
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { nome, email, tipo_usuario, foto_url } = req.body;
    if (!nome || !email || !tipo_usuario) {
        return res.status(400).json({ message: 'Nome, email e tipo de usuário são obrigatórios.' });
    }
    try {
        const query = `
            UPDATE usuario SET nome = $1, email = $2, tipo_usuario = $3, foto_url = $4
            WHERE id = $5 RETURNING id, nome, email, tipo_usuario, foto_url;
        `;
        const { rows } = await pool.query(query, [nome, email, tipo_usuario, foto_url, id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado para atualizar.' });
        }
        
        // REGISTRA A AÇÃO DE AUDITORIA
        await registrarAcao(req.usuario.id, 'UPDATE_USUARIO', `Atualizou os dados do usuário '${rows[0].nome}'`);

        res.status(200).json({ message: 'Usuário atualizado com sucesso!', usuario: rows[0] });
    } catch (error) {
         if (error.code === '23505') { 
            return res.status(409).json({ message: 'O email fornecido já está em uso por outro usuário.' });
        }
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// --- 5. DELETAR UM USUÁRIO ---
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Pega o nome do usuário ANTES de deletar, para registrar no log
        const userResult = await pool.query('SELECT nome FROM usuario WHERE id = $1', [id]);
        const nomeUsuarioDeletado = userResult.rows[0]?.nome || `ID ${id}`;
        
        const deleteOp = await pool.query('DELETE FROM usuario WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado para exclusão.' });
        }

        // REGISTRA A AÇÃO DE AUDITORIA
        await registrarAcao(req.usuario.id, 'DELETE_USUARIO', `Deletou o usuário '${nomeUsuarioDeletado}'`);
        
        res.status(200).json({ message: 'Usuário deletado com sucesso.' });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Não é possível excluir este usuário pois ele possui empréstimos ou reservas ativas.' });
        }
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// Exporta todas as funções
module.exports = {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
};