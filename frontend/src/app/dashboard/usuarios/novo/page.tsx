// Arquivo: frontend/src/app/dashboard/usuarios/novo/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function NovoUsuarioPage() {
  const initialState = {
    nome: '',
    email: '',
    senha: '',
    tipo_usuario: 'aluno',
    foto_url: '',
  };

  const [formData, setFormData] = useState(initialState);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    setSucesso('');

    if (formData.senha.length < 6) {
        setErro('A senha deve ter no mínimo 6 caracteres.');
        setEnviando(false);
        return;
    }

    try {
      await api.post('/usuarios', formData);
      setSucesso('Usuário cadastrado com sucesso! A notificação foi enviada.');
      setTimeout(() => {
        router.push('/dashboard/usuarios');
      }, 2000);
    } catch (error: any) {
      setErro(error.response?.data?.message || "Erro desconhecido ao cadastrar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex-1 p-6 lg:p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft size={18} />
                Voltar para a lista de usuários
            </button>

            <div className="bg-white p-8 rounded-xl shadow-md">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Cadastrar Novo Usuário</h1>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} required className="mt-1 block w-full p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="foto_url" className="block text-sm font-medium text-gray-700">URL da Foto de Perfil</label>
                        <input type="text" name="foto_url" id="foto_url" value={formData.foto_url} onChange={handleChange} placeholder="https://exemplo.com/foto.png (opcional)" className="mt-1 block w-full p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    
                    <div className="sm:col-span-3">
                        <label htmlFor="senha" className="block text-sm font-medium text-gray-700">Senha</label>
                        <input type="password" name="senha" id="senha" value={formData.senha} onChange={handleChange} placeholder="Mínimo 6 caracteres" required className="mt-1 block w-full p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500"/>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="tipo_usuario" className="block text-sm font-medium text-gray-700">Tipo de Usuário</label>
                        <select id="tipo_usuario" name="tipo_usuario" value={formData.tipo_usuario} onChange={handleChange} className="mt-1 block w-full p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white h-full">
                            <option value="aluno">Aluno</option>
                            <option value="bibliotecario">Bibliotecário</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                
                {erro && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-center text-sm">{erro}</p>}
                {sucesso && <p className="text-green-600 bg-green-100 p-3 rounded-lg text-center text-sm">{sucesso}</p>}
                
                <div className="flex items-center justify-end space-x-4 pt-4">
                    <button type="button" onClick={() => router.push('/dashboard/usuarios')} className="px-6 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                      Cancelar
                    </button>
                    <button type="submit" disabled={enviando} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                    <UserPlus size={18} /> {enviando ? 'Cadastrando...' : 'Cadastrar e Notificar'}
                    </button>
                </div>
                </form>
            </div>
        </div>
      </main>
  );
}