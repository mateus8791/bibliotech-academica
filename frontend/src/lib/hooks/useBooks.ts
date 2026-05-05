import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Book {
  id: number;
  titulo: string;
  isbn?: string | null;
  ano_publicacao?: number;
  capa_url?: string | null;
  quantidade_disponivel: number;
  sinopse?: string;
  autores?: Array<{ id: number; nome: string }>;
  autores_nomes?: string | null;
  categorias?: Array<{ id: number; nome: string }>;
  data_cadastro?: string;
}

export interface BooksParams {
  search?: string;
  categoriaId?: number;
  autorId?: number;
  page?: number;
}

export interface BooksResponse {
  data?: Book[];
  total?: number;
  page?: number;
}

const BOOKS_KEY = 'books';

export function useBooks(params?: BooksParams) {
  return useQuery({
    queryKey: [BOOKS_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.categoriaId) searchParams.set('categoriaId', String(params.categoriaId));
      if (params?.autorId) searchParams.set('autorId', String(params.autorId));
      if (params?.page) searchParams.set('page', String(params.page));
      const query = searchParams.toString();
      const res = await api.get<Book[] | BooksResponse>(`/livros${query ? `?${query}` : ''}`);
      return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
    },
  });
}

export function useBook(id: number | string | undefined) {
  return useQuery({
    queryKey: [BOOKS_KEY, id],
    queryFn: async () => {
      const res = await api.get<Book>(`/livros/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Book>) => {
      const res = await api.post<Book>('/livros', data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BOOKS_KEY] }),
  });
}

export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Book> }) => {
      const res = await api.put<Book>(`/livros/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BOOKS_KEY] }),
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/livros/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [BOOKS_KEY] }),
  });
}
