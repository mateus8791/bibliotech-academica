// Arquivo: frontend/src/components/catalogo/RecomendadosCarousel.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { resolveCapaUrl } from '@/lib/resolveCapaUrl';

interface LivroRecomendado {
  id: string;
  titulo: string;
  capa_url: string | null;
  autor_nome: string | null;
  categoria_nome: string | null;
  motivo: string;
  score: number;
}

export default function RecomendadosCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    skipSnaps: false,
    dragFree: true,
  });

  const [livros, setLivros] = useState<LivroRecomendado[]>([]);
  const [temPreferencias, setTemPreferencias] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchRecomendacoes = async () => {
      try {
        setLoading(true);
        const response = await api.get('/recomendacoes');
        
        // Formatar os dados
        const livrosFormatados = (response.data.livros || []).map((livro: any) => ({
          ...livro,
          id: String(livro.id),
          capa_url: resolveCapaUrl(livro.capa_url),
        }));

        setLivros(livrosFormatados);
        setTemPreferencias(response.data.temPreferencias);
      } catch (error) {
        console.error('Erro ao buscar recomendações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecomendacoes();
  }, []);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  if (loading) {
    return (
      <div className="mb-12 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 w-48 rounded mb-6"></div>
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-[0_0_200px] sm:flex-[0_0_240px] aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Se não tem preferências, mostrar um banner de call-to-action
  if (!temPreferencias) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="text-amber-400" /> Recomendações Personalizadas
          </h2>
          <p className="text-blue-100 max-w-2xl">
            Sua estante parece vazia de recomendações. Configure seus autores e categorias favoritos no seu perfil para receber sugestões feitas sob medida para você, estilo Spotify!
          </p>
        </div>
        <Link 
          href="/perfil" 
          className="whitespace-nowrap px-6 py-3 bg-white text-blue-700 font-bold rounded-full hover:bg-gray-100 transition-all shadow-md hover:shadow-lg hover:scale-105"
        >
          Configurar Perfil
        </Link>
      </motion.div>
    );
  }

  if (livros.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12 relative"
    >
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              Feito para você
            </h2>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
              Com base nos seus gostos literários
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
            className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <button
            onClick={scrollNext}
            disabled={nextBtnDisabled}
            className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden px-2 pb-8 pt-2" ref={emblaRef}>
        <div className="flex gap-6">
          {livros.map((livro, index) => (
            <motion.div
              key={livro.id}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex-[0_0_200px] sm:flex-[0_0_240px]"
            >
              <Link href={`/livro/${livro.id}`}>
                <div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden h-full flex flex-col">
                  {/* Badge de Motivo (Curadoria) */}
                  <div className="absolute top-3 left-3 z-10 max-w-[85%]">
                    <div className="inline-block px-3 py-1 bg-black/70 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
                      <span className="text-[10px] sm:text-xs font-semibold text-white truncate block">
                        {livro.motivo}
                      </span>
                    </div>
                  </div>

                  {/* Capa */}
                  <div className="relative aspect-[2/3] w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {livro.capa_url && !imgErrors[livro.id] ? (
                      <Image
                        src={livro.capa_url}
                        alt={`Capa do livro ${livro.titulo}`}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 200px, 240px"
                        onError={() => setImgErrors(prev => ({ ...prev, [livro.id]: true }))}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                        <Image
                          src="/covers/placeholder-icon.png"
                          alt="Capa não disponível"
                          width={60}
                          height={60}
                          className="opacity-30"
                        />
                      </div>
                    )}
                    
                    {/* Gradiente sutil em cima da capa */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-grow bg-white dark:bg-gray-800 relative z-20 -mt-2 rounded-t-xl">
                    <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {livro.titulo}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                      {livro.autor_nome || 'Autor desconhecido'}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
