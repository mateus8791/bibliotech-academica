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
ADD COLUMN IF NOT EXISTS data_reserva TIMESTAMP,
ADD COLUMN IF NOT EXISTS data_expiracao TIMESTAMP,
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
  'aguardando', 'disponivel', 'cancelado', 'concluido', 'expirado'
));

-- 3. Migrar dados da tabela reserva para emprestimo
INSERT INTO emprestimo (
  livro_id,
  usuario_id,
  tipo,
  data_reserva,
  data_expiracao,
  status,
  created_at,
  updated_at,
  posicao_fila,
  notificado
)
SELECT
  livro_id,
  usuario_id,
  'reserva' as tipo,
  data_reserva,
  data_expiracao,
  status,
  created_at,
  updated_at,
  NULL as posicao_fila,  -- Será calculado posteriormente se necessário
  FALSE as notificado
FROM reserva
WHERE NOT EXISTS (
  -- Evita duplicação caso o script seja executado múltiplas vezes
  SELECT 1 FROM emprestimo e
  WHERE e.livro_id = reserva.livro_id
  AND e.usuario_id = reserva.usuario_id
  AND e.tipo = 'reserva'
  AND e.data_reserva = reserva.data_reserva
);

-- 4. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_emprestimo_tipo ON emprestimo(tipo);
CREATE INDEX IF NOT EXISTS idx_emprestimo_usuario_tipo ON emprestimo(usuario_id, tipo);
CREATE INDEX IF NOT EXISTS idx_emprestimo_status_tipo ON emprestimo(status, tipo);
CREATE INDEX IF NOT EXISTS idx_emprestimo_data_expiracao ON emprestimo(data_expiracao) WHERE tipo = 'reserva';

-- 5. Criar view para compatibilidade (opcional - facilita transição)
CREATE OR REPLACE VIEW vw_reservas AS
SELECT
  id,
  livro_id,
  usuario_id,
  data_reserva,
  data_expiracao,
  data_retirada,
  status,
  posicao_fila,
  notificado,
  created_at,
  updated_at
FROM emprestimo
WHERE tipo = 'reserva';

CREATE OR REPLACE VIEW vw_emprestimos AS
SELECT
  id,
  livro_id,
  usuario_id,
  data_emprestimo,
  data_devolucao_prevista,
  data_devolucao_real,
  status,
  created_at,
  updated_at
FROM emprestimo
WHERE tipo = 'emprestimo';

-- 6. Atualizar empréstimos existentes para ter o tipo correto
UPDATE emprestimo
SET tipo = 'emprestimo'
WHERE tipo IS NULL;

COMMIT;

-- ============================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ============================================

-- Contar registros migrados
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

-- Verificar estrutura da tabela
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'emprestimo'
ORDER BY ordinal_position;
