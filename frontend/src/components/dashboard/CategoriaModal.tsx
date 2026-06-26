'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useCreateCategory, useUpdateCategory, type Category } from '@/lib/hooks/useCategories';

interface CategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoria: Category | null;
  onSuccess: () => void;
}

export default function CategoriaModal({ isOpen, onClose, categoria, onSuccess }: CategoriaModalProps) {
  const [name, setName] = useState('');
  const [descricao, setDescricao] = useState('');

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  useEffect(() => {
    if (isOpen) {
      if (categoria) {
        setName(categoria.name || '');
        setDescricao(categoria.descricao || '');
      } else {
        setName('');
        setDescricao('');
      }
    }
  }, [isOpen, categoria]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (categoria) {
      updateMutation.mutate(
        { category_id: categoria.category_id, name, descricao },
        {
          onSuccess: () => {
            onSuccess();
          },
          onError: (err: any) => {
            alert(err.response?.data?.mensagem || 'Erro ao atualizar categoria');
          }
        }
      );
    } else {
      createMutation.mutate(
        { name, descricao },
        {
          onSuccess: () => {
            onSuccess();
          },
          onError: (err: any) => {
            alert(err.response?.data?.mensagem || 'Erro ao criar categoria');
          }
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {categoria ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Categoria <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-800 dark:text-white"
                placeholder="Ex: Ficção Científica"
              />
            </div>
            
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                id="descricao"
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-800 dark:text-white resize-none"
                placeholder="Breve descrição sobre a categoria..."
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
                  {categoria ? 'Salvar Alterações' : 'Criar Categoria'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
