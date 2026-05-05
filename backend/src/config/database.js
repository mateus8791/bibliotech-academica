// Arquivo: backend/src/config/database.js

// Usamos o 'dotenv' para carregar as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Importamos a ferramenta de conexão do PostgreSQL (pg)
const { Pool } = require('pg');

// Criamos uma nova instância de Pool, que gerencia as conexões com o banco.
// O 'Pool' vai automaticamente ler as variáveis de ambiente (DB_USER, DB_PASSWORD, etc.)
// que nós definimos no arquivo .env.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Exportamos o 'pool' para que outros arquivos do nosso backend possam usá-lo para fazer consultas.
module.exports = pool;