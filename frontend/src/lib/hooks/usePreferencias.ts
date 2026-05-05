import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { PreferenciasResponse } from '@/types/preferencias';

const QUERY_KEY = ['preferencias'];

export function usePreferencias() {
  return useQuery<PreferenciasResponse>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/preferencias');
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useSalvarPreferencias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { categorias: string[]; autores: string[] }) => {
      const { data } = await api.post('/preferencias', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['recomendacoes'] });
      queryClient.invalidateQueries({ queryKey: ['tem-preferencias'] });
    },
  });
}

export function useRemoverPreferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tipo, valor }: { tipo: string; valor: string }) => {
      const { data } = await api.delete(`/preferencias/${tipo}/${encodeURIComponent(valor)}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['recomendacoes'] });
      queryClient.invalidateQueries({ queryKey: ['tem-preferencias'] });
    },
  });
}
