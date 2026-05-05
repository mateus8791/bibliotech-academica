/**
 * Tests for authentication endpoints
 */

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');

jest.mock('../src/config/database');
const pool = require('../src/config/database');
const authController = require('../src/controllers/authController');

describe('Authentication Endpoints', () => {
  let app;
  let correctHash;

  beforeAll(async () => {
    // Generate a real bcrypt hash for password tests
    correctHash = await bcrypt.hash('password123', 10);

    app = express();
    app.use(express.json());
    app.post('/api/auth/login', authController.login);
    app.post('/api/auth/login-com-id', authController.loginComId);
    app.post('/api/auth/validar-codigo', authController.validarCodigoRecuperacao);
    app.post('/api/auth/resetar-senha', authController.resetarSenha);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    test('should return 400 if email or password missing', async () => {
      // Validation happens before DB call - no mock needed
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' }); // missing senha

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensagem');
    });

    test('should return 404 if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@test.com', senha: 'password123' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('mensagem');
    });

    test('should return 401 if user uses Google OAuth (no senha_hash)', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'user@test.com', senha_hash: null }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', senha: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.mensagem).toContain('Google');
    });

    test('should return 401 if password is incorrect', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'user@test.com',
          nome: 'Test User',
          tipo_usuario: 'aluno',
          foto_url: null,
          senha_hash: correctHash
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', senha: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/login-com-id', () => {
    test('should return 400 if id or profile missing', async () => {
      // Validation happens before DB call - no mock needed
      const res = await request(app)
        .post('/api/auth/login-com-id')
        .send({ id: 1 }); // missing profile

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    test('should return 404 if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login-com-id')
        .send({ id: 999, profile: 'student' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/validar-codigo', () => {
    test('should return 400 if email or codigo_recuperacao missing', async () => {
      // Validation happens before DB call - no mock needed
      const res = await request(app)
        .post('/api/auth/validar-codigo')
        .send({ email: 'user@test.com' }); // missing codigo_recuperacao

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensagem');
    });

    test('should return 404 if user not found with email and id', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/validar-codigo')
        .send({ email: 'notfound@test.com', codigo_recuperacao: 1 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('mensagem');
    });

    test('should return 200 with user info if validation succeeds', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nome: 'Test User',
          email: 'user@test.com'
        }]
      });

      const res = await request(app)
        .post('/api/auth/validar-codigo')
        .send({ email: 'user@test.com', codigo_recuperacao: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('usuario_id');
      expect(res.body).toHaveProperty('nome');
    });
  });

  describe('POST /api/auth/resetar-senha', () => {
    test('should return 400 if required fields missing', async () => {
      // Validation happens before DB call - no mock needed
      const res = await request(app)
        .post('/api/auth/resetar-senha')
        .send({ email: 'user@test.com' }); // missing codigo_recuperacao and nova_senha

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('mensagem');
    });

    test('should return 400 if password is too short', async () => {
      // Length check happens before DB call - no mock needed
      const res = await request(app)
        .post('/api/auth/resetar-senha')
        .send({
          email: 'user@test.com',
          codigo_recuperacao: 1,
          nova_senha: '123' // too short
        });

      expect(res.status).toBe(400);
      expect(res.body.mensagem).toContain('6 caracteres');
    });

    test('should return 404 if email and id do not match', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/resetar-senha')
        .send({
          email: 'notfound@test.com',
          codigo_recuperacao: 999,
          nova_senha: 'newpassword123'
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('mensagem');
    });
  });
});
