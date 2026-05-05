import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Reservation {
  id: number;
  usuario_id: number;
  livro_id: number;
  data_reserva: string;
  data_expiracao?: string | null;
  status: 'ativa' | 'cancelada' | 'concluida' | 'expirada';
  usuario?: { id: number; nome: string; email: string };
  livro?: { id: number; titulo: string; capa_url?: string };
}

export interface ReservationsParams {
  usuarioId?: number;
  status?: Reservation['status'];
  page?: number;
}

const RESERVATIONS_KEY = 'reservations';

export function useReservations(params?: ReservationsParams) {
  return useQuery({
    queryKey: [RESERVATIONS_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.usuarioId) searchParams.set('usuarioId', String(params.usuarioId));
      if (params?.status) searchParams.set('status', params.status);
      if (params?.page) searchParams.set('page', String(params.page));
      const query = searchParams.toString();
      const res = await api.get<Reservation[]>(`/reservas${query ? `?${query}` : ''}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { livro_id: number }) => {
      const res = await api.post<Reservation>('/reservas', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [RESERVATIONS_KEY] }),
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/reservas/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [RESERVATIONS_KEY] }),
  });
}
