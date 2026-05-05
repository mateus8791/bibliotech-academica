// Arquivo: frontend/src/app/dashboard/livros/editar/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { Save, LoaderCircle } from 'lucide-react';

// Define a "forma" dos dados do formulário
interface FormData {
  titulo: string;
  isbn: string;
  ano_publicacao: string;
  num_paginas: string;
  sinopse: string;
  capa_url: string;
  autor_nome: string;
  categoria_nome: string;
}

export default function EditarLivroPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string; // Pega o ID do livro da URL

  // Estados do formulário e de controle
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [tituloOriginal, setTituloOriginal] = useState('');

  // Busca os dados do livro específico QUANDO A PÁGINA CARREGA NO NAVEGADOR
  useEffect(() => {
    // Só executa se tivermos um ID na URL
    if (!id) return; 
    
    const fetchData = async () => {
      try {
        setCarregando(true);
        // A chamada api.get já envia o token de segurança automaticamente
        const response = await api.get(`/livros/${id}`);
        const bookData = response.data;
        
        // Preenche o formulário com os dados que vieram da API
        setFormData({
            titulo: bookData.titulo || '',
            isbn: bookData.isbn || '',
            ano_publicacao: bookData.ano_publicacao?.toString() || '',
            num_paginas: bookData.num_paginas?.toString() || '',
            sinopse: bookData.sinopse || '',
            capa_url: bookData.capa_url || '',
            autor_nome: bookData.autor_nome || '',
            categoria_nome: bookData.categoria_nome || '',
        });
        setTituloOriginal(bookData.titulo || ''); // Guarda o título original para exibir no cabeçalho
      } catch (error) {
        console.error("Falha ao carregar dados do livro:", error);
        setErro('Não foi possível carregar os dados do livro. Tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    fetchData();
  }, [id]); // Depende do ID, então só roda uma vez

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.currentTarget.name]: e.currentTarget.value }));
  };

  // Envia os dados atualizados para a API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    setSucesso('');
    
    const dadosParaEnviar = {
      ...formData,
      ano_publicacao: Number(formData.ano_publicacao) || null,
      num_paginas: Number(formData.num_paginas) || null,
    };

    try {
      await api.put(`/livros/${id}`, dadosParaEnviar);
      setSucesso('Livro atualizado com sucesso!');
      setTimeout(() => {
        router.push('/catalogo');
      }, 1500);
    } catch (error: any) {
      setErro(error.response?.data?.mensagem || 'Falha ao atualizar o livro.');
    } finally {
      setEnviando(false);
    }
  };

  // Tela de Loading enquanto busca os dados
  if (carregando) {
    return (
        <div>
            <div className="flex justify-center items-center h-full text-gray-500">
                <LoaderCircle className="animate-spin mr-4" size={32}/>
                Carregando dados do livro para edição...
            </div>
        </div>
    );
  }
  
  // Tela de Erro se a busca falhar
  if (erro && !formData.titulo) {
      return (
          <div>
              <div className="text-center p-8 bg-white rounded-lg shadow-md">
                  <h1 className="text-2xl font-bold text-red-600">Erro ao Carregar</h1>
                  <p className="text-gray-600 mt-2">{erro}</p>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Editar Livro</h1>
        <p className="mb-6 text-gray-500 border-b pb-4">Alterando dados de: <strong>{tituloOriginal}</strong></p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" name="titulo" value={formData.titulo || ''} onChange={handleChange} placeholder="Título do Livro" required className="p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input type="text" name="isbn" value={formData.isbn || ''} onChange={handleChange} placeholder="ISBN" className="p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" name="autor_nome" value={formData.autor_nome || ''} onChange={handleChange} placeholder="Nome do Autor" required className="p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input type="text" name="categoria_nome" value={formData.categoria_nome || ''} onChange={handleChange} placeholder="Nome da Categoria" required className="p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="number" name="ano_publicacao" value={formData.ano_publicacao || ''} onChange={handleChange} placeholder="Ano de Publicação" className="p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            <input type="number" name="num_paginas" value={formData.num_paginas || ''} onChange={handleChange} placeholder="Nº de Páginas" className="p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <input type="text" name="capa_url" value={formData.capa_url || ''} onChange={handleChange} placeholder="URL da Imagem da Capa" className="w-full p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          <textarea name="sinopse" value={formData.sinopse || ''} onChange={handleChange} placeholder="Sinopse..." rows={4} className="w-full p-3 border-gray-300 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
          
          {erro && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-center">{erro}</p>}
          {sucesso && <p className="text-green-600 bg-green-100 p-3 rounded-lg text-center">{sucesso}</p>}
          
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button type="button" onClick={() => router.push('/catalogo')} className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
            <button type="submit" disabled={enviando} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300">
              <Save size={18} /> {enviando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
  );
}