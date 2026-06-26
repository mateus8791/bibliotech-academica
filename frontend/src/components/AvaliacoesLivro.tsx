// Arquivo: frontend/src/components/AvaliacoesLivro.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star, MessageSquareText } from 'lucide-react';
import api from '@/services/api';
import { resolveCapaUrl } from '@/lib/resolveCapaUrl';

interface Avaliacao {
  id: number;
  nota: number;
  comentario: string | null;
  data_criacao: string;
  usuario_nome: string;
  usuario_foto: string | null;
}

function Estrelas({ nota, size = 16 }: { nota: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i <= Math.round(nota)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
          }
        />
      ))}
    </div>
  );
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function AvatarAluno({ nome, foto }: { nome: string; foto: string | null }) {
  const [erro, setErro] = useState(false);
  const url = resolveCapaUrl(foto);
  if (url && !erro) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-gray-800 shadow">
        <Image src={url} alt={nome} fill unoptimized className="object-cover" sizes="40px" onError={() => setErro(true)} />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white ring-2 ring-white dark:ring-gray-800 shadow">
      {iniciais(nome)}
    </div>
  );
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function AvaliacoesLivro({ livroId }: { livroId: string }) {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!livroId) return;
    const fetchAvaliacoes = async () => {
      try {
        setCarregando(true);
        const res = await api.get(`/avaliacoes?livro_id=${livroId}&ordem=recentes`);
        setAvaliacoes(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Erro ao buscar avaliações do livro:', error);
        setAvaliacoes([]);
      } finally {
        setCarregando(false);
      }
    };
    fetchAvaliacoes();
  }, [livroId]);

  const total = avaliacoes.length;
  const media = total > 0 ? avaliacoes.reduce((s, a) => s + a.nota, 0) / total : 0;
  const comComentario = avaliacoes.filter((a) => a.comentario && a.comentario.trim().length > 0);

  return (
    <section className="mt-8 rounded-xl bg-white dark:bg-gray-900 shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquareText className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Avaliações dos leitores</h2>
      </div>

      {carregando ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Star className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-3" />
          <p className="font-semibold text-gray-700 dark:text-gray-300">Ainda não há avaliações</p>
          <p className="text-sm text-gray-500">Seja o primeiro a avaliar este livro.</p>
        </div>
      ) : (
        <>
          {/* Resumo (média) */}
          <div className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 p-4">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-gray-900 dark:text-white leading-none">
                {media.toFixed(1)}
              </div>
              <div className="mt-1">
                <Estrelas nota={media} size={14} />
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Baseado em <strong>{total}</strong> {total === 1 ? 'avaliação' : 'avaliações'}
              {comComentario.length > 0 && (
                <> · {comComentario.length} com comentário</>
              )}
            </div>
          </div>

          {/* Lista de avaliações */}
          <div className="space-y-4">
            {avaliacoes.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <AvatarAluno nome={a.usuario_nome} foto={a.usuario_foto} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{a.usuario_nome}</p>
                      <span className="text-xs text-gray-400">{formatarData(a.data_criacao)}</span>
                    </div>
                    <div className="mt-0.5">
                      <Estrelas nota={a.nota} size={14} />
                    </div>
                    {a.comentario && a.comentario.trim().length > 0 && (
                      <p className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                        {a.comentario}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
