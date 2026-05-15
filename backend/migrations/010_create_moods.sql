-- Migration: 009_create_moods
-- Descrição: Cria tabela de moods temáticos e popula com os 10 moods fixos do sistema.
-- Os moods são dados estáticos — não devem ser alterados via aplicação.
-- Criado em: 2026-05-01

CREATE TABLE IF NOT EXISTS moods (
  id                SERIAL       PRIMARY KEY,
  key               VARCHAR(30)  NOT NULL UNIQUE,
  name_pt           VARCHAR(60)  NOT NULL,
  primary_color     VARCHAR(7)   NOT NULL, -- hex, ex: '#7C3AED'
  secondary_color   VARCHAR(7)   NOT NULL,
  gradient_start    VARCHAR(7)   NOT NULL,
  gradient_end      VARCHAR(7)   NOT NULL,
  glow_color        VARCHAR(7)   NOT NULL, -- usado no box-shadow CSS
  emoji             VARCHAR(10)  NOT NULL,
  description_short VARCHAR(120) NOT NULL
);

INSERT INTO moods (key, name_pt, primary_color, secondary_color, gradient_start, gradient_end, glow_color, emoji, description_short)
VALUES
  ('fantasy',       'Fantasia',             '#7C3AED', '#F59E0B', '#8B5CF6', '#6D28D9', '#7C3AED', '✨', 'Mundos além da imaginação, onde tudo é possível'),
  ('mystery',       'Mistério',             '#1E3A5F', '#0D9488', '#1E4080', '#0F2744', '#1E3A5F', '🔍', 'Segredos que sussurram nas páginas da escuridão'),
  ('romance',       'Romance',              '#EC4899', '#F97316', '#F472B6', '#DB2777', '#EC4899', '💕', 'Histórias que fazem o coração bater mais forte'),
  ('adventure',     'Aventura',             '#EA580C', '#16A34A', '#F97316', '#C2410C', '#EA580C', '⚔️', 'Jornadas épicas para além do horizonte conhecido'),
  ('academic',      'Acadêmico',            '#1D4ED8', '#CA8A04', '#2563EB', '#1E40AF', '#1D4ED8', '📚', 'Conhecimento que transforma e expande horizontes'),
  ('comedy',        'Comédia',              '#EAB308', '#84CC16', '#FCD34D', '#CA8A04', '#EAB308', '😄', 'Leveza e humor que iluminam os dias cinzas'),
  ('drama',         'Drama',                '#9F1239', '#B45309', '#BE123C', '#881337', '#9F1239', '🎭', 'Emoções intensas que ecoam muito além da última página'),
  ('horror',        'Terror',               '#111827', '#16A34A', '#1F2937', '#030712', '#16A34A', '👻', 'Tensão e arrepio que prendem a respiração'),
  ('scifi',         'Ficção Científica',    '#0891B2', '#6366F1', '#06B6D4', '#0E7490', '#0891B2', '🚀', 'Futuros possíveis e universos inexplorados'),
  ('inspirational', 'Inspiracional',        '#D97706', '#EA580C', '#F59E0B', '#B45309', '#D97706', '🌟', 'Histórias reais que provam que tudo é possível')
ON CONFLICT (key) DO NOTHING;
