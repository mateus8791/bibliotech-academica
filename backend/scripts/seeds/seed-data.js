// Script para popular dados de teste (reservas e notificações)
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function seedData() {
  const client = await pool.connect();

  try {
    console.log('🌱 Iniciando seed de dados de teste...\n');

    // LIMPAR DADOS ANTERIORES DO ALUNO TESTE
    console.log('🧹 Limpando dados anteriores...');
    await client.query(`DELETE FROM reserva WHERE usuario_id = '00000000-0000-0000-0000-000000000002'`);

    // Verificar se a tabela notificacao existe antes de tentar deletar
    const { rows: tableExists } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'notificacao'
      );
    `);

    if (tableExists[0].exists) {
      await client.query(`DELETE FROM notificacao WHERE usuario_id = '00000000-0000-0000-0000-000000000002'`);
    } else {
      console.log('⚠️  Tabela "notificacao" não existe. Criando...');
      // Criar tabela de notificações
      await client.query(`
        CREATE TABLE IF NOT EXISTS notificacao (
          id SERIAL PRIMARY KEY,
          usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
          tipo VARCHAR(50) NOT NULL,
          titulo VARCHAR(255) NOT NULL,
          mensagem TEXT NOT NULL,
          lida BOOLEAN DEFAULT FALSE,
          data_criacao TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Tabela "notificacao" criada');
    }

    console.log('✅ Dados anteriores removidos\n');

    // CRIAR RESERVAS
    console.log('📚 Criando reservas de teste...');

    // Pegar alguns livros aleatórios
    const { rows: livros } = await client.query('SELECT id, titulo FROM livro ORDER BY RANDOM() LIMIT 5');

    if (livros.length < 5) {
      console.error('❌ Erro: Não há livros suficientes no banco. Execute o seed de livros primeiro.');
      return;
    }

    // Reserva 1: DISPONÍVEL (pronta para retirada)
    await client.query(`
      INSERT INTO reserva (livro_id, usuario_id, data_reserva, data_expiracao, status)
      VALUES ($1, '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', 'disponivel')
    `, [livros[0].id]);
    console.log(`  ✅ Reserva DISPONÍVEL: ${livros[0].titulo}`);

    // Reserva 2: AGUARDANDO (na fila)
    await client.query(`
      INSERT INTO reserva (livro_id, usuario_id, data_reserva, data_expiracao, status)
      VALUES ($1, '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days', 'aguardando')
    `, [livros[1].id]);
    console.log(`  ✅ Reserva AGUARDANDO: ${livros[1].titulo}`);

    // Reserva 3: CONCLUÍDO (já retirou)
    await client.query(`
      INSERT INTO reserva (livro_id, usuario_id, data_reserva, data_expiracao, status)
      VALUES ($1, '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', 'concluido')
    `, [livros[2].id]);
    console.log(`  ✅ Reserva CONCLUÍDO: ${livros[2].titulo}`);

    // Reserva 4: EXPIRADO (não retirou a tempo)
    await client.query(`
      INSERT INTO reserva (livro_id, usuario_id, data_reserva, data_expiracao, status)
      VALUES ($1, '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '15 days', NOW() - INTERVAL '8 days', 'expirado')
    `, [livros[3].id]);
    console.log(`  ✅ Reserva EXPIRADO: ${livros[3].titulo}`);

    // Reserva 5: CANCELADO (usuário cancelou)
    await client.query(`
      INSERT INTO reserva (livro_id, usuario_id, data_reserva, data_expiracao, status)
      VALUES ($1, '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days', 'cancelado')
    `, [livros[4].id]);
    console.log(`  ✅ Reserva CANCELADO: ${livros[4].titulo}\n`);

    // CRIAR NOTIFICAÇÕES
    console.log('🔔 Criando notificações de teste...');

    // Notificação 1: Reserva disponível para retirada
    await client.query(`
      INSERT INTO notificacao (usuario_id, tipo, titulo, mensagem, lida, data_criacao)
      VALUES (
        '00000000-0000-0000-0000-000000000002',
        'reserva_disponivel',
        'Livro disponível para retirada',
        'Seu livro "${livros[0].titulo}" está pronto para retirada na biblioteca. Retire até ' || TO_CHAR(NOW() + INTERVAL '3 days', 'DD/MM/YYYY') || '.',
        false,
        NOW() - INTERVAL '2 days'
      )
    `);
    console.log('  ✅ Notificação: Livro disponível para retirada (não lida)');

    // Notificação 2: Lembrete de devolução
    await client.query(`
      INSERT INTO notificacao (usuario_id, tipo, titulo, mensagem, lida, data_criacao)
      VALUES (
        '00000000-0000-0000-0000-000000000002',
        'lembrete_devolucao',
        'Lembrete: Devolução de livro',
        'O prazo de devolução do livro "1984" está próximo. Devolva até 25/11/2025.',
        false,
        NOW() - INTERVAL '1 day'
      )
    `);
    console.log('  ✅ Notificação: Lembrete de devolução (não lida)');

    // Notificação 3: Multa aplicada
    await client.query(`
      INSERT INTO notificacao (usuario_id, tipo, titulo, mensagem, lida, data_criacao)
      VALUES (
        '00000000-0000-0000-0000-000000000002',
        'multa',
        'Multa aplicada',
        'Uma multa de R$ 5,00 foi aplicada devido ao atraso na devolução. Acesse a área financeira para mais detalhes.',
        false,
        NOW() - INTERVAL '3 hours'
      )
    `);
    console.log('  ✅ Notificação: Multa aplicada (não lida)');

    // Notificação 4: Reserva expirada (lida)
    await client.query(`
      INSERT INTO notificacao (usuario_id, tipo, titulo, mensagem, lida, data_criacao)
      VALUES (
        '00000000-0000-0000-0000-000000000002',
        'reserva_expirada',
        'Reserva expirada',
        'Sua reserva do livro "${livros[3].titulo}" expirou. Faça uma nova reserva se ainda tiver interesse.',
        true,
        NOW() - INTERVAL '8 days'
      )
    `);
    console.log('  ✅ Notificação: Reserva expirada (lida)');

    // Notificação 5: Bem-vindo (lida)
    await client.query(`
      INSERT INTO notificacao (usuario_id, tipo, titulo, mensagem, lida, data_criacao)
      VALUES (
        '00000000-0000-0000-0000-000000000002',
        'sistema',
        'Bem-vindo ao Bibliotech!',
        'Seja bem-vindo à nossa biblioteca digital. Explore nosso catálogo e aproveite!',
        true,
        NOW() - INTERVAL '30 days'
      )
    `);
    console.log('  ✅ Notificação: Bem-vindo (lida)\n');

    // MOSTRAR RESUMO
    console.log('📊 RESUMO DOS DADOS CRIADOS:\n');

    const { rows: resumoReservas } = await client.query(`
      SELECT status, COUNT(*) as quantidade
      FROM reserva
      WHERE usuario_id = '00000000-0000-0000-0000-000000000002'
      GROUP BY status
      ORDER BY status
    `);

    console.log('📚 RESERVAS:');
    resumoReservas.forEach(r => {
      console.log(`  - ${r.status.toUpperCase()}: ${r.quantidade}`);
    });

    const { rows: resumoNotificacoes } = await client.query(`
      SELECT
        CASE WHEN lida THEN 'Lidas' ELSE 'Não lidas' END as status,
        COUNT(*) as quantidade
      FROM notificacao
      WHERE usuario_id = '00000000-0000-0000-0000-000000000002'
      GROUP BY lida
      ORDER BY lida
    `);

    console.log('\n🔔 NOTIFICAÇÕES:');
    resumoNotificacoes.forEach(n => {
      console.log(`  - ${n.status}: ${n.quantidade}`);
    });

    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n💡 Acesse a página "Minhas Reservas" para ver as reservas.');
    console.log('💡 Acesse a página de "Notificações" para ver as notificações.\n');

  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar seed
seedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
