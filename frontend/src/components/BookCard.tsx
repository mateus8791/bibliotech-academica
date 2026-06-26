// Arquivo: frontend/src/components/BookCard.tsx
'use client';

import { useState, MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Book as BookIcon, Pencil, Trash2, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { getCategoryMood } from '@/lib/categoryMood';
import ConfirmDeleteModal from './ConfirmDeleteModal';

// --- DEFINIÇÃO DOS TIPOS (INTERFACES) ---
interface CategoriaRef {
  id?: string | number;
  nome: string;
}

interface Livro {
  id: string;
  titulo: string;
  capa_url: string | null;
  autores: string | null;
  // Campos opcionais de enriquecimento (vindos de /livros)
  nota_media?: number | string | null;
  total_avaliacoes?: number | string | null;
  quantidade_disponivel?: number | null;
  categorias?: CategoriaRef[] | string | null;
}

interface BookCardProps {
  livro: Livro;
  onDelete: (id: string) => void;
}

const BookCard = ({ livro, onDelete }: BookCardProps) => {
  const { usuario } = useAuth();
  const router = useRouter();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);

  // --- Dados de enriquecimento (tratados de forma segura) ---
  const notaNum =
    livro.nota_media !== undefined && livro.nota_media !== null
      ? Number(livro.nota_media)
      : null;
  const totalAval =
    livro.total_avaliacoes !== undefined && livro.total_avaliacoes !== null
      ? Number(livro.total_avaliacoes)
      : 0;
  const temNota = notaNum !== null && !isNaN(notaNum) && totalAval > 0;
  const disponivel = (livro.quantidade_disponivel ?? 0) > 0;
  const primeiraCategoria = Array.isArray(livro.categorias)
    ? livro.categorias[0]?.nome ?? null
    : typeof livro.categorias === 'string'
      ? livro.categorias.split(',')[0]?.trim() || null
      : null;
  const mood = primeiraCategoria ? getCategoryMood(primeiraCategoria) : null;

  const handleDeleteClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/livros/${livro.id}`);
      alert('Livro apagado com sucesso!');
      onDelete(livro.id); 
    } catch (error) {
      console.error("Erro ao apagar livro:", error);
      alert('Falha ao apagar o livro.');
    } finally {
      setIsModalOpen(false); 
      setIsDeleting(false);
    }
  };

  const handleEdit = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/dashboard/livros/editar/${livro.id}`);
  };

  return (
    // Usamos <> (Fragment) para agrupar o card e o modal
    <>
      <div className="group block text-left">
        <div className="flex flex-col h-full overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 relative">

          {/* Lógica de Permissão para os botões */}
          {usuario?.tipo_usuario === 'bibliotecario' && (
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button onClick={handleEdit} className="p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 hover:scale-110 transition-all" aria-label="Editar">
                <Pencil size={14} />
              </button>
              <button onClick={handleDeleteClick} disabled={isDeleting} className="p-2 bg-red-600 dark:bg-red-500 text-white rounded-full shadow-lg hover:bg-red-700 dark:hover:bg-red-600 hover:scale-110 transition-all disabled:bg-red-300 dark:disabled:bg-red-800" aria-label="Apagar">
                <Trash2 size={14} />
              </button>
            </div>
          )}

          {/* O conteúdo do card que leva para a página de detalhes */}
          <Link href={`/livro/${livro.id}`} className="flex flex-col flex-grow">
              <div className="relative aspect-[2/3] w-full bg-gray-100 dark:bg-gray-700">
                {livro.capa_url && !imgError ? (
                  <Image
                    src={livro.capa_url}
                    alt={`Capa do livro ${livro.titulo}`}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <Image src="/covers/placeholder-icon.png" alt="Capa não disponível" width={64} height={64} className="opacity-50" />
                  </div>
                )}

                {/* Badge de disponibilidade */}
                <span
                  className={`absolute top-2 left-2 z-[5] inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm ${
                    disponivel
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-gray-700/80 text-gray-100'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${disponivel ? 'bg-white' : 'bg-gray-300'}`} />
                  {disponivel ? 'Disponível' : 'Esgotado'}
                </span>
              </div>
              <div className="p-3 flex flex-col flex-grow">
                {/* Chip de categoria (cor por "mood") */}
                {mood && primeiraCategoria && (
                  <span className={`mb-1.5 inline-flex w-max items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${mood.chip}`}>
                    <span>{mood.emoji}</span>
                    <span className="truncate max-w-[120px]">{primeiraCategoria}</span>
                  </span>
                )}

                <h3 className="font-bold text-sm text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {livro.titulo}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {livro.autores || 'Autor desconhecido'}
                </p>

                {/* Avaliação */}
                <div className="mt-2 flex items-center gap-1">
                  {temNota ? (
                    <>
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                        {notaNum!.toFixed(1)}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        ({totalAval})
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                      <Star className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                      Sem avaliações
                    </span>
                  )}
                </div>
              </div>
          </Link>
        </div>
      </div>

      {/* **** AQUI ESTÁ A CORREÇÃO **** */}
      {/* Renderiza o modal (ele só aparece na tela se 'isOpen' for true) */}
      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={livro.titulo} // Usamos 'itemName' em vez de 'bookTitle'
      />
    </>
  );
};

export default BookCard;