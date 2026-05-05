'use client';

import { Check } from 'lucide-react';

interface Categoria {
  nome: string;
  emoji: string;
  cor: string;
}

interface CategoryCardProps {
  categoria: Categoria;
  selecionada: boolean;
  onToggle: (nome: string) => void;
}

export function CategoryCard({ categoria, selecionada, onToggle }: CategoryCardProps) {
  return (
    <button
      onClick={() => onToggle(categoria.nome)}
      className={`
        relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-sm font-medium
        transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer text-left w-full
        ${selecionada
          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {/* Ícone com fundo colorido */}
      <span
        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg ${categoria.cor}`}
      >
        {categoria.emoji}
      </span>

      <span className="flex-1 leading-tight">{categoria.nome}</span>

      {/* Check mark */}
      {selecionada && (
        <span className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white stroke-[3]" />
        </span>
      )}
    </button>
  );
}
