// Script para executar a migração de unificação de tabelas
// Executa o arquivo SQL migrate-unify-emprestimo-reserva.sql

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuração do banco de dados
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'bibliotech_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('\n========================================');
    console.log('MIGRAÇÃO: Unificar Empréstimos e Reservas');
    console.log('========================================\n');

    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'migrate-unify-emprestimo-reserva.sql');
    console.log(`Lendo arquivo SQL: ${sqlFilePath}`);

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('\n1. Executando migração SQL...\n');

    // Executar o SQL
    const result = await client.query(sqlContent);

    console.log('✓ Migração SQL executada com sucesso!\n');

    // Verificar resultados
    console.log('2. Verificando resultados da migração...\n');

    const verificacaoQuery = `
      SELECT
        'Total de empréstimos' as descricao,
        COUNT(*) as quantidade
      FROM emprestimo
      WHERE tipo = 'emprestimo'
      UNION ALL
      SELECT
        'Total de reservas migradas' as descricao,
        COUNT(*) as quantidade
      FROM emprestimo
      WHERE tipo = 'reserva'
      UNION ALL
      SELECT
        'Total na tabela reserva (original)' as descricao,
        COUNT(*) as quantidade
      FROM reserva;
    `;

    const verificacao = await client.query(verificacaoQuery);

    console.log('Contagens:');
    verificacao.rows.forEach(row => {
      console.log(`  - ${row.descricao}: ${row.quantidade}`);
    });

    console.log('\n3. Verificando estrutura da tabela emprestimo...\n');

    const estruturaQuery = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'emprestimo'
      ORDER BY ordinal_position;
    `;

    const estrutura = await client.query(estruturaQuery);

    console.log('Colunas da tabela emprestimo:');
    estrutura.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n========================================');
    console.log('MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('========================================\n');

    console.log('PRÓXIMOS PASSOS:');
    console.log('1. Verifique se os dados foram migrados corretamente');
    console.log('2. Teste as funcionalidades de reserva e empréstimo');
    console.log('3. Se tudo estiver funcionando, você pode remover a tabela reserva');
    console.log('   com o comando: DROP TABLE reserva CASCADE;');
    console.log('\nIMPORTANTE: Faça backup antes de remover a tabela reserva!\n');

  } catch (error) {
    console.error('\n❌ ERRO durante a migração:');
    console.error(error);
    console.error('\nA migração foi revertida (ROLLBACK).');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a migração
runMigration();
