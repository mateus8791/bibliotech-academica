'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { Mail, Key, ArrowLeft, AlertCircle, HelpCircle } from 'lucide-react';
import { LoginCarousel } from '@/components/auth/LoginCarousel';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const response = await api.post('/auth/validar-codigo', {
        email,
        codigo_recuperacao: codigo
      });

      // Armazena os dados para a próxima tela
      sessionStorage.setItem('reset_email', email);
      sessionStorage.setItem('reset_codigo', codigo);
      sessionStorage.setItem('reset_nome', response.data.nome);

      // Redireciona para a tela de redefinir senha
      router.push('/auth/reset-password');
    } catch (error: any) {
      const mensagemErro = error.response?.data?.mensagem ||
        'Não foi possível validar o código. Verifique os dados e tente novamente.';
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

      {/* Lado Direito - Formulário de Recuperação */}
      <div className="w-full lg:w-2/5 xl:w-1/3 bg-white flex items-center justify-center p-8 relative">
        {/* Botão Voltar */}
        <Link
          href="/auth/login"
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Voltar ao Login</span>
        </Link>

        {/* Conteúdo */}
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="Logo Bibliotech" width={100} height={100} priority />
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Esqueceu sua senha?</h1>
            <p className="text-gray-600">
              Insira seu email e seu ID de usuário fornecido pela organização
            </p>
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

            {/* ID do Usuário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID do Usuário
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000001"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Formato: UUID (36 caracteres)
              </p>
            </div>

            {/* Botão de Ajuda */}
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Não sei meu ID de usuário
            </button>

            {/* Mensagem de Ajuda */}
            {showHelp && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-2">Como obter meu ID de usuário?</p>
                    <p className="mb-2">
                      O ID de usuário é um código único fornecido pela organização no momento do seu cadastro.
                    </p>
                    <p className="mb-2">
                      Entre em contato com o setor administrativo ou bibliotecário responsável
                      para solicitar seu ID de usuário.
                    </p>
                    <p className="text-xs text-blue-700 mt-3">
                      📧 Contato: suporte@bibliotech.com | 📞 (00) 0000-0000
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              {loading ? 'Validando...' : 'Validar ID'}
            </button>
          </form>

          {/* Link para Cadastro */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Não tem uma conta?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
