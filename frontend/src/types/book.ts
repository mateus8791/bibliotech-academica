export type Book = {
  autores_nomes: any;
  ano_publicacao: number;
  categorias_nomes: any;
  id: number;
  titulo: string;
  isbn?: string;
  capa_url?: string;
  preco: number;
  preco_promocional?: number;
  promocao_ativa?: boolean;
  quantidade_disponivel: number;
  sinopse?: string;
  autores?: { id: number; nome: string }[];
  categorias?: { id: number; nome: string }[];
};
