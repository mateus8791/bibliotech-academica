// Arquivo: backend/src/config/passport.js
// Configuração do Passport.js para autenticação com Google OAuth 2.0

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');

// Configuração da estratégia do Google OAuth (apenas se as credenciais estiverem configuradas)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
      try {
        // Extrair informações do perfil do Google
        const googleId = profile.id;
        const email = profile.emails[0].value;
        const nome = profile.displayName;
        const foto_url = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

        // Extrair o domínio do e-mail
        const dominio = '@' + email.split('@')[1];

        // Verificar se o domínio está na lista de domínios permitidos
        const { rows: dominiosPermitidos } = await pool.query(
          'SELECT * FROM dominios_permitidos WHERE dominio = $1 AND ativo = true',
          [dominio]
        );

        if (dominiosPermitidos.length === 0) {
          // Domínio não permitido
          return done(null, false, {
            message: `Acesso negado. O domínio ${dominio} não está autorizado. Entre em contato com o administrador.`
          });
        }

        // Verificar se o usuário já existe no banco
        const { rows: usuariosExistentes } = await pool.query(
          'SELECT * FROM usuario WHERE google_id = $1',
          [googleId]
        );

        let usuario;

        if (usuariosExistentes.length > 0) {
          // Usuário já existe - fazer login
          usuario = usuariosExistentes[0];

          // Atualizar foto se mudou
          if (usuario.foto_url !== foto_url) {
            await pool.query(
              'UPDATE usuario SET foto_url = $1 WHERE id = $2',
              [foto_url, usuario.id]
            );
            usuario.foto_url = foto_url;
          }
        } else {
          // Novo usuário - criar conta automaticamente
          const { rows: novoUsuario } = await pool.query(
            `INSERT INTO usuario (nome, email, google_id, is_google_user, foto_url, tipo_usuario, data_cadastro)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
             RETURNING *`,
            [nome, email, googleId, true, foto_url, 'aluno'] // Por padrão, novos usuários são 'aluno'
          );

          usuario = novoUsuario[0];
        }

        // Retornar o usuário autenticado
        return done(null, usuario);
      } catch (error) {
        console.error('Erro na autenticação Google:', error);
        return done(error, null);
      }
    }
  )
);
} else {
  console.warn('⚠️  Google OAuth não configurado. Login com Google estará desabilitado.');
}

// Serialização do usuário (armazenar na sessão)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Desserialização do usuário (recuperar da sessão)
passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query('SELECT * FROM usuario WHERE id = $1', [id]);
    if (rows.length > 0) {
      done(null, rows[0]);
    } else {
      done(new Error('Usuário não encontrado'), null);
    }
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
