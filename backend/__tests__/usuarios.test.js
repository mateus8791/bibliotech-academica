/**
 * Tests for user management endpoints (admin only)
 */

const request = require('supertest');
const express = require('express');

jest.mock('../src/config/database');
jest.mock('../src/services/emailService', () => ({
  sendRegistrationEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/auditoriaService', () => ({
  registrarAcao: jest.fn().mockResolvedValue(undefined),
}));

const pool = require('../src/config/database');
const userController = require('../src/controllers/userController');

describe('User Management Endpoints', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.use((req, res, next) => {
      req.usuario = { id: 1, tipo_usuario: 'admin' };
      next();
    });

    app.get('/api/usuarios', userController.getAllUsers);
    app.get('/api/usuarios/:id', userController.getUserById);
    app.post('/api/usuarios', userController.createUser);
    app.put('/api/usuarios/:id', userController.updateUser);
    app.delete('/api/usuarios/:id', userController.deleteUser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/usuarios', () => {
    test('should return list of all users', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          { id: 1, nome: 'User 1', email: 'user1@test.com', tipo_usuario: 'aluno' },
          { id: 2, nome: 'User 2', email: 'user2@test.com', tipo_usuario: 'bibliotecario' }
        ]
      });

      const res = await request(app).get('/api/usuarios');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });

    test('should filter users by search term', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/usuarios')
        .query({ search: 'John' });

      expect(res.status).toBe(200);
    });

    test('should filter users by tipo_usuario', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/usuarios')
        .query({ tipo: 'aluno' });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/usuarios/:id', () => {
    test('should return user by id', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nome: 'Test User',
          email: 'test@test.com',
          tipo_usuario: 'aluno'
        }]
      });

      const res = await request(app).get('/api/usuarios/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('nome', 'Test User');
    });

    test('should return 404 if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/usuarios/999');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/usuarios', () => {
    test('should create new user with valid data', async () => {
      // createUser does: bcrypt.hash (real), INSERT RETURNING, sendRegistrationEmail, registrarAcao
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'New User', email: 'newuser@test.com' }]
      });

      const res = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'New User',
          email: 'newuser@test.com',
          senha: 'password123',
          tipo_usuario: 'aluno'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
    });

    test('should return 400 if required fields missing', async () => {
      // Validation happens before DB call
      const res = await request(app)
        .post('/api/usuarios')
        .send({ nome: 'New User' }); // missing email, senha, tipo_usuario

      expect(res.status).toBe(400);
    });

    test('should return 409 if email already exists (duplicate key)', async () => {
      const dupError = new Error('duplicate key value violates unique constraint');
      dupError.code = '23505';
      pool.query.mockRejectedValueOnce(dupError);

      const res = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'New User',
          email: 'existing@test.com',
          senha: 'password123',
          tipo_usuario: 'aluno'
        });

      expect(res.status).toBe(409);
    });
  });

  describe('PUT /api/usuarios/:id', () => {
    test('should update existing user', async () => {
      // updateUser requires nome, email, tipo_usuario
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Updated Name', email: 'test@test.com', tipo_usuario: 'aluno' }]
      });

      const res = await request(app)
        .put('/api/usuarios/1')
        .send({
          nome: 'Updated Name',
          email: 'test@test.com',
          tipo_usuario: 'aluno'
        });

      expect(res.status).toBe(200);
    });

    test('should return 400 if required fields missing', async () => {
      const res = await request(app)
        .put('/api/usuarios/1')
        .send({ nome: 'Only Name' }); // missing email and tipo_usuario

      expect(res.status).toBe(400);
    });

    test('should return 404 if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/usuarios/999')
        .send({
          nome: 'Updated Name',
          email: 'test@test.com',
          tipo_usuario: 'aluno'
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/usuarios/:id', () => {
    test('should delete user and return 200', async () => {
      // deleteUser: SELECT nome, then DELETE
      pool.query
        .mockResolvedValueOnce({ rows: [{ nome: 'User To Delete' }] }) // SELECT nome
        .mockResolvedValueOnce({ rowCount: 1 }); // DELETE

      const res = await request(app).delete('/api/usuarios/1');

      expect(res.status).toBe(200);
    });

    test('should return 404 if user not found', async () => {
      // SELECT returns nothing, DELETE returns rowCount 0
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // SELECT nome (not found)
        .mockResolvedValueOnce({ rowCount: 0 }); // DELETE (nothing deleted)

      const res = await request(app).delete('/api/usuarios/999');

      expect(res.status).toBe(404);
    });
  });
});
