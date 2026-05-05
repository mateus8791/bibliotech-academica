/**
 * Rotas de gerenciamento de sessões
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { heartbeat, logout, getActiveSession } = require('../controllers/sessionController');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// POST /api/session/logout - Faz logout
router.post('/logout', logout);

// POST /api/session/heartbeat - Atualiza last_seen
router.post('/heartbeat', heartbeat);

// GET /api/session/active - Retorna sessão ativa
router.get('/active', getActiveSession);

module.exports = router;
