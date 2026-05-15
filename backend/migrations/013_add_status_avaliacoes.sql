-- =====================================================
-- Migration 013: Adiciona coluna status na tabela avaliacoes
-- Valores: 'ativa' (padrão) ou 'arquivada'
-- Permite que bibliotecários/admins arquivem avaliações
-- sem precisar deletá-las permanentemente.
-- =====================================================

ALTER TABLE avaliacoes
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ativa'
    CHECK (status IN ('ativa', 'arquivada'));

-- Índice para filtros por status (ex: só avaliações ativas por livro)
CREATE INDEX IF NOT EXISTS idx_avaliacoes_status ON avaliacoes(status);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_livro_status ON avaliacoes(livro_id, status);

DO $$
BEGIN
    RAISE NOTICE '✅ Coluna "status" adicionada à tabela "avaliacoes"';
    RAISE NOTICE '✅ Valores permitidos: ativa, arquivada (padrão: ativa)';
    RAISE NOTICE '✅ Índices criados: idx_avaliacoes_status, idx_avaliacoes_livro_status';
END $$;
