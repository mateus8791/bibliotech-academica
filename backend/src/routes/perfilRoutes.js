// Arquivo: backend/src/routes/perfilRoutes.js

const express = require('express');
const { getMeuPerfilData } = require('../controllers/perfilController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// A rota /perfil é protegida, precisa de um usuário logado para funcionar
router.get('/perfil', authMiddleware, getMeuPerfilData);

module.exports = router;