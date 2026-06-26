'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Search, Loader2, BookOpen, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import api from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';

interface GoogleBook {
  google_id: string;
  titulo: string;
  autores: string[];
  descricao: string;
  isbn: string;
  numero_paginas: number;
  capa_url: string;
  editora: string;
  ano_publicacao: string;
}

interface GoogleBooksSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (book: GoogleBook) => void;
}

export default function GoogleBooksSearchModal({ isOpen, onClose, onSelectBook }: GoogleBooksSearchModalProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchBooks = async () => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await api.get('/integrations/google-books/search', { params: { query: debouncedQuery } });
        setResults(response.data || []);
      } catch (err: any) {
        setResults([]);
        if (err.response?.status === 403) {
           setError('Integração com Google Books não está habilitada.');
        } else {
           setError('Erro ao buscar livros na API.');
        }
      } finally {
        setLoading(false);
      }
    };

    searchBooks();
  }, [debouncedQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Search className="w-6 h-6 text-blue-600" /> Buscar no Google Books
            </h2>
            <p className="text-sm text-gray-500 mt-1">Busque pelo título, autor ou ISBN</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              ref={inputRef}
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o título do livro..." 
              className="w-full p-4 pl-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-800 dark:text-white text-lg" 
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" size={20} />}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-gray-900/50">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          {!loading && !error && results.length === 0 && query && debouncedQuery === query && (
             <div className="text-center py-10 text-gray-500">
               Nenhum livro encontrado para "{query}".
             </div>
          )}

          {!loading && !error && results.length === 0 && !query && (
             <div className="text-center py-10 text-gray-400 flex flex-col items-center">
               <BookOpen className="w-12 h-12 mb-3 opacity-50" />
               <p>Os resultados da busca aparecerão aqui.</p>
             </div>
          )}

          <div className="space-y-4">
            {results.map((book) => (
              <div key={book.google_id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-20 h-28 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden flex items-center justify-center">
                  {book.capa_url ? (
                    <Image src={book.capa_url} alt={book.titulo} width={80} height={112} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg">{book.titulo}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                    <span className="font-medium">Autor(es):</span> {book.autores.join(', ') || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    <span className="font-medium">ISBN:</span> {book.isbn || 'N/A'} • <span className="font-medium">Ano:</span> {book.ano_publicacao || 'N/A'} • <span className="font-medium">Páginas:</span> {book.numero_paginas || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 leading-snug">
                    {book.descricao || 'Nenhuma descrição disponível.'}
                  </p>
                  <div className="mt-auto pt-3 flex justify-end">
                    <button 
                      onClick={() => onSelectBook(book)}
                      className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Selecionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
