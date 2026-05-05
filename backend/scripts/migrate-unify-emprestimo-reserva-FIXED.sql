-- ============================================
-- MIGRAÇÃO: Unificar tabelas emprestimo e reserva
-- Data: 2025-11-17
-- Descrição: Adiciona colunas da tabela reserva à tabela emprestimo
--            e migra os dados existentes
-- ============================================

BEGIN;

-- 1. Adicionar novas colunas à tabela emprestimo
ALTER TABLE emprestimo
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'emprestimo' CHECK (tipo IN ('emprestimo', 'reserva')),
ADD COLUMN IF NOT EXISTS data_reserva TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data_expiracao DATE,
ADD COLUMN IF NOT EXISTS data_retirada DATE,
ADD COLUMN IF NOT EXISTS posicao_fila INTEGER,
ADD COLUMN IF NOT EXISTS notificado BOOLEAN DEFAULT FALSE;

-- 2. Atualizar constraint de status para incluir status de reserva
ALTER TABLE emprestimo DROP CONSTRAINT IF EXISTS emprestimo_status_check;
ALTER TABLE emprestimo
ADD CONSTRAINT emprestimo_status_check
CHECK (status IN (
  -- Status de empréstimo
  'ativo', 'atrasado', 'devolvido', 'renovado',
  -- Status de reserva
  'aguardando', 'disponivel', 'cancelado', 'concluido', 'expirado', 'ativa', 'cancelada', 'atendida'
));

-- 3. Migrar dados da tabela reserva para emprestimo
INSERT INTO emprestimo (
  id,
  livro_id,
  usuario_id,
  tipo,
  data_reserva,
  data_expiracao,
  status,
  data_emprestimo,
  data_devolucao_prevista,
  posicao_fila,
  notificado
)
SELECT
  id,
  livro_id,
  usuario_id,
  'reserva' as tipo,
  data_reserva,
  data_expiracao,
  status,
  COALESCE(data_reserva::date, CURRENT_DATE) as data_emprestimo,
  data_expiracao as data_devolucao_prevista,
  NULL as posicao_fila,
  FALSE as notificado
FROM reserva
WHERE NOT EXISTS (
  -- Evita duplicação caso o script seja executado múltiplas vezes
  SELECT 1 FROM emprestimo e
  WHERE e.id = reserva.id
);

-- 4. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_emprestimo_tipo ON emprestimo(tipo);
CREATE INDEX IF NOT EXISTS idx_emprestimo_usuario_tipo ON emprestimo(usuario_id, tipo);
CREATE INDEX IF NOT EXISTS idx_emprestimo_status_tipo ON emprestimo(status, tipo);
CREATE INDEX IF NOT EXISTS idx_emprestimo_data_expiracao ON emprestimo(data_expiracao) WHERE tipo = 'reserva';

-- 5. Atualizar empréstimos existentes para ter o tipo correto
UPDATE emprestimo
SET tipo = 'emprestimo'
WHERE tipo IS NULL OR tipo = 'emprestimo';

COMMIT;

-- ============================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ============================================

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
