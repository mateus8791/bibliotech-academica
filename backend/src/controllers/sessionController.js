/**
 * =====================================================
 * CONTROLLER: Gerenciamento de Sessões
 * =====================================================
 * Responsável por rastrear sessões ativas via heartbeat
 * e registrar logout de usuários.
 *
 * Autor: Claude Code
 * Data: 2025-11-10
 * =====================================================
 */

const pool = require('../config/database');

/**
 * POST /api/session/heartbeat
 * Atualiza o last_seen da sessão ativa do usuário
 * Deve ser chamado a cada 60 segundos pelo frontend
 */
const heartbeat = async (req, res) => {
  try {
    const userId = req.usuario?.id;
    const accessLogId = req.usuario?.accessLogId; // Vem do JWT

    // Se não houver userId, retorna erro
    if (!userId) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido - usuário não identificado.'
      });
    }

    // Se o token não tem accessLogId (token antigo), retorna 200 mas pede reautenticação
    // IMPORTANTE: Não bloqueia o acesso, apenas avisa
    if (!accessLogId) {
      console.warn(`[Heartbeat] Token sem accessLogId para usuário ${userId}. Token antigo detectado.`);
      return res.status(200).json({
        sucesso: true,
        mensagem: 'Token sem accessLogId (sessão antiga). Faça logout e login novamente para habilitar rastreamento de sessão.',
        requiresReauth: true,
        tokenOutdated: true
      });
    }

    // Atualiza o last_seen da sessão ativa
    const query = `
      UPDATE access_logs
      SET last_seen = CURRENT_TIMESTAMP,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $1 AND usuario_id = $2 AND is_active = TRUE
      RETURNING id, last_seen
    `;

    const result = await pool.query(query, [accessLogId, userId]);

    if (result.rows.length === 0) {
      // Sessão não encontrada - mas não bloqueia o usuário
      console.warn(`[Heartbeat] Sessão ${accessLogId} não encontrada para usuário ${userId}`);
      return res.status(200).json({
        sucesso: false,
        mensagem: 'Sessão não encontrada ou já expirada (não bloqueante).',
        sessionNotFound: true
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Heartbeat registrado',
      lastSeen: result.rows[0].last_seen
    });

  } catch (error) {
    console.error('Erro no heartbeat:', error);
    // Retorna 200 mesmo com erro para não bloquear o usuário
    return res.status(200).json({
      sucesso: false,
      mensagem: 'Erro ao registrar heartbeat (não bloqueante)',
      error: true
    });
  }
};

/**
 * POST /api/session/logout
 * Registra o logout do usuário (logout_time)
 */
const logout = async (req, res) => {
  try {
    const userId = req.usuario?.id;
    const accessLogId = req.usuario?.accessLogId;

    if (userId && accessLogId) {
      // Registra o logout_time
      const query = `
        UPDATE access_logs
        SET logout_time = CURRENT_TIMESTAMP,
            is_active = FALSE,
            status = 'success',
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $1 AND usuario_id = $2
      `;

      await pool.query(query, [accessLogId, userId]);
    }

    // Logout do Passport
    req.logout((err) => {
      if (err) {
        console.error('Erro ao fazer logout do passport:', err);
      }

      // Destruir sessão
      req.session.destroy((err) => {
        if (err) {
          console.error('Erro ao destruir sessão:', err);
          return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao fazer logout'
          });
        }

        return res.status(200).json({
          sucesso: true,
          mensagem: 'Logout realizado com sucesso'
        });
      });
    });

  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao processar logout'
    });
  }
};

/**
 * GET /api/session/active
 * Retorna informações da sessão ativa do usuário
 */
const getActiveSession = async (req, res) => {
  try {
    const userId = req.usuario.id;

    const query = `
      SELECT
        id,
        login_time,
        last_seen,
        ip_address,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - login_time))::INTEGER AS duracao_segundos,
        CASE
          WHEN last_seen > CURRENT_TIMESTAMP - INTERVAL '2 minutes' THEN 'online'
          WHEN last_seen > CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN 'idle'
          ELSE 'offline'
        END AS status_presenca
      FROM access_logs
      WHERE usuario_id = $1 AND is_active = TRUE
      ORDER BY login_time DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Nenhuma sessão ativa encontrada'
      });
    }

    return res.status(200).json({
      sucesso: true,
      sessao: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar sessão ativa:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar sessão'
    });
  }
};

module.exports = {
  heartbeat,
  logout,
  getActiveSession
};
