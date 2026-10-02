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

// Campos do formulário que podem ser completados por outro provedor
const FILLABLE_FIELDS = ["title", "authors", "publisher", "year", "pageCount"] as const;

type FillableField = (typeof FILLABLE_FIELDS)[number];

function isFieldEmpty(book: BookFormState, field: FillableField): boolean {
  const value = book[field];
  if (field === "pageCount") return !value;
  return typeof value !== "string" || value.trim() === "";
}

function getMissingFields(book: BookFormState): FillableField[] {
  return FILLABLE_FIELDS.filter((field) => isFieldEmpty(book, field));
}

async function fetchFromProvider(isbn: string, provider?: Provider) {
  try {
    let url = `${BASE_URL}/${isbn}`;
    if (provider) url += `?providers=${provider}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    console.error(`Falha na busca da obra (${provider ?? "automático"}): `, error);
    return null;
  }
}

/**
 * Busca a obra no provedor escolhido (ou no mais rápido, se nenhum for informado)
 * e completa os campos vazios consultando os demais provedores, em ordem.
 */
export async function fetchBookData(isbn: string, provider?: Provider): Promise<BookFormState | null> {
  const primaryData = await fetchFromProvider(isbn, provider);
  const book = primaryData ? normalizeBookData(primaryData, isbn) : null;

  const usedProviders = new Set<string>();
  if (book?.provider) usedProviders.add(book.provider);
  if (provider) usedProviders.add(provider);

  const fallbackProviders = PROVIDERS.filter((item) => !usedProviders.has(item));
  let result = book;

  for (const fallbackProvider of fallbackProviders) {
    const missingFields = result ? getMissingFields(result) : [...FILLABLE_FIELDS];
    if (missingFields.length === 0) break;

    const fallbackData = await fetchFromProvider(isbn, fallbackProvider);
    if (!fallbackData) continue;

    const fallbackBook = normalizeBookData(fallbackData, isbn);

    if (!result) {
      result = fallbackBook;
      continue;
    }

    const filled = missingFields.filter((field) => !isFieldEmpty(fallbackBook, field));
    if (filled.length === 0) continue;

    result = { ...result };
    for (const field of filled) {
      Object.assign(result, { [field]: fallbackBook[field] });
    }
    result.provider = `${result.provider} + ${fallbackBook.provider}`;
  }

  return result;
}
