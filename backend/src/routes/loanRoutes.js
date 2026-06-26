// Arquivo: backend/src/routes/loanRoutes.js

const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getMyBooks, getHistorico } = require('../controllers/loanController');

const router = express.Router();

// Define que a rota GET para /meus-livros é protegida e usa a função getMyBooks
router.get('/meus-livros', authMiddleware, getMyBooks);

// Nova rota para histórico de leituras
router.get('/historico', authMiddleware, getHistorico);

module.exports = router;
