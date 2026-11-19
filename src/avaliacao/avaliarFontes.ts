// Avaliação das fontes de dados (Cap. 5 do TCC, seção 5.1.3).
//
// Consulta cada fonte isoladamente para os ISBNs de uma amostra, com os mesmos
// adaptadores e a mesma regra de consolidação da aplicação (api.ts), e produz as
// tabelas de cobertura, completude, estratos, ganho da consolidação e equivalência
// entre ISBN-10 e ISBN-13. Não é importado pela aplicação: é executado pelo
// script scripts/avaliar-fontes.mjs, que cuida da leitura e da gravação dos arquivos.

import { consolidateBooks, fetchFromProvider, PROVIDER_LABELS, PROVIDERS, toBook, type Provider } from "../api";
import { formatIsbn, isValidIsbn, type BookFormState } from "../utils/bookUtils";

/** Os catorze campos do formulário de revisão considerados na completude. */
export const CAMPOS = [
  ["titulo", "Título", "title"],
  ["subtitulo", "Subtítulo", "subtitle"],
  ["autores", "Autores", "authors"],
  ["editora", "Editora", "publisher"],
  ["local", "Local", "location"],
  ["edicao", "Edição", "edition"],
  ["ano", "Ano", "year"],
  ["paginas", "Páginas", "pageCount"],
  ["altura", "Altura", "height"],
  ["formato", "Formato", "format"],
  ["idioma", "Idioma", "language"],
  ["sinopse", "Sinopse", "synopsis"],
  ["assuntos", "Assuntos", "subjects"],
  ["capa", "Capa", "coverUrl"],
] as const satisfies readonly (readonly [string, string, keyof BookFormState])[];

export type Campo = (typeof CAMPOS)[number][0];

export type ItemAmostra = { id: string; estrato: string; titulo: string; isbn: string };

type Situacao = "encontrado" | "nao-encontrado" | "erro" | "tempo-esgotado";

export type ConsultaFonte = {
  fonte: Provider;
  situacao: Situacao;
  tempoMs: number;
  livro?: BookFormState;
};

export type ResultadoIsbn = {
  isbn: string;
  valido: boolean;
  fontes: ConsultaFonte[];
  /** Situação do registro consolidado, com a mesma regra da aplicação. */
  situacao: "encontrado" | "nao-encontrado" | "indisponivel" | "isbn-invalido";
  consolidado?: BookFormState;
  tempoTotalMs: number;
};

export type ResultadoObra = {
  item: ItemAmostra;
  principal: ResultadoIsbn;
  /** Consulta repetida com o ISBN-13 equivalente, apenas para obras com ISBN-10. */
  equivalente13?: ResultadoIsbn;
};

export type Avaliacao = {
  inicio: Date;
  fim: Date;
  fontes: readonly Provider[];
  obras: ResultadoObra[];
};

const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Converte um ISBN-10 no ISBN-13 equivalente (prefixo 978 e novo dígito verificador). */
export function isbn10para13(isbn10: string): string {
  const base = `978${formatIsbn(isbn10).slice(0, 9)}`;
  const soma = [...base].reduce((total, digito, indice) => total + Number(digito) * (indice % 2 === 0 ? 1 : 3), 0);
  return `${base}${(10 - (soma % 10)) % 10}`;
}

export function campoPreenchido(livro: BookFormState | undefined, campo: Campo): boolean {
  if (!livro) return false;
  const chave = CAMPOS.find(([id]) => id === campo)![2];
  const valor = livro[chave];
  if (typeof valor === "string") return valor.trim() !== "";
  if (Array.isArray(valor)) return valor.length > 0;
  return valor !== undefined && valor !== null;
}

export function camposPreenchidos(livro: BookFormState | undefined): number {
  return CAMPOS.filter(([campo]) => campoPreenchido(livro, campo)).length;
}

async function consultarIsbn(isbnBruto: string): Promise<ResultadoIsbn> {
  const isbn = formatIsbn(isbnBruto);
  if (!isValidIsbn(isbn)) {
    return { isbn, valido: false, fontes: [], situacao: "isbn-invalido", tempoTotalMs: 0 };
  }

  const inicio = performance.now();
  // Todas as fontes em paralelo, como na aplicação; o tempo é medido por fonte
  const fontes = await Promise.all(
    PROVIDERS.map(async (fonte): Promise<ConsultaFonte> => {
      const t0 = performance.now();
      const resposta = await fetchFromProvider(isbn, fonte);
      const tempoMs = Math.round(performance.now() - t0);

      if (resposta.status === "found") {
        return { fonte, situacao: "encontrado", tempoMs, livro: toBook(resposta.data, fonte, isbn) };
      }
      const situacao: Situacao =
        resposta.status === "timeout" ? "tempo-esgotado" : resposta.status === "error" ? "erro" : "nao-encontrado";
      return { fonte, situacao, tempoMs };
    }),
  );
  const tempoTotalMs = Math.round(performance.now() - inicio);

  // Modo automático da aplicação: a ordem de PROVIDERS define a prioridade
  const consolidado = consolidateBooks(fontes.flatMap((consulta) => (consulta.livro ? [consulta.livro] : [])));
  const falhou = fontes.some((consulta) => consulta.situacao === "erro" || consulta.situacao === "tempo-esgotado");
  const situacao = consolidado ? "encontrado" : falhou ? "indisponivel" : "nao-encontrado";

  return { isbn, valido: true, fontes, situacao, consolidado, tempoTotalMs };
}

/**
 * Consulta a amostra, um ISBN por vez (com pausa entre eles, para não sobrecarregar
 * as fontes). Obras com ISBN-10 são consultadas também pelo ISBN-13 equivalente.
 */
export async function avaliarAmostra(
  amostra: ItemAmostra[],
  opcoes: { pausaMs?: number; aoProgredir?: (feitos: number, total: number, item: ItemAmostra) => void } = {},
): Promise<Avaliacao> {
  const { pausaMs = 500, aoProgredir } = opcoes;
  const inicio = new Date();
  const obras: ResultadoObra[] = [];

  for (const [indice, item] of amostra.entries()) {
    const principal = await consultarIsbn(item.isbn);
    let equivalente13: ResultadoIsbn | undefined;

    if (principal.valido && principal.isbn.length === 10) {
      await espera(pausaMs);
      equivalente13 = await consultarIsbn(isbn10para13(principal.isbn));
    }

    obras.push({ item, principal, equivalente13 });
    aoProgredir?.(indice + 1, amostra.length, item);
    if (indice < amostra.length - 1) await espera(pausaMs);
  }

  return { inicio, fim: new Date(), fontes: PROVIDERS, obras };
}

// ---------------------------------------------------------------------------
// Relatórios (CSV com ";" e vírgula decimal, que o Excel em português abre direto)
// ---------------------------------------------------------------------------

type Celula = string | number | boolean | undefined;

function celula(valor: Celula): string {
  if (valor === undefined) return "";
  if (typeof valor === "boolean") return valor ? "1" : "0";
  if (typeof valor === "number") return Number.isInteger(valor) ? String(valor) : valor.toFixed(1).replace(".", ",");
  return /[;"\n\r]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

function csv(cabecalho: string[], linhas: Celula[][]): string {
  return [cabecalho, ...linhas].map((linha) => linha.map(celula).join(";")).join("\r\n") + "\r\n";
}

const pct = (parte: number, total: number) => (total > 0 ? (parte / total) * 100 : 0);
const media = (valores: number[]) => (valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0);

/** Fontes isoladas mais a linha "consolidado", com o livro e a situação de cada uma. */
function colunas(avaliacao: Avaliacao) {
  return [
    ...avaliacao.fontes.map((fonte) => ({
      id: fonte as string,
      rotulo: PROVIDER_LABELS[fonte],
      livro: (r: ResultadoIsbn) => r.fontes.find((consulta) => consulta.fonte === fonte)?.livro,
      consulta: (r: ResultadoIsbn) => r.fontes.find((consulta) => consulta.fonte === fonte),
    })),
    {
      id: "consolidado",
      rotulo: "Consolidado",
      livro: (r: ResultadoIsbn) => r.consolidado,
      consulta: () => undefined,
    },
  ];
}

/** Itens do estrato "controle" (ISBN inválido ou obra inexistente) não entram nas proporções. */
function ehControle(obra: ResultadoObra) {
  return obra.item.estrato.trim().toLowerCase() === "controle";
}

/** Obras que entram nas proporções: ISBN válido e fora do estrato "controle". */
function obrasValidas(avaliacao: Avaliacao) {
  return avaliacao.obras.filter((obra) => obra.principal.valido && !ehControle(obra));
}

export function gerarRelatorios(avaliacao: Avaliacao): Record<string, string> {
  const validas = obrasValidas(avaliacao);
  const cols = colunas(avaliacao);
  const camposId = CAMPOS.map(([id]) => id);

  // 1. Dados brutos: uma linha por ISBN consultado e por fonte (e o consolidado)
  const consultas: Celula[][] = [];
  for (const obra of avaliacao.obras) {
    for (const [tipo, resultado] of [
      ["principal", obra.principal],
      ["isbn13-equivalente", obra.equivalente13],
    ] as const) {
      if (!resultado) continue;
      if (!resultado.valido) {
        consultas.push([obra.item.id, obra.item.estrato, obra.item.titulo, resultado.isbn, tipo, "—", "isbn-invalido"]);
        continue;
      }
      for (const consulta of resultado.fontes) {
        consultas.push([
          obra.item.id, obra.item.estrato, obra.item.titulo, resultado.isbn, tipo, consulta.fonte,
          consulta.situacao, consulta.tempoMs, camposPreenchidos(consulta.livro),
          ...camposId.map((campo) => campoPreenchido(consulta.livro, campo)),
        ]);
      }
      consultas.push([
        obra.item.id, obra.item.estrato, obra.item.titulo, resultado.isbn, tipo, "consolidado",
        resultado.situacao, resultado.tempoTotalMs, camposPreenchidos(resultado.consolidado),
        ...camposId.map((campo) => campoPreenchido(resultado.consolidado, campo)),
      ]);
    }
  }

  // 2. Tabela 2: cobertura, completude e tempo por fonte
  const resumoFontes = cols.map((col) => {
    const encontradas = validas.filter((obra) => col.livro(obra.principal));
    const consultasFonte = validas.flatMap((obra) => col.consulta(obra.principal) ?? []);
    const tempos = col.id === "consolidado"
      ? validas.map((obra) => obra.principal.tempoTotalMs)
      : consultasFonte.map((consulta) => consulta.tempoMs);
    return [
      col.rotulo,
      validas.length,
      encontradas.length,
      pct(encontradas.length, validas.length),
      // Completude: média, entre as obras encontradas, da proporção dos 14 campos preenchidos
      media(encontradas.map((obra) => pct(camposPreenchidos(col.livro(obra.principal)), CAMPOS.length))),
      media(tempos),
      col.id === "consolidado" ? undefined : consultasFonte.filter((c) => c.situacao === "erro").length,
      col.id === "consolidado" ? undefined : consultasFonte.filter((c) => c.situacao === "tempo-esgotado").length,
    ];
  });

  // 3. Tabela 3: proporção das obras (válidas) com cada campo preenchido, por fonte
  const resumoCampos = CAMPOS.map(([campo, rotulo]) => [
    rotulo,
    ...cols.map((col) => pct(validas.filter((obra) => campoPreenchido(col.livro(obra.principal), campo)).length, validas.length)),
  ]);

  // 4. Tabela 4: obras encontradas por estrato e por fonte
  const estratos = [...new Set(validas.map((obra) => obra.item.estrato))];
  const resumoEstratos = estratos.map((estrato) => {
    const doEstrato = validas.filter((obra) => obra.item.estrato === estrato);
    return [
      estrato,
      doEstrato.length,
      ...cols.map((col) => pct(doEstrato.filter((obra) => col.livro(obra.principal)).length, doEstrato.length)),
    ];
  });

  // 5. Ganho da consolidação, por obra e resumido
  const fontesIsoladas = cols.filter((col) => col.id !== "consolidado");
  const porObra = validas.map((obra) => {
    const r = obra.principal;
    const melhor = fontesIsoladas
      .map((col) => ({ rotulo: col.rotulo, campos: camposPreenchidos(col.livro(r)) }))
      .sort((a, b) => b.campos - a.campos)[0];
    const consolidado = camposPreenchidos(r.consolidado);
    const contribuintes = r.consolidado?.provider.split(" + ").filter(Boolean).length ?? 0;
    return {
      linha: [
        obra.item.id, obra.item.estrato, obra.item.titulo, r.isbn, r.situacao, r.consolidado?.provider,
        r.fontes.filter((consulta) => consulta.livro).length, contribuintes,
        melhor?.campos ? melhor.rotulo : undefined, melhor?.campos ?? 0, consolidado, consolidado - (melhor?.campos ?? 0),
      ] as Celula[],
      encontrada: Boolean(r.consolidado),
      ganho: consolidado - (melhor?.campos ?? 0),
      contribuintes,
    };
  });
  const encontradas = porObra.filter((obra) => obra.encontrada);
  const resumoConsolidacao: Celula[][] = [
    ["Obras com ISBN válido", validas.length],
    ["Obras encontradas (consolidado)", encontradas.length],
    ["Campos acrescentados pela consolidação, em média por obra encontrada", media(encontradas.map((o) => o.ganho))],
    ["Obras encontradas em que a consolidação acrescentou ao menos um campo (%)", pct(encontradas.filter((o) => o.ganho > 0).length, encontradas.length)],
    ["Registros compostos com dados de duas ou mais fontes (%)", pct(encontradas.filter((o) => o.contribuintes >= 2).length, encontradas.length)],
    ["Obras encontradas por uma única fonte", encontradas.filter((o) => Number(o.linha[6]) === 1).length],
  ];

  // 6. H7: equivalência entre ISBN-10 e ISBN-13
  const pares = validas.filter((obra) => obra.equivalente13);
  const camposComparados = ["title", "subtitle", "authors", "publisher", "year", "pageCount"] as const;
  const equivalencia = pares.map((obra) => {
    const a = obra.principal;
    const b = obra.equivalente13!;
    const diferentes = a.consolidado && b.consolidado
      ? camposComparados.filter((campo) => String(a.consolidado![campo] ?? "") !== String(b.consolidado![campo] ?? ""))
      : [];
    const porFonte = a.fontes.map((consulta) => {
      const outra = b.fontes.find((item) => item.fonte === consulta.fonte);
      return `${consulta.fonte}: ${consulta.situacao}/${outra?.situacao ?? "—"}`;
    });
    const concordante = a.situacao === b.situacao && diferentes.length === 0;
    return [
      obra.item.id, obra.item.titulo, a.isbn, b.isbn, a.situacao, b.situacao,
      a.consolidado?.provider, b.consolidado?.provider,
      camposPreenchidos(a.consolidado), camposPreenchidos(b.consolidado),
      diferentes.join(", "), porFonte.join(" | "), concordante ? "sim" : "não",
    ];
  });

  // 7. Resumo legível
  const minutos = (avaliacao.fim.getTime() - avaliacao.inicio.getTime()) / 60000;
  const controles = avaliacao.obras.filter((obra) => !obra.principal.valido || ehControle(obra));
  const texto = [
    "Avaliação das fontes de dados do Cataloga+",
    `Início: ${avaliacao.inicio.toLocaleString("pt-BR")}`,
    `Fim: ${avaliacao.fim.toLocaleString("pt-BR")} (${minutos.toFixed(1).replace(".", ",")} min)`,
    `Fontes consultadas: ${avaliacao.fontes.map((fonte) => PROVIDER_LABELS[fonte]).join(", ")}`,
    avaliacao.fontes.includes("google-books")
      ? ""
      : "Google Books NÃO consultado: VITE_GOOGLE_BOOKS_API_KEY não configurada no .env.",
    `Itens na amostra: ${avaliacao.obras.length} (${validas.length} obras avaliadas, ${controles.length} controles ou ISBNs inválidos)`,
    `Encontrados (consolidado): ${encontradas.length} de ${validas.length} (${pct(encontradas.length, validas.length).toFixed(1).replace(".", ",")}%)`,
    `Pares ISBN-10/ISBN-13: ${pares.length}, concordantes: ${equivalencia.filter((linha) => linha.at(-1) === "sim").length}`,
    "",
    "Situação por obra (consolidado):",
    ...avaliacao.obras.map((obra) => `  ${obra.item.id.padEnd(5)} ${obra.principal.isbn.padEnd(14)} ${obra.principal.situacao.padEnd(15)} ${obra.principal.consolidado?.provider ?? ""}`),
  ].filter((linha, indice, todas) => linha !== "" || todas[indice - 1] !== "");

  return {
    "consultas.csv": csv(
      ["id", "estrato", "titulo", "isbn", "consulta", "fonte", "situacao", "tempo_ms", "campos_preenchidos", ...camposId],
      consultas,
    ),
    "resumo-fontes.csv": csv(
      ["fonte", "obras_consultadas", "obras_encontradas", "encontradas_pct", "completude_pct", "tempo_medio_ms", "erros", "tempos_esgotados"],
      resumoFontes,
    ),
    "resumo-campos.csv": csv(["campo", ...cols.map((col) => col.rotulo)], resumoCampos),
    "resumo-estratos.csv": csv(["estrato", "obras", ...cols.map((col) => col.rotulo)], resumoEstratos),
    "consolidacao-por-obra.csv": csv(
      ["id", "estrato", "titulo", "isbn", "situacao", "provedor", "fontes_que_encontraram", "fontes_que_contribuiram", "melhor_fonte_isolada", "campos_melhor_fonte", "campos_consolidado", "ganho"],
      porObra.map((obra) => obra.linha),
    ),
    "resumo-consolidacao.csv": csv(["indicador", "valor"], resumoConsolidacao),
    "isbn10-isbn13.csv": csv(
      ["id", "titulo", "isbn10", "isbn13", "situacao_10", "situacao_13", "provedor_10", "provedor_13", "campos_10", "campos_13", "campos_divergentes", "situacao_por_fonte_10/13", "concordante"],
      equivalencia,
    ),
    "resumo.txt": texto.join("\r\n") + "\r\n",
  };
}
