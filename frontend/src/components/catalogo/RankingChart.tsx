'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, Crown } from 'lucide-react';
import api from '@/services/api';
import { resolveCapaUrl } from '@/lib/resolveCapaUrl';

interface Leitor {
  id: string;
  nome: string;
  foto_url: string | null;
  livros_lidos: number;
  posicao: number;
  sou_eu: boolean;
}

interface RankingResponse {
  ranking: Leitor[];
  meuRank: Leitor | null;
  totalRanqueados: number;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const Avatar: React.FC<{ leitor: Leitor; size?: number }> = ({ leitor, size = 48 }) => {
  const [erro, setErro] = useState(false);
  const url = resolveCapaUrl(leitor.foto_url);

  if (url && !erro) {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-full ring-4 ring-white dark:ring-gray-800 shadow-md"
        style={{ width: size, height: size }}
      >
        <Image
          src={url}
          alt={leitor.nome}
          fill
          unoptimized
          className="object-cover"
          sizes={`${size}px`}
          onError={() => setErro(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 font-bold text-white ring-4 ring-white dark:ring-gray-800 shadow-md"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {iniciais(leitor.nome)}
    </div>
  );
};

export default function RankingChart() {
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const res = await api.get('/ranking/leitores?limit=6'); 
        setData(res.data);
      } catch (error) {
        console.error('Erro ao buscar ranking de leitores:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  if (loading) {
    return (
      <div className="my-12 animate-pulse px-2">
        <div className="mb-6 h-8 w-56 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-[300px] rounded-3xl bg-gray-200 dark:bg-gray-800" />
      </div>
    );
  }

  if (!data || data.ranking.length === 0) return null;

  const ranking = data.ranking;
  const maxLivros = Math.max(...ranking.map(r => r.livros_lidos), 1);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="my-16 px-2"
    >
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 p-2.5 dark:from-amber-900/30 dark:to-yellow-900/30">
          <Trophy className="h-7 w-7 text-amber-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Maratona de Leitura</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Os maiores devoradores de livros do mês
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-6">
          {ranking.map((leitor, i) => {
            const widthPct = Math.max((leitor.livros_lidos / maxLivros) * 100, 5); // no mínimo 5% para a barra aparecer

            return (
              <div key={leitor.id} className="flex items-center gap-4">
                {/* Ranking Numérico */}
                <div className="w-6 font-black text-gray-400 dark:text-gray-600 text-right">
                  {leitor.posicao}º
                </div>
                
                {/* Fotinha */}
                <div className="relative">
                  {leitor.posicao === 1 && (
                    <Crown className="absolute -top-4 -left-2 w-6 h-6 text-yellow-500 rotate-[-20deg] z-10" fill="currentColor" />
                  )}
                  <Avatar leitor={leitor} size={48} />
                </div>

                {/* Área da Barra e Nome */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white truncate">
                      {leitor.nome}
                    </span>
                    {leitor.sou_eu && (
                      <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        VOCÊ
                      </span>
                    )}
                  </div>
                  
                  <div className="relative h-6 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${widthPct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, type: 'spring', bounce: 0.2 }}
                      className={`h-full rounded-full flex items-center px-3 ${
                        leitor.posicao === 1 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' 
                        : leitor.posicao === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400'
                        : leitor.posicao === 3 ? 'bg-gradient-to-r from-orange-300 to-amber-600'
                        : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                      }`}
                    >
                       <span className="text-white text-xs font-bold drop-shadow-md flex items-center gap-1">
                          {leitor.livros_lidos} <span className="hidden sm:inline">livros</span>
                       </span>
                    </motion.div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
