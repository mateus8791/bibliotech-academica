import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo_usuario: 'aluno' | 'bibliotecario' | 'admin';
  foto_url?: string | null;
  ativo?: boolean;
  data_criacao?: string;
  data_cadastro?: string;
  tem_reserva_ativa?: boolean;
}

export interface UsersParams {
  search?: string;
  tipo?: User['tipo_usuario'];
  page?: number;
}

const USERS_KEY = 'users';

export function useUsers(params?: UsersParams) {
  return useQuery({
    queryKey: [USERS_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.tipo) searchParams.set('tipo', params.tipo);
      if (params?.page) searchParams.set('page', String(params.page));
      const query = searchParams.toString();
      const res = await api.get<{ usuarios: User[] } | User[]>(`/usuarios${query ? `?${query}` : ''}`);
      // Backend pode retornar { usuarios: [] } ou []
      const data = res.data;
      if (Array.isArray(data)) return data;
      if ('usuarios' in data && Array.isArray(data.usuarios)) return data.usuarios;
      return [];
    },
  });
}

export function useUser(id: string | number | undefined) {
  return useQuery({
    queryKey: [USERS_KEY, id],
    queryFn: async () => {
      const res = await api.get<User>(`/usuarios/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<User> & { senha?: string }) => {
      const res = await api.post<User>('/usuarios', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<User> }) => {
      const res = await api.put<User>(`/usuarios/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/usuarios/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [USERS_KEY] }),
  });
}
