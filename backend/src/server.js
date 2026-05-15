// Arquivo: backend/src/server.js

// Carregar variáveis de ambiente PRIMEIRO
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
require('./config/redis');

// --- 1. IMPORTAR TODAS AS NOSSAS ROTAS ---
const authRoutes = require('./routes/authRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes'); // Rotas Google OAuth
const dominiosRoutes = require('./routes/dominiosRoutes'); // Rotas de gerenciamento de domínios
const bookRoutes = require('./routes/bookRoutes');
const authorRoutes = require('./routes/authorRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const loanRoutes = require('./routes/loanRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes'); // Rota de Relatórios
const userRoutes = require('./routes/userRoutes');       // <-- A LINHA QUE FALTAVA
const dashboardRoutes = require('./routes/dashboardRoutes'); // 1. IMPORTE AQUI
const perfilRoutes = require('./routes/perfilRoutes'); // 1. IMPORTE AQUI
const publicRoutes = require('./routes/publicRoutes'); // Rotas públicas (sem autenticação)

// Rotas de sessão e logs
const sessionRoutes = require('./routes/sessionRoutes'); // Heartbeat e logout
const accessLogsRoutes = require('./routes/accessLogsRoutes'); // Logs de acesso
const diagnosticoRoutes = require('./routes/diagnosticoRoutes'); // Diagnóstico
const notificacoesRoutes = require('./routes/notificacoesRoutes'); // Notificações
const preferenciasRoutes = require('./routes/preferenciasRoutes'); // Preferências do aluno
const recomendacoesRoutes = require('./routes/recomendacoesRoutes'); // Recomendações de livros
const avaliacoesRoutes = require('./routes/avaliacoesRoutes'); // Avaliações de livros

const path = require('path');

const app = express();

// Servir arquivos estáticos de capas de livros
app.use('/covers', express.static(path.join(__dirname, '..', 'covers')));

app.use(cors());

app.use(express.json());
app.use(cookieParser());

// MIDDLEWARE DE LOG - Captura TODAS as requisições
app.use((req, res, next) => {
  console.log(`\n========== NOVA REQUISIÇÃO ==========`);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Authorization Header:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('====================================\n');
  next();
});

// Configuração de sessão (necessária para o Passport)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true em produção (HTTPS)
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000 // 8 horas
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 3001;

// --- 2. USAR AS ROTAS QUE IMPORTAMOS ---
// IMPORTANTE: Rotas públicas DEVEM VIR PRIMEIRO para não serem bloqueadas
app.use('/api/public', publicRoutes); // Rotas públicas (sem autenticação necessária) - DEVE VIR PRIMEIRO

// Rotas de autenticação
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes); // Rotas de autenticação Google

// Rotas protegidas
app.use('/api', bookRoutes); // Livros (tem rotas públicas)
app.use('/api', authorRoutes);
app.use('/api', categoryRoutes);
app.use('/api', dominiosRoutes); // Rotas de gerenciamento de domínios (admin)
app.use('/api', reservationRoutes);
app.use('/api', loanRoutes);
app.use('/api', relatorioRoutes);
app.use('/api', userRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', perfilRoutes);

// Rotas de sessão e logs
app.use('/api/session', sessionRoutes); // Heartbeat e logout
app.use('/api/admin/access-logs', accessLogsRoutes); // Logs de acesso (Admin)
app.use('/api', diagnosticoRoutes); // Diagnóstico de token
app.use('/api', notificacoesRoutes); // Notificações
app.use('/api/preferencias', preferenciasRoutes); // Preferências do aluno
app.use('/api/recomendacoes', recomendacoesRoutes); // Recomendações de livros
app.use('/api', avaliacoesRoutes); // Avaliações de livros

// Rota principal de teste
app.get('/', (req, res) => {
  res.send('<h1>API do Bibliotech está no ar!</h1>');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}.`);
});

