'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, BookOpen, Trash2, Pencil } from 'lucide-react';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { useAuth } from '@/contexts/AuthContext';
import { ImportLivrosModal } from '@/components/ImportLivrosModal';
import { useBooks, useDeleteBook, type Book } from '@/lib/hooks/useBooks';

export default function AdminLivrosPage() {
  const [livroParaDeletar, setLivroParaDeletar] = useState<Book | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const { usuario } = useAuth();
  const { data: livros = [], isLoading, isError } = useBooks();
  const deleteMutation = useDeleteBook();

  const handleDelete = () => {
    if (!livroParaDeletar) return;
    deleteMutation.mutate(Number(livroParaDeletar.id), {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setLivroParaDeletar(null);
      },
    });
  };

  const openDeleteModal = (livro: Book) => {
    setLivroParaDeletar(livro);
    setDeleteModalOpen(true);
  };

  return (
    <>
      <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
              Gerenciamento de Livros
            </h1>

            <div className="flex items-center gap-2">
              <Link href="/dashboard/livros/novo">
                <button className="flex items-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Adicionar Novo Livro
                </button>
              </Link>

              {usuario?.tipo_usuario === 'bibliotecario' && <ImportLivrosModal />}
            </div>
          </div>

          {isLoading && <p className="text-center text-gray-500">Carregando...</p>}
          {isError && !isLoading && (
            <p className="text-center text-red-500 bg-red-100 p-3 rounded-lg">
              Não foi possível carregar os livros. Tente novamente mais tarde.
            </p>
          )}

          {!isLoading && !isError && (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autor(es)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Disp.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Cadastro</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {livros.length > 0 ? (
                    livros.map((livro) => (
                      <tr key={livro.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex-shrink-0 h-16 w-12 bg-gray-200 flex items-center justify-center rounded">
                            {livro.capa_url ? (
                              <Image
                                src={livro.capa_url}
                                alt={`Capa de ${livro.titulo}`}
                                width={48}
                                height={64}
                                className="object-cover h-16 w-12 rounded"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-16 w-12 rounded bg-gray-200">
                                <BookOpen className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{livro.titulo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {livro.autores_nomes ?? livro.autores?.map((a) => a.nome).join(', ') ?? 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{livro.isbn ?? 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-700">{livro.quantidade_disponivel}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{livro.data_cadastro ?? '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Link href={`/dashboard/livros/editar/${livro.id}`} passHref>
                            <button className="p-2 text-gray-400 hover:text-blue-600" aria-label="Editar">
                              <Pencil className="w-5 h-5" />
                            </button>
                          </Link>
                          <button onClick={() => openDeleteModal(livro)} className="p-2 text-gray-400 hover:text-red-600" aria-label="Deletar">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-500">Nenhum livro cadastrado.</td>
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
        itemName={livroParaDeletar?.titulo ?? ''}
      />
    </>
  );
}
