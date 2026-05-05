// Arquivo: backend/src/routes/authRoutes.js

const express = require('express');
const { login, loginComId, validarCodigoRecuperacao, resetarSenha } = require('../controllers/authController');

const router = express.Router();

// Rota para login com email/senha
router.post('/login', login);

// Rota para login com ID e perfil
router.post('/login-id', loginComId);

// Rota para validar código de recuperação
router.post('/validar-codigo', validarCodigoRecuperacao);

// Rota para resetar senha
router.post('/resetar-senha', resetarSenha);

module.exports = router;