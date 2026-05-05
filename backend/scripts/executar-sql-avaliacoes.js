// Script para executar a migration de criação da tabela de avaliações
// Execute com: node scripts/executar-sql-avaliacoes.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function executarMigration() {
  console.log('\n🚀 Iniciando criação da tabela de avaliações...\n');

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'migrations', 'create_avaliacoes_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Executar o SQL
    console.log('📝 Executando script SQL...');
    const result = await pool.query(sql);

    console.log('\n✅ SUCESSO! Tabela de avaliações criada com sucesso!\n');
    console.log('📊 Detalhes:');
    console.log('   - Tabela: avaliacoes');
    console.log('   - Índices: 3 (livro_id, usuario_id, data_criacao)');
    console.log('   - Constraints: 3 (FK livro, FK usuario, UNIQUE)');
    console.log('\n💡 Próximo passo: Reinicie o servidor backend (npm start)\n');

  } catch (error) {
    console.error('\n❌ ERRO ao criar tabela de avaliações:');
    console.error(error.message);

    if (error.code === '42P07') {
      console.log('\nℹ️  A tabela "avaliacoes" já existe no banco de dados.');
      console.log('   Se quiser recriar, execute primeiro: DROP TABLE avaliacoes CASCADE;\n');
    }
  } finally {
    await pool.end();
  }
}

// Perguntar se deseja inserir dados de exemplo
async function perguntarDadosExemplo() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question('\n❓ Deseja inserir dados de exemplo? (s/n): ', (resposta) => {
      readline.close();
      resolve(resposta.toLowerCase() === 's');
    });
  });
}

async function inserirDadosExemplo() {
  try {
    console.log('\n📝 Inserindo dados de exemplo...');

    const sqlPath = path.join(__dirname, '..', 'migrations', 'seed_avaliacoes_exemplo.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Dados de exemplo inseridos com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao inserir dados de exemplo:', error.message);
  }
}

// Executar
(async () => {
  await executarMigration();

  const inserirDados = await perguntarDadosExemplo();

  if (inserirDados) {
    await inserirDadosExemplo();
  }

  console.log('🎉 Processo concluído!\n');
  process.exit(0);
})();
