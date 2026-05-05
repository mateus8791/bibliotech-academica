// Arquivo: backend/src/controllers/perfilController.js

const pool = require('../config/database');

const getMeuPerfilData = async (req, res) => {
  // O ID e o tipo do usuário vêm do token, que o authMiddleware já verificou
  const { id: usuarioId, tipo: tipoUsuario } = req.usuario;

  try {
    // 1. Busca os dados básicos do usuário
    const usuarioQuery = "SELECT id, nome, email, tipo_usuario, foto_url, TO_CHAR(data_cadastro, 'DD/MM/YYYY') AS data_cadastro FROM usuario WHERE id = $1";
    const usuarioResult = await pool.query(usuarioQuery, [usuarioId]);

    if (usuarioResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const perfilData = {
      info: usuarioResult.rows[0],
      atividades: [], // Um array vazio que vamos preencher a seguir
    };

    // 2. Busca dados adicionais dependendo do tipo de usuário
    if (tipoUsuario === 'aluno') {
      // Se for aluno, busca o histórico de livros devolvidos
      const historicoQuery = `
        SELECT l.titulo, TO_CHAR(e.data_devolucao_real, 'DD/MM/YYYY') as data_conclusao
        FROM emprestimo e
        JOIN livro l ON e.livro_id = l.id
        WHERE e.usuario_id = $1 AND e.status = 'devolvido'
        ORDER BY e.data_devolucao_real DESC
        LIMIT 10;
      `;
      const historicoResult = await pool.query(historicoQuery, [usuarioId]);
      perfilData.atividades = historicoResult.rows.map(r => ({
          descricao: `Você leu o livro "${r.titulo}"`,
          data: r.data_conclusao,
      }));

    } else if (tipoUsuario === 'bibliotecario' || tipoUsuario === 'admin') {
      // Se for bibliotecário, busca as últimas ações na tabela de auditoria
      const auditoriaQuery = `
        SELECT detalhes, TO_CHAR(data_acao, 'DD/MM/YYYY às HH24:MI') as data_formatada
        FROM "Auditoria_Acoes"
        WHERE usuario_id = $1
        ORDER BY data_acao DESC
        LIMIT 10;
      `;
      const auditoriaResult = await pool.query(auditoriaQuery, [usuarioId]);
      perfilData.atividades = auditoriaResult.rows.map(r => ({
          descricao: r.detalhes,
          data: r.data_formatada,
      }));
    }

    res.status(200).json(perfilData);

  } catch (error) {
    console.error('Erro ao buscar dados do perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = {
  getMeuPerfilData,
};