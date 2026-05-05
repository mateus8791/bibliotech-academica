// Script de teste para verificar rotas
const express = require('express');
const app = express();

// Importar as rotas
const bookRoutes = require('./src/routes/bookRoutes');

// Registrar as rotas
app.use('/api', bookRoutes);

// Iniciar servidor de teste
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 Servidor de teste rodando na porta ${PORT}`);
  console.log(`📝 Teste: curl http://localhost:${PORT}/api/livros-novos?limit=1`);
});
