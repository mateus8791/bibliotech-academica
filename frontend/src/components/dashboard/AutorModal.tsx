'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useCreateAuthor, useUpdateAuthor, type Author } from '@/lib/hooks/useAuthors';

interface AutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  autor: Author | null;
  onSuccess: () => void;
}

export default function AutorModal({ isOpen, onClose, autor, onSuccess }: AutorModalProps) {
  const [name, setName] = useState('');
  const [biografia, setBiografia] = useState('');
  const [nacionalidade, setNacionalidade] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  const createMutation = useCreateAuthor();
  const updateMutation = useUpdateAuthor();

  useEffect(() => {
    if (isOpen) {
      if (autor) {
        setName(autor.name || '');
        setBiografia(autor.biografia || '');
        setNacionalidade(autor.nacionalidade || '');
        // Formatar data para o input date (YYYY-MM-DD)
        setDataNascimento(autor.data_nascimento ? new Date(autor.data_nascimento).toISOString().split('T')[0] : '');
        setFotoUrl(autor.foto_url || '');
      } else {
        setName('');
        setBiografia('');
        setNacionalidade('');
        setDataNascimento('');
        setFotoUrl('');
      }
    }
  }, [isOpen, autor]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      biografia,
      nacionalidade,
      data_nascimento: dataNascimento || undefined,
      foto_url: fotoUrl
    };

    if (autor) {
      updateMutation.mutate(
        { author_id: autor.author_id, ...payload },
        {
          onSuccess: () => {
            onSuccess();
          },
          onError: (err: any) => {
            alert(err.response?.data?.mensagem || 'Erro ao atualizar autor');
          }
        }
      );
    } else {
      createMutation.mutate(
        payload,
        {
          onSuccess: () => {
            onSuccess();
          },
          onError: (err: any) => {
            alert(err.response?.data?.mensagem || 'Erro ao criar autor');
          }
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {autor ? 'Editar Autor' : 'Novo Autor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Autor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-800 dark:text-white"
                placeholder="Ex: Machado de Assis"
              />
            </div>
            
            <div>
              <label htmlFor="nacionalidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nacionalidade
              </label>
              <input
                type="text"
                id="nacionalidade"
                value={nacionalidade}
                onChange={(e) => setNacionalidade(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-800 dark:text-white"
                placeholder="Ex: Brasileiro"
              />
            </div>

            <div>
              <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                id="dataNascimento"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="fotoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL da Foto
              </label>
              <input
                type="url"
                id="fotoUrl"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-800 dark:text-white"
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="biografia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Biografia
              </label>
              <textarea
                id="biografia"
                rows={4}
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-800 dark:text-white resize-none"
                placeholder="Breve biografia..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending ? 'Salvando...' : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {autor ? 'Salvar Alterações' : 'Criar Autor'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
