// Consulta direta à Google Books API (https://developers.google.com/books/docs/v1/using).
// Sem chave, as consultas usam uma cota anônima compartilhada que se esgota com frequência;
// por isso o provedor só é habilitado quando VITE_GOOGLE_BOOKS_API_KEY está configurada.

const BASE_URL = "https://www.googleapis.com/books/v1/volumes";

export const GOOGLE_BOOKS_API_KEY: string | undefined = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || undefined;

type VolumeInfo = {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
};

type Volume = {
  volumeInfo?: VolumeInfo;
  saleInfo?: { listPrice?: { amount?: number; currencyCode?: string } };
};

/** Dados do Google Books convertidos para o formato da BrasilAPI. */
export async function fetchFromGoogleBooks(isbn: string, signal: AbortSignal): Promise<Record<string, unknown> | null> {
  const params = new URLSearchParams({ q: `isbn:${isbn}` });
  if (GOOGLE_BOOKS_API_KEY) params.set("key", GOOGLE_BOOKS_API_KEY);

  const response = await fetch(`${BASE_URL}?${params}`, { signal });
  if (!response.ok) throw new Error(`Google Books respondeu ${response.status}`);

  const body = (await response.json()) as { items?: Volume[] };
  const volume = body.items?.[0];
  const info = volume?.volumeInfo;
  if (!info) return null;

  const price = volume.saleInfo?.listPrice;
  // A API devolve as capas em http; o navegador bloquearia conteúdo misto
  const cover = (info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail)?.replace(/^http:/, "https:");

  return {
    title: info.title,
    subtitle: info.subtitle,
    authors: info.authors ?? [],
    publisher: info.publisher,
    year: info.publishedDate?.match(/\d{4}/)?.[0],
    page_count: info.pageCount,
    subjects: info.categories ?? [],
    synopsis: info.description,
    retail_price: price?.amount ? { amount: price.amount, currency: price.currencyCode } : undefined,
    cover_url: cover,
    provider: "google-books",
  };
}
