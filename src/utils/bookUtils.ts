export type BookFormState = {
  title: string;
  authors: string;
  publisher: string;
  year: string;
  provider: string;
  isbn: string;
  pageCount?: number;
};

export function formatIsbn(isbn: string): string {
  return isbn.replace(/\D/g, "");
}

export function normalizeBookData(apiData: Record<string, unknown> | null, fallbackIsbn = ""): BookFormState {
  const authorsValue = apiData?.authors;
  const normalizedAuthors = Array.isArray(authorsValue)
    ? authorsValue.join(", ")
    : typeof authorsValue === "string"
      ? authorsValue
      : "";

  // A BrasilAPI retorna "page_count"; "pageCount" é mantido por compatibilidade
  const pageCountValue = Number(apiData?.page_count ?? apiData?.pageCount);

  return {
    title: String(apiData?.title ?? ""),
    authors: normalizedAuthors,
    publisher: String(apiData?.publisher ?? ""),
    year: String(apiData?.year ?? ""),
    provider: String(apiData?.provider ?? ""),
    pageCount: pageCountValue > 0 ? pageCountValue : undefined,
    isbn: fallbackIsbn || formatIsbn(String(apiData?.isbn ?? "")),
  };
}
