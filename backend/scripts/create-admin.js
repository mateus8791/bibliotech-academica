// Script para criar usuário administrador no banco de dados
// Uso: node scripts/create-admin.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createAdminUser() {
  const client = await pool.connect();

  try {
    console.log('🔍 Verificando se usuário admin já existe...');

    // Verificar se já existe
    const checkQuery = 'SELECT id, nome, email, tipo_usuario FROM usuario WHERE email = $1';
    const checkResult = await client.query(checkQuery, ['admin@bibliotech.com']);

    if (checkResult.rows.length > 0) {
      console.log('⚠️  Usuário admin já existe!');
      console.log('📧 Email:', checkResult.rows[0].email);
      console.log('👤 Nome:', checkResult.rows[0].nome);
      console.log('🔑 Tipo:', checkResult.rows[0].tipo_usuario);
      return;
    }

    console.log('📝 Criando novo usuário admin...');

    // Criar usuário admin
    const insertQuery = `
      INSERT INTO usuario (
        nome,
        email,
        senha_hash,
        tipo_usuario,
        is_google_user,
        data_cadastro
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id, nome, email, tipo_usuario, data_cadastro
    `;

    const values = [
      'Administrador do Sistema',
      'admin@bibliotech.com',
      '$2b$10$DtyLBMJgB.bj5mvyofZUCO7twt05Y27H6nZ0pXgFeJJnjIKWPOFAi', // Senha: admin123
      'admin',
      false
    ];

    const insertResult = await client.query(insertQuery, values);
    const newUser = insertResult.rows[0];

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('');
    console.log('📋 Detalhes do usuário:');
    console.log('═══════════════════════════════════════════');
    console.log('🆔 ID:', newUser.id);
    console.log('👤 Nome:', newUser.nome);
    console.log('📧 Email:', newUser.email);
    console.log('🔑 Tipo:', newUser.tipo_usuario);
    console.log('📅 Data Cadastro:', newUser.data_cadastro);
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('🔐 Credenciais de acesso:');
    console.log('   Email: admin@bibliotech.com');
    console.log('   Senha: admin123');
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar
createAdminUser()
  .then(() => {
    console.log('');
    console.log('🎉 Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('💥 Erro fatal:', error.message);
    process.exit(1);
  });
