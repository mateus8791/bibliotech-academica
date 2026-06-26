'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PenTool, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import api from '@/services/api';
import { resolveCapaUrl } from '@/lib/resolveCapaUrl';

interface Livro {
  id: string;
  titulo: string;
  capa_url: string | null;
}

interface AutorDestaque {
  nome: string;
  livros: Livro[];
}

export default function AutoresEmDestaque() {
  const [autores, setAutores] = useState<AutorDestaque[]>([]);
  const [loading, setLoading] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
  });

  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(true);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevDisabled(!emblaApi.canScrollPrev());
    setNextDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const fetchAutores = async () => {
      try {
        setLoading(true);
        // Busca livros recentes ou com boas avaliações para extrair os autores
        const response = await api.get('/livros?limit=50');
        const data: any[] = Array.isArray(response.data) ? response.data : response.data?.data ?? [];

        const autoresMap = new Map<string, AutorDestaque>();

        data.forEach((livro: any) => {
          const nomeAutor = Array.isArray(livro.autores) 
            ? livro.autores.map((a: any) => a.nome).join(', ') 
            : livro.autores_nomes;
            
          if (nomeAutor && nomeAutor !== 'Autor Desconhecido') {
            if (!autoresMap.has(nomeAutor)) {
              autoresMap.set(nomeAutor, { nome: nomeAutor, livros: [] });
            }
            if (livro.capa_url) {
              const autorData = autoresMap.get(nomeAutor)!;
              // Evita duplicidade de livros pro mesmo autor
              if (!autorData.livros.find(l => l.id === String(livro.id))) {
                autorData.livros.push({
                  id: String(livro.id),
                  titulo: livro.titulo,
                  capa_url: resolveCapaUrl(livro.capa_url),
                });
              }
            }
          }
        });

        // Filtra autores que têm pelo menos 1 livro com capa e ordena pela quantidade de livros
        const autoresFiltrados = Array.from(autoresMap.values())
          .filter(a => a.livros.length > 0)
          .sort((a, b) => b.livros.length - a.livros.length)
          .slice(0, 8); // Pega os top 8 autores

        setAutores(autoresFiltrados);
      } catch (error) {
        console.error('Erro ao buscar autores:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAutores();
  }, []);

  if (loading) {
    return (
      <div className="my-12 animate-pulse px-2">
         <div className="h-8 bg-gray-200 dark:bg-gray-800 w-56 rounded mb-8"></div>
         <div className="flex gap-6 overflow-hidden">
           {[1, 2, 3].map(i => (
             <div key={i} className="flex-shrink-0 w-80 h-40 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
           ))}
         </div>
      </div>
    );
  }

  if (autores.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="my-16"
    >
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 p-2.5 dark:from-amber-900/30 dark:to-orange-900/30">
            <PenTool className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Autores em Destaque</h2>
            <p className="text-gray-500 dark:text-gray-400">Grandes mentes por trás de grandes obras</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={scrollPrev}
            disabled={prevDisabled}
            className="rounded-full border border-gray-200 bg-white p-2 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-200" />
          </button>
          <button
            onClick={scrollNext}
            disabled={nextDisabled}
            className="rounded-full border border-gray-200 bg-white p-2 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden px-2 pb-6" ref={emblaRef}>
        <div className="flex gap-6">
          {autores.map((autor, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="flex-[0_0_90%] sm:flex-[0_0_320px] relative group"
            >
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col justify-between relative overflow-hidden">
                {/* Efeito sutil de fundo animado */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
                
                <div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-md">
                    {autor.nome.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {autor.nome}
                  </h3>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-6 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg inline-block">
                    Selecionado por ter {autor.livros.length} obras no acervo
                  </p>
                </div>

                <div className="flex items-center gap-[-10px] relative z-10">
                  {autor.livros.slice(0, 3).map((livro, i) => (
                    <Link 
                      href={`/livro/${livro.id}`} 
                      key={livro.id}
                      className="relative w-14 h-20 rounded-md shadow-md hover:shadow-lg hover:-translate-y-2 transition-all duration-300 border border-white/20 dark:border-gray-700 overflow-hidden bg-gray-200"
                      style={{ 
                        marginLeft: i === 0 ? '0' : '-16px',
                        zIndex: 10 - i,
                        transform: `rotate(${i === 0 ? -5 : i === 1 ? 0 : 5}deg)`
                      }}
                      title={livro.titulo}
                    >
                      {livro.capa_url && (
                        <Image src={livro.capa_url} alt={livro.titulo} fill className="object-cover" unoptimized />
                      )}
                    </Link>
                  ))}
                  {autor.livros.length > 3 && (
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300 -ml-3 z-0 shadow-sm">
                      +{autor.livros.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
