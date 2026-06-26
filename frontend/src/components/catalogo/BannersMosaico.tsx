'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen } from 'lucide-react';
import api from '@/services/api';
import { resolveCapaUrl } from '@/lib/resolveCapaUrl';

interface Livro {
  id: string;
  titulo: string;
  capa_url: string | null;
  autores_nomes?: string | null;
  categorias_nomes?: string | null;
}

const BannersMosaico: React.FC = () => {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLivros = async () => {
      try {
        setLoading(true);
        // Busca alguns livros bem avaliados ou em destaque
        const response = await api.get('/livros?limit=12&orderBy=avaliacoes');
        const data: any[] = Array.isArray(response.data) ? response.data : response.data?.data ?? [];

        const formatados = data.map((livro: any) => ({
          id: String(livro.id),
          titulo: livro.titulo,
          capa_url: resolveCapaUrl(livro.capa_url),
          autores_nomes: Array.isArray(livro.autores) 
            ? livro.autores.map((a: any) => a.nome).join(', ') 
            : livro.autores_nomes || 'Autor Desconhecido',
          categorias_nomes: Array.isArray(livro.categorias)
            ? livro.categorias.map((c: any) => c.nome).join(', ')
            : 'Literatura',
        }));
        
        // Pega os 4 primeiros que possuem capa para o mosaico
        const comCapa = formatados.filter((l: Livro) => l.capa_url);
        setLivros(comCapa.slice(0, 4));
      } catch (error) {
        console.error('Erro ao buscar livros pro mosaico:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLivros();
  }, []);

  if (loading) {
    return (
      <div className="my-12 animate-pulse px-2">
        <div className="mb-6 h-8 w-56 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-[300px] rounded-3xl bg-gray-200 dark:bg-gray-800 lg:col-span-2"></div>
          <div className="h-[300px] rounded-3xl bg-gray-200 dark:bg-gray-800"></div>
          <div className="h-[300px] rounded-3xl bg-gray-200 dark:bg-gray-800"></div>
          <div className="h-[300px] rounded-3xl bg-gray-200 dark:bg-gray-800 lg:col-span-2"></div>
        </div>
      </div>
    );
  }

  if (livros.length < 4) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="my-12"
    >
      <div className="mb-8 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-rose-100 to-orange-100 p-2.5 dark:from-rose-900/30 dark:to-orange-900/30">
            <Sparkles className="h-7 w-7 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Explorar por Destaques</h2>
            <p className="text-gray-500 dark:text-gray-400">Títulos que merecem a sua atenção</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        {/* Card Grande (ocupa 2 colunas no desktop) */}
        <Link href={`/livro/${livros[0].id}`} className="group relative overflow-hidden rounded-[2rem] bg-gray-900 lg:col-span-2 shadow-lg min-h-[320px]">
          {livros[0].capa_url && (
             <Image
             src={livros[0].capa_url}
             alt={livros[0].titulo}
             fill
             className="object-cover opacity-50 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700 blur-sm"
           />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
          
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-rose-500/20 text-rose-300 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-3 border border-rose-500/30">
              <BookOpen className="w-4 h-4" /> Escolha da Semana
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-white mb-2 line-clamp-2">{livros[0].titulo}</h3>
            <p className="text-gray-300 font-medium text-lg mb-4">por {livros[0].autores_nomes}</p>
            <span className="text-white font-bold group-hover:text-rose-400 transition-colors flex items-center gap-2">
              Ver detalhes <span className="text-xl leading-none">›</span>
            </span>
          </div>
          
          {/* Capa flutuante */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-[140px] h-[200px] hidden sm:block rotate-[5deg] group-hover:rotate-0 transition-all duration-500 group-hover:scale-110 shadow-2xl rounded-md">
             {livros[0].capa_url && (
               <Image src={livros[0].capa_url} alt="Capa" fill className="object-cover rounded-md" unoptimized />
             )}
          </div>
        </Link>

        {/* Card Menor 1 */}
        <Link href={`/livro/${livros[1].id}`} className="group relative overflow-hidden rounded-[2rem] bg-gray-900 shadow-lg min-h-[320px]">
          {livros[1].capa_url && (
             <Image src={livros[1].capa_url} alt={livros[1].titulo} fill className="object-cover opacity-40 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700 blur-sm" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-950/90"></div>
          
          <div className="absolute inset-0 p-8 flex flex-col justify-end items-center text-center">
            <div className="w-[120px] h-[170px] relative mb-6 shadow-xl rounded-md group-hover:-translate-y-2 transition-transform duration-500">
               {livros[1].capa_url && <Image src={livros[1].capa_url} alt="Capa" fill className="object-cover rounded-md" unoptimized />}
            </div>
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{livros[1].titulo}</h3>
            <p className="text-sm text-indigo-300">Categoria: {livros[1].categorias_nomes?.split(',')[0]}</p>
          </div>
        </Link>

        {/* Card Menor 2 */}
        <Link href={`/livro/${livros[2].id}`} className="group relative overflow-hidden rounded-[2rem] bg-gray-900 shadow-lg min-h-[320px]">
          {livros[2].capa_url && (
             <Image src={livros[2].capa_url} alt={livros[2].titulo} fill className="object-cover opacity-40 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700 blur-sm" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 to-transparent"></div>
          
          <div className="absolute inset-0 p-8 flex flex-col justify-end items-center text-center">
            <div className="w-[120px] h-[170px] relative mb-6 shadow-xl rounded-md group-hover:-translate-y-2 transition-transform duration-500">
               {livros[2].capa_url && <Image src={livros[2].capa_url} alt="Capa" fill className="object-cover rounded-md" unoptimized />}
            </div>
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{livros[2].titulo}</h3>
            <p className="text-sm text-emerald-300">{livros[2].autores_nomes}</p>
          </div>
        </Link>

        {/* Card Grande 2 (ocupa 2 colunas no desktop, embaixo) */}
        <Link href={`/livro/${livros[3].id}`} className="group relative overflow-hidden rounded-[2rem] bg-gray-900 lg:col-span-2 shadow-lg min-h-[320px]">
          {livros[3].capa_url && (
             <Image
             src={livros[3].capa_url}
             alt={livros[3].titulo}
             fill
             className="object-cover opacity-50 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700 blur-sm"
           />
          )}
          <div className="absolute inset-0 bg-gradient-to-l from-gray-900 via-gray-900/80 to-transparent"></div>
          
          <div className="absolute inset-0 p-8 flex flex-col justify-center items-end text-right">
             <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-cyan-500/20 text-cyan-300 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-3 border border-cyan-500/30">
              <Sparkles className="w-4 h-4" /> Novo no Acervo
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-white mb-2 max-w-lg line-clamp-2">{livros[3].titulo}</h3>
            <p className="text-gray-300 font-medium text-lg mb-4">por {livros[3].autores_nomes}</p>
            <span className="text-white font-bold group-hover:text-cyan-400 transition-colors flex items-center gap-2">
              Explorar <span className="text-xl leading-none">›</span>
            </span>
          </div>
          
          {/* Capa flutuante */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 w-[140px] h-[200px] hidden sm:block -rotate-[5deg] group-hover:rotate-0 transition-all duration-500 group-hover:scale-110 shadow-2xl rounded-md">
             {livros[3].capa_url && (
               <Image src={livros[3].capa_url} alt="Capa" fill className="object-cover rounded-md" unoptimized />
             )}
          </div>
        </Link>
      </div>
    </motion.section>
  );
};

export default BannersMosaico;
