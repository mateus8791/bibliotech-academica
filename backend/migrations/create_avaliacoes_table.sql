-- =====================================================
-- Script de Criação da Tabela de Avaliações
-- Sistema de Biblioteca Acadêmica
-- =====================================================

-- Criação da tabela de avaliações
CREATE TABLE IF NOT EXISTS avaliacoes (
    id SERIAL PRIMARY KEY,
    livro_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    data_criacao TIMESTAMP DEFAULT NOW(),

    -- Chaves estrangeiras
    CONSTRAINT fk_livro
        FOREIGN KEY (livro_id)
        REFERENCES livros(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    -- Garantir que um usuário só pode avaliar um livro uma vez
    CONSTRAINT unique_usuario_livro UNIQUE (livro_id, usuario_id)
);

-- Índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_avaliacoes_livro_id ON avaliacoes(livro_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_usuario_id ON avaliacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_data_criacao ON avaliacoes(data_criacao DESC);

-- Comentários na tabela
COMMENT ON TABLE avaliacoes IS 'Armazena as avaliações dos usuários sobre os livros';
COMMENT ON COLUMN avaliacoes.id IS 'Identificador único da avaliação';
COMMENT ON COLUMN avaliacoes.livro_id IS 'Referência ao livro avaliado';
COMMENT ON COLUMN avaliacoes.usuario_id IS 'Referência ao usuário que fez a avaliação';
COMMENT ON COLUMN avaliacoes.nota IS 'Nota de 1 a 5 estrelas';
COMMENT ON COLUMN avaliacoes.comentario IS 'Comentário opcional do usuário sobre o livro';
COMMENT ON COLUMN avaliacoes.data_criacao IS 'Data e hora em que a avaliação foi criada';

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela "avaliacoes" criada com sucesso!';
    RAISE NOTICE '✅ Índices criados para otimização de consultas';
    RAISE NOTICE '✅ Constraints de integridade referencial configuradas';
END $$;
