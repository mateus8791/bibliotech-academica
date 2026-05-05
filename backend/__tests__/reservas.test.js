/**
 * Tests for reservation management endpoints
 * reservationController exports: createReservation, getMyReservations, cancelReservation
 */

const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database');
const pool = require('../src/config/database');
const reservationController = require('../src/controllers/reservationController');

describe('Reservation Endpoints', () => {
  let app;
  let mockClient;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.use((req, res, next) => {
      req.usuario = { id: 1, tipo_usuario: 'aluno' };
      next();
    });

    app.get('/api/reservas', reservationController.getMyReservations);
    app.post('/api/reservas', reservationController.createReservation);
    app.delete('/api/reservas/:id', reservationController.cancelReservation);
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

  describe('GET /api/reservas (getMyReservations)', () => {
    test('should return all reservations for authenticated user', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            usuario_id: 1,
            livro_id: 1,
            data_reserva: new Date().toISOString(),
            data_expiracao: new Date().toISOString(),
            status: 'aguardando',
            posicao_fila: 1,
            notificado: false,
            titulo: 'Test Book',
            capa_url: null,
            autores: 'Author Name'
          }
        ]
      });

      const res = await request(app).get('/api/reservas');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('should return empty array when user has no reservations', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/reservas');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('should handle database errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app).get('/api/reservas');

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/reservas (createReservation)', () => {
    test('should return 400 if livro_id or data_expiracao missing', async () => {
      // Validation happens before DB call
      const res = await request(app)
        .post('/api/reservas')
        .send({ livro_id: 1 }); // missing data_expiracao

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensagem');
    });

    test('should create reservation successfully', async () => {
      // createReservation uses pool.connect() for transaction
      // Sequence: limit check query, BEGIN, INSERT reserva, COMMIT
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // limit check (0 active)
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            livro_id: 1,
            usuario_id: 1,
            status: 'aguardando'
          }]
        }) // INSERT
        .mockResolvedValueOnce(undefined); // COMMIT

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .post('/api/reservas')
        .send({
          livro_id: 1,
          data_expiracao: tomorrow.toISOString()
        });

      expect(res.status).toBe(201);
    });

    test('should return 403 if reservation limit reached (1 active reservation)', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // limit check (1 active = limit reached)

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .post('/api/reservas')
        .send({
          livro_id: 1,
          data_expiracao: tomorrow.toISOString()
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/reservas/:id (cancelReservation)', () => {
    test('should cancel reservation and return 200', async () => {
      // cancelReservation uses pool.query (single UPDATE, no transaction)
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, usuario_id: 1, status: 'cancelado' }],
        rowCount: 1
      });

      const res = await request(app).delete('/api/reservas/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('mensagem');
    });

    test('should return 404 if reservation not found or already cancelled', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      const res = await request(app).delete('/api/reservas/999');

      expect(res.status).toBe(404);
    });
  });
});
