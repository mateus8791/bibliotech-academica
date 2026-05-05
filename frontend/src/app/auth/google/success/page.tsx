'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GoogleAuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirectMessage, setRedirectMessage] = useState('Autenticando com Google...');

  useEffect(() => {
    const token = searchParams.get('token');
    const userString = searchParams.get('user');

    if (token && userString) {
      try {
        const usuario = JSON.parse(decodeURIComponent(userString));

        // Armazenar token e dados do usuário
        localStorage.setItem('bibliotech_token', token);
        localStorage.setItem('bibliotech_usuario', JSON.stringify(usuario));

        // Redirecionamento automático baseado no tipo_usuario
        const tipoUsuario = usuario.tipo_usuario;
        let redirectPath = '/catalogo'; // Padrão para alunos

        if (tipoUsuario === 'admin' || tipoUsuario === 'bibliotecario') {
          setRedirectMessage('Redirecionando para o painel administrativo...');
          redirectPath = '/dashboard/livros';
        } else if (tipoUsuario === 'aluno') {
          setRedirectMessage('Redirecionando para o catálogo...');
          redirectPath = '/catalogo';
        } else {
          // Fallback - ir para loja como visitante
          setRedirectMessage('Redirecionando para a loja...');
          redirectPath = '/loja';
        }

        // Pequeno delay para mostrar a mensagem
        setTimeout(() => {
          router.push(redirectPath);
        }, 1000);

      } catch (error) {
        console.error('Erro ao processar autenticação Google:', error);
        router.push('/login?error=invalid_data');
      }
    } else {
      // Se não houver token ou usuário, redirecionar para login com erro
      router.push('/login?error=missing_data');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-gray-800 font-semibold text-xl mt-4">{redirectMessage}</p>
        <p className="text-gray-500 text-sm mt-2">Aguarde um momento...</p>
        <div className="mt-6 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
