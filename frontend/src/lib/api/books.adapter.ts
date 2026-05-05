import type { Book } from "@/types/book";
import api from "@/services/api";
import { resolveCapaUrl } from "@/lib/resolveCapaUrl";

/** Converte "a, b, c" em [{id?, nome}] */
function splitNomesToArray(nomes?: string | null): { id: number; nome: string }[] {
  if (!nomes) return [];
  return nomes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((nome, idx) => ({ id: idx + 1, nome }));
}

const safeNum = (v: any, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

let __tempId = 1;
const tempId = () => 1_000_000 + __tempId++;

/** Converte row de /livros -> Book (lista) */
function mapFromListRow(row: any): Book {
  const autores = Array.isArray(row?.autores)
    ? row.autores.map((a: any, i: number) => ({ id: safeNum(a?.id, i + 1), nome: a?.nome ?? "Autor" }))
    : splitNomesToArray(row?.autores_nomes);

  const categorias = Array.isArray(row?.categorias)
    ? row.categorias.map((c: any, i: number) => ({ id: safeNum(c?.id, i + 1), nome: c?.nome ?? "Categoria" }))
    : splitNomesToArray(row?.categorias_nomes);

  const idRaw = row?.id ?? row?.book_id ?? row?.codigo;
  const idFinal = safeNum(idRaw, tempId());

  return {
    id: idFinal,
    titulo: row?.titulo ?? "Sem título",
    isbn: row?.isbn ?? undefined,
    capa_url: resolveCapaUrl(row?.capa_url) ?? undefined,
    preco: 59.9,
    preco_promocional: undefined,
    promocao_ativa: false,
    quantidade_disponivel: safeNum(row?.quantidade_disponivel, 0),
    sinopse: row?.sinopse ?? "",
    autores,
    categorias,
    autores_nomes: undefined,
    ano_publicacao: 0,
    categorias_nomes: undefined,
  };
}

/** Converte row de /livros/:id -> Book (detalhe) */
function mapFromDetailRow(row: any): Book {
  const autores = Array.isArray(row?.autores)
    ? row.autores.map((a: any, i: number) => ({ id: safeNum(a?.id, i + 1), nome: a?.nome ?? "Autor" }))
    : splitNomesToArray(row?.autores_nomes);

  const categorias = Array.isArray(row?.categorias)
    ? row.categorias.map((c: any, i: number) => ({ id: safeNum(c?.id, i + 1), nome: c?.nome ?? "Categoria" }))
    : splitNomesToArray(row?.categorias_nomes);

  const idRaw = row?.id ?? row?.book_id ?? row?.codigo;
  const idFinal = safeNum(idRaw, tempId());

  return {
    id: idFinal,
    titulo: row?.titulo ?? "Sem título",
    isbn: row?.isbn ?? undefined,
    capa_url: resolveCapaUrl(row?.capa_url) ?? undefined,
    preco: 59.9,
    preco_promocional: undefined,
    promocao_ativa: false,
    quantidade_disponivel: safeNum(row?.quantidade_disponivel, 0),
    sinopse: row?.sinopse ?? "",
    autores,
    categorias,
    autores_nomes: undefined,
    ano_publicacao: 0,
    categorias_nomes: undefined,
  };
}

export async function getBooks(): Promise<Book[]> {
  try {
    const res = await api.get("/livros");
    const rows = res.data;

    if (!Array.isArray(rows)) {
      console.warn("Formato inesperado em /livros:", rows);
      return [];
    }
    return rows.map(mapFromListRow);
  } catch (error: any) {
    console.error("❌ Falha ao carregar livros:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    throw new Error("Falha ao carregar livros");
  }
}

export async function getBook(id: number): Promise<Book | undefined> {
  try {
    const res = await api.get(`/livros/${id}`);
    return mapFromDetailRow(res.data);
  } catch (error: any) {
    console.error("❌ Falha ao carregar livro:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    return undefined;
  }
}

/** Alias de conveniência (esperado pelo componente Loja) */
export const listBooks = getBooks;
