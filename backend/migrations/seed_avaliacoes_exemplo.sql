-- =====================================================
-- Script de Dados de Exemplo para Avaliações
-- Sistema de Biblioteca Acadêmica
-- OPCIONAL: Use este script para inserir dados de teste
-- =====================================================

-- ATENÇÃO: Este script insere dados de exemplo
-- Execute apenas em ambiente de desenvolvimento/teste

-- Inserir avaliações de exemplo
-- Substitua os IDs de livro_id e usuario_id pelos IDs reais do seu banco

INSERT INTO avaliacoes (livro_id, usuario_id, nota, comentario) VALUES
(1, 1, 5, 'Livro excepcional! A narrativa é envolvente e os personagens são muito bem desenvolvidos. Recomendo fortemente para quem gosta de ficção histórica.'),
(1, 2, 4, 'Muito bom! A história é interessante, mas em alguns momentos achei que poderia ter mais desenvolvimento em certos capítulos.'),
(1, 3, 5, 'Obra-prima da literatura! Cada página me prendeu do início ao fim. A forma como o autor aborda os temas sociais é brilhante.'),
(2, 1, 3, 'Livro ok. Tem bons momentos, mas a leitura ficou um pouco arrastada em algumas partes. Ainda assim, vale a pena ler.'),
(2, 2, 4, 'Gostei bastante! O conteúdo técnico é bem explicado e os exemplos práticos ajudaram muito no meu aprendizado.'),
(3, 3, 5, 'Incrível! Este livro mudou minha perspectiva sobre vários assuntos. Leitura obrigatória para todos os estudantes.'),
(3, 1, 4, 'Muito bom! Conteúdo rico e bem estruturado. Ótima bibliografia complementar para o curso.'),
(4, 2, 2, 'Não gostei muito. Esperava mais profundidade no assunto. Achei a abordagem muito superficial para o tema proposto.'),
(4, 3, 3, 'É um livro razoável. Serve como introdução ao tema, mas para quem já tem conhecimento prévio, pode parecer básico.'),
(5, 1, 5, 'Simplesmente perfeito! Um dos melhores livros que já li na vida acadêmica. Super recomendo!')
ON CONFLICT (livro_id, usuario_id) DO NOTHING;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Dados de exemplo inseridos na tabela "avaliacoes"';
    RAISE NOTICE 'ℹ️  Total de avaliações inseridas: 10';
    RAISE NOTICE '⚠️  Ajuste os IDs de livro_id e usuario_id conforme seu banco de dados';
END $$;
