// Arquivo: backend/src/routes/rankingRoutes.js

const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getRankingLeitores } = require('../controllers/rankingController');

const router = express.Router();

// GET /api/ranking/leitores — top alunos por livros lidos + posição do próprio usuário
router.get('/ranking/leitores', authMiddleware, getRankingLeitores);

module.exports = router;
