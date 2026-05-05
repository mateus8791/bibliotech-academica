// Arquivo: backend/src/routes/googleAuthRoutes.js
// Rotas para autenticação via Google OAuth 2.0

const express = require('express');
const passport = require('../config/passport');
const { googleAuthCallback, googleAuthFailure, logout } = require('../controllers/googleAuthController');

const router = express.Router();

// Rota para iniciar o fluxo de autenticação Google
// O usuário será redirecionado para a página de login do Google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    // hd pode ser configurado dinamicamente aqui se necessário
    // mas a validação real acontece no callback
  })
);

// Rota de callback após autenticação Google
// O Google redireciona para cá após o usuário fazer login
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/google/failure',
    failureFlash: true
  }),
  googleAuthCallback
);

// Rota de falha na autenticação
router.get('/google/failure', googleAuthFailure);

// Rota de logout
router.post('/logout', logout);

module.exports = router;
