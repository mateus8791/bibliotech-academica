'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import api from '@/services/api';

interface AvaliarModalProps {
  isOpen: boolean;
  onClose: () => void;
  livroId: string | number;
  livroTitulo: string;
  coverUrl?: string | null;
  onSuccess: () => void;
}

export function AvaliarModal({ isOpen, onClose, livroId, livroTitulo, coverUrl, onSuccess }: AvaliarModalProps) {
  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nota === 0) {
      setError('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/avaliacoes', {
        livro_id: livroId,
        nota,
        comentario
      });
      onSuccess();
      onClose();
      setNota(0);
      setComentario('');
    } catch (err: any) {
      setError(err.response?.data?.mensagem || 'Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* Container principal sem overflow-hidden para permitir que a coruja "vaze" */}
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-md shadow-2xl ring-1 ring-gray-200/50 dark:ring-gray-800 flex flex-col relative animate-in zoom-in-95 duration-300 mt-12">
        
        {/* Mascote Coruja */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 drop-shadow-xl z-20">
          <img 
            src="/mascot/owl-creative.png" 
            alt="Coruja Mascote" 
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 rounded-full transition-colors z-30"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header com Gradiente (arredondado para bater com o container) */}
        <div className="pt-16 pb-6 px-6 rounded-t-[2rem] bg-gradient-to-b from-purple-50/80 to-white dark:from-purple-900/20 dark:to-gray-900 text-center relative overflow-hidden">
          {/* Efeito de brilho no fundo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-400/20 dark:bg-purple-600/20 blur-[50px] rounded-full pointer-events-none"></div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white relative z-10 font-serif tracking-tight">Como foi a leitura?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 relative z-10">Sua opinião ajuda outros alunos a escolherem os melhores livros!</p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 flex flex-col gap-8">
          
          {/* Card do Livro */}
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-inner">
            <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
              <img 
                src={coverUrl || '/covers/placeholder-icon.png'} 
                alt={livroTitulo} 
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/covers/placeholder-icon.png'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-wider font-bold mb-0.5">Livro em Avaliação</p>
              <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight">{livroTitulo}</p>
            </div>
          </div>

          {/* Seleção de Estrelas */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2" onMouseLeave={() => setHoverNota(0)}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= (hoverNota || nota);
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverNota(star)}
                    onClick={() => setNota(star)}
                    className="p-1 focus:outline-none group relative"
                  >
                    <Star
                      className={`w-10 h-10 transition-all duration-300 ${
                        isActive
                          ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] scale-110'
                          : 'text-gray-300 dark:text-gray-600 group-hover:scale-105'
                      }`}
                    />
                    {/* Efeito de pulse ao clicar/hover forte */}
                    {isActive && (
                      <span className="absolute inset-0 bg-yellow-400/20 rounded-full blur-md -z-10 animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Texto dinâmico para a nota */}
            <div className="h-4 text-xs font-medium text-gray-500 dark:text-gray-400 transition-all">
              {(hoverNota || nota) === 1 && 'Péssimo 😢'}
              {(hoverNota || nota) === 2 && 'Ruim 😕'}
              {(hoverNota || nota) === 3 && 'Razoável 😐'}
              {(hoverNota || nota) === 4 && 'Muito Bom 🙂'}
              {(hoverNota || nota) === 5 && 'Incrível! 🤩'}
              {(hoverNota || nota) === 0 && 'Toque para avaliar'}
            </div>
          </div>

          {/* Campo de Comentário */}
          <div className="flex flex-col gap-2 relative group">
            <label htmlFor="comentario" className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
              Comentário <span className="text-gray-400 font-normal text-xs">(opcional)</span>
            </label>
            <div className="relative">
              <textarea
                id="comentario"
                rows={3}
                maxLength={500}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="O que você mais gostou nesta leitura?"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white resize-none transition-all placeholder-gray-400 shadow-sm group-hover:border-purple-300 dark:group-hover:border-purple-500/50"
              />
              <span className="absolute bottom-3 right-4 text-[10px] text-gray-400 font-medium">
                {comentario.length}/500
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/30 text-center animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 hover:shadow-purple-500/40 flex items-center justify-center gap-2 transform active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Enviando...
                </>
              ) : (
                'Enviar Avaliação'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
