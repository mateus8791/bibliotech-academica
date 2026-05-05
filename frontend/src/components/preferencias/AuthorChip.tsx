'use client';

import { X } from 'lucide-react';

interface Autor {
  author_id: string;
  name: string;
  foto_url: string | null;
}

interface AuthorChipProps {
  autor: Autor;
  onRemover: (id: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

export function AuthorChip({ autor, onRemover }: AuthorChipProps) {
  return (
    <div className="flex items-center gap-2 bg-white border-2 border-blue-200 rounded-full pl-1 pr-3 py-1 shadow-sm">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
        {autor.foto_url ? (
          <img
            src={autor.foto_url}
            alt={autor.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<span class="text-white text-xs font-bold">${getInitials(autor.name)}</span>`;
              }
            }}
          />
        ) : (
          <span className="text-white text-xs font-bold">{getInitials(autor.name)}</span>
        )}
      </div>

      <span className="text-sm font-medium text-gray-800">{autor.name}</span>

      <button
        onClick={() => onRemover(autor.author_id)}
        className="w-5 h-5 rounded-full bg-gray-200 hover:bg-red-100 flex items-center justify-center transition-colors"
        aria-label={`Remover ${autor.name}`}
      >
        <X className="w-3 h-3 text-gray-600 hover:text-red-500" />
      </button>
    </div>
  );
}
