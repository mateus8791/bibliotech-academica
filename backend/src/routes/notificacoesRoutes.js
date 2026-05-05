// Arquivo: backend/src/routes/notificacoesRoutes.js

const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getNaoLidas,
  getTodas,
  marcarTodasLidas,
  marcarLida,
  deletar,
} = require('../controllers/notificacoesController');

const router = express.Router();

// IMPORTANTE: /todas/lidas deve vir ANTES de /:id/lida para não conflitar
router.get('/notificacoes',           authMiddleware, getNaoLidas);
router.get('/notificacoes/todas',     authMiddleware, getTodas);
router.put('/notificacoes/todas/lidas', authMiddleware, marcarTodasLidas);
router.put('/notificacoes/:id/lida',  authMiddleware, marcarLida);
router.delete('/notificacoes/:id',    authMiddleware, deletar);

module.exports = router;
