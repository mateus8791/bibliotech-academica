'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { LoginCarousel } from '@/components/auth/LoginCarousel';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    setLoading(true);

    try {
      await api.post('/auth/solicitar-reset', { email });
      setSucesso(true);
    } catch (error: any) {
      const mensagemErro = error.response?.data?.mensagem ||
        'Não foi possível solicitar a redefinição de senha. Tente novamente.';
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

          {!sucesso ? (
            <>
              {/* Título */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Esqueceu sua senha?</h1>
                <p className="text-gray-600">
                  Insira seu e-mail e notificaremos os administradores para liberar a troca da sua senha.
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
                  disabled={loading || !email}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  {loading ? 'Enviando Solicitação...' : 'Solicitar Redefinição'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h2>
                <p className="text-gray-600">
                  Os administradores foram notificados. Assim que aprovarem, você receberá uma senha temporária (ou instruções) para acessar a plataforma e redefinir sua senha definitiva.
                </p>
              </div>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Voltar para o Login
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
