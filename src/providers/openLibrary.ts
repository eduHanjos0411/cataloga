// Consulta direta à Open Library (https://openlibrary.org/dev/docs/api/books), sem chave.
// "jscmd=data" traz autores, assuntos e capa já resolvidos; "jscmd=details" traz o registro
// da edição (edição, formato, dimensões, descrição). As duas consultas são feitas em paralelo.

const BASE_URL = "https://openlibrary.org/api/books";

// Os assuntos vêm da obra (todas as edições e traduções) e podem passar de cem;
// os primeiros são os mais gerais, o resto é ruído para a catalogação de uma edição
const MAX_SUBJECTS = 10;

type Named = { name?: string };

async function fetchBibKey(isbn: string, command: "data" | "details", signal: AbortSignal) {
  const response = await fetch(`${BASE_URL}?bibkeys=ISBN:${isbn}&format=json&jscmd=${command}`, { signal });
  if (!response.ok) throw new Error(`Open Library respondeu ${response.status}`);

  const body = (await response.json()) as Record<string, Record<string, unknown> | undefined>;
  return body[`ISBN:${isbn}`];
}

function names(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: Named | string) => (typeof item === "string" ? item : item?.name))
    .filter((name): name is string => Boolean(name?.trim()));
}

/** "21 x 14 x 2 centimeters" -> { height: 21, unit: "CENTIMETER" } (a altura vem primeiro). */
function parseDimensions(value: unknown) {
  if (typeof value !== "string") return undefined;
  const height = Number(value.match(/[\d.]+/)?.[0]);
  if (!(height > 0)) return undefined;
  return { height, unit: /inch/i.test(value) ? "INCH" : "CENTIMETER" };
}

function parseFormat(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return /e-?book|digital|electronic/i.test(value) ? "DIGITAL" : "PHYSICAL";
}

function parseDescription(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "value" in value) return String(value.value);
  return undefined;
}

/** Dados da Open Library convertidos para o formato da BrasilAPI. */
export async function fetchFromOpenLibrary(isbn: string, signal: AbortSignal): Promise<Record<string, unknown> | null> {
  const [data, details] = await Promise.all([
    fetchBibKey(isbn, "data", signal),
    fetchBibKey(isbn, "details", signal),
  ]);
  if (!data) return null;

  const edition = (details?.details ?? {}) as Record<string, unknown>;
  const cover = data.cover as Record<string, string> | undefined;

  return {
    title: data.title,
    subtitle: data.subtitle,
    authors: names(data.authors),
    publisher: names(data.publishers).join(", "),
    location: names(data.publish_places)[0],
    year: String(data.publish_date ?? "").match(/\d{4}/)?.[0],
    page_count: data.number_of_pages,
    subjects: names(data.subjects).slice(0, MAX_SUBJECTS),
    edition: edition.edition_name,
    format: parseFormat(edition.physical_format),
    dimensions: parseDimensions(edition.physical_dimensions),
    synopsis: parseDescription(edition.description),
    cover_url: cover?.large ?? cover?.medium,
    provider: "open-library",
  };
}
