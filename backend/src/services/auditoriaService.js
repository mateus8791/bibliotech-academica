// Arquivo: backend/src/services/auditoriaService.js

const pool = require('../config/database');

/**
 * Registra uma ação de um usuário no banco de dados de auditoria.
 * @param {string} usuarioId - O ID do usuário que realizou a ação.
 * @param {string} tipo - O tipo da ação (ex: 'CADASTRO_LIVRO').
 * @param {string} detalhes - Uma descrição amigável da ação.
 */
const registrarAcao = async (usuarioId, tipo, detalhes) => {
  // Envolvemos em um try...catch para garantir que uma falha no log não quebre a aplicação principal.
  try {
    const query = `
      INSERT INTO "Auditoria_Acoes" (usuario_id, tipo, detalhes)
      VALUES ($1, $2, $3)
    `;
    await pool.query(query, [usuarioId, tipo, detalhes]);
    console.log(`[AUDITORIA] Ação registrada para o usuário ${usuarioId}: ${detalhes}`);
  } catch (error) {
    console.error('--- [ERRO DE AUDITORIA] Falha ao registrar ação ---:', error);
  }
};

module.exports = {
  registrarAcao,
};