// Script para executar a migração de unificação de tabelas (CORRIGIDO)
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

    // Ler o arquivo SQL CORRIGIDO
    const sqlFilePath = path.join(__dirname, 'migrate-unify-emprestimo-reserva-FIXED.sql');
    console.log(`Lendo arquivo SQL: ${sqlFilePath}`);

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('\n1. Executando migração SQL...\n');

    // Executar o SQL
    await client.query(sqlContent);

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
      console.log(`  ✓ ${row.descricao}: ${row.quantidade}`);
    });

    console.log('\n3. Verificando estrutura da tabela emprestimo...\n');

    const estruturaQuery = `
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'emprestimo' AND column_name IN ('tipo', 'data_reserva', 'notificado', 'posicao_fila', 'data_expiracao')
      ORDER BY ordinal_position;
    `;

    const estrutura = await client.query(estruturaQuery);

    console.log('Novas colunas adicionadas:');
    estrutura.rows.forEach(col => {
      console.log(`  ✓ ${col.column_name} (${col.data_type})`);
    });

    console.log('\n========================================');
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('========================================\n');

    console.log('PRÓXIMOS PASSOS:');
    console.log('1. ✓ Reinicie o servidor backend (Ctrl+C e npm run dev)');
    console.log('2. ✓ Teste as funcionalidades de reserva');
    console.log('3. ✓ Verifique o dashboard');
    console.log('4. ⚠️  Após confirmar que tudo funciona, você pode remover a tabela reserva');
    console.log('   (OPCIONAL: DROP TABLE reserva CASCADE;)\n');

  } catch (error) {
    console.error('\n❌ ERRO durante a migração:');
    console.error(error.message);
    console.error('\nA migração foi revertida (ROLLBACK).');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a migração
runMigration();
