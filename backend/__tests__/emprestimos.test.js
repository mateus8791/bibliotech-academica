/**
 * Tests for loan management endpoints
 * Note: loanController exports only getMyBooks which returns active loans + reservations.
 */

const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database');
const pool = require('../src/config/database');
const loanController = require('../src/controllers/loanController');

describe('Loan Endpoints', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock auth middleware
    app.use((req, res, next) => {
      req.usuario = { id: 1, tipo_usuario: 'aluno' };
      next();
    });

    // getMyBooks is the main exported function
    app.get('/api/emprestimos', loanController.getMyBooks);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/emprestimos (getMyBooks)', () => {
    test('should return active loans and reservations for authenticated user', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            tipo: 'emprestimo',
            titulo: 'Clean Code',
            capa_url: null,
            autor_nome: 'Robert Martin',
            data_emprestimo: new Date().toISOString(),
            data_devolucao_prevista: new Date().toISOString(),
            data_reserva: null,
            data_expiracao: null,
            status: 'ativo'
          }
        ]
      });

      const res = await request(app).get('/api/emprestimos');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe('ativo');
    });

    test('should return empty array when user has no active items', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/emprestimos');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('should return both active loans (tipo=emprestimo) and active reservations (tipo=reserva)', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 1, tipo: 'emprestimo', titulo: 'Book A', status: 'ativo' },
          { id: 2, tipo: 'reserva', titulo: 'Book B', status: 'aguardando' }
        ]
      });

      const res = await request(app).get('/api/emprestimos');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    test('should handle database errors and return 500', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app).get('/api/emprestimos');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('mensagem');
    });

    test('should query using the authenticated user id', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await request(app).get('/api/emprestimos');

      // Verify pool.query was called with the user's ID
      expect(pool.query).toHaveBeenCalledTimes(1);
      const [queryText, queryParams] = pool.query.mock.calls[0];
      expect(queryParams).toContain(1); // user id = 1
    });
  });
});
