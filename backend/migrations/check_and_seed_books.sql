-- =====================================================
-- Script para Verificar e Popular Livros
-- =====================================================

-- 1. Verificar quantos livros existem
SELECT 'Total de livros:' as info, COUNT(*) as total FROM livro;

-- 2. Verificar quantos autores existem
SELECT 'Total de autores:' as info, COUNT(*) as total FROM autor;

-- 3. Verificar quantas categorias existem
SELECT 'Total de categorias:' as info, COUNT(*) as total FROM categoria;

-- 4. Se não houver livros, vamos criar alguns dados de exemplo

-- Inserir categorias se não existirem
INSERT INTO categoria (nome, descricao)
VALUES
    ('Ficção Científica', 'Livros de ficção científica'),
    ('Romance', 'Livros de romance'),
    ('Literatura Clássica', 'Clássicos da literatura mundial'),
    ('Literatura Brasileira', 'Obras da literatura brasileira')
ON CONFLICT DO NOTHING;

-- Inserir autores se não existirem
INSERT INTO autor (nome, biografia, nacionalidade)
VALUES
    ('George Orwell', 'Escritor, jornalista e ensaísta político inglês', 'Britânico'),
    ('Isaac Asimov', 'Escritor e bioquímico americano', 'Russo-Americano'),
    ('Machado de Assis', 'Escritor brasileiro, considerado um dos maiores nomes da literatura brasileira', 'Brasileiro'),
    ('José de Alencar', 'Escritor e político brasileiro, um dos maiores representantes do Romantismo', 'Brasileiro'),
    ('Arthur Conan Doyle', 'Escritor britânico, criador do detetive Sherlock Holmes', 'Britânico')
ON CONFLICT DO NOTHING;

-- Inserir livros se não existirem
INSERT INTO livro (titulo, isbn, ano_publicacao, num_paginas, sinopse, capa_url, quantidade_disponivel, preco, preco_promocional, promocao_ativa)
VALUES
    (
        '1984',
        '978-0451524935',
        1949,
        328,
        'Uma distopia sombria onde Big Brother observa tudo. Winston Smith luta contra a tirania totalitária que controla até os pensamentos.',
        'https://m.media-amazon.com/images/I/71rpa1-kyvL._AC_UF1000,1000_QL80_.jpg',
        5,
        3.50,
        2.50,
        true
    ),
    (
        'Fundação',
        '978-8576570646',
        1951,
        244,
        'Hari Seldon prevê a queda do Império Galáctico usando psicohistória. Cria duas Fundações para preservar o conhecimento.',
        'https://m.media-amazon.com/images/I/81gq-I9PE9L._AC_UF1000,1000_QL80_.jpg',
        3,
        4.00,
        NULL,
        false
    ),
    (
        'Dom Casmurro',
        '978-8535911664',
        1899,
        256,
        'Bentinho narra sua vida e o tormento do ciúme de Capitu. Será que ela o traiu com Escobar?',
        'https://m.media-amazon.com/images/I/71c7p6HZ3IL._AC_UF1000,1000_QL80_.jpg',
        7,
        2.50,
        NULL,
        false
    ),
    (
        'Iracema',
        '978-8508040407',
        1865,
        96,
        'Lenda do Ceará: o amor impossível entre a índia Iracema e o português Martim.',
        'https://m.media-amazon.com/images/I/81X1rRRt9hL._AC_UF1000,1000_QL80_.jpg',
        4,
        2.00,
        1.50,
        true
    ),
    (
        'Um Estudo em Vermelho',
        '978-8544001011',
        1887,
        176,
        'A primeira aventura de Sherlock Holmes e Dr. Watson investigando assassinatos misteriosos em Londres.',
        'https://m.media-amazon.com/images/I/81V8Em0GOHL._AC_UF1000,1000_QL80_.jpg',
        6,
        3.00,
        NULL,
        false
    ),
    (
        'A Revolução dos Bichos',
        '978-0451526342',
        1945,
        112,
        'Animais expulsam fazendeiro e criam sociedade igualitária. Porcos assumem poder e se tornam tão tiranos quanto humanos.',
        'https://m.media-amazon.com/images/I/91V69jmK48L._AC_UF1000,1000_QL80_.jpg',
        8,
        2.80,
        2.00,
        true
    )
ON CONFLICT (isbn) DO NOTHING;

-- Associar livros com autores
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id
FROM livro l, autor a
WHERE l.titulo = '1984' AND a.nome = 'George Orwell'
ON CONFLICT DO NOTHING;

INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id
FROM livro l, autor a
WHERE l.titulo = 'Fundação' AND a.nome = 'Isaac Asimov'
ON CONFLICT DO NOTHING;

INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id
FROM livro l, autor a
WHERE l.titulo = 'Dom Casmurro' AND a.nome = 'Machado de Assis'
ON CONFLICT DO NOTHING;

INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id
FROM livro l, autor a
WHERE l.titulo = 'Iracema' AND a.nome = 'José de Alencar'
ON CONFLICT DO NOTHING;

INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id
FROM livro l, autor a
WHERE l.titulo = 'Um Estudo em Vermelho' AND a.nome = 'Arthur Conan Doyle'
ON CONFLICT DO NOTHING;

INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id
FROM livro l, autor a
WHERE l.titulo = 'A Revolução dos Bichos' AND a.nome = 'George Orwell'
ON CONFLICT DO NOTHING;

-- Associar livros com categorias
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id
FROM livro l, categoria c
WHERE l.titulo = '1984' AND c.nome = 'Ficção Científica'
ON CONFLICT DO NOTHING;

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id
FROM livro l, categoria c
WHERE l.titulo = '1984' AND c.nome = 'Literatura Clássica'
ON CONFLICT DO NOTHING;

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id
FROM livro l, categoria c
WHERE l.titulo = 'Fundação' AND c.nome = 'Ficção Científica'
ON CONFLICT DO NOTHING;

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id
FROM livro l, categoria c
WHERE l.titulo = 'Dom Casmurro' AND c.nome = 'Literatura Brasileira'
ON CONFLICT DO NOTHING;

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id
FROM livro l, categoria c
WHERE l.titulo = 'Dom Casmurro' AND c.nome = 'Literatura Clássica'
ON CONFLICT DO NOTHING;

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id
FROM livro l, categoria c
WHERE l.titulo = 'Iracema' AND c.nome = 'Literatura Brasileira'
ON CONFLICT DO NOTHING;

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id
FROM livro l, categoria c
WHERE l.titulo = 'Iracema' AND c.nome = 'Romance'
ON CONFLICT DO NOTHING;

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id
FROM livro l, categoria c
WHERE l.titulo = 'Um Estudo em Vermelho' AND c.nome = 'Literatura Clássica'
ON CONFLICT DO NOTHING;

INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id
FROM livro l, categoria c
WHERE l.titulo = 'A Revolução dos Bichos' AND c.nome = 'Literatura Clássica'
ON CONFLICT DO NOTHING;

-- Verificar resultado final
SELECT 'Livros cadastrados:' as info;
SELECT l.id, l.titulo, l.preco, l.quantidade_disponivel,
       STRING_AGG(DISTINCT a.nome, ', ') as autores,
       STRING_AGG(DISTINCT c.nome, ', ') as categorias
FROM livro l
LEFT JOIN livro_autor la ON l.id = la.livro_id
LEFT JOIN autor a ON la.autor_id = a.id
LEFT JOIN livro_categoria lc ON l.id = lc.livro_id
LEFT JOIN categoria c ON lc.categoria_id = c.id
GROUP BY l.id, l.titulo, l.preco, l.quantidade_disponivel
ORDER BY l.titulo;
