// Arquivo: backend/src/routes/recomendacoesRoutes.js

const express = require('express');
const router = express.Router();
const { getRecomendacoes, temPreferencias } = require('../controllers/recomendacoesController');

// GET /api/recomendacoes/tem-preferencias — verificar se aluno tem preferências
// DEVE vir antes de / para não ser capturado como parâmetro
router.get('/tem-preferencias', temPreferencias);

// GET /api/recomendacoes — lista de livros recomendados com score e motivo
router.get('/', getRecomendacoes);

module.exports = router;
