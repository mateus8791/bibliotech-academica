// Arquivo: backend/src/routes/preferenciasRoutes.js

const express = require('express');
const router = express.Router();
const {
  getPreferencias,
  salvarPreferencias,
  removerPreferencia,
} = require('../controllers/preferenciasController');

// GET /api/preferencias — lista preferências do aluno autenticado
router.get('/', getPreferencias);

// POST /api/preferencias — salva preferências (substitui anteriores)
router.post('/', salvarPreferencias);

// DELETE /api/preferencias/:tipo/:valor — remove uma preferência específica
router.delete('/:tipo/:valor', removerPreferencia);

module.exports = router;
