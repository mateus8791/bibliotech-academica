// Arquivo: backend/src/middlewares/adminMiddleware.js
// Middleware para verificar permissões de acesso por papel (role)

const ROLES = {
  ADMIN: 'admin',
  BIBLIOTECARIO: 'bibliotecario',
  ALUNO: 'aluno',
};

// Apenas admin
const checkAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: 'Autenticação necessária', code: 'UNAUTHENTICATED' });
  }
  if (req.usuario.tipo_usuario !== ROLES.ADMIN) {
    return res.status(403).json({ error: 'Acesso negado. Exclusivo para administradores.', code: 'FORBIDDEN' });
  }
  return next();
};

// Admin ou Bibliotecário
const checkAdminOrBibliotecario = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: 'Autenticação necessária', code: 'UNAUTHENTICATED' });
  }
  const tipo = req.usuario.tipo_usuario;
  if (tipo !== ROLES.ADMIN && tipo !== ROLES.BIBLIOTECARIO) {
    return res.status(403).json({ error: 'Acesso negado. Exclusivo para administradores ou bibliotecários.', code: 'FORBIDDEN' });
  }
  return next();
};

module.exports = { checkAdmin, checkAdminOrBibliotecario, ROLES };
