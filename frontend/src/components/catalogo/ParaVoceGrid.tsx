// Arquivo: frontend/src/components/catalogo/ParaVoceGrid.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
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

const slugify = (text: string) => {
  return text.toString().toLowerCase()
    .replace(/[àáâãäå]/g,"a").replace(/æ/g,"ae").replace(/ç/g,"c")
    .replace(/[èéêë]/g,"e").replace(/[ìíîï]/g,"i").replace(/ñ/g,"n")
    .replace(/[òóôõö]/g,"o").replace(/œ/g,"oe").replace(/[ùúûü]/g,"u")
    .replace(/[ýÿ]/g,"y").replace(/[\s_]+/g, '-').replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

export default function ParaVoceGrid() {
  const [livros, setLivros] = useState<LivroRecomendado[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerErrors, setBannerErrors] = useState<Record<string, boolean>>({});

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true });
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

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

  useEffect(() => {
    const fetchRecomendacoes = async () => {
      try {
        setLoading(true);
        const response = await api.get('/recomendacoes');
        const livrosFormatados = (response.data.livros || []).map((livro: any) => ({
          ...livro,
          id: String(livro.id),
          capa_url: resolveCapaUrl(livro.capa_url),
        }));
        setLivros(livrosFormatados);
      } catch (error) {
        console.error('Erro ao buscar recomendações:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecomendacoes();
  }, []);

  if (loading) {
    return (
      <div className="mb-16 animate-pulse px-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 w-48 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-[400px] bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
          <div className="flex flex-col gap-6">
            <div className="h-[125px] bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            <div className="h-[125px] bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            <div className="h-[125px] bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (livros.length < 2) return null;

  // Monta os "slides": cada slide tem 1 destaque + até 3 livros laterais
  const buildSlides = () => {
    const slides: { destaque: LivroRecomendado; laterais: LivroRecomendado[] }[] = [];
    let i = 0;
    while (i < livros.length) {
      const destaque = livros[i];
      const laterais = livros.slice(i + 1, i + 4); // até 3 laterais
      if (laterais.length > 0) {
        slides.push({ destaque, laterais });
      }
      i += 1 + laterais.length;
    }
    return slides;
  };

  const slides = buildSlides();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-16 relative"
    >
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <Heart className="w-8 h-8 text-blue-600 fill-blue-600" />
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Para você</h2>
            <p className="text-gray-500 dark:text-gray-400">Seleções personalizadas com base nos seus interesses</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="#" className="hidden sm:block text-blue-600 font-medium hover:underline mr-2">
            Ver todas <span className="text-xl leading-none">›</span>
          </Link>
          <button onClick={scrollPrev} disabled={prevBtnDisabled} className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <button onClick={scrollNext} disabled={nextBtnDisabled} className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden px-2" ref={emblaRef}>
        <div className="flex gap-6">
          {slides.map((slide, si) => (
            <div key={si} className="flex-[0_0_100%] min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* CARD DESTAQUE GRANDE (ESQUERDA) – USA BANNER SE EXISTIR */}
                <Link href={`/livro/${slide.destaque.id}`} className="md:col-span-2 group">
                  <div className="relative h-[420px] rounded-3xl overflow-hidden bg-gradient-to-br from-blue-700 to-indigo-900 flex text-white shadow-lg transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
                      <>
                        {/* Fundo Desfocado Baseado na Capa */}
                        {slide.destaque.capa_url && (
                          <div className="absolute inset-0 z-0">
                            <Image
                              src={slide.destaque.capa_url}
                              alt="Background"
                              fill
                              className="object-cover opacity-20 blur-2xl saturate-150 mix-blend-overlay"
                            />
                          </div>
                        )}
                        <div className="p-8 flex flex-col justify-between w-full sm:w-1/2 relative z-10">
                          <div>
                            <span className="inline-block px-4 py-1.5 bg-cyan-400/20 text-cyan-200 font-medium text-sm rounded-full mb-4 border border-cyan-400/30">
                              {slide.destaque.motivo || 'Recomendado para você'}
                            </span>
                            <h3 className="text-3xl md:text-4xl font-bold mb-2 leading-tight drop-shadow-md">{slide.destaque.titulo}</h3>
                            <p className="text-blue-200 mb-4 drop-shadow-md">{slide.destaque.autor_nome}</p>
                          </div>
                          <span className="bg-cyan-400 text-blue-950 font-bold px-6 py-3 rounded-full w-max hover:bg-cyan-300 transition-colors shadow-lg">Ver detalhes ›</span>
                        </div>
                        <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden sm:flex items-center justify-center p-8">
                          <div className="relative w-[180px] h-[260px] lg:w-[220px] lg:h-[320px] shadow-2xl rounded-md group-hover:scale-105 transition-transform duration-500 rotate-2 group-hover:rotate-0">
                            {slide.destaque.capa_url && (
                              <Image src={slide.destaque.capa_url} alt={slide.destaque.titulo} fill className="object-cover rounded-md" unoptimized />
                            )}
                          </div>
                        </div>
                      </>
                    <button className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors z-20">
                      <Heart className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </Link>

                {/* CARDS LATERAIS (DIREITA) – SEMPRE CSS COM TEXTO + CAPA (MAIS LIVROS!) */}
                <div className="flex flex-col gap-4 h-[420px]">
                  {slide.laterais.map((livro) => {
                    const cardHeight = slide.laterais.length === 1 ? 'h-full' : slide.laterais.length === 2 ? 'h-[calc(50%-8px)]' : 'h-[calc(33.33%-11px)]';
                    return (
                      <Link href={`/livro/${livro.id}`} key={livro.id} className={`group ${cardHeight}`}>
                        <div className="relative h-full rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-900 via-blue-900 to-blue-950 flex text-white shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                          
                          {/* Texto */}
                          <div className="p-5 flex flex-col justify-center w-[60%] relative z-10">
                            <span className="inline-block px-3 py-1 bg-blue-500/30 text-blue-200 font-medium text-[10px] rounded-full mb-2 w-max truncate max-w-full">
                              {livro.motivo || 'Baseado no que você lê'}
                            </span>
                            <h3 className="text-lg font-bold mb-1 leading-snug line-clamp-2">{livro.titulo}</h3>
                            <p className="text-blue-300 text-sm truncate">{livro.autor_nome}</p>
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-semibold text-amber-300">{(4 + livro.score / 100).toFixed(1)}</span>
                            </div>
                          </div>

                          {/* Capa do livro */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-[35%] flex items-center justify-center">
                            <div className="relative w-20 h-28 sm:w-24 sm:h-32">
                              {livro.capa_url && (
                                <Image
                                  src={livro.capa_url}
                                  alt={livro.titulo}
                                  fill
                                  unoptimized
                                  className="object-cover rounded-lg shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
