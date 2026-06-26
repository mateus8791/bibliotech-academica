// Arquivo: backend/src/routes/avaliacoesRoutes.js

const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkAdminOrBibliotecario } = require('../middlewares/adminMiddleware');
const {
  listarAvaliacoes,
  criarAvaliacao,
  editarAvaliacao,
  arquivarAvaliacao,
  deletarAvaliacao,
  notificarAutor,
} = require('../controllers/avaliacoesController');

const router = express.Router();

// GET    /api/avaliacoes               — lista com filtros opcionais
// POST   /api/avaliacoes               — cria (apenas aluno)
// PUT    /api/avaliacoes/:id           — edita nota/comentario (dono ou admin)
// PATCH  /api/avaliacoes/:id/arquivar  — alterna ativa/arquivada (admin/bibliotecário)
// POST   /api/avaliacoes/:id/notificar — notifica autor (admin/bibliotecário)
// DELETE /api/avaliacoes/:id           — exclui (dono ou admin)

// IMPORTANTE: /arquivar deve vir ANTES de /:id para não conflitar
router.get('/avaliacoes',                    authMiddleware, listarAvaliacoes);
router.post('/avaliacoes',                   authMiddleware, criarAvaliacao);
router.put('/avaliacoes/:id',                authMiddleware, editarAvaliacao);
router.patch('/avaliacoes/:id/arquivar',     authMiddleware, checkAdminOrBibliotecario, arquivarAvaliacao);
router.post('/avaliacoes/:id/notificar',     authMiddleware, checkAdminOrBibliotecario, notificarAutor);
router.delete('/avaliacoes/:id',             authMiddleware, deletarAvaliacao);

module.exports = router;
