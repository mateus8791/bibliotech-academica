// backend/src/routes/publicRoutes.js
// Rotas públicas (sem autenticação) para visitantes

const express = require('express');
const router = express.Router();
const {
  getPublicBookById,
  getRelatedBooks,
  getAllAuthorsPublic,
  getAllCategoriesPublic,
  getFilteredBooks
} = require('../controllers/publicController');

const {
  getNewBooks,
  getPromotionalBooks,
  getAllBooks
} = require('../controllers/bookController');

// Rotas públicas - SEM authMiddleware
router.get('/livro/:id', getPublicBookById);
router.get('/livro/:id/relacionados', getRelatedBooks);
router.get('/autores', getAllAuthorsPublic);
router.get('/categorias', getAllCategoriesPublic);
router.get('/livros', getFilteredBooks);

// Landing page public routes
router.get('/livros-novos', getNewBooks);
router.get('/livros-promocao', getPromotionalBooks);
router.get('/todos-livros', getAllBooks);

module.exports = router;
