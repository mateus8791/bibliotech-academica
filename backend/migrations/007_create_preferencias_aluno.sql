-- Migration 007: Tabela de preferências do aluno para sistema de recomendação
CREATE TABLE IF NOT EXISTS preferencias_aluno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('categoria', 'autor')),
  valor VARCHAR(100) NOT NULL,
  criada_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(aluno_id, tipo, valor)
);

CREATE INDEX IF NOT EXISTS idx_preferencias_aluno ON preferencias_aluno(aluno_id);
