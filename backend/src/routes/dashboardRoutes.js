// Arquivo: backend/src/routes/dashboardRoutes.js

const express = require('express');
const { getLoanDashboardData, getStudentDashboard } = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkAdminOrBibliotecario } = require('../middlewares/adminMiddleware');

const router = express.Router();

// Protegemos a rota para que apenas bibliotecários/admins possam acessá-la
const adminOnly = [authMiddleware, checkAdminOrBibliotecario];

// Define o endpoint GET /dashboard/emprestimos
router.get('/dashboard/emprestimos', adminOnly, getLoanDashboardData);

// TESTE SIMPLES - Endpoint sem nenhuma lógica complexa
router.get('/dashboard/teste', authMiddleware, (req, res) => {
  console.log('=== TESTE ENDPOINT ===');
  console.log('req.usuario:', req.usuario);
  res.json({ sucesso: true, usuario: req.usuario, mensagem: 'Autenticação funcionando!' });
});

// Dashboard completo do aluno (autenticado)
router.get('/dashboard/aluno', authMiddleware, (req, res, next) => {
  console.log('========== DEBUG DASHBOARD ALUNO ==========');
  console.log('req.usuario:', req.usuario);
  console.log('req.usuario.tipo_usuario:', req.usuario?.tipo_usuario);
  console.log('Chamando getStudentDashboard...');
  console.log('==========================================');
  next();
}, getStudentDashboard);

module.exports = router;