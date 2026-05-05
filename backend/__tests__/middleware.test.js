/**
 * Tests for authentication and role-based access control middleware
 */

const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/middlewares/authMiddleware');
const { checkAdmin, checkAdminOrBibliotecario, ROLES } = require('../src/middlewares/adminMiddleware');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('authMiddleware', () => {
    test('should return 401 if no token provided', () => {
      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Token')
      }));
    });

    test('should return 401 if token format is invalid', () => {
      req.headers.authorization = 'InvalidFormat';
      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 401 if scheme is not Bearer', () => {
      req.headers.authorization = 'Basic sometoken';
      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 401 if token is invalid', () => {
      req.headers.authorization = 'Bearer invalidtoken';
      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('inválido ou expirado')
      }));
    });

    test('should call next if token is valid', () => {
      const payload = { id: 1, tipo_usuario: 'aluno' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.usuario).toEqual(expect.objectContaining(payload));
    });
  });
});

describe('Role-Based Access Control Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { usuario: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('checkAdmin', () => {
    test('should return 401 if user not authenticated', () => {
      req.usuario = null;
      checkAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'UNAUTHENTICATED'
      }));
    });

    test('should return 403 if user is not admin', () => {
      req.usuario = { id: 1, tipo_usuario: 'aluno' };
      checkAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'FORBIDDEN'
      }));
    });

    test('should call next if user is admin', () => {
      req.usuario = { id: 1, tipo_usuario: 'admin' };
      checkAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 403 if user is bibliotecario', () => {
      req.usuario = { id: 1, tipo_usuario: 'bibliotecario' };
      checkAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('checkAdminOrBibliotecario', () => {
    test('should return 401 if user not authenticated', () => {
      req.usuario = null;
      checkAdminOrBibliotecario(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 403 if user is aluno', () => {
      req.usuario = { id: 1, tipo_usuario: 'aluno' };
      checkAdminOrBibliotecario(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should call next if user is admin', () => {
      req.usuario = { id: 1, tipo_usuario: 'admin' };
      checkAdminOrBibliotecario(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should call next if user is bibliotecario', () => {
      req.usuario = { id: 1, tipo_usuario: 'bibliotecario' };
      checkAdminOrBibliotecario(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});

describe('ROLES constant', () => {
  test('should have correct role values', () => {
    expect(ROLES.ADMIN).toBe('admin');
    expect(ROLES.BIBLIOTECARIO).toBe('bibliotecario');
    expect(ROLES.ALUNO).toBe('aluno');
  });
});
