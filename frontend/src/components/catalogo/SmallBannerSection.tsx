'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { resolveCapaUrl } from '@/lib/resolveCapaUrl';
import { BookOpen } from 'lucide-react';

interface Livro {
  id: string;
  titulo: string;
  capa_url: string | null;
  autores_nomes?: string | null;
}

export default function SmallBannerSection({ tipo = 'recentes' }: { tipo?: 'recentes' | 'recomendacoes' }) {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLivros = async () => {
      try {
        setLoading(true);
        let response;
        if (tipo === 'recomendacoes') {
           response = await api.get('/recomendacoes');
        } else {
           response = await api.get('/livros?limit=10&orderBy=recentes');
        }
        
        let data = [];
        if (response.data.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data.livros && Array.isArray(response.data.livros)) {
          data = response.data.livros;
        }

        const formatados = data.map((livro: any) => ({
          id: String(livro.id),
          titulo: livro.titulo,
          capa_url: resolveCapaUrl(livro.capa_url),
          autores_nomes: Array.isArray(livro.autores) 
            ? livro.autores.map((a: any) => a.nome).join(', ') 
            : livro.autores_nomes || 'Autor Desconhecido',
        }));
        
        const comCapa = formatados.filter((l: Livro) => l.capa_url);
        // Pega 4 livros para os banners para evitar espaços vazios
        setLivros(comCapa.slice(0, 4));
      } catch (error) {
        console.error('Erro ao buscar livros pro SmallBanner:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLivros();
  }, [tipo]);

  if (loading) {
    return (
      <div className="flex gap-4 mt-8 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-shrink-0 w-64 h-28 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (livros.length === 0) return null;

  return (
    <div className="flex gap-4 mt-8 mb-12 overflow-x-auto pb-4 snap-x hide-scrollbar">
      {livros.map((livro, idx) => (
        <Link 
          href={`/livro/${livro.id}`} 
          key={livro.id}
          className="snap-start flex-shrink-0 w-72 md:w-80 h-32 relative rounded-2xl overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-r from-blue-700 to-indigo-800"
        >
          {/* Fundo decorativo (opcional blur da capa) */}
          {livro.capa_url && (
             <Image
             src={livro.capa_url}
             alt={livro.titulo}
             fill
             className="object-cover opacity-20 blur-md saturate-200 mix-blend-overlay group-hover:opacity-30 transition-opacity duration-300"
           />
          )}
          
          <div className="absolute inset-0 p-4 flex items-center gap-4">
            {/* Capinha do Livro */}
            <div className="relative w-[60px] h-[85px] flex-shrink-0 shadow-lg rounded-sm overflow-hidden group-hover:scale-105 transition-transform duration-300">
               {livro.capa_url ? (
                 <Image src={livro.capa_url} alt="Capa" fill className="object-cover" unoptimized />
               ) : (
                 <div className="w-full h-full bg-blue-900 flex items-center justify-center text-xs text-white">S/Capa</div>
               )}
            </div>

            {/* Textos */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-200 mb-1 tracking-wider">
                <BookOpen className="w-3 h-3" /> Recomendado
              </span>
              <h4 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1 group-hover:text-blue-100">
                {livro.titulo}
              </h4>
              <p className="text-blue-300 text-xs line-clamp-1">
                {livro.autores_nomes}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
