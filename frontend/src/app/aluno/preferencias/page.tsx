'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Lock } from 'lucide-react';
import { usePreferencias, useSalvarPreferencias } from '@/lib/hooks/usePreferencias';
import { Owl, OWL_STATE } from '@/components/preferencias/Owl';
import { CategoryCard } from '@/components/preferencias/CategoryCard';
import { AuthorChip } from '@/components/preferencias/AuthorChip';
import { ProgressBar } from '@/components/preferencias/ProgressBar';
import api from '@/services/api';

// ─── Dados ────────────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { nome: 'Aventura',          emoji: '🚀', cor: 'bg-blue-100'    },
  { nome: 'Fantasia',          emoji: '✨', cor: 'bg-purple-100'  },
  { nome: 'Terror',            emoji: '💀', cor: 'bg-red-100'     },
  { nome: 'Romance',           emoji: '❤️', cor: 'bg-pink-100'    },
  { nome: 'Ficção científica', emoji: '🔬', cor: 'bg-teal-100'    },
  { nome: 'Mistério',          emoji: '🔍', cor: 'bg-orange-100'  },
  { nome: 'Humor',             emoji: '😊', cor: 'bg-yellow-100'  },
  { nome: 'HQ / Mangá',       emoji: '💬', cor: 'bg-sky-100'     },
  { nome: 'Poesia',            emoji: '✒️', cor: 'bg-emerald-100' },
  { nome: 'História',          emoji: '🏛️', cor: 'bg-indigo-100'  },
  { nome: 'Biografia',         emoji: '👤', cor: 'bg-violet-100'  },
  { nome: 'Autoajuda',         emoji: '🌱', cor: 'bg-green-100'   },
  { nome: 'Clássicos',         emoji: '📘', cor: 'bg-blue-100'    },
  { nome: 'Policial',          emoji: '🛡️', cor: 'bg-emerald-100' },
  { nome: 'Suspense',          emoji: '🎭', cor: 'bg-amber-100'   },
  { nome: 'Drama',             emoji: '🎬', cor: 'bg-rose-100'    },
  { nome: 'Contos',            emoji: '🏆', cor: 'bg-yellow-100'  },
];

interface Autor {
  author_id: string;
  name: string;
  foto_url: string | null;
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PreferenciasPage() {
  const { data: prefSalvas, isLoading: loadingPrefs } = usePreferencias();
  const salvarMutation = useSalvarPreferencias();

  const [categoriasSel, setCategoriasSel] = useState<Set<string>>(new Set());
  const [autoresSel,    setAutoresSel]    = useState<Autor[]>([]);
  const [todosAutores,  setTodosAutores]  = useState<Autor[]>([]);
  const [busca,         setBusca]         = useState('');
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [owlEstado,    setOwlEstado]     = useState<OWL_STATE>('welcome');
  const [salvando,     setSalvando]      = useState(false);
  const [toast,        setToast]         = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);

  // Pré-preencher preferências salvas
  useEffect(() => {
    if (!prefSalvas) return;
    setCategoriasSel(new Set(prefSalvas.categorias));
  }, [prefSalvas]);

  useEffect(() => {
    if (!prefSalvas || !todosAutores.length) return;
    setAutoresSel(todosAutores.filter(a => prefSalvas.autores.includes(a.name)));
  }, [prefSalvas, todosAutores]);

  // Buscar autores do backend
  useEffect(() => {
    api.get('/autores')
      .then(({ data }) => setTodosAutores(Array.isArray(data) ? data : []))
      .catch(() => setTodosAutores([]));
  }, []);

  // Debounce busca 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusca(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  // Mascote reativo às categorias
  useEffect(() => {
    const n = categoriasSel.size;
    if (n === 0)     setOwlEstado('warning');
    else if (n <= 2) setOwlEstado('achievement');
    else             setOwlEstado('success');
  }, [categoriasSel]);

  // Autores filtrados (sem os já selecionados)
  const autoresFiltrados = useMemo(() => {
    const idsSel = new Set(autoresSel.map(a => a.author_id));
    const q = debouncedBusca.toLowerCase();
    return todosAutores
      .filter(a => !idsSel.has(a.author_id))
      .filter(a => !q || a.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [todosAutores, autoresSel, debouncedBusca]);

  const toggleCategoria = useCallback((nome: string) => {
    setCategoriasSel(prev => {
      const next = new Set(prev);
      next.has(nome) ? next.delete(nome) : next.add(nome);
      return next;
    });
  }, []);

  const adicionarAutor = useCallback((autor: Autor) => {
    setAutoresSel(prev => prev.find(a => a.author_id === autor.author_id) ? prev : [...prev, autor]);
    setOwlEstado('reservation');
    setTimeout(() => {
      setCategoriasSel(prev => {
        const n = prev.size;
        setOwlEstado(n === 0 ? 'warning' : n <= 2 ? 'achievement' : 'success');
        return prev;
      });
    }, 1500);
    setBusca('');
  }, []);

  const removerAutor = useCallback((id: string) => {
    setAutoresSel(prev => prev.filter(a => a.author_id !== id));
  }, []);

  const podeSalvar = categoriasSel.size >= 3 && autoresSel.length >= 1;

  const handleSalvar = async () => {
    if (!podeSalvar) {
      setOwlEstado('error');
      setTimeout(() => {
        const n = categoriasSel.size;
        setOwlEstado(n === 0 ? 'warning' : n <= 2 ? 'achievement' : 'success');
      }, 1500);
      return;
    }
    setSalvando(true);
    try {
      await salvarMutation.mutateAsync({
        categorias: Array.from(categoriasSel),
        autores: autoresSel.map(a => a.name),
      });
      setOwlEstado('success');
      setToast({ tipo: 'sucesso', msg: 'Preferências salvas com sucesso!' });
    } catch {
      setToast({ tipo: 'erro', msg: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  if (loadingPrefs) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    // Container que ocupa todo o espaço disponível dentro do main do layout
    // -m-6 lg:-m-8 cancela o padding do DashboardLayout para o header sangrar
    <div className="flex flex-col -m-6 lg:-m-8 min-h-[calc(100vh-0px)]">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-white font-medium text-sm ${
          toast.tipo === 'sucesso' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ══ HEADER GRADIENTE AZUL ════════════════════════════════════════════ */}
      <header
        className="relative overflow-hidden px-6 sm:px-10 pt-8 pb-6 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 55%, #1D4ED8 100%)' }}
      >
        {/* Círculos decorativos */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-4 right-1/3 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex items-center gap-6">

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-sm font-medium mb-2">Oi! Eu sou a Coruja 👋</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2">
              Vamos montar sua{' '}
              <span className="text-cyan-300">biblioteca</span>{' '}
              do seu jeito?
            </h1>
            <p className="text-white/65 text-sm">
              Escolha pelo menos 3 categorias e 1 autor para começar.
            </p>
          </div>

          {/* Mascote central */}
          <div className="hidden md:flex flex-shrink-0 self-end">
            <Owl estado={owlEstado} size={170} />
          </div>

          {/* Card de progresso */}
          <div className="flex-shrink-0 w-56">
            <ProgressBar atual={categoriasSel.size} total={3} />
          </div>
        </div>

        {/* Mascote mobile */}
        <div className="flex md:hidden justify-center mt-4">
          <Owl estado={owlEstado} size={90} />
        </div>
      </header>

      {/* ══ CORPO ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-950 px-6 sm:px-10 py-8 space-y-6">

        {/* Categorias */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-blue-600 text-xl">📚</span>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Categorias favoritas</h2>
            </div>
            <p className="text-xs text-gray-400 ml-8">Escolha pelo menos 3 categorias</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {CATEGORIAS.map(cat => (
              <CategoryCard
                key={cat.nome}
                categoria={cat}
                selecionada={categoriasSel.has(cat.nome)}
                onToggle={toggleCategoria}
              />
            ))}
          </div>
        </section>

        {/* Autores */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-blue-600 text-xl">👨‍💻</span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Autores favoritos</h2>
              </div>
              <p className="text-xs text-gray-400 ml-8">Escolha pelo menos 1 autor</p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar autor..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Chips de autores selecionados */}
          {autoresSel.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {autoresSel.map(autor => (
                <AuthorChip key={autor.author_id} autor={autor} onRemover={removerAutor} />
              ))}
              <button
                onClick={() => setBusca('')}
                className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full px-4 py-1.5 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <span className="text-base leading-none">+</span> Adicionar autor
              </button>
            </div>
          )}

          {/* Lista de autores para seleção */}
          {autoresFiltrados.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {autoresFiltrados.map(autor => (
                <button
                  key={autor.author_id}
                  onClick={() => adicionarAutor(autor)}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full pl-1.5 pr-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-150"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                    {autor.foto_url ? (
                      <img src={autor.foto_url} alt={autor.name} className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <span className="text-white text-[10px] font-bold">{autor.name.charAt(0)}</span>
                    )}
                  </div>
                  {autor.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {debouncedBusca ? 'Nenhum autor encontrado.' : 'Carregando autores...'}
            </p>
          )}
        </section>

        {/* Espaço para a barra sticky não sobrepor conteúdo */}
        <div className="h-24" />
      </div>

      {/* ══ BARRA INFERIOR STICKY ══════════════════════════════════════════════
           sticky bottom-0 funciona porque o scroll está em main (overflow-y-auto)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl flex-shrink-0">
        <div className="px-6 sm:px-10 py-3 flex items-center gap-4">

          {/* Mascote pequeno */}
          <div className="hidden sm:flex flex-shrink-0">
            <Owl estado={owlEstado} size={52} />
          </div>

          {/* Mensagem */}
          <div className="hidden md:block flex-shrink-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">
              {podeSalvar
                ? 'Muito bom! Continue assim! 🌟'
                : categoriasSel.size < 3
                  ? `Falta${3 - categoriasSel.size === 1 ? '' : 'm'} ${3 - categoriasSel.size} categoria${3 - categoriasSel.size === 1 ? '' : 's'}!`
                  : 'Escolha pelo menos 1 autor!'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Com suas escolhas, vou te sugerir livros incríveis que você vai amar. 💙
            </p>
          </div>

          {/* Stats */}
          <div className="hidden lg:flex items-center gap-6 ml-4 flex-shrink-0">
            {[
              { v: '+17mil',      l: 'títulos disponíveis'       },
              { v: '+4 milhões',  l: 'de usuários ativos'        },
              { v: '+550',        l: 'instituições parceiras'     },
            ].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{s.v}</p>
                <p className="text-[10px] text-gray-400 leading-tight">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Botão CTA */}
          <div className="ml-auto flex-shrink-0 flex flex-col items-end gap-1">
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                podeSalvar
                  ? 'bg-blue-800 hover:bg-blue-900 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>✦</span>
              {salvando ? 'Salvando...' : 'Personalizar minha biblioteca'}
            </button>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <Lock className="w-3 h-3" /> É rápido, gratuito e sempre será!
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
