// Arquivo: backend/src/routes/reservationRoutes.js

const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

// Importamos as funções do nosso controlador
const {
  createReservation,
  getMyReservations,
  cancelReservation,
} = require('../controllers/reservationController');

const router = express.Router();

// Rota para BUSCAR todas as reservas do usuário logado
router.get('/reservas/minhas', authMiddleware, getMyReservations);

// Rota para CRIAR uma nova reserva
router.post('/reservas', authMiddleware, createReservation);

// Rota para CANCELAR uma reserva específica pelo seu ID
router.put('/reservas/:id/cancelar', authMiddleware, cancelReservation);


module.exports = router;
