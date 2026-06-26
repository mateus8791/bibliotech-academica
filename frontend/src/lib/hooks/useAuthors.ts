import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Author {
  author_id: string | number;
  name: string;
  biografia?: string;
  nacionalidade?: string;
  data_nascimento?: string;
  foto_url?: string;
}

const fetchAuthors = async (): Promise<Author[]> => {
  const { data } = await api.get('/autores');
  return data;
};

export function useAuthors() {
  return useQuery({
    queryKey: ['authors'],
    queryFn: fetchAuthors,
  });
}

export function useCreateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newAuthor: Omit<Author, 'author_id'>) => {
      const { data } = await api.post('/autores', newAuthor);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
    },
  });
}

export function useUpdateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (author: Author) => {
      const { data } = await api.put(`/autores/${author.author_id}`, author);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
    },
  });
}

export function useDeleteAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      const { data } = await api.delete(`/autores/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
    },
  });
}
