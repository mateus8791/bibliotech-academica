// backend/src/routes/authorRoutes.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
// Importar as funções existentes e a nova searchAuthors
const { getAllAuthors, createAuthor, searchAuthors } = require('../controllers/authorController');
// const roleMiddleware = require('../middlewares/roleMiddleware'); // Para controle de acesso, se necessário

const router = express.Router();

// NOVA Rota: Buscar autores por nome (protegida)
router.get('/autores/search', authMiddleware, searchAuthors);

// Rota existente: Buscar todos os autores (protegida)
router.get('/autores', authMiddleware, getAllAuthors);

// Rota existente: Criar novo autor (protegida)
// Você pode adicionar roleMiddleware(['admin']) se só admins puderem criar
router.post('/autores', authMiddleware, /* roleMiddleware(['admin']), */ createAuthor);

module.exports = router;