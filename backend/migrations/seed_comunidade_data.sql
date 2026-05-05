-- =====================================================
-- Script de População de Dados - Comunidade
-- Sistema de Biblioteca Acadêmica
-- =====================================================

-- =====================================================
-- 1. POPULAR RESUMO_IA COM RESUMOS DOS LIVROS
-- =====================================================

-- Inserir resumos IA para os livros existentes
INSERT INTO resumo_ia (livro_id, resumo_texto, modelo_utilizado) VALUES

-- 1984 - George Orwell
((SELECT id FROM livros WHERE titulo ILIKE '%1984%' LIMIT 1),
'Uma distopia sombria onde Big Brother observa tudo. Winston Smith luta contra a tirania totalitária que controla até os pensamentos. Um clássico sobre vigilância, manipulação e resistência.',
'gpt-4-turbo'),

-- Fundação - Isaac Asimov
((SELECT id FROM livros WHERE titulo ILIKE '%Fundação%' OR titulo ILIKE '%Foundation%' LIMIT 1),
'Hari Seldon prevê a queda do Império Galáctico usando psicohistória. Cria duas Fundações para preservar o conhecimento e encurtar a era das trevas vindoura. Épico de ficção científica sobre destino e ciência.',
'gpt-4-turbo'),

-- Dom Casmurro - Machado de Assis
((SELECT id FROM livros WHERE titulo ILIKE '%Dom Casmurro%' LIMIT 1),
'Bentinho narra sua vida e o tormento do ciúme de Capitu. Será que ela o traiu com Escobar? Um mistério psicológico sobre memória, paixão e a natureza humana narrado por um protagonista pouco confiável.',
'gpt-4-turbo'),

-- O Cortiço - Aluísio Azevedo
((SELECT id FROM livros WHERE titulo ILIKE '%Cortiço%' LIMIT 1),
'Retrato naturalista de um cortiço carioca no século XIX. João Romão explora os moradores enquanto busca ascensão social. Crítica social sobre pobreza, ambição e determinismo ambiental.',
'gpt-4-turbo'),

-- Memórias Póstumas de Brás Cubas - Machado de Assis
((SELECT id FROM livros WHERE titulo ILIKE '%Memórias Póstumas%' OR titulo ILIKE '%Brás Cubas%' LIMIT 1),
'Brás Cubas narra sua vida depois de morto. Com humor negro e ironia, disseca a hipocrisia da elite brasileira do século XIX. Revolucionou a literatura nacional com sua narrativa não-linear.',
'gpt-4-turbo'),

-- Iracema - José de Alencar
((SELECT id FROM livros WHERE titulo ILIKE '%Iracema%' LIMIT 1),
'Lenda do Ceará: o amor impossível entre a índia Iracema e o português Martim. Ela sacrifica tudo por amor, simbolizando o encontro doloroso entre culturas. Prosa poética que forjou mitos nacionais.',
'gpt-4-turbo'),

-- A Revolução dos Bichos - George Orwell
((SELECT id FROM livros WHERE titulo ILIKE '%Revolução dos Bichos%' OR titulo ILIKE '%Animal Farm%' LIMIT 1),
'Animais expulsam fazendeiro e criam sociedade igualitária. Porcos assumem poder e se tornam tão tiranos quanto humanos. Alegoria devastadora sobre corrupção de ideais revolucionários.',
'gpt-4-turbo'),

-- Senhora - José de Alencar
((SELECT id FROM livros WHERE titulo ILIKE '%Senhora%' LIMIT 1),
'Aurélia compra seu próprio casamento para vingar-se de Seixas, que a rejeitou por dinheiro. Romance urbano sobre orgulho, mercantilização do amor e redenção na sociedade carioca oitocentista.',
'gpt-4-turbo')

ON CONFLICT DO NOTHING;


-- =====================================================
-- 2. CRIAR AVALIAÇÕES DE AUTORES
-- =====================================================

-- Buscar IDs de usuários e autores para usar nas avaliações
DO $$
DECLARE
    usuario1_id UUID;
    usuario2_id UUID;
    usuario3_id UUID;
    orwell_id UUID;
    asimov_id UUID;
    machado_id UUID;
    alencar_id UUID;
    aluisio_id UUID;
BEGIN
    -- Pegar 3 usuários de exemplo (se existirem)
    SELECT id INTO usuario1_id FROM usuario WHERE tipo_usuario = 'aluno' LIMIT 1;
    SELECT id INTO usuario2_id FROM usuario WHERE tipo_usuario = 'aluno' OFFSET 1 LIMIT 1;
    SELECT id INTO usuario3_id FROM usuario WHERE tipo_usuario = 'aluno' OFFSET 2 LIMIT 1;

    -- Pegar IDs dos autores
    SELECT id INTO orwell_id FROM autor WHERE nome ILIKE '%Orwell%' LIMIT 1;
    SELECT id INTO asimov_id FROM autor WHERE nome ILIKE '%Asimov%' LIMIT 1;
    SELECT id INTO machado_id FROM autor WHERE nome ILIKE '%Machado%' LIMIT 1;
    SELECT id INTO alencar_id FROM autor WHERE nome ILIKE '%Alencar%' LIMIT 1;
    SELECT id INTO aluisio_id FROM autor WHERE nome ILIKE '%Aluísio%' OR nome ILIKE '%Aluisio%' LIMIT 1;

    -- Inserir avaliações de autores (se os usuários existirem)
    IF usuario1_id IS NOT NULL AND orwell_id IS NOT NULL THEN
        INSERT INTO avaliacoes_autor (autor_id, usuario_id, nota, comentario, data_criacao) VALUES
        (orwell_id, usuario1_id, 5, 'George Orwell é um mestre em criar distopias que nos fazem refletir sobre o poder e a liberdade. Sua escrita direta e impactante denuncia autoritarismos de forma atemporal. 1984 e A Revolução dos Bichos são leituras essenciais!', NOW() - INTERVAL '15 days');
    END IF;

    IF usuario2_id IS NOT NULL AND machado_id IS NOT NULL THEN
        INSERT INTO avaliacoes_autor (autor_id, usuario_id, nota, comentario, data_criacao) VALUES
        (machado_id, usuario2_id, 5, 'Machado de Assis é simplesmente o maior escritor brasileiro. Sua ironia, narrativas não-confiáveis e análise da sociedade são incomparáveis. Dom Casmurro e Memórias Póstumas mudaram minha forma de ler literatura.', NOW() - INTERVAL '10 days');
    END IF;

    IF usuario3_id IS NOT NULL AND asimov_id IS NOT NULL THEN
        INSERT INTO avaliacoes_autor (autor_id, usuario_id, nota, comentario, data_criacao) VALUES
        (asimov_id, usuario3_id, 5, 'Asimov revolucionou a ficção científica com suas Leis da Robótica e a série Fundação. Sua capacidade de misturar ciência, filosofia e narrativa envolvente é única. Um verdadeiro visionário!', NOW() - INTERVAL '7 days');
    END IF;

    IF usuario1_id IS NOT NULL AND alencar_id IS NOT NULL THEN
        INSERT INTO avaliacoes_autor (autor_id, usuario_id, nota, comentario, data_criacao) VALUES
        (alencar_id, usuario1_id, 4, 'José de Alencar é fundamental para entender o Romantismo brasileiro. Iracema e Senhora são obras lindas que constroem mitos nacionais. A linguagem é poética, embora às vezes datada para leitores modernos.', NOW() - INTERVAL '5 days');
    END IF;

    IF usuario2_id IS NOT NULL AND aluisio_id IS NOT NULL THEN
        INSERT INTO avaliacoes_autor (autor_id, usuario_id, nota, comentario, data_criacao) VALUES
        (aluisio_id, usuario2_id, 4, 'Aluísio Azevedo retrata o Rio de Janeiro do século XIX com realismo impressionante. O Cortiço é uma obra-prima do Naturalismo, mostrando as duras condições sociais da época. Leitura importante para entender a história brasileira.', NOW() - INTERVAL '3 days');
    END IF;

    IF usuario3_id IS NOT NULL AND orwell_id IS NOT NULL THEN
        INSERT INTO avaliacoes_autor (autor_id, usuario_id, nota, comentario, data_criacao) VALUES
        (orwell_id, usuario3_id, 5, 'Relendo Orwell em 2025 e suas obras continuam extremamente relevantes. A vigilância digital, fake news e manipulação da verdade que ele previu estão mais atuais do que nunca. Um autor visionário!', NOW() - INTERVAL '1 days');
    END IF;

    RAISE NOTICE '✅ Avaliações de autores criadas com sucesso!';
END $$;


-- =====================================================
-- 3. CRIAR CURTIDAS EM COMENTÁRIOS
-- =====================================================

DO $$
DECLARE
    usuario_id UUID;
    comentario_id_var INTEGER;
BEGIN
    -- Curtir avaliações de livros (se existirem)
    FOR usuario_id IN (SELECT id FROM usuario WHERE tipo_usuario = 'aluno' LIMIT 5)
    LOOP
        FOR comentario_id_var IN (SELECT id FROM avaliacoes ORDER BY RANDOM() LIMIT 3)
        LOOP
            INSERT INTO curtidas_comentario (tipo_comentario, comentario_id, usuario_id)
            VALUES ('livro', comentario_id_var, usuario_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- Curtir avaliações de autores (se existirem)
    FOR usuario_id IN (SELECT id FROM usuario WHERE tipo_usuario = 'aluno' LIMIT 5)
    LOOP
        FOR comentario_id_var IN (SELECT id FROM avaliacoes_autor ORDER BY RANDOM() LIMIT 2)
        LOOP
            INSERT INTO curtidas_comentario (tipo_comentario, comentario_id, usuario_id)
            VALUES ('autor', comentario_id_var, usuario_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    RAISE NOTICE '✅ Curtidas criadas com sucesso!';
END $$;


-- =====================================================
-- 4. CRIAR RESPOSTAS A COMENTÁRIOS
-- =====================================================

DO $$
DECLARE
    usuario1_id UUID;
    usuario2_id UUID;
    comentario_autor_id INTEGER;
    comentario_livro_id INTEGER;
BEGIN
    -- Pegar 2 usuários diferentes
    SELECT id INTO usuario1_id FROM usuario WHERE tipo_usuario = 'aluno' LIMIT 1;
    SELECT id INTO usuario2_id FROM usuario WHERE tipo_usuario = 'aluno' OFFSET 1 LIMIT 1;

    -- Resposta em avaliação de autor
    SELECT id INTO comentario_autor_id FROM avaliacoes_autor LIMIT 1;
    IF usuario1_id IS NOT NULL AND comentario_autor_id IS NOT NULL THEN
        INSERT INTO respostas_comentario (tipo_comentario, comentario_id, usuario_id, texto, data_criacao) VALUES
        ('autor', comentario_autor_id, usuario1_id, 'Concordo totalmente! A escrita desse autor é realmente marcante e atemporal.', NOW() - INTERVAL '2 days');
    END IF;

    -- Resposta em avaliação de livro
    SELECT id INTO comentario_livro_id FROM avaliacoes LIMIT 1;
    IF usuario2_id IS NOT NULL AND comentario_livro_id IS NOT NULL THEN
        INSERT INTO respostas_comentario (tipo_comentario, comentario_id, usuario_id, texto, data_criacao) VALUES
        ('livro', comentario_livro_id, usuario2_id, 'Ótima avaliação! Você me convenceu a ler esse livro também.', NOW() - INTERVAL '1 days');
    END IF;

    RAISE NOTICE '✅ Respostas criadas com sucesso!';
END $$;


-- =====================================================
-- MENSAGENS DE SUCESSO FINAL
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ DADOS DE COMUNIDADE POPULADOS!';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📚 Resumos IA adicionados aos livros';
    RAISE NOTICE '⭐ Avaliações de autores criadas';
    RAISE NOTICE '❤️  Curtidas distribuídas nos comentários';
    RAISE NOTICE '💬 Respostas aos comentários criadas';
    RAISE NOTICE '';
END $$;
