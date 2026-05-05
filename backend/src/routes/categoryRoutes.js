// backend/src/routes/categoryRoutes.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
// Importar a nova função searchCategories e a createCategory
const { getAllCategories, searchCategories, createCategory } = require('../controllers/categoryController');

const router = express.Router();

// NOVA Rota: Buscar categorias por nome (protegida)
// Usará req.query.nome para pegar o termo de busca
router.get('/categorias/search', authMiddleware, searchCategories);

// Rota PÚBLICA: Buscar todas as categorias (para filtros da landing page)
router.get('/categorias/publico', getAllCategories);

// Rota existente: Buscar todas as categorias (protegida)
router.get('/categorias', authMiddleware, getAllCategories);

// Rota existente: Criar nova categoria (protegida - ajustar middleware se necessário)
// Assumindo que apenas admins podem criar, você pode adicionar um roleMiddleware aqui
router.post('/categorias', authMiddleware, /* roleMiddleware(['admin']), */ createCategory);


module.exports = router;