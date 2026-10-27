import { Buffer } from "buffer";
import { Marc, Record, type MarcField } from "marcjs";
import { formatIsbn, type BookFormState } from "./bookUtils";

// O formatador ISO 2709 do marcjs usa o Buffer global do Node.js
(globalThis as { Buffer?: unknown }).Buffer ??= Buffer;

/*
 * Conversão dos dados da obra para um registro bibliográfico MARC 21
 * (https://www.loc.gov/marc/bibliographic/), descrito segundo o RDA ou o AACR2,
 * com pontuação ISBD nos subcampos.
 */

// O AACR2 continua em uso em SIGBs que não adotaram o RDA (ex.: Biblivre)
export type CatalogingRules = "rda" | "aacr2";

// "Record" aqui é a classe do marcjs, por isso o tipo mapeado
export const RULES_LABELS: { [rules in CatalogingRules]: string } = {
  rda: "RDA",
  aacr2: "AACR2",
};

// Artigos iniciais desconsiderados na ordenação (2º indicador do 245)
const INITIAL_ARTICLES = ["o", "a", "os", "as", "um", "uma", "uns", "umas", "the", "an", "el", "la", "los", "las"];

// Termos de parentesco que acompanham o sobrenome ("Santos Filho, João")
const KINSHIP_TERMS = ["filho", "filha", "neto", "neta", "sobrinho", "sobrinha", "júnior", "junior", "jr."];

const BRAZILIAN_ISBN = /^(978|979)?(65|85)/;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function isBrazilian(isbn: string): boolean {
  return BRAZILIAN_ISBN.test(formatIsbn(isbn));
}

function getYear(book: BookFormState): string | undefined {
  return book.year.match(/\d{4}/)?.[0];
}

function isDigital(book: BookFormState): boolean {
  return book.format?.toUpperCase() === "DIGITAL";
}

/** Garante a pontuação final do campo sem duplicar a pontuação existente. */
function withFinalPeriod(value: string): string {
  return /[.?!]$/.test(value) ? value : `${value}.`;
}

function splitAuthors(authors: string): string[] {
  // Autores no formato "SOBRENOME, Nome" vêm separados por ";" em alguns provedores
  const separator = authors.includes(";") ? ";" : ",";
  return authors
    .split(separator)
    .map((author) => author.trim())
    .filter(Boolean);
}

/** Forma invertida do nome para os pontos de acesso (100/700): "Sobrenome, Prenome". */
export function invertName(name: string): string {
  if (name.includes(",")) return name;

  const words = name.split(/\s+/).filter(Boolean);
  if (words.length < 2) return name;

  let surnameStart = words.length - 1;
  if (KINSHIP_TERMS.includes(words[surnameStart].toLowerCase()) && surnameStart > 1) {
    surnameStart -= 1;
  }

  const surname = words.slice(surnameStart).join(" ");
  const forenames = words.slice(0, surnameStart);

  // Partículas ficam com o prenome: "José da Silva" -> "Silva, José da"
  return `${surname}, ${forenames.join(" ")}`;
}

/** Forma direta do nome para a indicação de responsabilidade (245 $c). */
function directName(name: string): string {
  const [surname, forenames] = name.split(",").map((part) => part.trim());
  return forenames ? `${forenames} ${surname}` : name;
}

function nonFilingCharacters(title: string): string {
  const [firstWord] = title.split(/\s+/);
  if (!firstWord || !INITIAL_ARTICLES.includes(firstWord.toLowerCase())) return "0";
  return String(Math.min(firstWord.length + 1, 9));
}

function buildLeader(rules: CatalogingRules): string {
  // 05 n: registro novo | 06 a: material textual | 07 m: monografia
  // 09 a: Unicode | 17 7: nível mínimo
  // 18 i: pontuação ISBD (RDA) | a: AACR2
  // Tamanho do registro (00-04) e endereço base (12-16) são calculados pelo marcjs
  return `00000nam a22000007${rules === "aacr2" ? "a" : "i"} 4500`;
}

function buildField005(now: Date): string {
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.0`
  );
}

function buildField008(book: BookFormState, now: Date): string {
  const year = getYear(book);
  const brazilian = isBrazilian(book.isbn);

  const field =
    `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}` + // 00-05 data de entrada
    (year ? "s" : "n") + // 06 tipo de data
    (year ?? "uuuu") + // 07-10 data 1
    "    " + // 11-14 data 2
    (brazilian ? "bl " : "xx ") + // 15-17 local de publicação
    "    " + // 18-21 ilustrações
    " " + // 22 público-alvo
    (isDigital(book) ? "o" : " ") + // 23 forma do item
    "    " + // 24-27 natureza do conteúdo
    " " + // 28 publicação governamental
    "0" + // 29 publicação de evento
    "0" + // 30 homenagem
    "0" + // 31 índice
    " " + // 32 indefinido
    "|" + // 33 forma literária (não codificada)
    " " + // 34 biografia
    (brazilian ? "por" : "und") + // 35-37 idioma
    " " + // 38 registro modificado
    "d"; // 39 fonte da catalogação

  return field;
}

function buildField020(book: BookFormState): MarcField | null {
  const isbn = formatIsbn(book.isbn);
  if (!isbn) return null;

  const field = ["020", "  ", "a", isbn];
  if (book.price) {
    const amount = book.price.amount.toFixed(2).replace(".", ",");
    const currency = book.price.currency === "BRL" ? "R$" : book.price.currency;
    field.push("c", `${currency} ${amount}`);
  }
  return field;
}

function buildField245(book: BookFormState, authors: string[], rules: CatalogingRules): MarcField {
  const title = book.title.trim() || "[Sem título]";
  const ind1 = authors.length > 0 ? "1" : "0";
  const ind2 = nonFilingCharacters(title);
  const responsibility = authors.map(directName).join(", ");

  const subfields: [string, string][] = [["a", title]];
  // Designação geral do material (AACR2); no RDA ela é substituída pelos campos 336-338
  if (rules === "aacr2" && isDigital(book)) subfields.push(["h", "[recurso eletrônico]"]);
  if (book.subtitle) subfields.push(["b", book.subtitle]);
  if (responsibility) subfields.push(["c", responsibility]);

  // Pontuação ISBD: precede o subcampo seguinte, no fim do subcampo anterior
  // (a designação geral do material não é precedida de pontuação)
  for (let i = 0; i < subfields.length - 1; i += 1) {
    const next = subfields[i + 1][0];
    if (next !== "h") subfields[i][1] += next === "b" ? " :" : " /";
  }
  const last = subfields[subfields.length - 1];
  last[1] = withFinalPeriod(last[1]);

  return ["245", `${ind1}${ind2}`, ...subfields.flat()];
}

function buildField264(book: BookFormState): MarcField {
  const place = book.location || "[Local de publicação não identificado]";
  const publisher = book.publisher.trim() || "[editora não identificada]";
  const year = getYear(book) ?? "[data de publicação não identificada]";

  return ["264", " 1", "a", `${place} :`, "b", `${publisher},`, "c", withFinalPeriod(year)];
}

/** Publicação no AACR2 (260), com as abreviaturas latinas para dados desconhecidos. */
function buildField260(book: BookFormState): MarcField {
  const place = book.location || "[S.l.]";
  const publisher = book.publisher.trim() || "[s.n.]";
  const year = getYear(book) ?? "[s.d.]";

  return ["260", "  ", "a", `${place} :`, "b", `${publisher},`, "c", withFinalPeriod(year)];
}

function buildField300(book: BookFormState, rules: CatalogingRules): MarcField {
  // RDA registra os termos por extenso; o AACR2 usa abreviaturas ("p.", "v.")
  const aacr2 = rules === "aacr2";
  const extent = book.pageCount
    ? `${book.pageCount} ${aacr2 ? "p." : "páginas"}`
    : aacr2
      ? "1 v."
      : "1 volume";
  if (!book.height || isDigital(book)) return ["300", "  ", "a", extent];

  // "cm" é símbolo no RDA (sem ponto); no AACR2 a área termina com ponto
  const height = `${Math.ceil(book.height)} cm${aacr2 ? "." : ""}`;
  return ["300", "  ", "a", `${extent} ;`, "c", height];
}

function buildContentFields(book: BookFormState): MarcField[] {
  const digital = isDigital(book);
  return [
    ["336", "  ", "a", "texto", "b", "txt", "2", "rdacontent"],
    digital
      ? ["337", "  ", "a", "computador", "b", "c", "2", "rdamedia"]
      : ["337", "  ", "a", "não mediado", "b", "n", "2", "rdamedia"],
    digital
      ? ["338", "  ", "a", "recurso online", "b", "cr", "2", "rdacarrier"]
      : ["338", "  ", "a", "volume", "b", "nc", "2", "rdacarrier"],
  ];
}

export function buildMarcRecord(book: BookFormState, rules: CatalogingRules = "rda", now = new Date()): Record {
  const record = new Record();
  record.leader = buildLeader(rules);
  const rda = rules === "rda";

  const authors = splitAuthors(book.authors);
  const [mainAuthor, ...addedAuthors] = authors;

  const fields: (MarcField | null)[] = [
    ["001", formatIsbn(book.isbn)],
    ["005", buildField005(now)],
    ["008", buildField008(book, now)],
    buildField020(book),
    mainAuthor ? ["100", "1 ", "a", withFinalPeriod(invertName(mainAuthor))] : null,
    buildField245(book, authors, rules),
    book.edition?.trim() ? ["250", "  ", "a", withFinalPeriod(book.edition.trim())] : null,
    rda ? buildField264(book) : buildField260(book),
    buildField300(book, rules),
    ...(rda ? buildContentFields(book) : []),
    book.synopsis ? ["520", "  ", "a", book.synopsis] : null,
    ...(book.subjects ?? []).map((subject): MarcField => ["653", "  ", "a", subject]),
    ...addedAuthors.map((author): MarcField => ["700", "1 ", "a", withFinalPeriod(invertName(author))]),
    book.coverUrl ? ["856", "42", "3", "Capa", "u", book.coverUrl] : null,
  ];

  for (const field of fields) {
    if (field) record.append(field);
  }

  return record;
}

/** Registro serializado em ISO 2709 (arquivo .mrc). */
export function exportToMarc(book: BookFormState, rules: CatalogingRules): string {
  return Marc.format(buildMarcRecord(book, rules), "iso2709");
}

/** Vários registros em um único arquivo .mrc: cada um termina com o terminador de registro (0x1D). */
export function exportBatchToMarc(books: BookFormState[], rules: CatalogingRules): string {
  const now = new Date();
  return books.map((book) => Marc.format(buildMarcRecord(book, rules, now), "iso2709")).join("");
}
