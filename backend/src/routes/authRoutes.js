const express = require('express');
const { login, loginComId, validarCodigoRecuperacao, resetarSenha, firstLoginChangePassword, solicitarReset } = require('../controllers/authController');

const router = express.Router();

// Rota para login com email/senha
router.post('/login', login);

// Rota para login com ID e perfil
router.post('/login-id', loginComId);

// Rota para validar código de recuperação (pode ser descontinuada no futuro, mas manteremos por enquanto)
router.post('/validar-codigo', validarCodigoRecuperacao);

// Rota para resetar senha (fluxo antigo, ou admins forçando)
router.post('/resetar-senha', resetarSenha);

// Rota para redefinir senha no primeiro login forçado
router.post('/first-login-change-password', firstLoginChangePassword);

// Rota para solicitar redefinição de senha aos admins
router.post('/solicitar-reset', solicitarReset);

module.exports = router;