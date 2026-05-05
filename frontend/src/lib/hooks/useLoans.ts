import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Loan {
  id: number;
  usuario_id: number;
  livro_id: number;
  data_emprestimo: string;
  data_devolucao_prevista: string;
  data_devolucao_real?: string | null;
  status: 'ativo' | 'devolvido' | 'atrasado' | 'renovado';
  renovacoes: number;
  usuario?: { id: number; nome: string; email: string };
  livro?: { id: number; titulo: string; capa_url?: string };
}

export interface LoansParams {
  status?: Loan['status'];
  usuarioId?: number;
  page?: number;
}

const LOANS_KEY = 'loans';

export function useLoans(params?: LoansParams) {
  return useQuery({
    queryKey: [LOANS_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.usuarioId) searchParams.set('usuarioId', String(params.usuarioId));
      if (params?.page) searchParams.set('page', String(params.page));
      const query = searchParams.toString();
      const res = await api.get<Loan[]>(`/emprestimos${query ? `?${query}` : ''}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useLoan(id: number | string | undefined) {
  return useQuery({
    queryKey: [LOANS_KEY, id],
    queryFn: async () => {
      const res = await api.get<Loan>(`/emprestimos/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { livro_id: number; usuario_id?: number }) => {
      const res = await api.post<Loan>('/emprestimos', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [LOANS_KEY] }),
  });
}

export function useReturnLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put<Loan>(`/emprestimos/${id}/devolver`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [LOANS_KEY] }),
  });
}

export function useRenewLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put<Loan>(`/emprestimos/${id}/renovar`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [LOANS_KEY] }),
  });
}
