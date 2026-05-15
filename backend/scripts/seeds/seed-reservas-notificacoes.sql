-- Script para popular reservas e notificações de teste
-- Aluno: 00000000-0000-0000-0000-000000000002 (Aluno Teste)

-- 1. INSERIR RESERVAS DE TESTE
-- Vamos criar 5 reservas com diferentes status

-- Reserva 1: DISPONÍVEL (pronta para retirada)
INSERT INTO reserva (livro_id, usuario_id, data_reserva, data_expiracao, status)
VALUES (
  (SELECT id FROM livro ORDER BY RANDOM() LIMIT 1),
  '00000000-0000-0000-0000-000000000002',
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '3 days',
  'disponivel'
);

-- Reserva 2: AGUARDANDO (na fila)
INSERT INTO reserva (livro_id, usuario_id, data_reserva, data_expiracao, status)
VALUES (
  (SELECT id FROM livro ORDER BY RANDOM() LIMIT 1),
  '00000000-0000-0000-0000-000000000002',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '7 days',
  'aguardando'
);

-- Reserva 3: CONCLUÍDO (já retirou)
INSERT INTO reserva (livro_id, usuario_id, data_reserva, data_expiracao, status)
VALUES (
  (SELECT id FROM livro ORDER BY RANDOM() LIMIT 1),
  '00000000-0000-0000-0000-000000000002',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '3 days',
  'concluido'
);

-- Reserva 4: EXPIRADO (não retirou a tempo)
INSERT INTO reserva (livro_id, usuario_id, data_reserva, data_expiracao, status)
VALUES (
  (SELECT id FROM livro ORDER BY RANDOM() LIMIT 1),
  '00000000-0000-0000-0000-000000000002',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '8 days',
  'expirado'
);

-- Reserva 5: CANCELADO (usuário cancelou)
INSERT INTO reserva (livro_id, usuario_id, data_reserva, data_expiracao, status)
VALUES (
  (SELECT id FROM livro ORDER BY RANDOM() LIMIT 1),
  '00000000-0000-0000-0000-000000000002',
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '2 days',
  'cancelado'
);

-- 2. VERIFICAR SE EXISTE TABELA DE NOTIFICAÇÕES
-- Primeiro vamos verificar a estrutura da tabela notificacao
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notificacao';

-- 3. INSERIR NOTIFICAÇÕES DE TESTE
-- Vamos criar notificações relacionadas às reservas

-- Notificação 1: Reserva disponível para retirada
INSERT INTO notificacao (usuario_id, tipo, titulo, mensagem, lida, data_criacao)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'reserva_disponivel',
  'Livro disponível para retirada',
  'Seu livro está pronto para retirada na biblioteca. Retire até ' || TO_CHAR(NOW() + INTERVAL '3 days', 'DD/MM/YYYY') || '.',
  false,
  NOW() - INTERVAL '2 days'
);

-- Notificação 2: Lembrete de devolução
INSERT INTO notificacao (usuario_id, tipo, titulo, mensagem, lida, data_criacao)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'lembrete_devolucao',
  'Lembrete: Devolução de livro',
  'O prazo de devolução do livro "1984" está próximo. Devolva até 25/11/2025.',
  false,
  NOW() - INTERVAL '1 day'
);

-- Notificação 3: Multa aplicada
INSERT INTO notificacao (usuario_id, tipo, titulo, mensagem, lida, data_criacao)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'multa',
  'Multa aplicada',
  'Uma multa de R$ 5,00 foi aplicada devido ao atraso na devolução. Acesse a área financeira para mais detalhes.',
  false,
  NOW() - INTERVAL '3 hours'
);

-- Notificação 4: Reserva expirada (lida)
INSERT INTO notificacao (usuario_id, tipo, titulo, mensagem, lida, data_criacao)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'reserva_expirada',
  'Reserva expirada',
  'Sua reserva do livro "O Senhor dos Anéis" expirou. Faça uma nova reserva se ainda tiver interesse.',
  true,
  NOW() - INTERVAL '8 days'
);

-- Notificação 5: Bem-vindo (lida)
INSERT INTO notificacao (usuario_id, tipo, titulo, mensagem, lida, data_criacao)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'sistema',
  'Bem-vindo ao Bibliotech!',
  'Seja bem-vindo à nossa biblioteca digital. Explore nosso catálogo e aproveite!',
  true,
  NOW() - INTERVAL '30 days'
);

-- 4. MOSTRAR RESUMO
SELECT 'RESUMO DAS RESERVAS CRIADAS:' as info;
SELECT status, COUNT(*) as quantidade
FROM reserva
WHERE usuario_id = '00000000-0000-0000-0000-000000000002'
GROUP BY status
ORDER BY status;

SELECT 'RESUMO DAS NOTIFICAÇÕES CRIADAS:' as info;
SELECT tipo, lida, COUNT(*) as quantidade
FROM notificacao
WHERE usuario_id = '00000000-0000-0000-0000-000000000002'
GROUP BY tipo, lida
ORDER BY tipo, lida;
