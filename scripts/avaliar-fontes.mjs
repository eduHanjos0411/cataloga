// Avaliação das fontes de dados do Cataloga+ (Cap. 5 do TCC).
//
// Uso:
//   npm run avaliar -- <amostra.csv> [--saida <pasta>] [--pausa <ms>]
//
// A amostra é um CSV (separado por ";", "," ou tabulação) com, no mínimo, a coluna
// "isbn". As colunas "id", "estrato" e "titulo" são opcionais. Linhas sem ISBN são
// ignoradas. A planilha docs/tcc/resultados/planilha-cobertura.csv já está nesse formato.
//
// O código da avaliação (src/avaliacao/avaliarFontes.ts) é carregado pelo Vite, para
// que os adaptadores das fontes funcionem exatamente como na aplicação, inclusive a
// chave do Google Books lida do arquivo .env.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createServer } from "vite";

function lerArgumentos(argv) {
  const opcoes = { amostra: undefined, saida: undefined, pausa: 500 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--saida") opcoes.saida = argv[++i];
    else if (argv[i] === "--pausa") opcoes.pausa = Number(argv[++i]);
    else opcoes.amostra ??= argv[i];
  }
  return opcoes;
}

function semAcento(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

/** Divide uma linha de CSV respeitando campos entre aspas. */
function dividir(linha, separador) {
  const campos = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (aspas) {
      if (c === '"' && linha[i + 1] === '"') { atual += '"'; i++; }
      else if (c === '"') aspas = false;
      else atual += c;
    } else if (c === '"') aspas = true;
    else if (c === separador) { campos.push(atual); atual = ""; }
    else atual += c;
  }
  campos.push(atual);
  return campos.map((campo) => campo.trim());
}

function lerAmostra(conteudo) {
  const linhas = conteudo.replace(/^﻿/, "").split(/\r?\n/).filter((linha) => linha.trim() !== "");
  if (linhas.length === 0) throw new Error("A amostra está vazia.");

  const separador = [";", "\t", ","].find((s) => linhas[0].includes(s)) ?? ";";
  const cabecalho = dividir(linhas[0], separador).map(semAcento);
  const coluna = (nome) => cabecalho.indexOf(nome);
  if (coluna("isbn") < 0) throw new Error('A amostra precisa de uma coluna "isbn".');

  return linhas.slice(1).flatMap((linha, indice) => {
    const campos = dividir(linha, separador);
    const valor = (nome) => (coluna(nome) >= 0 ? campos[coluna(nome)] ?? "" : "");
    const isbn = valor("isbn");
    if (!isbn) return [];
    return [{
      id: valor("id") || String(indice + 1).padStart(2, "0"),
      estrato: valor("estrato") || "—",
      titulo: valor("titulo"),
      isbn,
    }];
  });
}

const opcoes = lerArgumentos(process.argv.slice(2));
if (!opcoes.amostra) {
  console.error("Uso: npm run avaliar -- <amostra.csv> [--saida <pasta>] [--pausa <ms>]");
  process.exit(1);
}

const amostra = lerAmostra(await readFile(resolve(opcoes.amostra), "utf8"));
if (amostra.length === 0) {
  console.error("Nenhuma linha da amostra tem ISBN preenchido.");
  process.exit(1);
}

const carimbo = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const saida = resolve(opcoes.saida ?? join("avaliacao", `resultado-${carimbo}`));

// Só o carregador de módulos do Vite é usado: sem servidor HTTP e sem recarga automática
const vite = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
  logLevel: "error",
});
try {
  const { avaliarAmostra, gerarRelatorios } = await vite.ssrLoadModule("/src/avaliacao/avaliarFontes.ts");

  console.log(`Consultando ${amostra.length} ISBNs (pausa de ${opcoes.pausa} ms entre eles)...`);
  const avaliacao = await avaliarAmostra(amostra, {
    pausaMs: opcoes.pausa,
    aoProgredir: (feitos, total, item) => console.log(`  [${String(feitos).padStart(2)}/${total}] ${item.id} ${item.isbn}`),
  });

  await mkdir(saida, { recursive: true });
  const relatorios = gerarRelatorios(avaliacao);
  for (const [arquivo, conteudo] of Object.entries(relatorios)) {
    // BOM para o Excel reconhecer os acentos
    await writeFile(join(saida, arquivo), `﻿${conteudo}`, "utf8");
  }

  console.log("");
  console.log(relatorios["resumo.txt"]);
  console.log(`Arquivos gravados em ${saida}`);
} finally {
  await vite.close();
}
