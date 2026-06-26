// Arquivo: backend/src/routes/userRoutes.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getOnlineUsers
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { checkAdminOrBibliotecario, checkAdmin } = require('../middlewares/adminMiddleware');

const router = express.Router();

// Configuração do multer para upload de avatares locais
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rota para usuários online (qualquer usuário logado pode acessar)
router.get('/usuarios/online', getOnlineUsers);

// Rota para LISTAR todos os usuários - Admin e Bibliotecário podem ver
router.get('/usuarios', checkAdminOrBibliotecario, getAllUsers);

// Rota para CRIAR um novo usuário - Apenas Admin
router.post('/usuarios', checkAdmin, createUser);

// Rotas para um usuário específico
router.get('/usuarios/:id', checkAdminOrBibliotecario, getUserById);
router.put('/usuarios/:id', checkAdmin, upload.single('file'), updateUser);
router.delete('/usuarios/:id', checkAdmin, deleteUser);

module.exports = router;