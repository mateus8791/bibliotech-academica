// Arquivo: frontend/src/lib/categoryMood.ts
//
// Mapeia o NOME de uma categoria para um "mood" visual (emoji + cores Tailwind),
// reaproveitando a paleta dos 10 moods do sistema (migration 010_create_moods).
//
// Motivo: a tabela ai_book_metadata (que ligaria livro -> mood) está vazia,
// então derivamos o clima visual a partir da categoria, que todo livro tem.

export interface MoodVisual {
  key: string;
  emoji: string;
  /** Classes Tailwind completas para um "chip" (badge) de categoria. */
  chip: string;
}

// Paleta base — uma entrada por mood. As classes cobrem light + dark.
const MOODS: Record<string, MoodVisual> = {
  fantasy: {
    key: 'fantasy',
    emoji: '✨',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  },
  mystery: {
    key: 'mystery',
    emoji: '🔍',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
  },
  romance: {
    key: 'romance',
    emoji: '💕',
    chip: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  },
  adventure: {
    key: 'adventure',
    emoji: '⚔️',
    chip: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  },
  academic: {
    key: 'academic',
    emoji: '📚',
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  comedy: {
    key: 'comedy',
    emoji: '😄',
    chip: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  },
  drama: {
    key: 'drama',
    emoji: '🎭',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  },
  horror: {
    key: 'horror',
    emoji: '👻',
    chip: 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
  scifi: {
    key: 'scifi',
    emoji: '🚀',
    chip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  },
  inspirational: {
    key: 'inspirational',
    emoji: '🌟',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  emerald: {
    key: 'emerald',
    emoji: '📗',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  teal: {
    key: 'teal',
    emoji: '📘',
    chip: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  },
};

// Palavras-chave por mood (nome da categoria normalizado, sem acento, minúsculo).
const KEYWORDS: Array<[string, string[]]> = [
  ['scifi', ['ficcao cientifica', 'sci-fi', 'scifi', 'cientifica']],
  ['fantasy', ['fantasia', 'fantastico', 'magia']],
  ['mystery', ['misterio', 'suspense', 'policial', 'thriller', 'crime', 'investigacao']],
  ['romance', ['romance', 'romantico', 'paixao']],
  ['adventure', ['aventura', 'acao']],
  ['horror', ['terror', 'horror']],
  ['comedy', ['comedia', 'humor']],
  ['drama', ['drama', 'tragedia']],
  ['inspirational', ['autoajuda', 'auto-ajuda', 'inspiracional', 'biografia', 'motivacional', 'religiao', 'espiritualidade']],
  ['academic', ['academico', 'didatico', 'tecnico', 'educacao', 'ciencia', 'historia', 'matematica', 'filosofia', 'direito', 'economia', 'tecnologia', 'engenharia', 'literatura', 'classico']],
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .trim();
}

// Fallback determinístico: mesma categoria -> sempre a mesma cor.
const FALLBACK_KEYS = ['academic', 'emerald', 'teal', 'mystery', 'inspirational', 'fantasy'];

function hashIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

/** Retorna o visual (emoji + classes do chip) para um nome de categoria. */
export function getCategoryMood(categoryName: string | null | undefined): MoodVisual {
  if (!categoryName) return MOODS.academic;
  const n = normalize(categoryName);

  for (const [moodKey, words] of KEYWORDS) {
    if (words.some((w) => n.includes(w))) {
      return MOODS[moodKey];
    }
  }

  // Sem match: escolhe uma cor estável a partir do nome.
  const key = FALLBACK_KEYS[hashIndex(n, FALLBACK_KEYS.length)];
  return MOODS[key];
}
