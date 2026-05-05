// Tipos para o sistema de avaliações

export interface Avaliacao {
  id: number;
  livro_id: number;
  usuario_id: number;
  nota: number; // 1 a 5
  comentario: string;
  data_criacao: string;
  usuario: {
    id: number;
    nome: string;
  };
}

export interface EstatisticasAvaliacao {
  media_notas: string;
  total_avaliacoes: number;
}

export interface AvaliacoesResponse {
  success: boolean;
  data: {
    avaliacoes: Avaliacao[];
    estatisticas: EstatisticasAvaliacao;
    paginacao?: {
      pagina_atual: number;
      total_paginas: number;
      total_itens: number;
    };
  };
}

export interface CriarAvaliacaoData {
  nota: number;
  comentario: string;
}

export interface CriarAvaliacaoResponse {
  success: boolean;
  data?: Avaliacao;
  error?: string;
}
