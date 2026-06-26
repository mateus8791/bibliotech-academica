// Arquivo: backend/src/controllers/integrationController.js

const pool = require('../config/database');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations
// Lista todas as integrações cadastradas
// ─────────────────────────────────────────────────────────────────────────────
const listarIntegracoes = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM integrations ORDER BY provider');
    
    const defaultIntegrations = [
      { provider: 'openai', model: 'gpt-4o-mini', enabled: false, api_key_encrypted: '' },
      { provider: 'gemini', model: 'gemini-1.5-flash', enabled: false, api_key_encrypted: '' },
      { provider: 'claude', model: 'claude-3-haiku', enabled: false, api_key_encrypted: '' },
      { provider: 'google_books', model: '', enabled: false, api_key_encrypted: '' },
      { provider: 'sendgrid', model: '', enabled: false, api_key_encrypted: '' },
      { provider: 'google_analytics', model: '', enabled: false, api_key_encrypted: '' }
    ];

    const existingProviders = rows.map(r => r.provider);
    const missingIntegrations = defaultIntegrations.filter(def => !existingProviders.includes(def.provider));

    if (missingIntegrations.length > 0) {
      for (let def of missingIntegrations) {
        const result = await pool.query(
          `INSERT INTO integrations (provider, model, enabled, api_key_encrypted, library_id, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, 1, NOW(), NOW()) RETURNING *`,
          [def.provider, def.model, def.enabled, def.api_key_encrypted]
        );
        rows.push(result.rows[0]);
      }
    }

    res.json(rows);
  } catch (error) {
    console.error('[integrations] Erro ao listar:', error.message);
    res.status(500).json({ mensagem: 'Erro ao buscar integrações.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/integrations/:id
// Atualiza uma integração
// ─────────────────────────────────────────────────────────────────────────────
const atualizarIntegracao = async (req, res) => {
  const { id } = req.params;
  const { model, enabled, api_key_encrypted } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      'SELECT id FROM integrations WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ mensagem: 'Integração não encontrada.' });
    }

    // Se api_key for vazio ou null, a gente mantem a antiga
    // (A menos que o user limpe explicitamente, mas trataremos de forma simplificada)
    let updateQuery = `UPDATE integrations SET model = $1, enabled = $2, updated_at = NOW()`;
    let values = [model, enabled];

    if (api_key_encrypted !== undefined) {
      updateQuery += `, api_key_encrypted = $3 WHERE id = $4 RETURNING *`;
      values.push(api_key_encrypted, id);
    } else {
      updateQuery += ` WHERE id = $3 RETURNING *`;
      values.push(id);
    }

    const { rows: updated } = await pool.query(updateQuery, values);
    
    res.json(updated[0]);
  } catch (error) {
    console.error('[integrations] Erro ao atualizar:', error.message);
    res.status(500).json({ mensagem: 'Erro ao atualizar integração.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/integrations/:id/test
// Testa conexão com o provedor (mock)
// ─────────────────────────────────────────────────────────────────────────────
const testarConexao = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query('SELECT provider, api_key_encrypted FROM integrations WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ mensagem: 'Integração não encontrada.' });
    }

    const integracao = rows[0];

    if (!integracao.api_key_encrypted) {
      return res.status(400).json({ mensagem: 'Chave de API não configurada.' });
    }

    res.json({ mensagem: `Conexão com ${integracao.provider} estabelecida com sucesso!` });
  } catch (error) {
    console.error('[integrations] Erro ao testar:', error.message);
    res.status(500).json({ mensagem: 'Erro ao testar conexão.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/integrations/google-books/search
// Busca livros na API do Google Books
// ─────────────────────────────────────────────────────────────────────────────
const googleBooksSearch = async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ mensagem: 'Parâmetro "query" é obrigatório para a busca.' });
  }

  try {
    const { rows } = await pool.query('SELECT api_key_encrypted, enabled FROM integrations WHERE provider = $1', ['google_books']);
    
    if (rows.length === 0 || !rows[0].enabled) {
      return res.status(403).json({ mensagem: 'A integração com Google Books não está habilitada.' });
    }

    const apiKey = rows[0].api_key_encrypted;
    if (!apiKey) {
      return res.status(400).json({ mensagem: 'Chave de API do Google Books não configurada.' });
    }

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=10`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Erro na API do Google Books');
    }

    if (!data.items) {
      return res.json([]);
    }

    // Formatar para facilitar o preenchimento no frontend
    const books = data.items.map(item => {
      const info = item.volumeInfo;
      const isbnObj = info.industryIdentifiers?.find(id => id.type === 'ISBN_13') 
                   || info.industryIdentifiers?.find(id => id.type === 'ISBN_10');
                   
      return {
        google_id: item.id,
        titulo: info.title || '',
        autores: info.authors || [],
        descricao: info.description || '',
        isbn: isbnObj ? isbnObj.identifier : '',
        numero_paginas: info.pageCount || null,
        capa_url: info.imageLinks?.thumbnail?.replace('http:', 'https:') || info.imageLinks?.smallThumbnail?.replace('http:', 'https:') || '',
        editora: info.publisher || '',
        ano_publicacao: info.publishedDate ? info.publishedDate.substring(0, 4) : null,
      };
    });

    res.json(books);
  } catch (error) {
    console.error('[google_books] Erro na busca:', error.message);
    res.status(500).json({ mensagem: 'Erro ao buscar livros na API do Google Books.' });
  }
};

module.exports = {
  listarIntegracoes,
  atualizarIntegracao,
  testarConexao,
  googleBooksSearch
};
