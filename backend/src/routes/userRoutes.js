// Arquivo: backend/src/routes/userRoutes.js

const express = require('express');
const {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkAdminOrBibliotecario, checkAdmin } = require('../middlewares/adminMiddleware');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rota para LISTAR todos os usuários - Admin e Bibliotecário podem ver
router.get('/usuarios', checkAdminOrBibliotecario, getAllUsers);

// Rota para CRIAR um novo usuário - Apenas Admin
router.post('/usuarios', checkAdmin, createUser);

// Rotas para um usuário específico
router.get('/usuarios/:id', checkAdminOrBibliotecario, getUserById);
router.put('/usuarios/:id', checkAdmin, updateUser);
router.delete('/usuarios/:id', checkAdmin, deleteUser);

module.exports = router;