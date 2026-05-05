// Arquivo: backend/src/controllers/googleAuthController.js
// Controller para autenticação via Google OAuth 2.0

const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Helper: Registra o acesso no access_logs
async function logAccess(usuario, req, status = 'success', failureReason = null) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
             req.connection?.remoteAddress ||
             req.socket?.remoteAddress ||
             'unknown';

  const userAgent = req.headers['user-agent'] || '';

  try {
    const query = `
      INSERT INTO access_logs (
        usuario_id, email, nome, foto_url,
        status, failure_reason, ip_address, user_agent,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const values = [
      usuario?.id || null,
      usuario?.email || 'unknown',
      usuario?.nome || null,
      usuario?.foto_url || null,
      status,
      failureReason,
      ip,
      userAgent,
      status === 'success'
    ];

    const result = await pool.query(query, values);
    return result.rows[0]?.id;
  } catch (error) {
    console.error('Erro ao registrar access_log:', error);
    return null;
  }
}

// Callback de sucesso após autenticação Google
const googleAuthCallback = async (req, res) => {
  try {
    // req.user contém os dados do usuário autenticado (vem do Passport)
    const usuario = req.user;

    if (!usuario) {
      await logAccess(null, req, 'failed', 'auth_failed');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    // Registra o acesso com sucesso
    const accessLogId = await logAccess(usuario, req, 'success');

    // Criar JWT token para o usuário
    const payload = {
      id: usuario.id,
      nome: usuario.nome,
      tipo_usuario: usuario.tipo_usuario,
      foto_url: usuario.foto_url,
      email: usuario.email,
      accessLogId // ID do log para atualizar o heartbeat
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    // Remover dados sensíveis antes de enviar
    const { senha_hash, google_id, ...usuarioSeguro } = usuario;

    // Redirecionar para o frontend com o token e dados do usuário
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/google/success?token=${token}&user=${encodeURIComponent(JSON.stringify(usuarioSeguro))}`;

    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('Erro no callback de autenticação Google:', error);
    await logAccess(null, req, 'failed', 'server_error');
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

// Callback de erro na autenticação Google
const googleAuthFailure = (req, res) => {
  const message = req.flash('error')[0] || 'Falha na autenticação com Google';
  return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
};

// Rota de logout
const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ mensagem: 'Erro ao fazer logout' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ mensagem: 'Erro ao destruir sessão' });
      }
      res.status(200).json({ mensagem: 'Logout realizado com sucesso' });
    });
  });
};

module.exports = {
  googleAuthCallback,
  googleAuthFailure,
  logout
};
