// Arquivo: frontend/src/lib/schemas.ts
// Schemas Zod para validação de dados

import { z } from 'zod';

// Schema para Livro
export const LivroSchema = z.object({
  id: z.string(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  capa_url: z.string().url().nullable(),
  autores_nomes: z.string().nullable(),
  categoria: z.string().optional(),
  categoria_id: z.number().optional(),
  ano: z.number().optional(),
  isbn: z.string().optional(),
  descricao: z.string().optional(),
  num_emprestimos: z.number().default(0),
});

export type Livro = z.infer<typeof LivroSchema>;

// Schema para Categoria
export const CategoriaSchema = z.object({
  category_id: z.number(),
  name: z.string(),
  descricao: z.string().optional(),
});

export type Categoria = z.infer<typeof CategoriaSchema>;

// Schema para Autor
export const AutorSchema = z.object({
  id: z.number(),
  nome: z.string(),
  biografia: z.string().optional(),
});

export type Autor = z.infer<typeof AutorSchema>;

// Schema para resposta de lista de livros
export const LivrosResponseSchema = z.object({
  data: z.array(LivroSchema),
  pagination: z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalItems: z.number(),
    itemsPerPage: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }).optional(),
});

export type LivrosResponse = z.infer<typeof LivrosResponseSchema>;
