export type BookFormState = {
  title: string;
  authors: string;
  publisher: string;
  year: string;
  provider: string;
  isbn: string;
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

  return {
    title: String(apiData?.title ?? ""),
    authors: normalizedAuthors,
    publisher: String(apiData?.publisher ?? ""),
    year: String(apiData?.year ?? ""),
    provider: String(apiData?.provider ?? ""),
    isbn: fallbackIsbn || formatIsbn(String(apiData?.isbn ?? "")),
  };
}
