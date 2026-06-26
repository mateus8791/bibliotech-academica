// Arquivo: backend/src/controllers/bookController.js (VERSÃO ATUALIZADA com Importação)

const pool = require('../config/database');
const { registrarAcao } = require('../services/auditoriaService'); // Serviço de auditoria já importado
const csvParser = require('csv-parser'); // <- Adicionar csv-parser
const { Readable } = require('stream');  // <- Adicionar Readable from stream

// --- Funções Auxiliares para Importação (findOrCreate) ---
// Adaptadas para usar o 'client' da transação e registrar auditoria se criar novo autor/categoria

async function findOrCreateAutor(client, nomeAutor, usuarioId) {
    let autorResult = await client.query('SELECT id FROM autor WHERE nome = $1', [nomeAutor]);
    if (autorResult.rows.length === 0) {
        const novoAutorResult = await client.query(
            'INSERT INTO autor (nome) VALUES ($1) RETURNING id',
            [nomeAutor]
        );
        const novoAutorId = novoAutorResult.rows[0].id;
        // Opcional: Registrar auditoria para criação de autor via importação
        // await registrarAcao(usuarioId, 'CADASTRO_AUTOR_IMPORT', `Autor '${nomeAutor}' criado via importação CSV.`);
        return novoAutorId;
    }
    return autorResult.rows[0].id;
}

async function findOrCreateCategoria(client, nomeCategoria, usuarioId) {
    let categoriaResult = await client.query('SELECT id FROM categoria WHERE nome = $1', [nomeCategoria]);
    if (categoriaResult.rows.length === 0) {
        const novaCategoriaResult = await client.query(
            'INSERT INTO categoria (nome) VALUES ($1) RETURNING id',
            [nomeCategoria]
        );
        const novaCategoriaId = novaCategoriaResult.rows[0].id;
        // Opcional: Registrar auditoria para criação de categoria via importação
        // await registrarAcao(usuarioId, 'CADASTRO_CATEGORIA_IMPORT', `Categoria '${nomeCategoria}' criada via importação CSV.`);
        return novaCategoriaId;
    }
    return categoriaResult.rows[0].id;
}


// --- 1. LISTAR TODOS OS LIVROS (com lógica de busca e paginação) ---
const getAllBooks = async (req, res) => {
  const { search, categoria, autor, limit, page, orderBy } = req.query;

  console.log('📥 Backend recebeu - page:', page, 'limit:', limit, 'search:', search, 'categoria:', categoria, 'autor:', autor, 'orderBy:', orderBy);

  try {
    let queryParams = [];
    let whereConditions = [];
    let paramIndex = 1;

    // Filtro por termo de busca
    if (search) {
      whereConditions.push(`(l.titulo ILIKE $${paramIndex} OR a.nome ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por categoria
    if (categoria) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM livro_categoria lc
        WHERE lc.livro_id = l.id AND lc.categoria_id = $${paramIndex}
      )`);
      queryParams.push(categoria);
      paramIndex++;
    }

    // Filtro por autor (aceita nome do autor)
    if (autor) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM livro_autor la
        JOIN autor a ON la.autor_id = a.id
        WHERE la.livro_id = l.id AND a.nome ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${autor}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Se page não for fornecido e limit for fornecido, retorna array simples (compatibilidade com carrossel)
    const usePagination = page !== undefined;

    console.log(`🔀 Decisão de paginação - usePagination: ${usePagination}, !usePagination && limit: ${!usePagination && limit}`);

    if (!usePagination && limit) {
      // Modo simples: retorna apenas um array com limit
      const itemsLimit = parseInt(limit);
      const orderClause = orderBy === 'emprestimos'
        ? 'l.num_emprestimos DESC NULLS LAST, l.titulo ASC'
        : 'l.data_cadastro DESC, l.titulo ASC';
      const query = `
        SELECT
          l.id,
          l.titulo,
          l.isbn,
          l.ano_publicacao,
          l.capa_url,
          l.quantidade_disponivel,
          l.num_emprestimos,
          l.preco,
          l.preco_promocional,
          l.promocao_ativa,
          l.sinopse,
          l.num_paginas,
          TO_CHAR(l.data_cadastro, 'DD/MM/YYYY') AS data_cadastro,
          (SELECT ROUND(AVG(av.nota)::numeric, 1) FROM avaliacoes av WHERE av.livro_id = l.id) AS nota_media,
          (SELECT COUNT(*) FROM avaliacoes av WHERE av.livro_id = l.id) AS total_avaliacoes,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object('id', a.id, 'nome', a.nome, 'foto_url', a.foto_url)
            ) FILTER (WHERE a.id IS NOT NULL),
            '[]'
          ) AS autores,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object('id', c.id, 'nome', c.nome)
            ) FILTER (WHERE c.id IS NOT NULL),
            '[]'
          ) AS categorias
        FROM
          livro l
        LEFT JOIN
          livro_autor la ON l.id = la.livro_id
        LEFT JOIN
          autor a ON la.autor_id = a.id
        LEFT JOIN
          livro_categoria lc ON l.id = lc.livro_id
        LEFT JOIN
          categoria c ON lc.categoria_id = c.id
        ${whereClause}
        GROUP BY
          l.id
        ORDER BY
          ${orderClause}
        LIMIT $${paramIndex};
      `;

      queryParams.push(itemsLimit);
      const { rows } = await pool.query(query, queryParams);
      return res.status(200).json(rows);
    }

    // Modo paginado
    const itemsPerPage = limit ? parseInt(limit) : 20;
    const currentPage = parseInt(page) || 1;
    const offset = (currentPage - 1) * itemsPerPage;

    console.log(`📊 Paginação calculada - currentPage: ${currentPage}, itemsPerPage: ${itemsPerPage}, offset: ${offset}`);

    // Query para contar total de livros (para paginação)
    const countQuery = `
      SELECT COUNT(DISTINCT l.id) as total
      FROM livro l
      LEFT JOIN livro_autor la ON l.id = la.livro_id
      LEFT JOIN autor a ON la.autor_id = a.id
      LEFT JOIN livro_categoria lc ON l.id = lc.livro_id
      LEFT JOIN categoria c ON lc.categoria_id = c.id
      ${whereClause};
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Query completa com todos os campos necessários
    const query = `
      SELECT
        l.id,
        l.titulo,
        l.isbn,
        l.ano_publicacao,
        l.capa_url,
        l.quantidade_disponivel,
        l.preco,
        l.preco_promocional,
        l.promocao_ativa,
        l.sinopse,
        l.num_paginas,
        TO_CHAR(l.data_cadastro, 'DD/MM/YYYY') AS data_cadastro,
        (SELECT ROUND(AVG(av.nota)::numeric, 1) FROM avaliacoes av WHERE av.livro_id = l.id) AS nota_media,
        (SELECT COUNT(*) FROM avaliacoes av WHERE av.livro_id = l.id) AS total_avaliacoes,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', a.id, 'nome', a.nome, 'foto_url', a.foto_url)
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS autores,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', c.id, 'nome', c.nome)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS categorias
      FROM
        livro l
      LEFT JOIN
        livro_autor la ON l.id = la.livro_id
      LEFT JOIN
        autor a ON la.autor_id = a.id
      LEFT JOIN
        livro_categoria lc ON l.id = lc.livro_id
      LEFT JOIN
        categoria c ON lc.categoria_id = c.id
      ${whereClause}
      GROUP BY
        l.id
      ORDER BY
        l.data_cadastro DESC, l.titulo ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    queryParams.push(itemsPerPage, offset);
    const { rows } = await pool.query(query, queryParams);

    // Retorna dados paginados com metadados
    res.status(200).json({
      data: rows,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      }
    });
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

// --- FUNÇÕES ADICIONAIS QUE ESTAVAM FALTANDO NO SEU CÓDIGO MAS TINHAM ROTAS ---
// (Implementações básicas, ajuste conforme necessidade)

const getAvailableBooks = async (req, res) => {
    try {
        const query = `
            SELECT
                l.id, l.titulo, l.isbn, l.ano_publicacao, l.capa_url, l.quantidade_disponivel,
                TO_CHAR(l.data_cadastro, 'DD/MM/YYYY') AS data_cadastro,
                (SELECT STRING_AGG(a.nome, ', ') FROM autor a JOIN livro_autor la ON a.id = la.autor_id WHERE la.livro_id = l.id) AS autores_nomes,
                (SELECT STRING_AGG(c.nome, ', ') FROM categoria c JOIN livro_categoria lc ON c.id = lc.categoria_id WHERE lc.livro_id = l.id) AS categorias_nomes
            FROM livro l
            WHERE l.quantidade_disponivel > 0
            GROUP BY l.id
            ORDER BY l.titulo ASC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao buscar livros disponíveis:", error);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
};

const getBooksByCategory = async (req, res) => {
    const { categoriaId } = req.params;
    try {
        const query = `
            SELECT
                l.id, l.titulo, l.isbn, l.ano_publicacao, l.capa_url, l.quantidade_disponivel,
                TO_CHAR(l.data_cadastro, 'DD/MM/YYYY') AS data_cadastro,
                (SELECT STRING_AGG(a.nome, ', ') FROM autor a JOIN livro_autor la ON a.id = la.autor_id WHERE la.livro_id = l.id) AS autores_nomes,
                (SELECT STRING_AGG(c.nome, ', ') FROM categoria c JOIN livro_categoria lc ON c.id = lc.categoria_id WHERE lc.livro_id = l.id) AS categorias_nomes
            FROM livro l
            JOIN livro_categoria lc ON l.id = lc.livro_id
            WHERE lc.categoria_id = $1
            GROUP BY l.id
            ORDER BY l.titulo ASC;
        `;
        const { rows } = await pool.query(query, [categoriaId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao buscar livros por categoria:", error);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
};

const getBooksByAuthor = async (req, res) => {
    const { autorId } = req.params;
    try {
        const query = `
            SELECT
                l.id, l.titulo, l.isbn, l.ano_publicacao, l.capa_url, l.quantidade_disponivel,
                TO_CHAR(l.data_cadastro, 'DD/MM/YYYY') AS data_cadastro,
                (SELECT STRING_AGG(a.nome, ', ') FROM autor a JOIN livro_autor la ON a.id = la.autor_id WHERE la.livro_id = l.id) AS autores_nomes,
                (SELECT STRING_AGG(c.nome, ', ') FROM categoria c JOIN livro_categoria lc ON c.id = lc.categoria_id WHERE lc.livro_id = l.id) AS categorias_nomes
            FROM livro l
            JOIN livro_autor la ON l.id = la.livro_id
            WHERE la.autor_id = $1
            GROUP BY l.id
            ORDER BY l.titulo ASC;
        `;
        const { rows } = await pool.query(query, [autorId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao buscar livros por autor:", error);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
};

// --- BUSCAR LIVROS MAIS RECENTES (para landing page) ---
const getNewBooks = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    try {
        const query = `
            SELECT
                l.id, l.titulo, l.isbn, l.ano_publicacao, l.capa_url, l.quantidade_disponivel,
                l.preco, l.preco_promocional, l.promocao_ativa, l.sinopse,
                TO_CHAR(l.data_cadastro, 'DD/MM/YYYY') AS data_cadastro,
                (SELECT json_agg(json_build_object('id', a.id, 'nome', a.nome)) FROM autor a JOIN livro_autor la ON a.id = la.autor_id WHERE la.livro_id = l.id) AS autores,
                (SELECT json_agg(json_build_object('id', c.id, 'nome', c.nome)) FROM categoria c JOIN livro_categoria lc ON c.id = lc.categoria_id WHERE lc.livro_id = l.id) AS categorias
            FROM livro l
            WHERE l.quantidade_disponivel > 0
            ORDER BY l.data_cadastro DESC
            LIMIT $1;
        `;
        const { rows } = await pool.query(query, [limit]);
        // Garantir que autores/categorias sejam arrays
        const livrosFormatados = rows.map(livro => ({
            ...livro,
            autores: livro.autores || [],
            categorias: livro.categorias || []
        }));
        res.status(200).json(livrosFormatados);
    } catch (error) {
        console.error("Erro ao buscar livros novos:", error);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
};

// --- BUSCAR LIVROS EM PROMOÇÃO (ofertas do dia) ---
const getPromotionalBooks = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    try {
        const query = `
            SELECT
                l.id, l.titulo, l.isbn, l.ano_publicacao, l.capa_url, l.quantidade_disponivel,
                l.preco, l.preco_promocional, l.promocao_ativa, l.sinopse,
                TO_CHAR(l.data_cadastro, 'DD/MM/YYYY') AS data_cadastro,
                (SELECT json_agg(json_build_object('id', a.id, 'nome', a.nome)) FROM autor a JOIN livro_autor la ON a.id = la.autor_id WHERE la.livro_id = l.id) AS autores,
                (SELECT json_agg(json_build_object('id', c.id, 'nome', c.nome)) FROM categoria c JOIN livro_categoria lc ON c.id = lc.categoria_id WHERE lc.livro_id = l.id) AS categorias
            FROM livro l
            WHERE l.promocao_ativa = true AND l.quantidade_disponivel > 0
            ORDER BY
                CASE
                    WHEN l.preco_promocional IS NOT NULL AND l.preco > 0
                    THEN ((l.preco - l.preco_promocional) / l.preco) * 100
                    ELSE 0
                END DESC,
                l.data_cadastro DESC
            LIMIT $1;
        `;
        const { rows } = await pool.query(query, [limit]);
        // Garantir que autores/categorias sejam arrays e calcular desconto
        const livrosFormatados = rows.map(livro => ({
            ...livro,
            autores: livro.autores || [],
            categorias: livro.categorias || [],
            desconto_percentual: livro.preco_promocional && livro.preco > 0
                ? Math.round(((livro.preco - livro.preco_promocional) / livro.preco) * 100)
                : 0
        }));
        res.status(200).json(livrosFormatados);
    } catch (error) {
        console.error("Erro ao buscar livros em promoção:", error);
        res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
};


// --- 2. CRIAR UM NOVO LIVRO (com registro de auditoria) ---
const createBook = async (req, res) => {
  const { titulo, isbn, ano_publicacao, num_paginas, sinopse, capa_url, autores_ids = [], categorias_ids = [], quantidade_disponivel } = req.body; // Mudança para receber IDs

  // Validação básica - Ajuste conforme necessário
  if (!titulo || !autores_ids || autores_ids.length === 0 || !categorias_ids || categorias_ids.length === 0) {
    return res.status(400).json({ mensagem: 'Título, pelo menos um autor e uma categoria são obrigatórios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Inserir o livro
    const livroResult = await client.query(
      'INSERT INTO livro (titulo, isbn, ano_publicacao, num_paginas, sinopse, capa_url, quantidade_disponivel) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [titulo, isbn, ano_publicacao || null, num_paginas || null, sinopse, capa_url, quantidade_disponivel || 0]
    );
    const novoLivroId = livroResult.rows[0].id;

    // Associar autores (garanta que os IDs existem ou trate o erro)
    for (const autorId of autores_ids) {
        // Validação opcional: Verificar se autorId existe na tabela autor
      await client.query('INSERT INTO livro_autor (livro_id, autor_id) VALUES ($1, $2)', [novoLivroId, autorId]);
    }

    // Associar categorias (garanta que os IDs existem ou trate o erro)
    for (const categoriaId of categorias_ids) {
        // Validação opcional: Verificar se categoriaId existe na tabela categoria
      await client.query('INSERT INTO livro_categoria (livro_id, categoria_id) VALUES ($1, $2)', [novoLivroId, categoriaId]);
    }

    await client.query('COMMIT');

    // REGISTRA A AÇÃO NA AUDITORIA
    await registrarAcao(req.usuario.id, 'CADASTRO_LIVRO', `Cadastrou o livro '${titulo}' (ID: ${novoLivroId})`);

    res.status(201).json({ mensagem: 'Livro cadastrado com sucesso!', livroId: novoLivroId });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cadastrar livro:', error);
     // Verifica erro de chave estrangeira (ex: ID de autor/categoria inválido)
     if (error.code === '23503') { // Código de erro do PostgreSQL para foreign key violation
         return res.status(400).json({ mensagem: 'Erro ao cadastrar livro: ID de autor ou categoria inválido.' });
     }
    res.status(500).json({ mensagem: 'Erro interno do servidor ao cadastrar livro.' });
  } finally {
    client.release();
  }
};


// --- 3. BUSCAR UM LIVRO POR ID (com a query corrigida) ---
const getBookById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT
        l.*,
        (SELECT json_agg(json_build_object('id', a.id, 'nome', a.nome)) FROM autor a JOIN livro_autor la ON a.id = la.autor_id WHERE la.livro_id = l.id) as autores,
        (SELECT json_agg(json_build_object('id', c.id, 'nome', c.nome)) FROM categoria c JOIN livro_categoria lc ON c.id = lc.categoria_id WHERE lc.livro_id = l.id) as categorias
      FROM livro l
      WHERE l.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ mensagem: 'Livro não encontrado.' });
    }
    // Ajuste para garantir que autores/categorias sejam arrays vazios se não houver associações
    const livro = rows[0];
    livro.autores = livro.autores || [];
    livro.categorias = livro.categorias || [];

    res.status(200).json(livro);
  } catch (error) {
    console.error('Erro ao buscar livro por ID:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};


// --- 4. ATUALIZAR UM LIVRO (com registro de auditoria) ---
const updateBook = async (req, res) => {
  const { id } = req.params;
  const { titulo, isbn, ano_publicacao, num_paginas, sinopse, capa_url, quantidade_disponivel, autores_ids = [], categorias_ids = [] } = req.body;

  if (!titulo || !autores_ids || autores_ids.length === 0 || !categorias_ids || categorias_ids.length === 0) {
    return res.status(400).json({ mensagem: 'Título, pelo menos um autor e uma categoria são obrigatórios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar se o livro existe antes de atualizar
    const checkBook = await client.query('SELECT titulo, quantidade_disponivel FROM livro WHERE id = $1', [id]);
    if (checkBook.rowCount === 0) {
         await client.query('ROLLBACK'); // Não precisa fazer commit/rollback se não encontrou
         client.release();
         return res.status(404).json({ mensagem: 'Livro não encontrado para atualização.' });
    }
    const tituloOriginal = checkBook.rows[0].titulo;
    const qtdExistente = checkBook.rows[0].quantidade_disponivel;
    const novaQtd = quantidade_disponivel !== undefined ? quantidade_disponivel : qtdExistente;

    await client.query(
      `UPDATE livro SET titulo = $1, isbn = $2, ano_publicacao = $3, num_paginas = $4, sinopse = $5, capa_url = $6, quantidade_disponivel = $7 WHERE id = $8`,
      [titulo, isbn, ano_publicacao || null, num_paginas || null, sinopse, capa_url, novaQtd, id]
    );

    // Atualizar associações de autores
    await client.query('DELETE FROM livro_autor WHERE livro_id = $1', [id]);
    for (const autor_id of autores_ids) {
        // Validação opcional: Verificar se autor_id existe
      await client.query('INSERT INTO livro_autor (livro_id, autor_id) VALUES ($1, $2)', [id, autor_id]);
    }

    // Atualizar associações de categorias
    await client.query('DELETE FROM livro_categoria WHERE livro_id = $1', [id]);
    for (const categoria_id of categorias_ids) {
        // Validação opcional: Verificar se categoria_id existe
      await client.query('INSERT INTO livro_categoria (livro_id, categoria_id) VALUES ($1, $2)', [id, categoria_id]);
    }

    await client.query('COMMIT');

    // REGISTRA A AÇÃO NA AUDITORIA
    // Compara se o título mudou para log mais informativo
    const logMessage = titulo !== tituloOriginal
      ? `Atualizou o livro ID ${id} (título de '${tituloOriginal}' para '${titulo}')`
      : `Atualizou o livro '${titulo}' (ID: ${id})`;
    await registrarAcao(req.usuario.id, 'UPDATE_LIVRO', logMessage);

    res.status(200).json({ mensagem: 'Livro atualizado com sucesso!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar livro:', error);
    // Verifica erro de chave estrangeira
     if (error.code === '23503') {
         return res.status(400).json({ mensagem: 'Erro ao atualizar livro: ID de autor ou categoria inválido.' });
     }
    res.status(500).json({ mensagem: 'Erro interno do servidor ao atualizar livro.' });
  } finally {
    client.release();
  }
};


// --- 5. APAGAR UM LIVRO (com registro de auditoria) ---
const deleteBook = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect(); // Usar transação para garantir consistência
    try {
        await client.query('BEGIN');

        // Pega o título do livro ANTES de deletar para usar no log
        const bookResult = await client.query('SELECT titulo FROM livro WHERE id = $1', [id]);
        if (bookResult.rowCount === 0) {
             await client.query('ROLLBACK');
             client.release();
             return res.status(404).json({ mensagem: 'Livro não encontrado para exclusão.' });
        }
        const nomeLivroDeletado = bookResult.rows[0].titulo;

        // Deleta associações primeiro (chave estrangeira)
        await client.query('DELETE FROM livro_autor WHERE livro_id = $1', [id]);
        await client.query('DELETE FROM livro_categoria WHERE livro_id = $1', [id]);
        // Adicione DELETEs para outras tabelas relacionadas se houver (ex: emprestimo, reserva)
        // CUIDADO: Verifique as regras de negócio antes de deletar empréstimos/reservas associadas

        // Deleta o livro
        const deleteOp = await client.query('DELETE FROM livro WHERE id = $1', [id]);

        await client.query('COMMIT');

        // REGISTRA A AÇÃO NA AUDITORIA
        await registrarAcao(req.usuario.id, 'DELETE_LIVRO', `Deletou o livro '${nomeLivroDeletado}' (ID: ${id})`);

        res.status(200).json({ mensagem: 'Livro apagado com sucesso.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao apagar livro:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao apagar livro.' });
    } finally {
        client.release();
    }
};

// --- 6. IMPORTAR LIVROS VIA CSV ---
const importarLivrosCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo CSV enviado.' });
    }
    if (!req.usuario || !req.usuario.id) {
         // Importante ter o ID do usuário para auditoria e funções auxiliares
         return res.status(401).json({ message: 'Usuário não autenticado corretamente.' });
    }

    const usuarioId = req.usuario.id;
    const results = [];
    const errors = [];
    let processedCount = 0;
    let successCount = 0;

    // Cria um stream legível a partir do buffer do arquivo
    const stream = Readable.from(req.file.buffer.toString('utf-8'));

    stream
        .pipe(csvParser({
            mapHeaders: ({ header }) => header.trim().toLowerCase(), // Normaliza cabeçalhos
            mapValues: ({ value }) => value.trim()
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            if (results.length === 0) {
                return res.status(400).json({ message: 'Arquivo CSV vazio ou em formato inválido.' });
            }

            // Validar cabeçalhos esperados (ajuste conforme seu modelo CSV)
            const expectedHeaders = ['titulo', 'isbn', 'ano_publicacao', 'num_paginas', 'sinopse', 'quantidade_disponivel', 'capa_url', 'autores', 'categorias'];
            const actualHeaders = Object.keys(results[0]);
            const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));

            if (missingHeaders.length > 0) {
                 return res.status(400).json({ message: `Cabeçalhos faltando no CSV: ${missingHeaders.join(', ')}` });
            }

            for (const row of results) {
                processedCount++;
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');

                    // 1. Inserir o livro
                    const bookResult = await client.query(
                        `INSERT INTO livro (titulo, isbn, ano_publicacao, num_paginas, sinopse, quantidade_disponivel, capa_url, data_cadastro)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
                        [
                            row.titulo, row.isbn || null, // Permite ISBN nulo se não fornecido
                            parseInt(row.ano_publicacao) || null,
                            parseInt(row.num_paginas) || null, row.sinopse || null,
                            parseInt(row.quantidade_disponivel) || 0, row.capa_url || null
                        ]
                    );
                    const bookId = bookResult.rows[0].id;
                    let autoresCriados = [];
                    let categoriasCriadas = [];


                    // 2. Processar Autores (separados por vírgula no CSV)
                    if (row.autores) {
                        const nomesAutores = row.autores.split(',').map(nome => nome.trim()).filter(nome => nome);
                        if (nomesAutores.length === 0 && row.autores.trim()) { // Se havia algo mas virou vazio após trim/split
                            throw new Error('Formato inválido na coluna "autores". Use nomes separados por vírgula.');
                        }
                        for (const nomeAutor of nomesAutores) {
                            const autorId = await findOrCreateAutor(client, nomeAutor, usuarioId);
                            // Associar livro ao autor
                            await client.query(
                                'INSERT INTO livro_autor (livro_id, autor_id) VALUES ($1, $2)',
                                [bookId, autorId]
                            );
                            autoresCriados.push(nomeAutor); // Para log de auditoria
                        }
                    } else {
                        // Considerar se autores são obrigatórios ou não
                         throw new Error('Coluna "autores" não pode estar vazia.');
                    }


                    // 3. Processar Categorias (separadas por vírgula no CSV)
                    if (row.categorias) {
                        const nomesCategorias = row.categorias.split(',').map(nome => nome.trim()).filter(nome => nome);
                         if (nomesCategorias.length === 0 && row.categorias.trim()) {
                            throw new Error('Formato inválido na coluna "categorias". Use nomes separados por vírgula.');
                        }
                        for (const nomeCategoria of nomesCategorias) {
                            const categoriaId = await findOrCreateCategoria(client, nomeCategoria, usuarioId);
                            // Associar livro à categoria
                            await client.query(
                                'INSERT INTO livro_categoria (livro_id, categoria_id) VALUES ($1, $2)',
                                [bookId, categoriaId]
                            );
                             categoriasCriadas.push(nomeCategoria); // Para log de auditoria
                        }
                    } else {
                         // Considerar se categorias são obrigatórias
                         throw new Error('Coluna "categorias" não pode estar vazia.');
                    }

                    await client.query('COMMIT');
                    successCount++;

                     // REGISTRA A AÇÃO NA AUDITORIA para cada livro importado
                    await registrarAcao(usuarioId, 'CADASTRO_LIVRO_CSV', `Importou livro '${row.titulo}' (ID: ${bookId}) via CSV. Autores: ${autoresCriados.join(', ')}. Categorias: ${categoriasCriadas.join(', ')}.`);


                } catch (error) {
                    await client.query('ROLLBACK');
                    console.error(`Erro ao processar linha ${processedCount}: ${row.titulo || 'sem título'}`, error);
                    errors.push(`Linha ${processedCount} (Título: ${row.titulo || 'N/A'}): ${error.message}`);
                     // REGISTRA ERRO NA AUDITORIA
                     // await registrarAcao(usuarioId, 'ERRO_IMPORT_CSV', `Falha ao importar linha ${processedCount} (Título: ${row.titulo || 'N/A'}). Erro: ${error.message}`);
                } finally {
                    client.release();
                }
            }

            // Registro de auditoria final (opcional)
            await registrarAcao(usuarioId, 'FIM_IMPORT_CSV', `Tentativa de importação de ${processedCount} livros via CSV concluída. ${successCount} sucesso(s), ${errors.length} erro(s).`);

            res.status(200).json({
                message: `Importação concluída. ${successCount} de ${processedCount} livros importados com sucesso.`,
                errors: errors // Envia a lista de erros para o frontend
            });
        })
        .on('error', (error) => {
            console.error('Erro ao parsear CSV:', error);
            // Registrar erro de parse na auditoria
             registrarAcao(usuarioId, 'ERRO_PARSE_CSV', `Falha ao parsear arquivo CSV. Erro: ${error.message}`).catch(console.error);
            res.status(500).json({ message: 'Erro ao processar o arquivo CSV.', error: error.message });
        });
};


// Exporta todas as funções, incluindo a nova
module.exports = {
  getAllBooks,
  createBook,
  getBookById,
  updateBook,
  deleteBook,
  getAvailableBooks,   // Adicionada
  getBooksByCategory,  // Adicionada
  getBooksByAuthor,    // Adicionada
  importarLivrosCSV,   // <- Adicionada a nova função
  getNewBooks,         // <- Livros novos para landing
  getPromotionalBooks  // <- Ofertas do dia para landing
};