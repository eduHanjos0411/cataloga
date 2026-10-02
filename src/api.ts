import { normalizeBookData, type BookFormState } from "./utils/bookUtils";

const BASE_URL = "https://brasilapi.com.br/api/isbn/v1";

export const PROVIDERS = ["cbl", "mercado-editorial", "open-library", "google-books"] as const;

export type Provider = (typeof PROVIDERS)[number];

export const PROVIDER_LABELS: Record<Provider, string> = {
  cbl: "CBL",
  "mercado-editorial": "Mercado Editorial",
  "open-library": "Open Library",
  "google-books": "Google Books",
};

// Campos que, se vazios no provedor principal, são completados pelos demais
const FILLABLE_FIELDS = [
  "title",
  "authors",
  "publisher",
  "year",
  "pageCount",
  "subtitle",
  "location",
  "synopsis",
  "height",
  "format",
  "price",
  "coverUrl",
] as const;

type FillableField = (typeof FILLABLE_FIELDS)[number];

// Etiquetas de máquina que alguns provedores misturam aos assuntos
// (ex.: "nyt:combined-print-and-e-book-fiction=2023-07-09")
const MACHINE_TAG = /^[\w-]+:\S*=/;

function isFieldEmpty(book: BookFormState, field: FillableField): boolean {
  const value = book[field];
  if (typeof value === "string") return value.trim() === "";
  return !value;
}

/** União dos assuntos de todas as fontes, sem repetições (ignorando maiúsculas). */
function mergeSubjects(books: BookFormState[]): string[] | undefined {
  const subjects = new Map<string, string>();

  for (const subject of books.flatMap((book) => book.subjects ?? [])) {
    const key = subject.toLocaleLowerCase("pt-BR");
    if (!MACHINE_TAG.test(subject) && !subjects.has(key)) subjects.set(key, subject);
  }

  return subjects.size > 0 ? [...subjects.values()] : undefined;
}

async function fetchFromProvider(isbn: string, provider: Provider) {
  try {
    const response = await fetch(`${BASE_URL}/${isbn}?providers=${provider}`);

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    console.error(`Falha na busca da obra (${provider}): `, error);
    return null;
  }
}

/**
 * Consulta todos os provedores em paralelo e combina os resultados: o provedor
 * escolhido (ou o primeiro da lista, no modo automático) tem prioridade, os campos
 * vazios são completados pelos demais, em ordem, e os assuntos de todas as fontes
 * são reunidos.
 */
export async function fetchBookData(isbn: string, provider?: Provider): Promise<BookFormState | null> {
  const priority = provider ? [provider, ...PROVIDERS.filter((item) => item !== provider)] : [...PROVIDERS];

  const responses = await Promise.all(priority.map((item) => fetchFromProvider(isbn, item)));
  const books = responses.flatMap((data, index) =>
    data ? [normalizeBookData({ ...data, provider: data.provider ?? priority[index] }, isbn)] : [],
  );

  const [primary, ...fallbacks] = books;
  if (!primary) return null;

  const result: BookFormState = { ...primary };
  const contributors = new Set([primary.provider]);

  for (const fallback of fallbacks) {
    for (const field of FILLABLE_FIELDS) {
      if (isFieldEmpty(result, field) && !isFieldEmpty(fallback, field)) {
        Object.assign(result, { [field]: fallback[field] });
        contributors.add(fallback.provider);
      }
    }
  }

  result.subjects = mergeSubjects(books);
  for (const book of fallbacks) {
    if (book.subjects?.some((subject) => !MACHINE_TAG.test(subject))) contributors.add(book.provider);
  }

  result.provider = [...contributors].join(" + ");
  return result;
}
