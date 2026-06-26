// Arquivo: backend/src/controllers/authController.js

const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const criarNotificacao = require('../helpers/criarNotificacao');

// Função de login principal
const login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
  }

  try {
    const { rows: usuarios } = await pool.query('SELECT * FROM usuario WHERE email = $1', [email]);

    if (usuarios.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    const usuario = usuarios[0];

    // Verificar se o usuário tem senha (usuários Google não têm senha)
    if (!usuario.senha_hash) {
      return res.status(401).json({
        mensagem: 'Este usuário usa login com Google. Por favor, utilize o botão "Entrar com Google Institucional".'
      });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: 'Email ou senha inválidos.' });
    }

    if (usuario.must_change_password) {
      return res.status(428).json({
        requirePasswordChange: true,
        usuario_id: usuario.id,
        mensagem: 'Você precisa redefinir sua senha de acesso.'
      });
    }

    // Criar registro de access_log
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const accessLogQuery = `
      INSERT INTO access_logs (usuario_id, email, nome, foto_url, login_time, last_seen, ip_address, is_active, status)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5, TRUE, 'success')
      RETURNING id
    `;
    const accessLogResult = await pool.query(accessLogQuery, [
      usuario.id,
      usuario.email,
      usuario.nome,
      usuario.foto_url,
      ipAddress
    ]);
    const accessLogId = accessLogResult.rows[0].id;

    // --- CORREÇÃO AQUI: Adicionamos accessLogId ao payload do token ---
    const payload = {
      id: usuario.id,
      nome: usuario.nome,
      tipo_usuario: usuario.tipo_usuario,
      foto_url: usuario.foto_url,
      accessLogId: accessLogId // Adicionado para rastreamento de sessão
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    const { senha_hash, ...usuarioSemSenha } = usuario;

    // Notificação de onboarding para alunos sem preferências (não bloqueia resposta)
    if (usuario.tipo_usuario === 'aluno') {
      (async () => {
        try {
          const { rows: prefRows } = await pool.query(
            'SELECT COUNT(*) FROM preferencias_aluno WHERE aluno_id = $1',
            [usuario.id]
          );
          if (parseInt(prefRows[0].count) === 0) {
            const { rows: jaExiste } = await pool.query(
              "SELECT id FROM notificacoes WHERE usuario_id = $1 AND tipo = 'ONBOARDING'",
              [usuario.id]
            );
            if (jaExiste.length === 0) {
              await criarNotificacao(
                usuario.id,
                'ONBOARDING',
                'Personalize suas recomendações!',
                'Escolha suas categorias e autores favoritos para receber sugestões certeiras de livros.'
              );
            }
          }
        } catch (e) { /* silencioso — não interrompe o fluxo */ }
      })();
    }

    return res.status(200).json({
      mensagem: 'Login bem-sucedido!',
      usuario: usuarioSemSenha,
      token,
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};


// Função de login com ID (usada na tela de seleção de perfil)
const loginComId = async (req, res) => {
  const { id, profile } = req.body;

  if (!id || !profile) {
    return res.status(400).json({ message: 'ID e perfil são obrigatórios.' });
  }

  const tipoUsuarioNoBanco = profile === 'librarian' ? 'bibliotecario' : 'aluno';

  try {
    const query = 'SELECT * FROM usuario WHERE id = $1 AND tipo_usuario = $2';
    const { rows } = await pool.query(query, [id, tipoUsuarioNoBanco]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado com a identificação fornecida.' });
    }

    const usuarioEncontrado = rows[0];

    // Criar registro de access_log
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const accessLogQuery = `
      INSERT INTO access_logs (usuario_id, email, nome, foto_url, login_time, last_seen, ip_address, is_active, status)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5, TRUE, 'success')
      RETURNING id
    `;
    const accessLogResult = await pool.query(accessLogQuery, [
      usuarioEncontrado.id,
      usuarioEncontrado.email,
      usuarioEncontrado.nome,
      usuarioEncontrado.foto_url,
      ipAddress
    ]);
    const accessLogId = accessLogResult.rows[0].id;

    // --- CORREÇÃO AQUI: Adicionamos accessLogId ao payload do token ---
    const payload = {
      id: usuarioEncontrado.id,
      nome: usuarioEncontrado.nome,
      tipo_usuario: usuarioEncontrado.tipo_usuario,
      foto_url: usuarioEncontrado.foto_url,
      accessLogId: accessLogId // Adicionado para rastreamento de sessão
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    const { senha_hash, ...usuarioSemSenha } = usuarioEncontrado;

    return res.status(200).json({
      mensagem: 'Validação de perfil bem-sucedida!',
      usuario: usuarioSemSenha,
      token,
    });

  } catch (error) {
    console.error('Erro no login com ID:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};


// Função para validar ID do usuário
const validarCodigoRecuperacao = async (req, res) => {
  const { email, codigo_recuperacao } = req.body; // codigo_recuperacao = ID do usuário

  if (!email || !codigo_recuperacao) {
    return res.status(400).json({ mensagem: 'Email e ID do usuário são obrigatórios.' });
  }

  try {
    // Valida usando email + ID do usuário
    const { rows: usuarios } = await pool.query(
      'SELECT id, nome, email FROM usuario WHERE email = $1 AND id = $2',
      [email, codigo_recuperacao]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        mensagem: 'Email ou ID inválidos. Entre em contato com a organização para obter seu ID de usuário.'
      });
    }

    const usuario = usuarios[0];

    return res.status(200).json({
      mensagem: 'ID validado com sucesso!',
      usuario_id: usuario.id,
      nome: usuario.nome,
      email: usuario.email
    });

  } catch (error) {
    console.error('Erro ao validar ID de recuperação:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

// Função para resetar senha usando ID do usuário
const resetarSenha = async (req, res) => {
  const { email, codigo_recuperacao, nova_senha } = req.body; // codigo_recuperacao = ID do usuário

  if (!email || !codigo_recuperacao || !nova_senha) {
    return res.status(400).json({ mensagem: 'Email, ID do usuário e nova senha são obrigatórios.' });
  }

  // Validação de senha forte
  if (nova_senha.length < 6) {
    return res.status(400).json({ mensagem: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  try {
    // Verifica se o email e ID estão corretos
    const { rows: usuarios } = await pool.query(
      'SELECT id FROM usuario WHERE email = $1 AND id = $2',
      [email, codigo_recuperacao]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        mensagem: 'Email ou ID inválidos.'
      });
    }

    const usuario = usuarios[0];

    // Criptografa a nova senha
    const saltRounds = 10;
    const novaSenhaHash = await bcrypt.hash(nova_senha, saltRounds);

    // Atualiza a senha no banco de dados
    await pool.query(
      'UPDATE usuario SET senha_hash = $1 WHERE id = $2',
      [novaSenhaHash, usuario.id]
    );

    return res.status(200).json({
      mensagem: 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.'
    });

  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

// Função para redefinir senha no primeiro login
const firstLoginChangePassword = async (req, res) => {
  const { usuario_id, nova_senha } = req.body;

  if (!usuario_id || !nova_senha) {
    return res.status(400).json({ mensagem: 'ID do usuário e nova senha são obrigatórios.' });
  }

  try {
    const saltRounds = 10;
    const novaSenhaHash = await bcrypt.hash(nova_senha, saltRounds);

    await pool.query(
      'UPDATE usuario SET senha_hash = $1, must_change_password = FALSE WHERE id = $2',
      [novaSenhaHash, usuario_id]
    );

    return res.status(200).json({
      mensagem: 'Senha redefinida com sucesso. Faça login com sua nova senha.'
    });
  } catch (error) {
    console.error('Erro no firstLoginChangePassword:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

// Função para solicitar redefinição de senha (envia notificação aos admins)
const solicitarReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ mensagem: 'E-mail é obrigatório.' });
  }

  try {
    const { rows: usuarios } = await pool.query('SELECT id, nome, email FROM usuario WHERE email = $1', [email]);
    
    if (usuarios.length === 0) {
      // Retornar 200 mesmo se não encontrar, por segurança (evita enumeração de emails)
      return res.status(200).json({ mensagem: 'Se o e-mail existir, os administradores serão notificados.' });
    }

    const usuario = usuarios[0];

    // Buscar todos os admins
    const { rows: admins } = await pool.query("SELECT id FROM usuario WHERE tipo_usuario = 'admin'");

    // Criar notificação para cada admin
    for (const admin of admins) {
      await pool.query(
        `INSERT INTO notificacoes (usuario_id, tipo, lida, data_criacao, mensagem, payload)
         VALUES ($1, 'PASSWORD_RESET_REQUEST', false, CURRENT_TIMESTAMP, $2, $3)`,
        [
          admin.id,
          `O usuário ${usuario.nome} solicitou redefinição de senha.`,
          JSON.stringify({ usuario_id: usuario.id, email: usuario.email, nome: usuario.nome })
        ]
      );
    }

    return res.status(200).json({
      mensagem: 'Sua solicitação foi enviada aos administradores com sucesso.'
    });

  } catch (error) {
    console.error('Erro em solicitarReset:', error);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = {
  login,
  loginComId,
  validarCodigoRecuperacao,
  resetarSenha,
  firstLoginChangePassword,
  solicitarReset,
};