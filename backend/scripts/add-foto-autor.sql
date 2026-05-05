-- Migration: Adicionar campo foto_url na tabela autor
-- Data: 2025-11-08
-- Descrição: Adiciona coluna para armazenar URL da foto do autor

ALTER TABLE autor ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);

-- Comentário para documentação
COMMENT ON COLUMN autor.foto_url IS 'URL da foto/imagem do autor';

-- Exemplo de atualização para alguns autores (opcional - remova se não quiser dados de exemplo)
-- UPDATE autor SET foto_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Machado_de_Assis_1904.jpg/220px-Machado_de_Assis_1904.jpg' WHERE nome = 'Machado de Assis';
