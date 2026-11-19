import { fetchFromBrasilApi } from "./providers/brasilApi";
import { fetchFromGoogleBooks, GOOGLE_BOOKS_API_KEY } from "./providers/googleBooks";
import { fetchFromOpenLibrary } from "./providers/openLibrary";
import { isValidIsbn, normalizeBookData, type BookFormState } from "./utils/bookUtils";

const ALL_PROVIDERS = ["cbl", "mercado-editorial", "open-library", "google-books"] as const;

export type Provider = (typeof ALL_PROVIDERS)[number];

// Google Books só entra na lista com chave de API configurada (ver providers/googleBooks.ts)
export const PROVIDERS: readonly Provider[] = ALL_PROVIDERS.filter(
  (provider) => provider !== "google-books" || GOOGLE_BOOKS_API_KEY,
);

export const PROVIDER_LABELS: Record<Provider, string> = {
  cbl: "CBL",
  "mercado-editorial": "Mercado Editorial",
  "open-library": "Open Library",
  "google-books": "Google Books",
};

// Cada fonte é consultada pela sua própria API (CBL e Mercado Editorial pela BrasilAPI)
const PROVIDER_FETCHERS: Record<
  Provider,
  (isbn: string, signal: AbortSignal) => Promise<Record<string, unknown> | null>
> = {
  cbl: (isbn, signal) => fetchFromBrasilApi(isbn, "cbl", signal),
  "mercado-editorial": (isbn, signal) => fetchFromBrasilApi(isbn, "mercado-editorial", signal),
  "open-library": fetchFromOpenLibrary,
  "google-books": fetchFromGoogleBooks,
};

// Tempo máximo de espera por provedor; um provedor lento não deve travar a busca
const PROVIDER_TIMEOUT_MS = 10_000;

// Campos que, se vazios no provedor principal, são completados pelos demais
const FILLABLE_FIELDS = [
  "title",
  "authors",
  "publisher",
  "edition",
  "year",
  "pageCount",
  "subtitle",
  "location",
  "synopsis",
  "height",
  "format",
  "language",
  "coverUrl",
] as const;

type FillableField = (typeof FILLABLE_FIELDS)[number];

// Etiquetas de máquina que alguns provedores misturam aos assuntos
// (ex.: "nyt:combined-print-and-e-book-fiction=2023-07-09", "series:Harry_Potter")
const MACHINE_TAG = /^[\w-]+:\S/;

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

export type ProviderResponse =
  | { status: "found"; data: Record<string, unknown> }
  | { status: "not-found" | "error" | "timeout" };

export type BookSearchResult =
  // failedProviders: fontes que falharam ou excederam o tempo limite, mesmo com a obra encontrada
  | { status: "found"; book: BookFormState; failedProviders: Provider[] }
  | { status: "not-found" | "invalid-isbn" | "unavailable" };

/** Consulta um único provedor; erro e estouro do tempo limite contam como falha do provedor. */
export async function fetchFromProvider(isbn: string, provider: Provider): Promise<ProviderResponse> {
  try {
    const data = await PROVIDER_FETCHERS[provider](isbn, AbortSignal.timeout(PROVIDER_TIMEOUT_MS));
    return data ? { status: "found", data } : { status: "not-found" };
  } catch (error) {
    return { status: error instanceof DOMException && error.name === "TimeoutError" ? "timeout" : "error" };
  }
}

/** Converte a resposta de um provedor para BookFormState, registrando de qual provedor ela veio. */
export function toBook(data: Record<string, unknown>, provider: Provider, isbn: string): BookFormState {
  return normalizeBookData({ ...data, provider: data.provider ?? provider }, isbn);
}

/**
 * Combina os resultados dos provedores, já em ordem de prioridade: o primeiro prevalece,
 * os campos vazios são completados pelos seguintes, em ordem, e os assuntos são reunidos.
 */
export function consolidateBooks([primary, ...fallbacks]: BookFormState[]): BookFormState | undefined {
  if (!primary) return undefined;

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

  result.subjects = mergeSubjects([primary, ...fallbacks]);
  for (const book of fallbacks) {
    if (book.subjects?.some((subject) => !MACHINE_TAG.test(subject))) contributors.add(book.provider);
  }

  result.provider = [...contributors].join(" + ");
  return result;
}

/**
 * Consulta todos os provedores em paralelo e combina os resultados: o provedor
 * escolhido (ou o primeiro da lista, no modo automático) tem prioridade, os campos
 * vazios são completados pelos demais, em ordem, e os assuntos de todas as fontes
 * são reunidos.
 *
 * Sem resultados, informa o motivo: ISBN com dígito verificador inválido, obra não
 * encontrada em nenhum provedor, ou falha em algum provedor que impediu a confirmação.
 */
export async function fetchBookData(isbn: string, provider?: Provider): Promise<BookSearchResult> {
  if (!isValidIsbn(isbn)) return { status: "invalid-isbn" };

  const priority = provider ? [provider, ...PROVIDERS.filter((item) => item !== provider)] : [...PROVIDERS];

  const responses = await Promise.all(priority.map((item) => fetchFromProvider(isbn, item)));
  const books = responses.flatMap((response, index) =>
    response.status === "found" ? [toBook(response.data, priority[index], isbn)] : [],
  );

  const book = consolidateBooks(books);
  const failedProviders = priority.filter(
    (_, index) => responses[index].status === "error" || responses[index].status === "timeout",
  );
  if (!book) return { status: failedProviders.length > 0 ? "unavailable" : "not-found" };

  return { status: "found", book, failedProviders };
}
