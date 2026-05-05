const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Endpoint de diagnóstico - verifica o token atual
router.get('/diagnostico/token', authMiddleware, (req, res) => {
  try {
    return res.status(200).json({
      mensagem: 'Token decodificado com sucesso',
      usuario: req.usuario,
      possui_tipo: !!req.usuario.tipo,
      possui_tipo_usuario: !!req.usuario.tipo_usuario,
      valor_tipo: req.usuario.tipo || null,
      valor_tipo_usuario: req.usuario.tipo_usuario || null,
    });
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao verificar token',
      erro: error.message
    });
  }
});

module.exports = router;
