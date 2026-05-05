-- =====================================================
-- Script para Adicionar 70 Novos Livros Completos
-- Sistema de Biblioteca Acadêmica
-- =====================================================

-- =====================================================
-- 1. INSERIR NOVOS AUTORES
-- =====================================================

INSERT INTO autor (nome, biografia, nacionalidade, foto_url) VALUES
('J.K. Rowling', 'Autora britânica, criadora da série Harry Potter', 'Britânica', NULL),
('Stephen King', 'Mestre do terror e suspense, autor de mais de 60 romances', 'Americano', NULL),
('Agatha Christie', 'Rainha do crime, autora de mistérios clássicos', 'Britânica', NULL),
('Gabriel García Márquez', 'Escritor colombiano, Prêmio Nobel de Literatura 1982', 'Colombiano', NULL),
('Jane Austen', 'Romancista inglesa conhecida por suas obras sobre a sociedade georgiana', 'Britânica', NULL),
('Charles Dickens', 'Romancista vitoriano, autor de clássicos como Oliver Twist', 'Britânico', NULL),
('Fiódor Dostoiévski', 'Grande romancista russo, autor de Crime e Castigo', 'Russo', NULL),
('Virginia Woolf', 'Escritora modernista inglesa, pioneira do fluxo de consciência', 'Britânica', NULL),
('Ernest Hemingway', 'Escritor americano, Prêmio Nobel de Literatura 1954', 'Americano', NULL),
('Franz Kafka', 'Escritor tcheco de língua alemã, mestre do absurdo e alienação', 'Tcheco', NULL),
('J.R.R. Tolkien', 'Filólogo e autor de O Senhor dos Anéis', 'Britânico', NULL),
('Paulo Coelho', 'Escritor brasileiro, autor de O Alquimista', 'Brasileiro', NULL),
('Clarice Lispector', 'Escritora brasileira, mestra da prosa introspectiva', 'Brasileira', NULL),
('Jorge Amado', 'Escritor brasileiro, autor de Gabriela Cravo e Canela', 'Brasileiro', NULL),
('Cecília Meireles', 'Poetisa, pintora e professora brasileira', 'Brasileira', NULL),
('Carlos Drummond de Andrade', 'Poeta, contista e cronista brasileiro', 'Brasileiro', NULL),
('Graciliano Ramos', 'Escritor brasileiro, autor de Vidas Secas', 'Brasileiro', NULL),
('Rachel de Queiroz', 'Escritora e jornalista brasileira', 'Brasileira', NULL),
('Érico Veríssimo', 'Escritor brasileiro, autor de O Tempo e o Vento', 'Brasileiro', NULL),
('Monteiro Lobato', 'Escritor brasileiro, criador do Sítio do Picapau Amarelo', 'Brasileiro', NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. INSERIR NOVAS CATEGORIAS
-- =====================================================

INSERT INTO categoria (nome, descricao) VALUES
('Fantasia', 'Livros de fantasia e mundo imaginários'),
('Terror', 'Livros de terror e suspense'),
('Mistério', 'Livros de mistério e detetive'),
('Realismo Mágico', 'Obras que misturam realidade com elementos fantásticos'),
('Poesia', 'Coletâneas de poemas e obras poéticas'),
('Drama', 'Obras dramáticas e teatrais'),
('Filosofia', 'Obras filosóficas e de pensamento'),
('História', 'Livros sobre história e acontecimentos históricos'),
('Biografia', 'Biografias e autobiografias'),
('Autoajuda', 'Livros de desenvolvimento pessoal')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. INSERIR 70 NOVOS LIVROS
-- =====================================================

INSERT INTO livro (titulo, isbn, ano_publicacao, num_paginas, sinopse, capa_url, quantidade_disponivel, preco, preco_promocional, promocao_ativa) VALUES

-- Livros 1-10: Harry Potter e Fantasia
('Harry Potter e a Pedra Filosofal', '978-8532530787', 1997, 264, 'Harry descobre que é um bruxo e inicia sua jornada em Hogwarts', 'https://m.media-amazon.com/images/I/81ibfYk4qmL._AC_UF1000,1000_QL80_.jpg', 10, 4.50, 3.50, true),
('Harry Potter e a Câmara Secreta', '978-8532530794', 1998, 288, 'Harry retorna a Hogwarts e enfrenta novos mistérios', 'https://m.media-amazon.com/images/I/81lAPl9Fl5L._AC_UF1000,1000_QL80_.jpg', 8, 4.50, NULL, false),
('Harry Potter e o Prisioneiro de Azkaban', '978-8532530800', 1999, 352, 'Sirius Black escapa e Harry descobre segredos sobre seu passado', 'https://m.media-amazon.com/images/I/81lF7Sg95kL._AC_UF1000,1000_QL80_.jpg', 7, 5.00, 4.00, true),
('O Hobbit', '978-8595084742', 1937, 336, 'Bilbo Bolseiro parte em uma aventura inesperada', 'https://m.media-amazon.com/images/I/91b0C2YNSrL._AC_UF1000,1000_QL80_.jpg', 12, 4.00, NULL, false),
('O Senhor dos Anéis: A Sociedade do Anel', '978-8595084766', 1954, 576, 'Frodo inicia a jornada para destruir o Um Anel', 'https://m.media-amazon.com/images/I/81hCKbqx9UL._AC_UF1000,1000_QL80_.jpg', 6, 6.00, 5.00, true),
('As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa', '978-8578277109', 1950, 208, 'Quatro irmãos descobrem um mundo mágico através de um guarda-roupa', 'https://m.media-amazon.com/images/I/71yJLhQekBL._AC_UF1000,1000_QL80_.jpg', 9, 3.50, NULL, false),
('A História Sem Fim', '978-8533613447', 1979, 432, 'Bastian se perde em um livro mágico que muda sua vida', 'https://m.media-amazon.com/images/I/71P+qCGLv7L._AC_UF1000,1000_QL80_.jpg', 5, 4.50, 3.50, true),
('Alice no País das Maravilhas', '978-8544001066', 1865, 128, 'Alice cai em uma toca de coelho e vive aventuras surreais', 'https://m.media-amazon.com/images/I/91HHxxtA1wL._AC_UF1000,1000_QL80_.jpg', 8, 2.50, NULL, false),
('Peter Pan', '978-8594318602', 1911, 184, 'O menino que nunca cresce e suas aventuras na Terra do Nunca', 'https://m.media-amazon.com/images/I/81z7E0uWRkL._AC_UF1000,1000_QL80_.jpg', 7, 2.50, 2.00, true),
('O Pequeno Príncipe', '978-8522008865', 1943, 96, 'Um príncipe de outro planeta ensina sobre amor e amizade', 'https://m.media-amazon.com/images/I/61fHKHQq5OL._AC_UF1000,1000_QL80_.jpg', 15, 2.00, NULL, false),

-- Livros 11-20: Terror e Suspense
('O Iluminado', '978-8581050126', 1977, 464, 'Jack Torrance aceita ser zelador de um hotel isolado nas montanhas', 'https://m.media-amazon.com/images/I/91M9xPIf10L._AC_UF1000,1000_QL80_.jpg', 6, 5.00, 4.00, true),
('It: A Coisa', '978-8560280247', 1986, 1104, 'Uma entidade maligna aterroriza a cidade de Derry', 'https://m.media-amazon.com/images/I/71b+yykQ57L._AC_UF1000,1000_QL80_.jpg', 4, 7.00, NULL, false),
('Carrie: A Estranha', '978-8581052922', 1974, 288, 'Uma garota com poderes telecinéticos se vinga de seus agressores', 'https://m.media-amazon.com/images/I/81fkF0hCqrL._AC_UF1000,1000_QL80_.jpg', 5, 4.00, 3.00, true),
('O Cemitério', '978-8581052939', 1983, 416, 'Um cemitério misterioso que traz os mortos de volta', 'https://m.media-amazon.com/images/I/71SNlNvNYtL._AC_UF1000,1000_QL80_.jpg', 6, 4.50, NULL, false),
('Drácula', '978-8544001929', 1897, 488, 'O clássico sobre o vampiro mais famoso de todos os tempos', 'https://m.media-amazon.com/images/I/81gG76+LQEL._AC_UF1000,1000_QL80_.jpg', 8, 3.50, 2.50, true),
('Frankenstein', '978-8544002032', 1818, 280, 'Victor Frankenstein cria uma criatura que foge de seu controle', 'https://m.media-amazon.com/images/I/81z7E0uWRkL._AC_UF1000,1000_QL80_.jpg', 7, 3.00, NULL, false),
('O Médico e o Monstro', '978-8544001998', 1886, 144, 'Dr. Jekyll cria uma poção que libera seu lado obscuro', 'https://m.media-amazon.com/images/I/71yJLhQekBL._AC_UF1000,1000_QL80_.jpg', 6, 2.50, 2.00, true),
('O Exorcista', '978-8580572766', 1971, 385, 'Uma menina é possuída por uma entidade demoníaca', 'https://m.media-amazon.com/images/I/81SNlNvNYtL._AC_UF1000,1000_QL80_.jpg', 5, 4.00, NULL, false),
('Entrevista com o Vampiro', '978-8532525918', 1976, 416, 'Louis conta sua história como vampiro a um repórter', 'https://m.media-amazon.com/images/I/71M9xPIf10L._AC_UF1000,1000_QL80_.jpg', 6, 4.50, 3.50, true),
('A Assombração da Casa da Colina', '978-8580573893', 1959, 256, 'Quatro pessoas investigam fenômenos sobrenaturais', 'https://m.media-amazon.com/images/I/81gG76+LQEL._AC_UF1000,1000_QL80_.jpg', 4, 3.50, NULL, false),

-- Livros 21-30: Mistério e Detetive
('Assassinato no Expresso do Oriente', '978-8595081574', 1934, 256, 'Hercule Poirot investiga um assassinato em um trem', 'https://m.media-amazon.com/images/I/91b0C2YNSrL._AC_UF1000,1000_QL80_.jpg', 8, 3.50, 2.50, true),
('Morte no Nilo', '978-8595081581', 1937, 352, 'Poirot investiga um assassinato durante um cruzeiro', 'https://m.media-amazon.com/images/I/81hCKbqx9UL._AC_UF1000,1000_QL80_.jpg', 7, 3.50, NULL, false),
('O Caso dos Dez Negrinhos', '978-8595081598', 1939, 272, 'Dez pessoas são convidadas para uma ilha e começam a morrer', 'https://m.media-amazon.com/images/I/71P+qCGLv7L._AC_UF1000,1000_QL80_.jpg', 9, 3.50, 3.00, true),
('O Cão dos Baskervilles', '978-8544001134', 1902, 256, 'Sherlock Holmes investiga uma maldição familiar', 'https://m.media-amazon.com/images/I/81z7E0uWRkL._AC_UF1000,1000_QL80_.jpg', 10, 3.00, NULL, false),
('O Sinal dos Quatro', '978-8544001141', 1890, 176, 'Watson e Holmes investigam um mistério envolvendo tesouros', 'https://m.media-amazon.com/images/I/61fHKHQq5OL._AC_UF1000,1000_QL80_.jpg', 8, 2.50, 2.00, true),
('O Nome da Rosa', '978-8577992638', 1980, 544, 'Monge franciscano investiga mortes misteriosas em um mosteiro', 'https://m.media-amazon.com/images/I/91M9xPIf10L._AC_UF1000,1000_QL80_.jpg', 6, 5.50, NULL, false),
('O Código Da Vinci', '978-8599296639', 2003, 432, 'Robert Langdon investiga um assassinato no Louvre', 'https://m.media-amazon.com/images/I/81fkF0hCqrL._AC_UF1000,1000_QL80_.jpg', 12, 5.00, 4.00, true),
('Anjos e Demônios', '978-8599296646', 2000, 512, 'Langdon enfrenta uma conspiração contra o Vaticano', 'https://m.media-amazon.com/images/I/71SNlNvNYtL._AC_UF1000,1000_QL80_.jpg', 10, 5.00, NULL, false),
('A Menina que Roubava Livros', '978-8598078175', 2005, 480, 'Durante a Segunda Guerra, uma menina encontra consolo nos livros', 'https://m.media-amazon.com/images/I/81gG76+LQEL._AC_UF1000,1000_QL80_.jpg', 9, 4.50, 3.50, true),
('O Silêncio dos Inocentes', '978-8580570410', 1988, 368, 'Agente do FBI busca ajuda de serial killer para capturar outro', 'https://m.media-amazon.com/images/I/71yJLhQekBL._AC_UF1000,1000_QL80_.jpg', 7, 4.00, NULL, false),

-- Livros 31-40: Clássicos Internacionais
('Cem Anos de Solidão', '978-8501012371', 1967, 424, 'A saga da família Buendía em Macondo', 'https://m.media-amazon.com/images/I/91b0C2YNSrL._AC_UF1000,1000_QL80_.jpg', 8, 5.00, 4.00, true),
('O Amor nos Tempos do Cólera', '978-8501058980', 1985, 464, 'Uma história de amor que atravessa décadas', 'https://m.media-amazon.com/images/I/81hCKbqx9UL._AC_UF1000,1000_QL80_.jpg', 7, 4.50, NULL, false),
('Orgulho e Preconceito', '978-8544001943', 1813, 424, 'Elizabeth Bennet e Mr. Darcy em um romance clássico', 'https://m.media-amazon.com/images/I/71P+qCGLv7L._AC_UF1000,1000_QL80_.jpg', 10, 3.50, 2.50, true),
('Emma', '978-8544002001', 1815, 512, 'Emma Woodhouse e suas tentativas de casamenteira', 'https://m.media-amazon.com/images/I/81z7E0uWRkL._AC_UF1000,1000_QL80_.jpg', 6, 3.50, NULL, false),
('Razão e Sensibilidade', '978-8544001974', 1811, 416, 'As irmãs Dashwood e suas diferentes visões do amor', 'https://m.media-amazon.com/images/I/61fHKHQq5OL._AC_UF1000,1000_QL80_.jpg', 5, 3.50, 3.00, true),
('Oliver Twist', '978-8544001950', 1838, 544, 'Um órfão enfrenta a dura realidade da Londres vitoriana', 'https://m.media-amazon.com/images/I/91M9xPIf10L._AC_UF1000,1000_QL80_.jpg', 7, 4.00, NULL, false),
('Grandes Esperanças', '978-8544001967', 1861, 544, 'Pip e sua jornada de pobre órfão a cavalheiro', 'https://m.media-amazon.com/images/I/81fkF0hCqrL._AC_UF1000,1000_QL80_.jpg', 6, 4.00, 3.00, true),
('Crime e Castigo', '978-8535911152', 1866, 560, 'Raskólnikov comete um assassinato e lida com a culpa', 'https://m.media-amazon.com/images/I/71SNlNvNYtL._AC_UF1000,1000_QL80_.jpg', 8, 5.50, NULL, false),
('Os Irmãos Karamázov', '978-8535911176', 1880, 944, 'Três irmãos e o assassinato de seu pai', 'https://m.media-amazon.com/images/I/81gG76+LQEL._AC_UF1000,1000_QL80_.jpg', 5, 7.00, 6.00, true),
('Anna Kariênina', '978-8535911183', 1877, 864, 'O affair de Anna e suas trágicas consequências', 'https://m.media-amazon.com/images/I/71yJLhQekBL._AC_UF1000,1000_QL80_.jpg', 6, 6.50, NULL, false),

-- Livros 41-50: Literatura Modernista
('Mrs. Dalloway', '978-8520923580', 1925, 224, 'Um dia na vida de Clarissa Dalloway em Londres', 'https://m.media-amazon.com/images/I/91b0C2YNSrL._AC_UF1000,1000_QL80_.jpg', 5, 3.50, 2.50, true),
('Ao Farol', '978-8520923597', 1927, 256, 'A família Ramsay e suas visitas à ilha de Skye', 'https://m.media-amazon.com/images/I/81hCKbqx9UL._AC_UF1000,1000_QL80_.jpg', 4, 3.50, NULL, false),
('O Velho e o Mar', '978-8528613452', 1952, 128, 'Um velho pescador luta com um grande peixe', 'https://m.media-amazon.com/images/I/71P+qCGLv7L._AC_UF1000,1000_QL80_.jpg', 8, 2.50, 2.00, true),
('Por Quem os Sinos Dobram', '978-8528608199', 1940, 512, 'Robert Jordan e a Guerra Civil Espanhola', 'https://m.media-amazon.com/images/I/81z7E0uWRkL._AC_UF1000,1000_QL80_.jpg', 6, 5.00, NULL, false),
('O Sol Também Se Levanta', '978-8528608205', 1926, 272, 'Expatriados americanos em Paris e Pamplona', 'https://m.media-amazon.com/images/I/61fHKHQq5OL._AC_UF1000,1000_QL80_.jpg', 5, 3.50, 3.00, true),
('A Metamorfose', '978-8535908770', 1915, 96, 'Gregor Samsa acorda transformado em um inseto', 'https://m.media-amazon.com/images/I/91M9xPIf10L._AC_UF1000,1000_QL80_.jpg', 10, 2.00, NULL, false),
('O Processo', '978-8535908787', 1925, 320, 'Josef K. é acusado de um crime que desconhece', 'https://m.media-amazon.com/images/I/81fkF0hCqrL._AC_UF1000,1000_QL80_.jpg', 7, 3.50, 2.50, true),
('O Castelo', '978-8535908794', 1926, 480, 'K. tenta alcançar as autoridades de um castelo misterioso', 'https://m.media-amazon.com/images/I/71SNlNvNYtL._AC_UF1000,1000_QL80_.jpg', 6, 4.50, NULL, false),
('Ulisses', '978-8544001325', 1922, 832, 'Um dia na vida de Leopold Bloom em Dublin', 'https://m.media-amazon.com/images/I/81gG76+LQEL._AC_UF1000,1000_QL80_.jpg', 4, 7.00, 6.00, true),
('Em Busca do Tempo Perdido', '978-8525406491', 1913, 528, 'Memórias e reflexões sobre o tempo e a memória', 'https://m.media-amazon.com/images/I/71yJLhQekBL._AC_UF1000,1000_QL80_.jpg', 5, 6.00, NULL, false),

-- Livros 51-60: Literatura Brasileira
('O Alquimista', '978-8595080140', 1988, 256, 'Santiago busca seu tesouro no deserto do Egito', 'https://m.media-amazon.com/images/I/91b0C2YNSrL._AC_UF1000,1000_QL80_.jpg', 15, 3.50, 2.50, true),
('Brida', '978-8595080157', 1990, 256, 'Uma jovem irlandesa busca conhecimento mágico', 'https://m.media-amazon.com/images/I/81hCKbqx9UL._AC_UF1000,1000_QL80_.jpg', 8, 3.50, NULL, false),
('A Hora da Estrela', '978-8520925683', 1977, 88, 'Macabéa, uma nordestina no Rio de Janeiro', 'https://m.media-amazon.com/images/I/71P+qCGLv7L._AC_UF1000,1000_QL80_.jpg', 10, 2.50, 2.00, true),
('A Paixão Segundo G.H.', '978-8520925676', 1964, 176, 'Uma dona de casa vive uma experiência existencial', 'https://m.media-amazon.com/images/I/81z7E0uWRkL._AC_UF1000,1000_QL80_.jpg', 6, 3.00, NULL, false),
('Gabriela, Cravo e Canela', '978-8535908992', 1958, 424, 'Nacib e Gabriela na Ilhéus dos anos 1920', 'https://m.media-amazon.com/images/I/61fHKHQq5OL._AC_UF1000,1000_QL80_.jpg', 8, 4.50, 3.50, true),
('Capitães da Areia', '978-8535909005', 1937, 280, 'Meninos de rua em Salvador enfrentam a sociedade', 'https://m.media-amazon.com/images/I/91M9xPIf10L._AC_UF1000,1000_QL80_.jpg', 9, 3.50, NULL, false),
('Vidas Secas', '978-8501012364', 1938, 176, 'Família de retirantes foge da seca nordestina', 'https://m.media-amazon.com/images/I/81fkF0hCqrL._AC_UF1000,1000_QL80_.jpg', 12, 2.50, 2.00, true),
('São Bernardo', '978-8501012357', 1934, 192, 'Paulo Honório e sua busca obsessiva por sucesso', 'https://m.media-amazon.com/images/I/71SNlNvNYtL._AC_UF1000,1000_QL80_.jpg', 7, 2.50, NULL, false),
('O Quinze', '978-8503012211', 1930, 144, 'A seca de 1915 no Ceará e suas consequências', 'https://m.media-amazon.com/images/I/81gG76+LQEL._AC_UF1000,1000_QL80_.jpg', 8, 2.50, 2.00, true),
('O Tempo e o Vento', '978-8535908961', 1949, 688, 'A saga da família Terra Cambará no Rio Grande do Sul', 'https://m.media-amazon.com/images/I/71yJLhQekBL._AC_UF1000,1000_QL80_.jpg', 6, 6.00, NULL, false),

-- Livros 61-70: Poesia e Infantojuvenil
('Romanceiro da Inconfidência', '978-8526012103', 1953, 328, 'Poemas sobre a Inconfidência Mineira', 'https://m.media-amazon.com/images/I/91b0C2YNSrL._AC_UF1000,1000_QL80_.jpg', 5, 3.50, 2.50, true),
('Viagem', '978-8526012110', 1939, 192, 'Coletânea de poemas de Cecília Meireles', 'https://m.media-amazon.com/images/I/81hCKbqx9UL._AC_UF1000,1000_QL80_.jpg', 6, 2.50, NULL, false),
('Sentimento do Mundo', '978-8535911695', 1940, 128, 'Poemas que refletem sobre o mundo e a condição humana', 'https://m.media-amazon.com/images/I/71P+qCGLv7L._AC_UF1000,1000_QL80_.jpg', 8, 2.50, 2.00, true),
('A Rosa do Povo', '978-8535911701', 1945, 176, 'Poesia social e engajada de Drummond', 'https://m.media-amazon.com/images/I/81z7E0uWRkL._AC_UF1000,1000_QL80_.jpg', 7, 2.50, NULL, false),
('Claro Enigma', '978-8535911718', 1951, 144, 'Reflexões sobre a existência e o tempo', 'https://m.media-amazon.com/images/I/61fHKHQq5OL._AC_UF1000,1000_QL80_.jpg', 6, 2.50, 2.00, true),
('Reinações de Narizinho', '978-8525052636', 1931, 288, 'Aventuras de Narizinho no Sítio do Picapau Amarelo', 'https://m.media-amazon.com/images/I/91M9xPIf10L._AC_UF1000,1000_QL80_.jpg', 12, 3.00, NULL, false),
('Caçadas de Pedrinho', '978-8525052643', 1933, 144, 'Pedrinho caça uma onça no sítio', 'https://m.media-amazon.com/images/I/81fkF0hCqrL._AC_UF1000,1000_QL80_.jpg', 10, 2.50, 2.00, true),
('O Saci', '978-8525052650', 1921, 176, 'A história do Saci-Pererê', 'https://m.media-amazon.com/images/I/71SNlNvNYtL._AC_UF1000,1000_QL80_.jpg', 11, 2.50, NULL, false),
('A Chave do Tamanho', '978-8525052667', 1942, 160, 'Emília diminui todos os seres humanos', 'https://m.media-amazon.com/images/I/81gG76+LQEL._AC_UF1000,1000_QL80_.jpg', 9, 2.50, 2.00, true),
('Memórias de Emília', '978-8525052674', 1936, 192, 'Emília conta suas aventuras', 'https://m.media-amazon.com/images/I/71yJLhQekBL._AC_UF1000,1000_QL80_.jpg', 10, 2.50, NULL, false)

ON CONFLICT (isbn) DO NOTHING;

-- =====================================================
-- 4. ASSOCIAR LIVROS COM AUTORES
-- =====================================================

-- Harry Potter (J.K. Rowling)
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Harry Potter e a Pedra Filosofal', 'Harry Potter e a Câmara Secreta', 'Harry Potter e o Prisioneiro de Azkaban')
AND a.nome = 'J.K. Rowling'
ON CONFLICT DO NOTHING;

-- Stephen King
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('O Iluminado', 'It: A Coisa', 'Carrie: A Estranha', 'O Cemitério')
AND a.nome = 'Stephen King'
ON CONFLICT DO NOTHING;

-- Agatha Christie
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Assassinato no Expresso do Oriente', 'Morte no Nilo', 'O Caso dos Dez Negrinhos')
AND a.nome = 'Agatha Christie'
ON CONFLICT DO NOTHING;

-- Arthur Conan Doyle
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('O Cão dos Baskervilles', 'O Sinal dos Quatro')
AND a.nome = 'Arthur Conan Doyle'
ON CONFLICT DO NOTHING;

-- Gabriel García Márquez
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Cem Anos de Solidão', 'O Amor nos Tempos do Cólera')
AND a.nome = 'Gabriel García Márquez'
ON CONFLICT DO NOTHING;

-- Jane Austen
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Orgulho e Preconceito', 'Emma', 'Razão e Sensibilidade')
AND a.nome = 'Jane Austen'
ON CONFLICT DO NOTHING;

-- Charles Dickens
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Oliver Twist', 'Grandes Esperanças')
AND a.nome = 'Charles Dickens'
ON CONFLICT DO NOTHING;

-- Fiódor Dostoiévski
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Crime e Castigo', 'Os Irmãos Karamázov')
AND a.nome = 'Fiódor Dostoiévski'
ON CONFLICT DO NOTHING;

-- Virginia Woolf
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Mrs. Dalloway', 'Ao Farol')
AND a.nome = 'Virginia Woolf'
ON CONFLICT DO NOTHING;

-- Ernest Hemingway
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('O Velho e o Mar', 'Por Quem os Sinos Dobram', 'O Sol Também Se Levanta')
AND a.nome = 'Ernest Hemingway'
ON CONFLICT DO NOTHING;

-- Franz Kafka
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('A Metamorfose', 'O Processo', 'O Castelo')
AND a.nome = 'Franz Kafka'
ON CONFLICT DO NOTHING;

-- J.R.R. Tolkien
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('O Hobbit', 'O Senhor dos Anéis: A Sociedade do Anel')
AND a.nome = 'J.R.R. Tolkien'
ON CONFLICT DO NOTHING;

-- Paulo Coelho
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('O Alquimista', 'Brida')
AND a.nome = 'Paulo Coelho'
ON CONFLICT DO NOTHING;

-- Clarice Lispector
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('A Hora da Estrela', 'A Paixão Segundo G.H.')
AND a.nome = 'Clarice Lispector'
ON CONFLICT DO NOTHING;

-- Jorge Amado
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Gabriela, Cravo e Canela', 'Capitães da Areia')
AND a.nome = 'Jorge Amado'
ON CONFLICT DO NOTHING;

-- Graciliano Ramos
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Vidas Secas', 'São Bernardo')
AND a.nome = 'Graciliano Ramos'
ON CONFLICT DO NOTHING;

-- Rachel de Queiroz
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo = 'O Quinze'
AND a.nome = 'Rachel de Queiroz'
ON CONFLICT DO NOTHING;

-- Érico Veríssimo
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo = 'O Tempo e o Vento'
AND a.nome = 'Érico Veríssimo'
ON CONFLICT DO NOTHING;

-- Cecília Meireles
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Romanceiro da Inconfidência', 'Viagem')
AND a.nome = 'Cecília Meireles'
ON CONFLICT DO NOTHING;

-- Carlos Drummond de Andrade
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Sentimento do Mundo', 'A Rosa do Povo', 'Claro Enigma')
AND a.nome = 'Carlos Drummond de Andrade'
ON CONFLICT DO NOTHING;

-- Monteiro Lobato
INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id FROM livro l, autor a
WHERE l.titulo IN ('Reinações de Narizinho', 'Caçadas de Pedrinho', 'O Saci', 'A Chave do Tamanho', 'Memórias de Emília')
AND a.nome = 'Monteiro Lobato'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. ASSOCIAR LIVROS COM CATEGORIAS
-- =====================================================

-- Fantasia
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id FROM livro l, categoria c
WHERE l.titulo IN (
    'Harry Potter e a Pedra Filosofal', 'Harry Potter e a Câmara Secreta', 'Harry Potter e o Prisioneiro de Azkaban',
    'O Hobbit', 'O Senhor dos Anéis: A Sociedade do Anel', 'As Crônicas de Nárnia: O Leão, a Feiticeira e o Guarda-Roupa',
    'A História Sem Fim', 'Alice no País das Maravilhas', 'Peter Pan'
)
AND c.nome = 'Fantasia'
ON CONFLICT DO NOTHING;

-- Terror
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id FROM livro l, categoria c
WHERE l.titulo IN (
    'O Iluminado', 'It: A Coisa', 'Carrie: A Estranha', 'O Cemitério',
    'Drácula', 'Frankenstein', 'O Médico e o Monstro', 'O Exorcista',
    'Entrevista com o Vampiro', 'A Assombração da Casa da Colina'
)
AND c.nome = 'Terror'
ON CONFLICT DO NOTHING;

-- Mistério
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id FROM livro l, categoria c
WHERE l.titulo IN (
    'Assassinato no Expresso do Oriente', 'Morte no Nilo', 'O Caso dos Dez Negrinhos',
    'O Cão dos Baskervilles', 'O Sinal dos Quatro', 'O Nome da Rosa',
    'O Código Da Vinci', 'Anjos e Demônios', 'O Silêncio dos Inocentes'
)
AND c.nome = 'Mistério'
ON CONFLICT DO NOTHING;

-- Realismo Mágico
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id FROM livro l, categoria c
WHERE l.titulo IN ('Cem Anos de Solidão', 'O Amor nos Tempos do Cólera')
AND c.nome = 'Realismo Mágico'
ON CONFLICT DO NOTHING;

-- Romance
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id FROM livro l, categoria c
WHERE l.titulo IN (
    'Orgulho e Preconceito', 'Emma', 'Razão e Sensibilidade',
    'Anna Kariênina', 'O Amor nos Tempos do Cólera'
)
AND c.nome = 'Romance'
ON CONFLICT DO NOTHING;

-- Literatura Clássica
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id FROM livro l, categoria c
WHERE l.titulo IN (
    'Oliver Twist', 'Grandes Esperanças', 'Crime e Castigo', 'Os Irmãos Karamázov',
    'Anna Kariênina', 'Mrs. Dalloway', 'Ao Farol', 'O Velho e o Mar',
    'Por Quem os Sinos Dobram', 'O Sol Também Se Levanta', 'A Metamorfose',
    'O Processo', 'O Castelo', 'Ulisses', 'Em Busca do Tempo Perdido'
)
AND c.nome = 'Literatura Clássica'
ON CONFLICT DO NOTHING;

-- Literatura Brasileira
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id FROM livro l, categoria c
WHERE l.titulo IN (
    'A Hora da Estrela', 'A Paixão Segundo G.H.', 'Gabriela, Cravo e Canela',
    'Capitães da Areia', 'Vidas Secas', 'São Bernardo', 'O Quinze',
    'O Tempo e o Vento'
)
AND c.nome = 'Literatura Brasileira'
ON CONFLICT DO NOTHING;

-- Poesia
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id FROM livro l, categoria c
WHERE l.titulo IN (
    'Romanceiro da Inconfidência', 'Viagem', 'Sentimento do Mundo',
    'A Rosa do Povo', 'Claro Enigma'
)
AND c.nome = 'Poesia'
ON CONFLICT DO NOTHING;

-- Autoajuda
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id FROM livro l, categoria c
WHERE l.titulo IN ('O Alquimista', 'Brida', 'O Pequeno Príncipe')
AND c.nome = 'Autoajuda'
ON CONFLICT DO NOTHING;

-- Drama
INSERT INTO livro_categoria (livro_id, categoria_id)
SELECT l.id, c.id FROM livro l, categoria c
WHERE l.titulo IN ('A Menina que Roubava Livros')
AND c.nome = 'Drama'
ON CONFLICT DO NOTHING;

-- =====================================================
-- MENSAGENS DE SUCESSO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '✅ 70 NOVOS LIVROS ADICIONADOS!';
    RAISE NOTICE '✅ ========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📚 20 Novos autores adicionados';
    RAISE NOTICE '📖 10 Novas categorias adicionadas';
    RAISE NOTICE '📕 70 Livros completos com dados inseridos';
    RAISE NOTICE '🔗 Relacionamentos autor-livro criados';
    RAISE NOTICE '🏷️  Relacionamentos categoria-livro criados';
    RAISE NOTICE '';
    RAISE NOTICE 'Total esperado de livros no sistema: ~80+';
    RAISE NOTICE '';
END $$;
