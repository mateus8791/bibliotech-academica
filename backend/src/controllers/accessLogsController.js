/**
 * =====================================================
 * CONTROLLER: Logs de Acesso e Auditoria
 * =====================================================
 * Endpoints para visualização de logs de sessões
 * e estatísticas para dashboards administrativos
 *
 * Autor: Claude Code
 * Data: 2025-11-10
 * =====================================================
 */

const pool = require('../config/database');

/**
 * GET /api/access-logs - Lista todos os logs de acesso
 * Query params: ?page=1&limit=50&status=success&date=2025-11-10
 */
const getAllAccessLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      date,
      userId
    } = req.query;

    const offset = (page - 1) * limit;

    // Constrói a query dinamicamente
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (date) {
      whereConditions.push(`DATE(login_time) = $${paramIndex}`);
      params.push(date);
      paramIndex++;
    }

    if (userId) {
      whereConditions.push(`usuario_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Query para buscar os logs
    const query = `
      SELECT
        id,
        usuario_id,
        nome,
        email,
        foto_url,
        login_time,
        logout_time,
        last_seen,
        session_duration_seconds,
        status,
        failure_reason,
        ip_address,
        is_active,
        EXTRACT(EPOCH FROM (COALESCE(logout_time, last_seen) - login_time))::INTEGER AS duracao_calculada
      FROM access_logs
      ${whereClause}
      ORDER BY login_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM access_logs
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, params.slice(0, paramIndex - 1));
    const total = parseInt(countResult.rows[0].total);

    return res.status(200).json({
      sucesso: true,
      logs: result.rows,
      paginacao: {
        paginaAtual: parseInt(page),
        itensPorPagina: parseInt(limit),
        totalItens: total,
        totalPaginas: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs de acesso:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar logs de acesso'
    });
  }
};

/**
 * GET /api/access-logs/stats - Estatísticas gerais
 */
const getAccessStats = async (req, res) => {
  try {
    // Total de logins hoje
    const todayQuery = `
      SELECT
        COUNT(*) as total_hoje,
        COUNT(*) FILTER (WHERE status = 'success') as sucessos_hoje,
        COUNT(*) FILTER (WHERE status = 'failed') as falhas_hoje
      FROM access_logs
      WHERE DATE(login_time) = CURRENT_DATE
    `;

    // Sessões ativas agora
    const activeQuery = `
      SELECT COUNT(*) as sessoes_ativas
      FROM access_logs
      WHERE is_active = TRUE
        AND last_seen > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
    `;

    // Total de logins nos últimos 7 dias
    const weekQuery = `
      SELECT
        DATE(login_time) as data,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'success') as sucessos,
        COUNT(*) FILTER (WHERE status = 'failed') as falhas
      FROM access_logs
      WHERE login_time >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(login_time)
      ORDER BY data DESC
    `;

    // Sessões por hora (últimas 24h)
    const hourlyQuery = `
      SELECT
        EXTRACT(HOUR FROM login_time) as hora,
        COUNT(*) as total
      FROM access_logs
      WHERE login_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      GROUP BY EXTRACT(HOUR FROM login_time)
      ORDER BY hora
    `;

    // Top 5 usuários mais ativos
    const topUsersQuery = `
      SELECT
        usuario_id,
        nome,
        email,
        foto_url,
        COUNT(*) as total_sessoes,
        AVG(session_duration_seconds) as duracao_media
      FROM access_logs
      WHERE login_time >= CURRENT_DATE - INTERVAL '7 days'
        AND usuario_id IS NOT NULL
      GROUP BY usuario_id, nome, email, foto_url
      ORDER BY total_sessoes DESC
      LIMIT 5
    `;

    const [todayResult, activeResult, weekResult, hourlyResult, topUsersResult] = await Promise.all([
      pool.query(todayQuery),
      pool.query(activeQuery),
      pool.query(weekQuery),
      pool.query(hourlyQuery),
      pool.query(topUsersQuery)
    ]);

    return res.status(200).json({
      sucesso: true,
      estatisticas: {
        hoje: todayResult.rows[0],
        sessoesAtivas: parseInt(activeResult.rows[0].sessoes_ativas),
        ultimos7Dias: weekResult.rows,
        porHora: hourlyResult.rows,
        topUsuarios: topUsersResult.rows
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar estatísticas'
    });
  }
};

/**
 * GET /api/access-logs/active-sessions - Sessões ativas no momento
 */
const getActiveSessions = async (req, res) => {
  try {
    const query = `
      SELECT
        id,
        usuario_id,
        nome,
        email,
        foto_url,
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
      WHERE is_active = TRUE
        AND last_seen > CURRENT_TIMESTAMP - INTERVAL '30 minutes'
      ORDER BY last_seen DESC
    `;

    const result = await pool.query(query);

    return res.status(200).json({
      sucesso: true,
      total: result.rows.length,
      sessoes: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar sessões ativas:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar sessões ativas'
    });
  }
};

/**
 * GET /api/access-logs/user/:userId - Logs de um usuário específico
 */
const getUserAccessLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const query = `
      SELECT
        id,
        login_time,
        logout_time,
        last_seen,
        session_duration_seconds,
        status,
        ip_address,
        EXTRACT(EPOCH FROM (COALESCE(logout_time, last_seen) - login_time))::INTEGER AS duracao_calculada
      FROM access_logs
      WHERE usuario_id = $1
      ORDER BY login_time DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);

    return res.status(200).json({
      sucesso: true,
      total: result.rows.length,
      logs: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar logs do usuário:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar logs do usuário'
    });
  }
};

module.exports = {
  getAllAccessLogs,
  getAccessStats,
  getActiveSessions,
  getUserAccessLogs
};
