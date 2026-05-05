import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { RecomendacoesResponse, TemPreferenciasResponse } from '@/types/preferencias';

export function useRecomendacoes() {
  return useQuery<RecomendacoesResponse>({
    queryKey: ['recomendacoes'],
    queryFn: async () => {
      const { data } = await api.get('/recomendacoes');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTemPreferencias() {
  return useQuery<TemPreferenciasResponse>({
    queryKey: ['tem-preferencias'],
    queryFn: async () => {
      const { data } = await api.get('/recomendacoes/tem-preferencias');
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
