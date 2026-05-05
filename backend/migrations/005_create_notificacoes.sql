-- Migration: 005_create_notificacoes.sql
-- Cria a tabela de notificações do sistema BiblioTech

CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  criada_em TIMESTAMP DEFAULT NOW(),
  dados JSONB
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(usuario_id, lida);

-- Tipos válidos (documentação):
-- EMPRESTIMO_REALIZADO
-- DEVOLUCAO_CONFIRMADA
-- PRAZO_VENCENDO
-- PRAZO_VENCIDO
-- RESERVA_DISPONIVEL
-- CONQUISTA
-- ERRO
-- BOAS_VINDAS
