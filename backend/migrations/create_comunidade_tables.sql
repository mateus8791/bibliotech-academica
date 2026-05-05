-- =====================================================
-- Script de Criação das Tabelas de Comunidade
-- Sistema de Biblioteca Acadêmica - Aba Comunidade
-- =====================================================

-- =====================================================
-- 1. TABELA DE AVALIAÇÕES DE AUTORES
-- =====================================================
CREATE TABLE IF NOT EXISTS avaliacoes_autor (
    id SERIAL PRIMARY KEY,
    autor_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT NOW(),

    -- Chaves estrangeiras
    CONSTRAINT fk_autor
        FOREIGN KEY (autor_id)
        REFERENCES autor(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_usuario_avaliacao_autor
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    -- Garantir que um usuário só pode avaliar um autor uma vez
    CONSTRAINT unique_usuario_autor UNIQUE (autor_id, usuario_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_avaliacoes_autor_autor_id ON avaliacoes_autor(autor_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_autor_usuario_id ON avaliacoes_autor(usuario_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_autor_data_criacao ON avaliacoes_autor(data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_autor_nota ON avaliacoes_autor(nota);

COMMENT ON TABLE avaliacoes_autor IS 'Armazena as avaliações dos usuários sobre os autores';


-- =====================================================
-- 2. TABELA DE CURTIDAS EM COMENTÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS curtidas_comentario (
    id SERIAL PRIMARY KEY,
    tipo_comentario VARCHAR(20) NOT NULL CHECK (tipo_comentario IN ('livro', 'autor')),
    comentario_id INTEGER NOT NULL,
    usuario_id UUID NOT NULL,
    data_criacao TIMESTAMP DEFAULT NOW(),

    -- Chave estrangeira
    CONSTRAINT fk_usuario_curtida
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE,

    -- Garantir que um usuário só pode curtir um comentário uma vez
    CONSTRAINT unique_usuario_comentario_curtida UNIQUE (tipo_comentario, comentario_id, usuario_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_curtidas_tipo_comentario ON curtidas_comentario(tipo_comentario, comentario_id);
CREATE INDEX IF NOT EXISTS idx_curtidas_usuario_id ON curtidas_comentario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_curtidas_data_criacao ON curtidas_comentario(data_criacao DESC);

COMMENT ON TABLE curtidas_comentario IS 'Armazena as curtidas dos usuários em comentários de livros e autores';
COMMENT ON COLUMN curtidas_comentario.tipo_comentario IS 'Tipo do comentário: "livro" ou "autor"';
COMMENT ON COLUMN curtidas_comentario.comentario_id IS 'ID da avaliação (avaliacoes.id ou avaliacoes_autor.id)';


-- =====================================================
-- 3. TABELA DE RESPOSTAS A COMENTÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS respostas_comentario (
    id SERIAL PRIMARY KEY,
    tipo_comentario VARCHAR(20) NOT NULL CHECK (tipo_comentario IN ('livro', 'autor')),
    comentario_id INTEGER NOT NULL,
    usuario_id UUID NOT NULL,
    texto TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT NOW(),

    -- Chave estrangeira
    CONSTRAINT fk_usuario_resposta
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id)
        ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_respostas_tipo_comentario ON respostas_comentario(tipo_comentario, comentario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_usuario_id ON respostas_comentario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_data_criacao ON respostas_comentario(data_criacao DESC);

COMMENT ON TABLE respostas_comentario IS 'Armazena as respostas dos usuários em comentários de livros e autores';
COMMENT ON COLUMN respostas_comentario.tipo_comentario IS 'Tipo do comentário original: "livro" ou "autor"';
COMMENT ON COLUMN respostas_comentario.comentario_id IS 'ID da avaliação original (avaliacoes.id ou avaliacoes_autor.id)';


-- =====================================================
-- 4. VIEWS AUXILIARES PARA ESTATÍSTICAS
-- =====================================================

-- View: Estatísticas de autores
CREATE OR REPLACE VIEW vw_estatisticas_autores AS
SELECT
    a.id,
    a.nome,
    a.foto_url,
    a.nacionalidade,
    COUNT(aa.id) AS total_avaliacoes,
    COALESCE(AVG(aa.nota), 0) AS media_notas,
    COUNT(DISTINCT la.livro_id) AS total_livros
FROM autor a
LEFT JOIN avaliacoes_autor aa ON a.id = aa.autor_id
LEFT JOIN livro_autor la ON a.id = la.autor_id
GROUP BY a.id, a.nome, a.foto_url, a.nacionalidade;

COMMENT ON VIEW vw_estatisticas_autores IS 'Estatísticas agregadas dos autores (total avaliações, média, total livros)';


-- View: Ranking de comentários por curtidas
CREATE OR REPLACE VIEW vw_ranking_comentarios_livros AS
SELECT
    av.id,
    av.livro_id,
    av.usuario_id,
    av.nota,
    av.comentario,
    av.data_criacao,
    COUNT(cc.id) AS total_curtidas,
    COUNT(rc.id) AS total_respostas
FROM avaliacoes av
LEFT JOIN curtidas_comentario cc ON cc.tipo_comentario = 'livro' AND cc.comentario_id = av.id
LEFT JOIN respostas_comentario rc ON rc.tipo_comentario = 'livro' AND rc.comentario_id = av.id
GROUP BY av.id, av.livro_id, av.usuario_id, av.nota, av.comentario, av.data_criacao
ORDER BY total_curtidas DESC, av.data_criacao DESC;

COMMENT ON VIEW vw_ranking_comentarios_livros IS 'Comentários de livros ordenados por número de curtidas';


-- View: Ranking de comentários de autores por curtidas
CREATE OR REPLACE VIEW vw_ranking_comentarios_autores AS
SELECT
    aa.id,
    aa.autor_id,
    aa.usuario_id,
    aa.nota,
    aa.comentario,
    aa.data_criacao,
    COUNT(cc.id) AS total_curtidas,
    COUNT(rc.id) AS total_respostas
FROM avaliacoes_autor aa
LEFT JOIN curtidas_comentario cc ON cc.tipo_comentario = 'autor' AND cc.comentario_id = aa.id
LEFT JOIN respostas_comentario rc ON rc.tipo_comentario = 'autor' AND rc.comentario_id = aa.id
GROUP BY aa.id, aa.autor_id, aa.usuario_id, aa.nota, aa.comentario, aa.data_criacao
ORDER BY total_curtidas DESC, aa.data_criacao DESC;

COMMENT ON VIEW vw_ranking_comentarios_autores IS 'Comentários de autores ordenados por número de curtidas';


-- =====================================================
-- MENSAGENS DE SUCESSO
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ TABELAS DE COMUNIDADE CRIADAS COM SUCESSO!';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Tabelas criadas:';
    RAISE NOTICE '   - avaliacoes_autor';
    RAISE NOTICE '   - curtidas_comentario';
    RAISE NOTICE '   - respostas_comentario';
    RAISE NOTICE '';
    RAISE NOTICE '📈 Views criadas:';
    RAISE NOTICE '   - vw_estatisticas_autores';
    RAISE NOTICE '   - vw_ranking_comentarios_livros';
    RAISE NOTICE '   - vw_ranking_comentarios_autores';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Índices e constraints configurados';
    RAISE NOTICE '';
END $$;
