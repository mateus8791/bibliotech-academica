/**
 * Tests for book management endpoints
 * Note: bookController uses pool.connect() for write operations (transactions)
 */

const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database');
jest.mock('../src/services/auditoriaService', () => ({
  registrarAcao: jest.fn().mockResolvedValue(undefined),
}));

const pool = require('../src/config/database');
const bookController = require('../src/controllers/bookController');

describe('Book Endpoints', () => {
  let app;
  let mockClient;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.usuario = { id: 1, tipo_usuario: 'admin' };
      next();
    });
    app.get('/api/livros', bookController.getAllBooks);
    app.get('/api/livros/:id', bookController.getBookById);
    app.post('/api/livros', bookController.createBook);
    app.put('/api/livros/:id', bookController.updateBook);
    app.delete('/api/livros/:id', bookController.deleteBook);
  });

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/livros', () => {
    test('should return list of books (paginated)', async () => {
      // getAllBooks without page/limit falls into pagination mode → 2 queries (count + data)
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // count query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            titulo: 'Test Book',
            isbn: '123456789',
            ano_publicacao: 2023,
            quantidade_disponivel: 5,
            autores: [],
            categorias: []
          }]
        }); // data query

      const res = await request(app).get('/api/livros');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
    });

    test('should filter books by search term', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] }) // count
        .mockResolvedValueOnce({ rows: [] }); // data

      const res = await request(app)
        .get('/api/livros')
        .query({ search: 'Clean Code' });

      expect(res.status).toBe(200);
    });

    test('should filter books by category', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] }) // count
        .mockResolvedValueOnce({ rows: [] }); // data

      const res = await request(app)
        .get('/api/livros')
        .query({ categoria: 1 });

      expect(res.status).toBe(200);
    });

    test('should paginate results when page is provided', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: '5' }] }) // count
        .mockResolvedValueOnce({ rows: [] }); // data

      const res = await request(app)
        .get('/api/livros')
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('GET /api/livros/:id', () => {
    test('should return book by id', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          titulo: 'Test Book',
          isbn: '123456789',
          autores: [],
          categorias: []
        }]
      });

      const res = await request(app).get('/api/livros/1');

      expect(res.status).toBe(200);
    });

    test('should return 404 if book not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/livros/999');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/livros', () => {
    test('should create new book with autores_ids and categorias_ids', async () => {
      // createBook uses pool.connect() for transaction
      // Sequence: BEGIN, INSERT livro, INSERT livro_autor, INSERT livro_categoria, COMMIT
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT livro RETURNING id
        .mockResolvedValueOnce(undefined) // INSERT livro_autor
        .mockResolvedValueOnce(undefined) // INSERT livro_categoria
        .mockResolvedValueOnce(undefined); // COMMIT

      const res = await request(app)
        .post('/api/livros')
        .send({
          titulo: 'New Book',
          isbn: '123456789',
          ano_publicacao: 2024,
          autores_ids: [1],
          categorias_ids: [1]
        });

      expect(res.status).toBe(201);
    });

    test('should return 400 with missing titulo', async () => {
      const res = await request(app)
        .post('/api/livros')
        .send({
          isbn: '123456789',
          autores_ids: [],
          categorias_ids: []
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/livros/:id', () => {
    test('should update existing book', async () => {
      // updateBook uses pool.connect() transaction
      // Sequence: BEGIN, SELECT titulo (found), UPDATE, DELETE livro_autor, INSERT livro_autor,
      //           DELETE livro_categoria, INSERT livro_categoria, COMMIT
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ titulo: 'Old Title' }], rowCount: 1 }) // SELECT
        .mockResolvedValueOnce(undefined) // UPDATE livro
        .mockResolvedValueOnce(undefined) // DELETE livro_autor
        .mockResolvedValueOnce(undefined) // INSERT livro_autor
        .mockResolvedValueOnce(undefined) // DELETE livro_categoria
        .mockResolvedValueOnce(undefined) // INSERT livro_categoria
        .mockResolvedValueOnce(undefined); // COMMIT

      const res = await request(app)
        .put('/api/livros/1')
        .send({
          titulo: 'Updated Title',
          autores_ids: [1],
          categorias_ids: [1]
        });

      expect(res.status).toBe(200);
    });

    test('should return 404 if book not found', async () => {
      // Sequence: BEGIN, SELECT (empty), ROLLBACK, return 404
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // SELECT (not found)
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const res = await request(app)
        .put('/api/livros/999')
        .send({
          titulo: 'Updated Title',
          autores_ids: [1],
          categorias_ids: [1]
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/livros/:id', () => {
    test('should delete book and return 200', async () => {
      // deleteBook uses pool.connect() transaction
      // Sequence: BEGIN, SELECT titulo (found), DELETE livro_autor, DELETE livro_categoria,
      //           DELETE livro, COMMIT
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [{ titulo: 'Book To Delete' }], rowCount: 1 }) // SELECT
        .mockResolvedValueOnce(undefined) // DELETE livro_autor
        .mockResolvedValueOnce(undefined) // DELETE livro_categoria
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE livro
        .mockResolvedValueOnce(undefined); // COMMIT

      const res = await request(app).delete('/api/livros/1');

      expect(res.status).toBe(200);
    });

    test('should return 404 if book not found', async () => {
      // Sequence: BEGIN, SELECT (empty/rowCount 0), ROLLBACK, return 404
      mockClient.query
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // SELECT (not found)
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const res = await request(app).delete('/api/livros/999');

      expect(res.status).toBe(404);
    });
  });
});
