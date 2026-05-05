// backend/src/routes/livros.js (ou caminho equivalente)

const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkAdmin } = require('../middlewares/adminMiddleware');
const multer = require('multer');

const {
  getAllBooks,
  createBook,
  getBookById,
  updateBook,
  deleteBook,
  getAvailableBooks,
  getBooksByCategory,
  getBooksByAuthor,
  importarLivrosCSV,
  getNewBooks,
  getPromotionalBooks
} = require('../controllers/bookController');

const router = express.Router();

// Configuração do multer
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .csv são permitidos!'), false);
    }
  }
}); 

// ------------------------------
// ROTAS PÚBLICAS (sem login)
// ------------------------------

// Buscar livros novos (para landing page) - DEVE VIR ANTES DAS ROTAS PARAMETRIZADAS
router.get('/livros-novos', getNewBooks);

// Buscar livros em promoção (ofertas do dia) - DEVE VIR ANTES DAS ROTAS PARAMETRIZADAS
router.get('/livros-promocao', getPromotionalBooks);

// Lista todos os livros (público para a Storefront)
router.get('/livros', getAllBooks);

// ------------------------------
// ROTAS AUTENTICADAS (rotas específicas DEVEM vir antes de /livros/:id)
// ------------------------------

// Livros disponíveis (mantém proteção)
router.get('/livros/disponiveis', authMiddleware, getAvailableBooks);

// Filtros (mantém proteção) - DEVEM VIR ANTES DE /livros/:id
router.get('/livros/categoria/:categoriaId', authMiddleware, getBooksByCategory);
router.get('/livros/autor/:autorId', authMiddleware, getBooksByAuthor);

// ------------------------------
// ROTAS PÚBLICAS PARAMETRIZADAS (devem vir por último)
// ------------------------------

// Busca um livro por ID (público para a Storefront) - DEVE SER A ÚLTIMA ROTA GET /livros/*
router.get('/livros/:id', getBookById);

// Criação de livro (somente bibliotecário)
router.post('/livros', authMiddleware, checkAdmin, createBook); 

// Atualização de livro (somente bibliotecário)
router.put('/livros/:id', authMiddleware, checkAdmin, updateBook);

// Exclusão de livro (somente bibliotecário)
router.delete('/livros/:id', authMiddleware, checkAdmin, deleteBook);

// Importação via CSV (somente bibliotecário)
router.post(
  '/livros/importar', 
  authMiddleware,
  checkAdmin,
  upload.single('file'), 
  importarLivrosCSV 
);

module.exports = router;

