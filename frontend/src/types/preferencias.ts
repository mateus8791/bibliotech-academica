export interface Preferencia {
  tipo: 'categoria' | 'autor';
  valor: string;
}

export interface PreferenciasResponse {
  categorias: string[];
  autores: string[];
  total: number;
}

export interface LivroRecomendado {
  id: number;
  titulo: string;
  autor_nome: string | null;
  categoria_nome: string | null;
  capa_url: string | null;
  disponivel: boolean;
  score: number;
  motivo: string;
}

export interface RecomendacoesResponse {
  livros: LivroRecomendado[];
  temPreferencias: boolean;
}

export interface TemPreferenciasResponse {
  temPreferencias: boolean;
  total: number;
}
