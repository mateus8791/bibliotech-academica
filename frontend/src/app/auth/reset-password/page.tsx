'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { Lock, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { LoginCarousel } from '@/components/auth/LoginCarousel';

export default function ResetPasswordPage() {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [nome, setNome] = useState('');

  const router = useRouter();

  useEffect(() => {
    // Verifica se veio da tela anterior
    const email = sessionStorage.getItem('reset_email');
    const codigo = sessionStorage.getItem('reset_codigo');
    const nomeUsuario = sessionStorage.getItem('reset_nome');

    if (!email || !codigo) {
      // Se não tiver os dados, redireciona para a tela de esqueceu senha
      router.push('/auth/forgot-password');
    } else {
      setNome(nomeUsuario || '');
    }
  }, [router]);

  const validarSenhas = () => {
    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return false;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');

    if (!validarSenhas()) {
      return;
    }

    setLoading(true);

    try {
      const email = sessionStorage.getItem('reset_email');
      const codigo = sessionStorage.getItem('reset_codigo');

      await api.post('/auth/resetar-senha', {
        email,
        codigo_recuperacao: codigo,
        nova_senha: novaSenha
      });

      setSucesso(true);

      // Limpa os dados do sessionStorage
      sessionStorage.removeItem('reset_email');
      sessionStorage.removeItem('reset_codigo');
      sessionStorage.removeItem('reset_nome');

      // Redireciona para login após 3 segundos
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);

    } catch (error: any) {
      const mensagemErro = error.response?.data?.mensagem ||
        'Não foi possível redefinir a senha. Tente novamente.';
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  // Indicador de força da senha
  const calcularForcaSenha = (senha: string) => {
    if (senha.length === 0) return 0;
    if (senha.length < 6) return 1;
    if (senha.length < 8) return 2;

    let forca = 2;
    if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) forca++;
    if (/\d/.test(senha)) forca++;
    if (/[^a-zA-Z\d]/.test(senha)) forca++;

    return Math.min(forca, 4);
  };

  const forcaSenha = calcularForcaSenha(novaSenha);
  const coresForca = ['bg-gray-200', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const textosForca = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];

  if (sucesso) {
    return (
      <main className="min-h-screen flex">
        <div className="hidden lg:block lg:w-3/5 xl:w-2/3">
          <LoginCarousel />
        </div>

        <div className="w-full lg:w-2/5 xl:w-1/3 bg-white flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">Senha Redefinida!</h1>
            <p className="text-gray-600 mb-6">
              Sua senha foi alterada com sucesso. Você será redirecionado para a tela de login.
            </p>

            <div className="animate-pulse text-sm text-gray-500">
              Redirecionando em alguns segundos...
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex">
      {/* Lado Esquerdo - Carrossel */}
      <div className="hidden lg:block lg:w-3/5 xl:w-2/3">
        <LoginCarousel />
      </div>

      {/* Lado Direito - Formulário de Redefinição */}
      <div className="w-full lg:w-2/5 xl:w-1/3 bg-white flex items-center justify-center p-8 relative">
        {/* Botão Voltar */}
        <Link
          href="/auth/forgot-password"
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Voltar</span>
        </Link>

        {/* Conteúdo */}
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="Logo Bibliotech" width={100} height={100} priority />
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Redefinir Senha</h1>
            {nome && (
              <p className="text-gray-600">
                Olá, <span className="font-semibold text-blue-600">{nome}</span>! Crie sua nova senha
              </p>
            )}
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nova Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Indicador de Força da Senha */}
              {novaSenha && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= forcaSenha ? coresForca[forcaSenha] : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${forcaSenha >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                    Força: {textosForca[forcaSenha]}
                  </p>
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Indicador de Senhas Coincidem */}
              {confirmarSenha && (
                <p className={`text-xs mt-2 ${novaSenha === confirmarSenha ? 'text-green-600' : 'text-red-600'}`}>
                  {novaSenha === confirmarSenha ? '✓ As senhas coincidem' : '✗ As senhas não coincidem'}
                </p>
              )}
            </div>

            {/* Dicas de Senha */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900 font-medium mb-2">Dicas para uma senha forte:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Mínimo de 6 caracteres (recomendado 8+)</li>
                <li>• Use letras maiúsculas e minúsculas</li>
                <li>• Inclua números e caracteres especiais</li>
              </ul>
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
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
