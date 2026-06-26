// Arquivo: frontend/src/components/catalogo/CategoriasGrid.tsx
'use client';

import React from 'react';
import { BookOpen, Heart, Drama, FlaskConical, Monitor, Landmark, User, LayoutGrid } from 'lucide-react';

interface Category {
  category_id: number;
  name: string;
}

interface CategoriasGridProps {
  categories: Category[];
  onSelectCategory: (id: number | null) => void;
  selectedCategory: number | null;
}

// Mapeamento simples de ícones por nome de categoria
const getIconForCategory = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('ficção') || n.includes('literatura')) return <BookOpen className="w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />;
  if (n.includes('romance')) return <Heart className="w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />;
  if (n.includes('suspense') || n.includes('terror') || n.includes('drama')) return <Drama className="w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />;
  if (n.includes('ciência') || n.includes('exatas')) return <FlaskConical className="w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />;
  if (n.includes('tecnologia') || n.includes('informática')) return <Monitor className="w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />;
  if (n.includes('história') || n.includes('humanas')) return <Landmark className="w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />;
  if (n.includes('biografia')) return <User className="w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />;
  return <BookOpen className="w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />; // default
};

export default function CategoriasGrid({ categories, onSelectCategory, selectedCategory }: CategoriasGridProps) {
  // Pegamos apenas as primeiras 7 para deixar o 8º como "Ver todas"
  const topCategories = categories.slice(0, 7);

  return (
    <div className="mb-16">
      <div className="flex items-center gap-3 mb-6 px-2">
        <LayoutGrid className="w-8 h-8 text-indigo-600 fill-indigo-600/20" />
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Explorar categorias</h2>
          <p className="text-gray-500 dark:text-gray-400">Encontre livros por temas do seu interesse</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 px-2">
        {topCategories.map(cat => (
          <button
            key={cat.category_id}
            onClick={() => onSelectCategory(cat.category_id)}
            className={`group flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 ${
              selectedCategory === cat.category_id
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-indigo-950 text-indigo-100 hover:bg-blue-700 hover:text-white hover:scale-105 hover:shadow-xl'
            }`}
          >
            {getIconForCategory(cat.name)}
            <span className="text-sm font-semibold text-center leading-tight">{cat.name}</span>
          </button>
        ))}

        <button
          onClick={() => onSelectCategory(null)}
          className={`group flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 ${
            selectedCategory === null
              ? 'bg-blue-500 text-white shadow-lg scale-105'
              : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white hover:scale-105 hover:shadow-xl dark:bg-blue-500/20 dark:text-blue-400'
          }`}
        >
          <LayoutGrid className="w-8 h-8 mb-3 opacity-80 group-hover:opacity-100 transition-opacity" />
          <span className="text-sm font-semibold text-center leading-tight">Ver todas</span>
        </button>
      </div>
    </div>
  );
}
