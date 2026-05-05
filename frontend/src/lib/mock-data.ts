// Arquivo: frontend/src/lib/mock-data.ts
// Dados mockados para demonstração das funcionalidades

import { Livro, Categoria } from './schemas';

// Dados mock de livros mais lidos
export const mockTopReads: Livro[] = [
  {
    id: 'top-1',
    titulo: 'O Hobbit',
    capa_url: '/covers/hobbit.jpg',
    autores_nomes: 'J.R.R. Tolkien',
    categoria: 'Fantasia',
    categoria_id: 1,
    ano: 1937,
    isbn: '978-0547928227',
    descricao: 'A jornada inesperada de Bilbo Bolseiro',
    num_emprestimos: 847,
  },
  {
    id: 'top-2',
    titulo: '1984',
    capa_url: '/covers/1984.jpg',
    autores_nomes: 'George Orwell',
    categoria: 'Ficção Distópica',
    categoria_id: 2,
    ano: 1949,
    isbn: '978-0451524935',
    descricao: 'Um clássico distópico sobre vigilância e totalitarismo',
    num_emprestimos: 723,
  },
  {
    id: 'top-3',
    titulo: 'O Senhor dos Anéis',
    capa_url: '/covers/lotr.jpg',
    autores_nomes: 'J.R.R. Tolkien',
    categoria: 'Fantasia',
    categoria_id: 1,
    ano: 1954,
    isbn: '978-0544003415',
    descricao: 'A épica jornada pela Terra-média',
    num_emprestimos: 691,
  },
  {
    id: 'top-4',
    titulo: 'Harry Potter e a Pedra Filosofal',
    capa_url: '/covers/harry-potter.jpg',
    autores_nomes: 'J.K. Rowling',
    categoria: 'Fantasia',
    categoria_id: 1,
    ano: 1997,
    isbn: '978-0439708180',
    descricao: 'O início da jornada mágica de Harry Potter',
    num_emprestimos: 658,
  },
  {
    id: 'top-5',
    titulo: 'O Pequeno Príncipe',
    capa_url: '/covers/pequeno-principe.jpg',
    autores_nomes: 'Antoine de Saint-Exupéry',
    categoria: 'Infantil',
    categoria_id: 3,
    ano: 1943,
    isbn: '978-0156012195',
    descricao: 'Uma fábula poética sobre amor e amizade',
    num_emprestimos: 612,
  },
  {
    id: 'top-6',
    titulo: 'Dom Casmurro',
    capa_url: '/covers/dom-casmurro.jpg',
    autores_nomes: 'Machado de Assis',
    categoria: 'Romance',
    categoria_id: 4,
    ano: 1899,
    isbn: '978-8535911664',
    descricao: 'Um dos maiores clássicos da literatura brasileira',
    num_emprestimos: 589,
  },
];

// Dados mock de categorias
export const mockCategories: Categoria[] = [
  { category_id: 1, name: 'Fantasia', descricao: 'Mundos imaginários e magia' },
  { category_id: 2, name: 'Ficção Científica', descricao: 'Tecnologia e futuro' },
  { category_id: 3, name: 'Terror', descricao: 'Suspense e horror' },
  { category_id: 4, name: 'Romance', descricao: 'Histórias de amor' },
  { category_id: 5, name: 'Aventura', descricao: 'Jornadas e explorações' },
  { category_id: 6, name: 'Biografia', descricao: 'Histórias de vida reais' },
  { category_id: 7, name: 'Autoajuda', descricao: 'Desenvolvimento pessoal' },
  { category_id: 8, name: 'História', descricao: 'Eventos históricos' },
  { category_id: 9, name: 'Infantil', descricao: 'Livros para crianças' },
  { category_id: 10, name: 'Poesia', descricao: 'Versos e poemas' },
];

// Lista de autores para o filtro
export const mockAuthors: string[] = [
  'J.R.R. Tolkien',
  'George Orwell',
  'J.K. Rowling',
  'Antoine de Saint-Exupéry',
  'Machado de Assis',
  'Clarice Lispector',
  'José Saramago',
  'Gabriel García Márquez',
  'Haruki Murakami',
  'Stephen King',
  'Agatha Christie',
  'Arthur Conan Doyle',
  'Isaac Asimov',
  'Ray Bradbury',
  'Jane Austen',
];
