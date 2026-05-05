/**
 * Rotas para visualização de logs de acesso
 * Acesso: Apenas administradores
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { checkAdmin } = require('../middlewares/adminMiddleware');
const {
  getAllAccessLogs,
  getAccessStats,
  getActiveSessions,
  getUserAccessLogs
} = require('../controllers/accessLogsController');

// Todas as rotas requerem autenticação + tipo admin
router.use(authMiddleware);
router.use(checkAdmin);

// GET /api/access-logs - Lista todos os logs
router.get('/', getAllAccessLogs);

// GET /api/access-logs/stats - Estatísticas gerais
router.get('/stats', getAccessStats);

// GET /api/access-logs/active-sessions - Sessões ativas
router.get('/active-sessions', getActiveSessions);

// GET /api/access-logs/user/:userId - Logs de um usuário específico
router.get('/user/:userId', getUserAccessLogs);

module.exports = router;
