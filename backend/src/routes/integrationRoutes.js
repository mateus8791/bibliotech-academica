// Arquivo: backend/src/routes/integrationRoutes.js

const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkAdminOrBibliotecario } = require('../middlewares/adminMiddleware');
const {
  listarIntegracoes,
  atualizarIntegracao,
  testarConexao,
  googleBooksSearch
} = require('../controllers/integrationController');

const router = express.Router();

// GET    /api/integrations       - lista todas
// PUT    /api/integrations/:id   - atualiza uma integração
// POST   /api/integrations/:id/test - testa a conexão

router.get('/integrations', authMiddleware, checkAdminOrBibliotecario, listarIntegracoes);
router.put('/integrations/:id', authMiddleware, checkAdminOrBibliotecario, atualizarIntegracao);
router.post('/integrations/:id/test', authMiddleware, checkAdminOrBibliotecario, testarConexao);
router.get('/integrations/google-books/search', authMiddleware, checkAdminOrBibliotecario, googleBooksSearch);

module.exports = router;
