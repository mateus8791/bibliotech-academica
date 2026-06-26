'use client';

import { useState } from 'react';
import { PlusCircle, Tags, Trash2, Pencil } from 'lucide-react';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { useCategories, useDeleteCategory, type Category } from '@/lib/hooks/useCategories';
// Precisamos criar EditarCategoriaModal e NovaCategoriaModal ou usar o mesmo
import CategoriaModal from '@/components/dashboard/CategoriaModal';

export default function AdminCategoriasPage() {
  const [categoriaParaDeletar, setCategoriaParaDeletar] = useState<Category | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: categorias = [], isLoading, isError, refetch } = useCategories();
  const deleteMutation = useDeleteCategory();

  const handleDelete = () => {
    if (!categoriaParaDeletar) return;
    deleteMutation.mutate(categoriaParaDeletar.category_id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setCategoriaParaDeletar(null);
      },
      onError: (err: any) => {
        alert(err.response?.data?.mensagem || 'Erro ao excluir categoria');
      }
    });
  };

  const openDeleteModal = (categoria: Category) => {
    setCategoriaParaDeletar(categoria);
    setDeleteModalOpen(true);
  };

  const openEditModal = (categoria: Category) => {
    setCategoriaParaEditar(categoria);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setCategoriaParaEditar(null);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setCategoriaParaEditar(null);
    refetch();
  };

  return (
    <>
      <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <Tags className="w-8 h-8 mr-3 text-blue-600" />
              Gerenciamento de Categorias
            </h1>

            <div className="flex items-center gap-2">
              <button 
                onClick={openNewModal}
                className="flex items-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Adicionar Nova Categoria
              </button>
            </div>
          </div>

          {isLoading && <p className="text-center text-gray-500">Carregando...</p>}
          {isError && !isLoading && (
            <p className="text-center text-red-500 bg-red-100 p-3 rounded-lg">
              Não foi possível carregar as categorias. Tente novamente mais tarde.
            </p>
          )}

          {!isLoading && !isError && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categorias.length > 0 ? (
                    categorias.map((categoria) => (
                      <tr key={categoria.category_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{categoria.category_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{categoria.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{categoria.descricao ?? '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button onClick={() => openEditModal(categoria)} className="p-2 text-gray-400 hover:text-blue-600" aria-label="Editar">
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button onClick={() => openDeleteModal(categoria)} className="p-2 text-gray-400 hover:text-red-600" aria-label="Deletar">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-500">Nenhuma categoria cadastrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={categoriaParaDeletar?.name ?? ''}
      />

      <CategoriaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoria={categoriaParaEditar}
        onSuccess={handleSuccess}
      />
    </>
  );
}
