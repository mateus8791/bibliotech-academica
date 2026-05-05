'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import { LoginCarousel } from '@/components/auth/LoginCarousel';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { notify } from '@/lib/toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  // Verificar se há erro de autenticação Google na URL
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      const errorMessages: { [key: string]: string } = {
        'auth_failed': 'Falha na autenticação com Google. Tente novamente.',
        'server_error': 'Erro no servidor. Tente novamente mais tarde.',
        'missing_data': 'Dados de autenticação incompletos.',
        'invalid_data': 'Dados de autenticação inválidos.'
      };
      setErro(decodeURIComponent(errorMessages[error] || error));
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // Usa o método login do AuthContext
      await login(email, senha);

      // Aguarda um momento para o estado do usuario ser atualizado
      await new Promise(resolve => setTimeout(resolve, 100));

      // Pega o tipo de usuário do localStorage (foi setado pelo login)
      const userJson = localStorage.getItem('bibliotech_usuario');
      if (!userJson) {
        throw new Error('Erro ao carregar dados do usuário');
      }

      const userData = JSON.parse(userJson);
      const tipoUsuario = userData.tipo_usuario;
      const nomeUsuario = userData.nome?.split(' ')[0] || 'usuário';

      // Toast de boas-vindas
      notify.welcome(`Bem-vindo de volta, ${nomeUsuario}! 👋`);

      // Redirecionar baseado no tipo de usuário
      if (tipoUsuario === 'admin') {
        router.push('/dashboard');
      } else if (tipoUsuario === 'bibliotecario') {
        router.push('/dashboard');
      } else if (tipoUsuario === 'aluno') {
        router.push('/aluno/dashboard');
      } else {
        console.warn('Tipo de usuário não reconhecido:', tipoUsuario);
        router.push('/aluno/dashboard');
      }
    } catch (error: any) {
      const mensagemErro = error.response?.data?.mensagem || error.message || 'Não foi possível fazer login.';
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* Lado Esquerdo - Carrossel */}
      <div className="hidden lg:block lg:w-3/5 xl:w-2/3">
        <LoginCarousel />
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="w-full lg:w-2/5 xl:w-1/3 bg-white flex items-center justify-center p-8 relative">
        {/* Botão Voltar */}
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Voltar</span>
        </Link>

        {/* Conteúdo do Login */}
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="Logo Bibliotech" width={100} height={100} sizes="100px" priority />
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Logue em sua conta</h1>
            <p className="text-gray-600">Acesse sua biblioteca digital</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@dominio.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Link Esqueceu Senha */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Manter conectado</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Esqueceu sua senha?
              </Link>
            </div>

            {/* Erro */}
            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {erro}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Ou continue com</span>
            </div>
          </div>

          {/* Botão Google Login */}
          <GoogleLoginButton />

          {/* Aviso institucional */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Acesso exclusivo para instituições parceiras.
          </p>
        </div>
      </div>
    </main>
  );
}