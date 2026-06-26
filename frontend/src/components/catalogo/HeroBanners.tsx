'use client';

import { useState, useEffect, useCallback, MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { resolveCapaUrl } from '@/lib/resolveCapaUrl';

interface Livro {
  id: string;
  titulo: string;
  capa_url: string | null;
  autores_nomes?: string | null;
  categorias_nomes?: string | null;
}

const INTERVALO = 8000; // 8 segundos por banner

export default function HeroBanners({ tipo = 'recentes' }: { tipo?: 'recentes' | 'recomendacoes' }) {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLivros = async () => {
      try {
        let response;
        if (tipo === 'recomendacoes') {
           response = await api.get('/recomendacoes'); // Endpoint de preferencias/recomendacoes
        } else {
           response = await api.get('/livros?limit=5&orderBy=recentes');
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
          categorias_nomes: Array.isArray(livro.categorias)
            ? livro.categorias.map((c: any) => c.nome).join(', ')
            : 'Ficção', // Fallback se não vier
        }));
        // Filtra apenas livros que têm capa, como solicitado
        const comCapa = formatados.filter((l: Livro) => l.capa_url);
        setLivros(comCapa.slice(0, 4));
      } catch (error) {
        console.error('Erro ao buscar livros pro HeroBanner:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLivros();
  }, []);

  const avancar = useCallback(() => {
    if (livros.length > 0) {
      setAtual((i) => (i + 1) % livros.length);
    }
  }, [livros.length]);

  useEffect(() => {
    if (pausado || livros.length <= 1) return;
    const id = setInterval(avancar, INTERVALO);
    return () => clearInterval(id);
  }, [pausado, avancar, livros.length]);

  const irPara = (i: number) => (e: MouseEvent) => {
    e.stopPropagation();
    setAtual(i);
  };

  if (loading) {
    return <div className="mb-12 h-[350px] w-full rounded-[2.5rem] bg-gray-200 dark:bg-gray-800 animate-pulse md:h-[450px]"></div>;
  }

  if (livros.length === 0) return null;

  const livro = livros[atual];

  return (
    <div
      className="group relative mb-12 h-[350px] w-full overflow-hidden rounded-[2.5rem] shadow-2xl md:h-[450px]"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={livro.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 flex"
        >
          {/* Fundo Desfocado Baseado na Capa */}
          <div className="absolute inset-0 z-0">
            {livro.capa_url && (
              <Image
                src={livro.capa_url}
                alt="Background"
                fill
                className="object-cover opacity-40 blur-3xl saturate-200 transform scale-125"
              />
            )}
            {/* Overlay Gradiente Escuro */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/90 to-gray-800/40 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80"></div>
          </div>

          <div className="relative z-10 flex w-full h-full items-center px-8 md:px-16">
            
            {/* Informações à Esquerda */}
            <div className="flex w-full md:w-3/5 flex-col justify-center gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 backdrop-blur-md"
              >
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
                  {tipo === 'recomendacoes' ? 'Recomendado para Você' : 'Destaque da Coleção'}
                </span>
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-4xl font-black text-white drop-shadow-lg md:text-6xl md:leading-tight line-clamp-2"
              >
                {livro.titulo}
              </motion.h2>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-lg md:text-xl font-medium text-gray-300"
              >
                por <span className="text-white font-bold">{livro.autores_nomes}</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-4 flex gap-4"
              >
                <Link 
                  href={`/livro/${livro.id}`}
                  className="rounded-full bg-white px-8 py-3.5 font-bold text-gray-900 transition-all hover:bg-gray-100 hover:scale-105 shadow-xl hover:shadow-white/20"
                >
                  Pegar Emprestado
                </Link>
                {livro.categorias_nomes && (
                  <Link 
                    href={`/catalogo?categoria=${livro.categorias_nomes.split(',')[0]}`}
                    className="hidden sm:inline-flex rounded-full bg-white/10 px-8 py-3.5 font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 border border-white/10"
                  >
                    Ver Categoria
                  </Link>
                )}
              </motion.div>
            </div>

            {/* Capa à Direita */}
            <div className="hidden md:flex w-2/5 justify-end items-center relative pr-8">
              <motion.div
                initial={{ opacity: 0, x: 50, rotateY: 30 }}
                animate={{ opacity: 1, x: 0, rotateY: -15 }}
                transition={{ type: "spring", bounce: 0.4, duration: 1.2, delay: 0.2 }}
                className="relative w-[220px] h-[320px] lg:w-[280px] lg:h-[400px] rounded-r-2xl rounded-l-sm shadow-[20px_20px_40px_rgba(0,0,0,0.8)] preserve-3d"
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
              >
                {/* Efeito de lombada do livro */}
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gray-300 to-gray-100 rounded-l-sm transform -translate-x-full origin-right" style={{ transform: 'rotateY(-90deg) translateX(-100%)' }}></div>
                
                {/* Capa do livro */}
                <div className="relative w-full h-full rounded-r-xl rounded-l-sm overflow-hidden border-l border-white/20">
                  {livro.capa_url ? (
                    <Image
                      src={livro.capa_url}
                      alt={livro.titulo}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-900 flex items-center justify-center">
                      <span className="text-blue-200">Sem Capa</span>
                    </div>
                  )}
                  {/* Reflexo de vidro em cima da capa */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none"></div>
                </div>
              </motion.div>
            </div>

          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navegação Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-3">
        {livros.map((b, i) => (
          <button
            key={b.id}
            onClick={irPara(i)}
            aria-label={`Ir para ${b.titulo}`}
            className={`h-2.5 rounded-full transition-all duration-500 ${
              i === atual 
                ? 'w-10 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]' 
                : 'w-2.5 bg-white/40 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
