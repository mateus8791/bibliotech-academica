'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Pencil, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import EditUserModal from '@/components/dashboard/EditUserModal';
import { useDebounce } from '@/hooks/useDebounce';
import { useUsers, useDeleteUser, type User } from '@/lib/hooks/useUsers';

const TIPO_LABEL: Record<User['tipo_usuario'], string> = {
  aluno: 'Aluno',
  bibliotecario: 'Bibliotecário',
  admin: 'Administrador',
};

export default function GerenciamentoUsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<User['tipo_usuario'] | ''>('');
  const [usuarioParaDeletar, setUsuarioParaDeletar] = useState<User | null>(null);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<User | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: usuarios = [], isLoading, isError } = useUsers({
    search: debouncedSearchTerm || undefined,
    tipo: filterType || undefined,
  });
  
  const deleteMutation = useDeleteUser();

  const handleDelete = () => {
    if (!usuarioParaDeletar) return;
    deleteMutation.mutate(usuarioParaDeletar.id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setUsuarioParaDeletar(null);
      },
    });
  };

  const openDeleteModal = (usuario: User) => {
    setUsuarioParaDeletar(usuario);
    setDeleteModalOpen(true);
  };

  const openEditModal = (usuario: User) => {
    setUsuarioParaEditar(usuario);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setUsuarioParaEditar(null);
  };

  return (
    <>
      <main className="flex-1 p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              Usuários
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Gerencie alunos, bibliotecários e administradores do sistema.
            </p>
          </div>
          <Link href="/dashboard/usuarios/novo">
            <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all">
              <Plus className="w-5 h-5" />
              Adicionar Usuário
            </button>
          </Link>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou email..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all outline-none cursor-pointer appearance-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as User['tipo_usuario'] | '')}
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="">Todos os tipos</option>
              <option value="aluno">Apenas Alunos</option>
              <option value="bibliotecario">Apenas Bibliotecários</option>
              <option value="admin">Apenas Administradores</option>
            </select>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Buscando usuários...</p>
          </div>
        )}
        
        {isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center text-red-600 dark:text-red-400">
            <p className="font-semibold text-lg">Oops!</p>
            <p>Não foi possível carregar a lista de usuários.</p>
          </div>
        )}

        {/* Users Table */}
        {!isLoading && !isError && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {usuarios.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-gray-900/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reservas</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permissão</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data de Cadastro</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 shadow-sm">
                              {usuario.foto_url ? (
                                <Image
                                  className="h-full w-full object-cover"
                                  src={usuario.foto_url}
                                  alt={`Foto de ${usuario.nome}`}
                                  width={44}
                                  height={44}
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-lg">
                                  {usuario.nome.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">{usuario.nome}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{usuario.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {usuario.tem_reserva_ativa ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                              Ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                              <XCircle className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                              Nenhuma
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${
                              usuario.tipo_usuario === 'admin'
                                ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
                                : usuario.tipo_usuario === 'bibliotecario'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                            }`}
                          >
                            {TIPO_LABEL[usuario.tipo_usuario]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-medium">
                          {usuario.data_cadastro ? new Date(usuario.data_cadastro).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openEditModal(usuario)}
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg shadow-sm border border-transparent hover:border-blue-100 dark:hover:border-gray-600 transition-all" 
                              title="Editar Usuário"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(usuario)} 
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg shadow-sm border border-transparent hover:border-red-100 dark:hover:border-gray-600 transition-all" 
                              title="Excluir Usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Botões visíveis em mobile (sempre) */}
                          <div className="flex items-center justify-end gap-2 md:hidden">
                            <button onClick={() => openEditModal(usuario)} className="p-2 text-blue-600 bg-blue-50 dark:bg-gray-700 rounded-lg">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => openDeleteModal(usuario)} className="p-2 text-red-600 bg-red-50 dark:bg-gray-700 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Nenhum usuário encontrado</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  Não encontramos nenhum usuário com os filtros selecionados. Tente limpar a busca ou mudar o tipo.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        user={usuarioParaEditar}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={usuarioParaDeletar?.nome ?? ''}
      />
    </>
  );
}
