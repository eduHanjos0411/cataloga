export type BookFormState = {
  title: string;
  authors: string;
  publisher: string;
  year: string;
  provider: string;
  isbn: string;
  pageCount?: number;
  subtitle?: string;
  // Indicação de edição como consta na obra ("2. ed.", "3ª edição")
  edition?: string;
  location?: string;
  synopsis?: string;
  subjects?: string[];
  // Altura em centímetros
  height?: number;
  format?: string;
  // Código de idioma MARC de três letras ("por", "eng"), usado no 008/35-37
  language?: string;
  coverUrl?: string;
};

/** Mantém apenas os dígitos e o "X" final do ISBN-10 (dígito verificador 10). */
export function formatIsbn(isbn: string): string {
  return isbn
    .toUpperCase()
    .replace(/[^\dX]/g, "")
    .replace(/X(?!$)/g, "");
}

/** Confere o dígito verificador do ISBN-10 (pesos 10 a 1, módulo 11) ou do ISBN-13 (pesos 1 e 3, módulo 10). */
export function isValidIsbn(isbn: string): boolean {
  const value = formatIsbn(isbn);

  if (/^\d{9}[\dX]$/.test(value)) {
    const sum = [...value].reduce((total, char, index) => total + (char === "X" ? 10 : Number(char)) * (10 - index), 0);
    return sum % 11 === 0;
  }

  if (/^\d{13}$/.test(value)) {
    const sum = [...value].reduce((total, char, index) => total + Number(char) * (index % 2 === 0 ? 1 : 3), 0);
    return sum % 10 === 0;
  }

  return false;
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

// Códigos ISO 639-1 (Google Books) convertidos para os códigos de idioma do MARC 21
const ISO_TO_MARC_LANGUAGE: Record<string, string> = {
  pt: "por",
  en: "eng",
  es: "spa",
  fr: "fre",
  de: "ger",
  it: "ita",
  la: "lat",
  ja: "jpn",
  zh: "chi",
  ru: "rus",
};

/** Código de idioma MARC (três letras) a partir de "por", "/languages/por" ou "pt". */
export function normalizeLanguage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const code = value.trim().toLowerCase().replace(/^\/languages\//, "").split("-")[0];
  if (/^[a-z]{3}$/.test(code)) return code;
  return ISO_TO_MARC_LANGUAGE[code];
}

export function normalizeBookData(apiData: Record<string, unknown> | null, fallbackIsbn = ""): BookFormState {
  const authorsValue = apiData?.authors;
  // Autores separados sempre por ";": a vírgula faz parte dos nomes invertidos ("SILVA, José")
  const normalizedAuthors = Array.isArray(authorsValue)
    ? authorsValue
        .map((author) => String(author).trim())
        // Marcadores das fontes, como "[author not identified]" (Open Library), não são autores
        .filter((author) => author && !/^\[.*\]$/.test(author))
        .join("; ")
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
    edition: optionalString(apiData?.edition),
    location: optionalString(apiData?.location),
    synopsis: optionalString(apiData?.synopsis),
    subjects: subjects.length > 0 ? subjects : undefined,
    height: normalizeHeight(apiData?.dimensions),
    format: optionalString(apiData?.format),
    language: normalizeLanguage(apiData?.language),
    coverUrl: optionalString(apiData?.cover_url),
  };
}
