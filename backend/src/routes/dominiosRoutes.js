// Arquivo: backend/src/routes/dominiosRoutes.js
// Rotas para gerenciamento de domínios permitidos (APENAS ADMIN)

const express = require('express');
const {
  listarDominios,
  buscarDominioPorId,
  criarDominio,
  atualizarDominio,
  deletarDominio,
  toggleDominioAtivo
} = require('../controllers/dominiosController');
const verificarToken = require('../middlewares/authMiddleware'); // Importar diretamente
const { checkAdmin } = require('../middlewares/adminMiddleware');

const router = express.Router();

// Middleware para todas as rotas de domínios (autenticação + admin)
const adminAuth = [verificarToken, checkAdmin];

// Listar todos os domínios
router.get('/dominios', adminAuth, listarDominios);

// Buscar domínio específico
router.get('/dominios/:id', adminAuth, buscarDominioPorId);

// Criar novo domínio
router.post('/dominios', adminAuth, criarDominio);

// Atualizar domínio existente
router.put('/dominios/:id', adminAuth, atualizarDominio);

// Deletar domínio
router.delete('/dominios/:id', adminAuth, deletarDominio);

// Ativar/Desativar domínio
router.patch('/dominios/:id/toggle', adminAuth, toggleDominioAtivo);

module.exports = router;
