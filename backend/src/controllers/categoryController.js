// backend/src/controllers/categoryController.js
const pool = require('../config/database');

const getAllCategories = async (req, res) => {
    // --- CORREÇÃO: Seleciona 'descricao' ---
    const sql = 'SELECT id, nome, descricao FROM categoria ORDER BY nome';
    console.log('Executando SQL (getAllCategories):', sql);
    try {
        const result = await pool.query(sql);
        // Mapear incluindo a descrição
        const categories = result.rows.map(cat => ({
            category_id: cat.id,
            name: cat.nome,
            descricao: cat.descricao // Inclui descrição
        }));
        res.json(categories);
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao buscar categorias.' });
    }
};

const createCategory = async (req, res) => {
    // Agora espera 'name' e 'descricao' do frontend
    const { name, descricao } = req.body;
    if (!name) {
        return res.status(400).json({ mensagem: 'O nome da categoria é obrigatório.' });
    }
    try {
        const checkSql = 'SELECT id FROM categoria WHERE nome ILIKE $1';
        console.log('Executando SQL (createCategory - check):', checkSql, [name]);
        const existingCategory = await pool.query(checkSql, [name]);

        if (existingCategory.rows.length > 0) {
            return res.status(409).json({ mensagem: 'Categoria já existe.' });
        }

        // --- CORREÇÃO: Insere 'nome' e 'descricao', retorna 'id', 'nome', 'descricao' ---
        const insertSql = 'INSERT INTO categoria (nome, descricao) VALUES ($1, $2) RETURNING id, nome, descricao';
        console.log('Executando SQL (createCategory - insert):', insertSql, [name, descricao]);
        const newCategory = await pool.query(insertSql, [name, descricao]);

         // Mapear incluindo a descrição
        const createdCategory = {
            category_id: newCategory.rows[0].id,
            name: newCategory.rows[0].nome,
            descricao: newCategory.rows[0].descricao // Inclui descrição
        };
        res.status(201).json(createdCategory);
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ mensagem: 'Erro interno do servidor ao criar categoria.' });
    }
};

const searchCategories = async (req, res) => {
    const { nome: searchTermQuery } = req.query;

    if (!searchTermQuery) {
        return res.json([]);
    }

    try {
        const searchTerm = `%${searchTermQuery}%`;
        // --- CORREÇÃO: Seleciona 'descricao' ---
        const sql = 'SELECT id, nome, descricao FROM categoria WHERE nome ILIKE $1 ORDER BY nome LIMIT 10';
        console.log('Executando SQL (searchCategories):', sql, [searchTerm]);
        const result = await pool.query(sql, [searchTerm]);

        // Mapear incluindo a descrição
        const categories = result.rows.map(cat => ({
            category_id: cat.id,
            name: cat.nome,
            descricao: cat.descricao // Inclui descrição
        }));

        res.json(categories);
    } catch (error) {
        console.error('Erro ao buscar categorias por nome:', error);
        if (error.code === '42P01') {
             res.status(500).json({ mensagem: `Erro interno: Tabela 'categoria' não encontrada.` });
        } else if (error.code === '42703') {
             res.status(500).json({ mensagem: `Erro interno: Coluna 'nome', 'id' ou 'descricao' não encontrada. Detalhe: ${error.message}` });
        } else {
             res.status(500).json({ mensagem: 'Erro interno do servidor ao buscar categorias.' });
        }
    }
};

module.exports = {
    getAllCategories,
    createCategory,
    searchCategories
};