-- Migration 008: Function SQL de recomendação de livros (algoritmo 100% SQL)
-- Pontuação: +40 autor favorito, +30 categoria favorita, +15 alunos similares
CREATE OR REPLACE FUNCTION recomendar_livros(p_aluno_id UUID, p_limite INT DEFAULT 10)
RETURNS TABLE(
  id INT,
  titulo VARCHAR,
  autor_nome VARCHAR,
  categoria_nome VARCHAR,
  capa_url TEXT,
  disponivel BOOLEAN,
  score INT,
  motivo VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.titulo,
    (SELECT a.nome FROM autor a
     JOIN livro_autor la ON la.autor_id = a.id
     WHERE la.livro_id = l.id LIMIT 1) AS autor_nome,
    (SELECT c.nome FROM categoria c
     JOIN livro_categoria lc ON lc.categoria_id = c.id
     WHERE lc.livro_id = l.id LIMIT 1) AS categoria_nome,
    l.capa_url,
    (l.quantidade_disponivel > 0) AS disponivel,
    (
      -- Categoria favorita: +30
      CASE WHEN EXISTS (
        SELECT 1 FROM preferencias_aluno pa
        JOIN categoria c ON c.nome = pa.valor
        JOIN livro_categoria lc ON lc.categoria_id = c.id
        WHERE pa.aluno_id = p_aluno_id AND pa.tipo = 'categoria'
        AND lc.livro_id = l.id
      ) THEN 30 ELSE 0 END

      +

      -- Autor favorito: +40
      CASE WHEN EXISTS (
        SELECT 1 FROM preferencias_aluno pa
        JOIN autor au ON au.nome = pa.valor
        JOIN livro_autor la ON la.autor_id = au.id
        WHERE pa.aluno_id = p_aluno_id AND pa.tipo = 'autor'
        AND la.livro_id = l.id
      ) THEN 40 ELSE 0 END

      +

      -- Alunos com gostos similares: até +15
      COALESCE((
        SELECT LEAST(COUNT(*)::INT * 5, 15)
        FROM emprestimo e3
        WHERE e3.livro_id = l.id
        AND e3.tipo = 'emprestimo'
        AND e3.usuario_id IN (
          SELECT DISTINCT e4.usuario_id
          FROM emprestimo e4
          JOIN emprestimo e5 ON e4.livro_id = e5.livro_id
          WHERE e5.usuario_id = p_aluno_id
          AND e4.usuario_id != p_aluno_id
          AND e4.tipo = 'emprestimo'
          LIMIT 20
        )
      ), 0)
    )::INT AS score,

    CASE
      WHEN EXISTS (
        SELECT 1 FROM preferencias_aluno pa
        JOIN autor au ON au.nome = pa.valor
        JOIN livro_autor la ON la.autor_id = au.id
        WHERE pa.aluno_id = p_aluno_id AND pa.tipo = 'autor'
        AND la.livro_id = l.id
      ) THEN 'Seu autor favorito'
      WHEN EXISTS (
        SELECT 1 FROM preferencias_aluno pa
        JOIN categoria c ON c.nome = pa.valor
        JOIN livro_categoria lc ON lc.categoria_id = c.id
        WHERE pa.aluno_id = p_aluno_id AND pa.tipo = 'categoria'
        AND lc.livro_id = l.id
      ) THEN 'Sua categoria favorita'
      ELSE 'Alunos com gosto parecido'
    END AS motivo

  FROM livro l
  WHERE l.id NOT IN (
    SELECT livro_id FROM emprestimo
    WHERE usuario_id = p_aluno_id AND tipo = 'emprestimo'
  )
  ORDER BY score DESC, l.num_emprestimos DESC, l.titulo ASC
  LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;
