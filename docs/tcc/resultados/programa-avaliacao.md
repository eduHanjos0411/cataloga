# Programa de avaliação das fontes (seção 5.1.3)

O programa consulta **cada fonte isoladamente** para cada ISBN da amostra e gera os
números das Tabelas 2, 3 e 4 do Cap. 5, o ganho da consolidação (H1) e a
equivalência entre ISBN-10 e ISBN-13 (H7).

Ele usa os mesmos adaptadores (`src/providers/`) e a mesma regra de consolidação
(`consolidateBooks` em `src/api.ts`) da aplicação. Assim, o "Consolidado" do
relatório é o mesmo registro que a interface mostraria no modo "Automático".

## Antes de rodar

1. Instale o **Node.js 20 ou mais recente** (https://nodejs.org, versão LTS).
2. Na pasta do projeto, rode uma vez:

   ```bash
   npm install
   ```

3. **Google Books:** se quiser essa fonte na avaliação, crie o arquivo `.env` na raiz do
   projeto com a linha `VITE_GOOGLE_BOOKS_API_KEY=<sua chave>`, a mesma chave usada na
   Vercel. Sem a chave, o Google Books não é consultado, e o `resumo.txt` avisa isso.
   Registre no texto quais fontes estavam ativas.

## A amostra

É um CSV com, no mínimo, a coluna `isbn`. As colunas `id`, `estrato` e `titulo` são
opcionais. O separador pode ser `;`, `,` ou tabulação, e linhas sem ISBN são ignoradas.

A planilha `planilha-cobertura.csv` desta pasta já está nesse formato: preencha
`titulo` e `isbn` (e ajuste `estrato`) e salve como CSV. Os controles podem ficar na
amostra: tudo o que estiver no estrato `controle`, e qualquer ISBN com dígito
verificador inválido, aparece no `resumo.txt` mas não entra nas porcentagens.

## Rodar

```bash
npm run avaliar -- docs/tcc/resultados/planilha-cobertura.csv
```

Opções:
- `--saida <pasta>`: onde gravar os arquivos. O padrão é `avaliacao/resultado-<data-hora>`.
- `--pausa <ms>`: pausa entre um ISBN e o próximo. O padrão é 500 ms, para não
  sobrecarregar as fontes.

Com 50 ISBNs, leva de 2 a 5 minutos. **Rode uma vez só e guarde a pasta de saída**: as
fontes mudam com o tempo, e a data e a hora da execução ficam registradas no
`resumo.txt`. Esses são o "[data]" e as "[fontes]" da seção 5.1.3.

## Arquivos gerados

| Arquivo | Para que serve | Onde entra no Cap. 5 |
|---|---|---|
| `resumo-fontes.csv` | Por fonte e consolidado: obras encontradas, % encontradas, completude média (% dos 14 campos, entre as encontradas), tempo médio de resposta, erros e tempos esgotados | Tabela 2 |
| `resumo-campos.csv` | % das obras (com ISBN válido) com cada um dos 14 campos preenchido, por fonte | Tabela 3 |
| `resumo-estratos.csv` | % de obras encontradas por estrato e por fonte | Tabela 4 |
| `resumo-consolidacao.csv` | Campos acrescentados pela consolidação (média), % de obras com ganho, % de registros com duas ou mais fontes, obras encontradas por uma só fonte | Parágrafo após a Tabela 3 (os "[X]") |
| `consolidacao-por-obra.csv` | Por obra: provedor, melhor fonte isolada, campos de cada uma, ganho | Exemplos para a discussão |
| `isbn10-isbn13.csv` | Por obra com ISBN-10: situação e campos com o ISBN-10 e com o ISBN-13, campos divergentes, concordante (sim/não) | H7 |
| `consultas.csv` | Dados brutos: uma linha por ISBN e por fonte, com a situação, o tempo e 0/1 para cada campo | Conferência; pode ir para apêndice |
| `resumo.txt` | Data, fontes ativas, totais e a situação de cada obra | Texto da 5.1.3 |

Os CSV usam `;` e vírgula decimal e abrem direto no Excel.

## O que o programa **não** faz

- Não confere se os dados estão **corretos**. H2, H3 e H4 (Tabelas 5 e 6) continuam
  manuais, com a obra em mãos e a ficha catalográfica.
- Não mede o **tempo do lote na interface** (H6). Isso é feito na própria ferramenta.
- Não valida nem importa registros MARC (H5). Isso é feito no MarcEdit, no Koha e no
  Biblivre.

## Sugestão de texto para a 5.1.3

> Para medir a contribuição de cada fonte, foi desenvolvido um programa auxiliar,
> disponível no repositório da ferramenta (`scripts/avaliar-fontes.mjs`), que consulta
> cada fonte isoladamente para os ISBNs da amostra, utilizando os mesmos adaptadores e
> a mesma regra de consolidação empregados pela aplicação.
