// Arquivo: frontend/src/components/catalogo/RankingLeitores.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Trophy, BookOpen } from 'lucide-react';
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

const MEDALHAS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const Avatar: React.FC<{ leitor: Leitor; size?: number }> = ({ leitor, size = 40 }) => {
  const [erro, setErro] = useState(false);
  const url = resolveCapaUrl(leitor.foto_url);

  if (url && !erro) {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-gray-800 shadow"
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
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white ring-2 ring-white dark:ring-gray-800 shadow"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {iniciais(leitor.nome)}
    </div>
  );
};

const Linha: React.FC<{ leitor: Leitor; destaque?: boolean }> = ({ leitor, destaque }) => {
  const medalha = MEDALHAS[leitor.posicao];
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
        destaque || leitor.sou_eu
          ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400/60'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
      }`}
    >
      {/* Posição */}
      <div className="w-8 text-center shrink-0">
        {medalha ? (
          <span className="text-2xl leading-none">{medalha}</span>
        ) : (
          <span className="text-sm font-bold text-gray-400">{leitor.posicao}º</span>
        )}
      </div>

      <Avatar leitor={leitor} />

      {/* Nome */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {leitor.nome}
          {leitor.sou_eu && (
            <span className="ml-2 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white align-middle">
              VOCÊ
            </span>
          )}
        </p>
      </div>

      {/* Livros lidos */}
      <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 px-3 py-1">
        <BookOpen className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
          {leitor.livros_lidos}
        </span>
      </div>
    </div>
  );
};

const RankingLeitores: React.FC = () => {
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const res = await api.get('/ranking/leitores?limit=10');
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
      <div className="my-12 animate-pulse">
        <div className="mb-6 h-8 w-56 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="rounded-3xl bg-gray-100 dark:bg-gray-800/50 p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.ranking.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="my-12"
    >
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 p-2.5 dark:from-amber-900/30 dark:to-yellow-900/30">
          <Trophy className="h-7 w-7 text-amber-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Ranking de Leitores</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Vença seus colegas e leia mais que eles 📚
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-4">
        <div className="space-y-1">
          {data.ranking.map((leitor) => (
            <Linha key={leitor.id} leitor={leitor} />
          ))}
        </div>

        {/* Posição do próprio usuário, quando fora do top */}
        {data.meuRank && (
          <>
            <div className="my-2 flex items-center justify-center">
              <span className="text-gray-300 dark:text-gray-600">• • •</span>
            </div>
            <Linha leitor={data.meuRank} destaque />
          </>
        )}
      </div>
    </motion.section>
  );
};

export default RankingLeitores;
