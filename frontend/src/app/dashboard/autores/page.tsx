'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlusCircle, PenTool, Trash2, Pencil, UserCircle } from 'lucide-react';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { useAuthors, useDeleteAuthor, type Author } from '@/lib/hooks/useAuthors';
import AutorModal from '@/components/dashboard/AutorModal';

export default function AdminAutoresPage() {
  const [autorParaDeletar, setAutorParaDeletar] = useState<Author | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [autorParaEditar, setAutorParaEditar] = useState<Author | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: autores = [], isLoading, isError, refetch } = useAuthors();
  const deleteMutation = useDeleteAuthor();

  const handleDelete = () => {
    if (!autorParaDeletar) return;
    deleteMutation.mutate(autorParaDeletar.author_id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setAutorParaDeletar(null);
      },
      onError: (err: any) => {
        alert(err.response?.data?.mensagem || 'Erro ao excluir autor');
      }
    });
  };

  const openDeleteModal = (autor: Author) => {
    setAutorParaDeletar(autor);
    setDeleteModalOpen(true);
  };

  const openEditModal = (autor: Author) => {
    setAutorParaEditar(autor);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setAutorParaEditar(null);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setAutorParaEditar(null);
    refetch();
  };

  return (
    <>
      <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <PenTool className="w-8 h-8 mr-3 text-blue-600" />
              Gerenciamento de Autores
            </h1>

            <div className="flex items-center gap-2">
              <button 
                onClick={openNewModal}
                className="flex items-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Adicionar Novo Autor
              </button>
            </div>
          </div>

          {isLoading && <p className="text-center text-gray-500">Carregando...</p>}
          {isError && !isLoading && (
            <p className="text-center text-red-500 bg-red-100 p-3 rounded-lg">
              Não foi possível carregar os autores. Tente novamente mais tarde.
            </p>
          )}

          {!isLoading && !isError && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nacionalidade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nascimento</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {autores.length > 0 ? (
                    autores.map((autor) => (
                      <tr key={autor.author_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 flex items-center justify-center rounded-full overflow-hidden">
                            {autor.foto_url ? (
                              <Image
                                src={autor.foto_url}
                                alt={`Foto de ${autor.name}`}
                                width={40}
                                height={40}
                                className="object-cover h-10 w-10"
                              />
                            ) : (
                              <UserCircle className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{autor.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{autor.nacionalidade ?? '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                           {autor.data_nascimento ? new Date(autor.data_nascimento).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button onClick={() => openEditModal(autor)} className="p-2 text-gray-400 hover:text-blue-600" aria-label="Editar">
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button onClick={() => openDeleteModal(autor)} className="p-2 text-gray-400 hover:text-red-600" aria-label="Deletar">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500">Nenhum autor cadastrado.</td>
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
        itemName={autorParaDeletar?.name ?? ''}
      />

      <AutorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        autor={autorParaEditar}
        onSuccess={handleSuccess}
      />
    </>
  );
}
