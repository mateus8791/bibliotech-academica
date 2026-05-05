-- Migration: 010_create_ai_book_metadata
-- Descrição: Armazena metadados gerados por IA (ou fallback) para cada livro.
-- Um livro possui no máximo um registro (UNIQUE book_id).
-- provider_used indica se o dado veio de IA real ou do mapeamento de fallback.
-- Criado em: 2026-05-01

CREATE TABLE IF NOT EXISTS ai_book_metadata (
  id                   SERIAL       PRIMARY KEY,
  book_id              UUID         NOT NULL REFERENCES livro(id) ON DELETE CASCADE,
  mood_key             VARCHAR(30)  REFERENCES moods(key) ON DELETE SET NULL,
  quote                TEXT,                      -- frase marcante gerada pela IA
  emotion_tags         TEXT[]       DEFAULT '{}', -- ex: {'angustiante','esperançoso'}
  recommended_for      TEXT[]       DEFAULT '{}', -- ex: {'leitores noturnos','fãs de suspense'}
  reading_time_minutes INTEGER,                   -- estimativa total de leitura
  reading_difficulty   VARCHAR(10)  CHECK (reading_difficulty IN ('easy', 'medium', 'hard')),
  summary_ai           TEXT,                      -- sinopse gerada pela IA (diferente da sinopse manual)
  generated_at         TIMESTAMPTZ  DEFAULT NOW(),
  provider_used        VARCHAR(30), -- 'openai', 'gemini' ou 'fallback'
  CONSTRAINT ai_book_metadata_book_id_unique UNIQUE (book_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_book_metadata_mood_key ON ai_book_metadata(mood_key);
CREATE INDEX IF NOT EXISTS idx_ai_book_metadata_book_id  ON ai_book_metadata(book_id);
