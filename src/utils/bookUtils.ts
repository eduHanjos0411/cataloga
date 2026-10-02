export type BookFormState = {
  title: string;
  authors: string;
  publisher: string;
  year: string;
  provider: string;
  isbn: string;
  pageCount?: number;
  subtitle?: string;
  location?: string;
  synopsis?: string;
  subjects?: string[];
  // Altura em centímetros
  height?: number;
  format?: string;
  price?: { currency: string; amount: number };
  coverUrl?: string;
};

export function formatIsbn(isbn: string): string {
  return isbn.replace(/\D/g, "");
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function normalizeHeight(dimensions: unknown): number | undefined {
  if (!dimensions || typeof dimensions !== "object") return undefined;

  const { height, unit } = dimensions as Record<string, unknown>;
  const value = Number(height);
  if (!(value > 0)) return undefined;

  return unit === "INCH" ? value * 2.54 : value;
}

function normalizePrice(retailPrice: unknown): BookFormState["price"] {
  if (!retailPrice || typeof retailPrice !== "object") return undefined;

  const { currency, amount } = retailPrice as Record<string, unknown>;
  const value = Number(amount);
  if (!(value > 0)) return undefined;

  return { currency: String(currency ?? "BRL"), amount: value };
}

export function normalizeBookData(apiData: Record<string, unknown> | null, fallbackIsbn = ""): BookFormState {
  const authorsValue = apiData?.authors;
  // Nomes já invertidos ("SILVA, José") são separados por ";" para não ficarem ambíguos
  const normalizedAuthors = Array.isArray(authorsValue)
    ? authorsValue.join(authorsValue.some((author) => String(author).includes(",")) ? "; " : ", ")
    : typeof authorsValue === "string"
      ? authorsValue
      : "";

  // A BrasilAPI retorna "page_count"; "pageCount" é mantido por compatibilidade
  const pageCountValue = Number(apiData?.page_count ?? apiData?.pageCount);

  const subjectsValue = apiData?.subjects;
  const subjects = Array.isArray(subjectsValue)
    ? subjectsValue.map((subject) => String(subject).trim()).filter(Boolean)
    : [];

  return {
    title: String(apiData?.title ?? ""),
    authors: normalizedAuthors,
    publisher: String(apiData?.publisher ?? ""),
    year: String(apiData?.year ?? ""),
    provider: String(apiData?.provider ?? ""),
    pageCount: pageCountValue > 0 ? pageCountValue : undefined,
    isbn: fallbackIsbn || formatIsbn(String(apiData?.isbn ?? "")),
    subtitle: optionalString(apiData?.subtitle),
    location: optionalString(apiData?.location),
    synopsis: optionalString(apiData?.synopsis),
    subjects: subjects.length > 0 ? subjects : undefined,
    height: normalizeHeight(apiData?.dimensions),
    format: optionalString(apiData?.format),
    price: normalizePrice(apiData?.retail_price),
    coverUrl: optionalString(apiData?.cover_url),
  };
}
