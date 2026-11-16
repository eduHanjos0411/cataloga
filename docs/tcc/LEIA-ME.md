# Entrega — revisão do TCC (nov./2026)

Os arquivos desta pasta seguem a mesma estrutura do projeto LaTeX
(`TCC-Cataloga-latex` / Overleaf). Basta copiá-los para os mesmos caminhos.

| Arquivo | O que fazer |
|---|---|
| `estrutura/textuais/desenvolvimento/fundamentacao.tex` | **Substituir** (Cap. 2 revisado) |
| `estrutura/textuais/desenvolvimento/metodologia.tex` | **Substituir** (Cap. 3 revisado + seção 3.5) |
| `estrutura/textuais/desenvolvimento/desenvolvimento.tex` | **Substituir** (Cap. 4 novo) |
| `estrutura/pre-textuais/listas/lista-siglas.tex` | **Substituir** |
| `estrutura/pos-textuais/apendices.tex` | **Substituir** (A e B iguais + inclusão de C e D) |
| `estrutura/pos-textuais/apendices-questionarios.tex` | **Novo** (Apêndices C e D) |
| `referencias-novas.bib` | **Colar no final** de `base-referencias.bib` |
| `formularios.md` | Roteiro para montar os dois formulários no Google Forms |

## Ajustes no preâmbulo e no `principal.tex`

1. Em `configuracoes/pacotes.tex`, acrescentar (para os diagramas do Cap. 4):

   ```latex
   \usepackage{tikz}
   \usetikzlibrary{positioning, arrows.meta}
   \usepackage{float}   % opção [H] das capturas de tela do Cap. 4
   ```

2. Em `principal.tex`, descomentar a lista de quadros — o texto agora tem vários:

   ```latex
   \include{estrutura/pre-textuais/listas/lista-quadros}
   ```

3. O `principal.tex` do template ainda inclui `ferramentas-e-tecnologia`, arquivo que
   não existe mais. Se o Overleaf reclamar, remova essa linha.

> Não havia LaTeX instalado nesta máquina, então os arquivos **não foram compilados**.
> Foram conferidos por script: todas as citações existem no `.bib`, todos os
> `\autoref` apontam para rótulos existentes e os ambientes e chaves estão balanceados.
> Compile no Overleaf e me mande o log se aparecer algum erro.

## Comentários do orientador → o que foi feito

| Página / comentário | Alteração |
|---|---|
| Reunião: falta explicar MARC, RDA e AACR2 para quem não é da área | Seção 2.2 dividida em ISBD / AACR2 / RDA, com analogia com a ABNT, conceito de ponto de acesso, FRBR com exemplo (obra → item), quadro AACR2 × RDA. Seção 2.3 explica etiqueta, indicador, subcampo, líder, blocos 0XX–8XX, todos os campos gerados pela ferramenta, posições do líder e do 008 e uma leitura comentada de um campo 245 |
| p. 8 — "acrescentar ISBD" | ISBD na lista de siglas (junto com CBL, DGM, FRBR, LRM, RDA, SPA, SUS, TAM, TCLE, HTTP) |
| p. 14 — "referência mais atual?" (Tauber, 1954) | Acrescentadas Calhoun (2006) e Joudrey, Taylor e Wisser (2018); também IFLA LRM (2017) e RDA Toolkit na seção do RDA |
| p. 15 — "incluir significado da sigla" (IFLA) | IFLA por extenso na primeira menção do capítulo |
| p. 15 — "rever pontuação" | Lista de diferenças AACR2 × RDA reescrita em itens paralelos, com pontuação revista |
| p. 17 — trecho destacado sem comentário | Entendi como a sigla OPAC sem significado; agora está por extenso. **Confira se era isso** |
| p. 22 — "não é necessário escrever a ideia antiga" | Removida a proposta Python/PyQt/SQLite da seção 3.4; o texto descreve só a solução adotada. O Cap. 4 também não menciona a versão antiga |

## Pontos para você conferir

- **Referências novas** (`referencias-novas.bib`): conferir os dados de cada obra na fonte, principalmente Calhoun (2006) e Joudrey et al. (2018), que sustentam o argumento sobre o custo da catalogação.
- **Linha de desenvolvimento (4.2)**: refeita a partir do `git log` completo, agora em 6 fases datadas (18/09, 02/10, 05/10, 23/10, 27/10 e "após 27/10"). Há dois pontos marcados com `% VERIFICAR` no `.tex`:
  - as regras de catalogação (ISBD, inversão de nomes, 008) foram atribuídas ao commit de exportação de 02/10. Se entraram depois, mude de fase;
  - validação do dígito verificador, tempo limite, preservação do lote e caixas de diálogo próprias estão no código, mas não aparecem nas mensagens de commit até 27/10. Ficaram na fase 6, "após 27/10". Se já estiverem em algum commit, ajuste a data.

- **Exemplo de registro (Quadro "Registro gerado pelo Cataloga+…")**: usa ISBN e editora fictícios. O ideal é trocar por um registro real copiado da pré-visualização MARC.
- **Comitê de ética (3.5)**: o texto diz que a pesquisa se enquadra na dispensa da Resolução CNS 510/2016 (pesquisa de opinião com participantes não identificados). Confirme com o orientador se o IFB exige submissão ao CEP.
- **Classificação da pesquisa**: continua "qualitativa", agora com a ressalva de que os questionários geram indicadores descritivos. Se o orientador preferir, dá para reclassificar como quali-quantitativa.
- **E-mail e link** nos questionários: preencher `[inserir e-mail institucional]` e o link da demonstração.
- **RF17 (histórico de exportados)** aparece como pendente no Cap. 4. Se não for implementar, remova-o do Apêndice A.

## Capturas de tela a tirar (Cap. 4)

Cada figura tem um quadro reservado. Para inserir: salve o print em `dados/figuras/`
com o nome indicado, apague a linha `\espacotela{...}` e descomente o `\includegraphics`.

| Figura | Arquivo | O que mostrar |
|---|---|---|
| Tela inicial | `tela-inicial.png` | Tela vazia: painel de busca + "Sem dados consultados" |
| Entrada de lista | `entrada-lista.png` | 4–5 ISBNs colados, um por linha, antes de buscar |
| Seletores | `seletores.png` | Recorte com "Fonte dos dados" e RDA/AACR2 |
| Paginação do lote | `lote-paginacao.png` | Páginas em busca, prontas e com erro; "X de Y prontos" |
| Documento com erro | `documento-erro.png` | ISBN com último dígito trocado → "ISBN inválido" |
| Formulário de revisão | `formulario-revisao.png` | Obra brasileira com o máximo de campos preenchidos |
| MARC em RDA | `marc-rda.png` | Janela "Registro MARC 21 (RDA)" |
| MARC em AACR2 | `marc-aacr2.png` | Mesma obra em AACR2 (260, "p.", sem 336–338) |
| Confirmação do lote | `confirmacao-lote.png` | "Exportar lote incompleto?" |
| Aviso de exportação | `aviso-exportacao.png` | Toast verde após exportar |
| Tema escuro | `tema-escuro.png` | Tela inteira no tema escuro com um documento aberto |

Dica: para a figura de paginação com as três situações, cole uma lista com um ISBN
inválido e clique na página enquanto as outras ainda estão buscando.
