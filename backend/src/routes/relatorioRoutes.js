// Arquivo: backend/src/routes/relatorioRoutes.js

const express = require('express');
const { getDashboardStats } = require('../controllers/relatorioController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkAdminOrBibliotecario } = require('../middlewares/adminMiddleware');

const router = express.Router();

// A rota agora é completa: /relatorios/estatisticas
// Requer autenticação e tipo de usuário admin ou bibliotecario
router.get('/relatorios/estatisticas',
  authMiddleware,
  checkAdminOrBibliotecario,
  getDashboardStats
);

module.exports = router;