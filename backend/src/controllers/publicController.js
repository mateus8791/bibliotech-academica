// backend/src/controllers/publicController.js
// Controller para endpoints públicos (sem autenticação)

const pool = require('../config/database');

// Buscar livro completo por ID (com dados do autor incluindo foto)
const getPublicBookById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT
        l.id,
        l.titulo,
        l.isbn,
        l.ano_publicacao,
        l.num_paginas,
        l.sinopse,
        l.capa_url,
        l.quantidade_disponivel,
        l.preco,
        l.preco_promocional,
        l.promocao_ativa,
        TO_CHAR(l.data_cadastro, 'DD/MM/YYYY') AS data_cadastro,
        (
          SELECT json_agg(
            json_build_object(
              'id', a.id,
              'nome', a.nome,
              'biografia', a.biografia,
              'data_nascimento', a.data_nascimento,
              'nacionalidade', a.nacionalidade,
              'foto_url', a.foto_url
            )
          )
          FROM autor a
          JOIN livro_autor la ON a.id = la.autor_id
          WHERE la.livro_id = l.id
        ) AS autores,
        (
          SELECT json_agg(
            json_build_object('id', c.id, 'nome', c.nome, 'descricao', c.descricao)
          )
          FROM categoria c
          JOIN livro_categoria lc ON c.id = lc.categoria_id
          WHERE lc.livro_id = l.id
        ) AS categorias
      FROM livro l
      WHERE l.id = $1;
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensagem: 'Livro não encontrado.' });
    }

    const livro = rows[0];
    // Garantir que autores/categorias sejam arrays
    livro.autores = livro.autores || [];
    livro.categorias = livro.categorias || [];

    res.status(200).json(livro);
  } catch (error) {
    console.error('Erro ao buscar livro público por ID:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

// Buscar livros relacionados (mesma categoria)
const getRelatedBooks = async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 6;

  try {
    const query = `
      SELECT DISTINCT
        l.id,
        l.titulo,
        l.capa_url,
        l.preco,
        l.preco_promocional,
        l.promocao_ativa,
        l.quantidade_disponivel,
        (
          SELECT json_agg(json_build_object('id', a.id, 'nome', a.nome))
          FROM autor a
          JOIN livro_autor la ON a.id = la.autor_id
          WHERE la.livro_id = l.id
        ) AS autores,
        (
          SELECT json_agg(json_build_object('id', c.id, 'nome', c.nome))
          FROM categoria c
          JOIN livro_categoria lc ON c.id = lc.categoria_id
          WHERE lc.livro_id = l.id
        ) AS categorias
      FROM livro l
      JOIN livro_categoria lc ON l.id = lc.livro_id
      WHERE lc.categoria_id IN (
        SELECT categoria_id
        FROM livro_categoria
        WHERE livro_id = $1
      )
      AND l.id != $1
      AND l.quantidade_disponivel > 0
      ORDER BY l.data_cadastro DESC
      LIMIT $2;
    `;

    const { rows } = await pool.query(query, [id, limit]);

    const livrosFormatados = rows.map(livro => ({
      ...livro,
      autores: livro.autores || [],
      categorias: livro.categorias || []
    }));

    res.status(200).json(livrosFormatados);
  } catch (error) {
    console.error('Erro ao buscar livros relacionados:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

// Buscar todos os autores com fotos
const getAllAuthorsPublic = async (req, res) => {
  try {
    const query = `
      SELECT
        a.id,
        a.nome,
        a.foto_url,
        a.nacionalidade,
        COUNT(la.livro_id) as total_livros
      FROM autor a
      LEFT JOIN livro_autor la ON a.id = la.autor_id
      GROUP BY a.id, a.nome, a.foto_url, a.nacionalidade
      HAVING COUNT(la.livro_id) > 0
      ORDER BY a.nome ASC;
    `;

    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar autores públicos:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

// Buscar todas as categorias
const getAllCategoriesPublic = async (req, res) => {
  try {
    const query = `
      SELECT
        c.id,
        c.nome,
        c.descricao,
        COUNT(lc.livro_id) as total_livros
      FROM categoria c
      LEFT JOIN livro_categoria lc ON c.id = lc.categoria_id
      GROUP BY c.id, c.nome, c.descricao
      HAVING COUNT(lc.livro_id) > 0
      ORDER BY c.nome ASC;
    `;

    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar categorias públicas:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

// Buscar livros com filtros
const getFilteredBooks = async (req, res) => {
  const { categoria, autor, search, limit, page } = req.query;

  console.log(`📥 PUBLIC getFilteredBooks - page: ${page}, limit: ${limit}, search: ${search}, categoria: ${categoria}, autor: ${autor}`);

  try {
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    // Filtro por categoria
    if (categoria) {
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM livro_categoria lc
          WHERE lc.livro_id = l.id AND lc.categoria_id = $${paramCounter}
        )
      `);
      queryParams.push(categoria);
      paramCounter++;
    }

    // Filtro por autor (aceita nome do autor)
    if (autor) {
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM livro_autor la
          JOIN autor a ON la.autor_id = a.id
          WHERE la.livro_id = l.id AND a.nome ILIKE $${paramCounter}
        )
      `);
      queryParams.push(`%${autor}%`);
      paramCounter++;
    }

    // Filtro por busca
    if (search) {
      whereConditions.push(`(l.titulo ILIKE $${paramCounter} OR l.sinopse ILIKE $${paramCounter})`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Configurar paginação
    const itemsPerPage = limit ? parseInt(limit) : 20;
    const currentPage = parseInt(page) || 1;
    const offset = (currentPage - 1) * itemsPerPage;

    console.log(`📊 PUBLIC Paginação - currentPage: ${currentPage}, itemsPerPage: ${itemsPerPage}, offset: ${offset}`);

    // Count query para obter total de itens
    const countQuery = `
      SELECT COUNT(*) as total
      FROM livro l
      ${whereClause};
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

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
        (
          SELECT json_agg(json_build_object('id', a.id, 'nome', a.nome, 'foto_url', a.foto_url))
          FROM autor a
          JOIN livro_autor la ON a.id = la.autor_id
          WHERE la.livro_id = l.id
        ) AS autores,
        (
          SELECT json_agg(json_build_object('id', c.id, 'nome', c.nome))
          FROM categoria c
          JOIN livro_categoria lc ON c.id = lc.categoria_id
          WHERE lc.livro_id = l.id
        ) AS categorias
      FROM livro l
      ${whereClause}
      ORDER BY l.data_cadastro DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1};
    `;

    queryParams.push(itemsPerPage, offset);

    const { rows } = await pool.query(query, queryParams);

    const livrosFormatados = rows.map(livro => ({
      ...livro,
      autores: livro.autores || [],
      categorias: livro.categorias || []
    }));

    // Retornar com estrutura de paginação
    res.status(200).json({
      data: livrosFormatados,
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
    console.error('Erro ao buscar livros filtrados:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};

module.exports = {
  getPublicBookById,
  getRelatedBooks,
  getAllAuthorsPublic,
  getAllCategoriesPublic,
  getFilteredBooks
};
