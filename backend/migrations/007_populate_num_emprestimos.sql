-- Migration 006: Garantir coluna num_emprestimos e popular com dados reais

-- 1. Garante que a coluna existe
ALTER TABLE livro ADD COLUMN IF NOT EXISTS num_emprestimos INTEGER DEFAULT 0;

-- 2. Popula com contagem real de empréstimos por livro
UPDATE livro l
SET num_emprestimos = (
  SELECT COUNT(*)
  FROM emprestimo e
  WHERE e.livro_id = l.id
    AND e.tipo = 'emprestimo'
    AND e.status IN ('ativo', 'atrasado', 'devolvido', 'renovado', 'concluido')
);

-- 3. Função e trigger para manter atualizado automaticamente
CREATE OR REPLACE FUNCTION atualizar_num_emprestimos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.tipo = 'emprestimo' THEN
    UPDATE livro SET num_emprestimos = num_emprestimos + 1 WHERE id = NEW.livro_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atualizar_num_emprestimos ON emprestimo;
CREATE TRIGGER trg_atualizar_num_emprestimos
  AFTER INSERT ON emprestimo
  FOR EACH ROW EXECUTE FUNCTION atualizar_num_emprestimos();
