// backend/src/controllers/authorController.js
const pool = require('../config/database');

// Função existente para buscar todos os autores
const getAllAuthors = async (req, res) => {
    try {
        // --- CORREÇÃO: Usa 'id', 'nome' e 'foto_url' ---
        const result = await pool.query('SELECT id, nome, foto_url FROM autor ORDER BY nome');
        // Mapeia 'id' para 'author_id' para o frontend
        const authors = result.rows.map(author => ({
            author_id: author.id, // Mapeia id -> author_id
            name: author.nome,
            foto_url: author.foto_url
        }));
        res.json(authors);
    } catch (error) {
        console.error('Erro ao buscar todos os autores:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao buscar autores.' });
    }
};

// Função existente para criar autor
const createAuthor = async (req, res) => {
    // Pega os campos do corpo da requisição (frontend envia 'name', etc?)
    // Mantendo a busca por 'nome', inserindo nas colunas corretas
    const { name, biografia, data_nascimento, nacionalidade, foto_url } = req.body; // Adicionado foto_url
    const nomeAutor = name; // Renomeia para clareza ao usar na query

    if (!nomeAutor) {
        return res.status(400).json({ mensagem: 'O nome do autor é obrigatório.' });
    }
    try {
        // --- CORREÇÃO: Usa coluna 'nome' para checar, seleciona 'id' ---
        const existingAuthor = await pool.query(
            'SELECT id FROM autor WHERE nome ILIKE $1',
            [nomeAutor]
        );

        if (existingAuthor.rows.length > 0) {
            return res.status(409).json({ mensagem: 'Autor já cadastrado com este nome.' });
        }

        // --- CORREÇÃO: Insere nas colunas corretas ('nome', etc.), retorna 'id', 'nome' ---
        // Adiciona data_nascimento e foto_url se forem enviados
        const columns = ['nome', 'biografia', 'nacionalidade'];
        const values = [nomeAutor, biografia, nacionalidade];
        const placeholders = ['$1', '$2', '$3'];

        // Verifica se data_nascimento existe e é válida antes de adicionar
        if (data_nascimento && !isNaN(Date.parse(data_nascimento))) {
             columns.push('data_nascimento');
             values.push(data_nascimento);
             placeholders.push(`$${values.length}`); // Adiciona o próximo placeholder ($4)
        }

        // Adiciona foto_url se fornecida
        if (foto_url) {
             columns.push('foto_url');
             values.push(foto_url);
             placeholders.push(`$${values.length}`);
        }


        const insertSql = `INSERT INTO autor (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id, nome, biografia, nacionalidade, data_nascimento, foto_url`;

        console.log('Executando SQL (createAuthor - insert):', insertSql, values); // DEBUG

        const newAuthor = await pool.query(insertSql, values);

        // Mapeia 'id' para 'author_id' para o frontend
        const createdAuthor = {
            author_id: newAuthor.rows[0].id, // Mapeia id -> author_id
            name: newAuthor.rows[0].nome,
            biografia: newAuthor.rows[0].biografia,
            nacionalidade: newAuthor.rows[0].nacionalidade,
            data_nascimento: newAuthor.rows[0].data_nascimento,
            foto_url: newAuthor.rows[0].foto_url
        };
        res.status(201).json(createdAuthor);
    } catch (error) {
        console.error('Erro ao criar autor:', error);
         if (error.code === '42703') { // Coluna não existe
             res.status(500).json({ mensagem: `Erro interno: Coluna não encontrada na tabela 'autor'. Verifique se 'nome', 'biografia', 'data_nascimento', 'nacionalidade', 'foto_url' existem. Detalhe: ${error.message}` });
         } else {
             res.status(500).json({ mensagem: 'Erro interno do servidor ao criar autor.' });
         }
    }
};

// Função de busca (para autocompletar)
const searchAuthors = async (req, res) => {
    const { nome: searchTermQuery } = req.query;

    if (!searchTermQuery) {
        return res.json([]);
    }

    try {
        const searchTerm = `%${searchTermQuery}%`;
        // --- CORREÇÃO: Usa 'id', 'nome' e 'foto_url' ---
        const sql = 'SELECT id, nome, foto_url FROM autor WHERE nome ILIKE $1 ORDER BY nome LIMIT 10';
        console.log('Executando SQL (searchAuthors):', sql, [searchTerm]); // DEBUG
        const result = await pool.query(sql, [searchTerm]);

        // Mapeia 'id' para 'author_id' para o frontend
        const authors = result.rows.map(author => ({
            author_id: author.id, // Mapeia id -> author_id
            name: author.nome,
            foto_url: author.foto_url
        }));

        res.json(authors);
    } catch (error) {
        console.error('Erro ao buscar autores por nome:', error);
        if (error.code === '42P01') { // Tabela não encontrada
             res.status(500).json({ mensagem: `Erro interno: Tabela 'autor' não encontrada.` });
        } else if (error.code === '42703') { // Coluna não encontrada
             res.status(500).json({ mensagem: `Erro interno: Coluna 'nome' ou 'id' não encontrada na busca. Detalhe: ${error.message}` });
        } else {
             res.status(500).json({ mensagem: 'Erro interno do servidor ao buscar autores.' });
        }
    }
};


module.exports = {
    getAllAuthors,
    createAuthor,
    searchAuthors
};