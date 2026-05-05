'use client';

import { FcGoogle } from 'react-icons/fc';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    // Redirecionar para a rota de autenticação Google no backend
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      type="button"
      className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700 hover:border-gray-400"
    >
      <FcGoogle className="w-6 h-6" />
      <span>Entrar com Google Institucional</span>
    </button>
  );
}
