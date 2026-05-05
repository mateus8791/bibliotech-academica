export type AccessLevel = 'admin' | 'bibliotecario' | 'aluno';

export const getDefaultRoute = (accessLevel: AccessLevel): string => {
  switch (accessLevel) {
    case 'admin':
    case 'bibliotecario':
      return '/dashboard';
    case 'aluno':
      return '/aluno/dashboard';
    default:
      return '/';
  }
};
