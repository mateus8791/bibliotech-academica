import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Category {
  category_id: string | number;
  name: string;
  descricao?: string;
}

const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get('/categorias');
  return data;
};

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCategory: Omit<Category, 'category_id'>) => {
      const { data } = await api.post('/categorias', newCategory);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Category) => {
      const { data } = await api.put(`/categorias/${category.category_id}`, category);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      const { data } = await api.delete(`/categorias/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
