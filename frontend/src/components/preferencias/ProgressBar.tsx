'use client';

interface ProgressBarProps {
  atual: number;
  total: number;
}

export function ProgressBar({ atual, total }: ProgressBarProps) {
  const pct = Math.min((atual / total) * 100, 100);
  const faltam = Math.max(total - atual, 0);

  const getMensagem = () => {
    if (atual === 0) return 'Escolha suas categorias favoritas!';
    if (atual < total) return 'Boas escolhas! Sua biblioteca está ficando incrível! 💙';
    return 'Perfeito! Sua biblioteca está pronta! 🎉';
  };

  return (
    <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-4 min-w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/80 text-xs font-medium uppercase tracking-wide">
          Seu progresso
        </span>
        <span className="text-white font-bold text-lg">
          {atual} / {total}
        </span>
      </div>

      {/* Barra */}
      <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-cyan-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-white/70 text-xs">
          {atual} de {total} categorias selecionadas
        </span>
        {faltam > 0 && (
          <span className="text-xs text-cyan-300 border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 rounded-full font-medium">
            Falta{faltam === 1 ? '' : 'm'} só mais {faltam}!
          </span>
        )}
      </div>

      {/* Feedback */}
      <p className="text-white/80 text-xs mt-2 leading-snug">{getMensagem()}</p>
    </div>
  );
}
