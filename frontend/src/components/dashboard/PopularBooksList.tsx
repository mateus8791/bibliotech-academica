'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

interface LivroPopular {
  id: number;
  titulo: string;
  autores: string;
  capa_url: string | null;
  total_emprestimos?: number;
  total_reservas?: number;
}

interface PopularBooksListProps {
  livros: LivroPopular[];
}

export const PopularBooksList: React.FC<PopularBooksListProps> = ({ livros }) => {
  if (!livros || livros.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {livros.map((livro, index) => (
        <Link
          key={livro.id}
          href={`/catalogo/${livro.id}`}
          className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group"
        >
          {/* Ranking Badge */}
          <div className="flex-shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index === 0
                  ? 'bg-amber-100 text-amber-600'
                  : index === 1
                  ? 'bg-gray-100 text-gray-600'
                  : index === 2
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {index + 1}
            </div>
          </div>

          {/* Book Cover */}
          <div className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
            {livro.capa_url ? (
              <Image
                src={livro.capa_url}
                alt={livro.titulo}
                width={64}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                <span className="text-white text-lg font-bold">
                  {livro.titulo.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
              {livro.titulo}
            </h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              {livro.autores}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs text-gray-600">
                {livro.total_reservas || livro.total_emprestimos || 0} {livro.total_reservas ? 'reservas' : 'empréstimos'}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
