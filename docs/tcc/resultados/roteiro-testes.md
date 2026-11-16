# Roteiro dos testes do Cap. 5 (Resultados)

Testes que você faz sozinho: **1. Cobertura das fontes**, **2. Conformidade e
importação**, **3. Qualidade catalográfica** e **4. Esforço de catalogação**.
Todos usam a mesma amostra de 50 obras. O teste 1 roda as 50; os outros
reaproveitam os mesmos registros (2) ou uma subamostra deles (3 e 4).

Planilhas para a coleta, nesta pasta:
- `planilha-cobertura.csv` (testes 1 e 2)
- `planilha-qualidade.csv` (testes 3 e 4)

Abra as duas no Excel ou no Google Planilhas.

---

## 0. Antes de começar

1. **Monte a amostra com livros que você tem em mãos.** Use o acervo da biblioteca do
   IFB ou de outra biblioteca a que tenha acesso. Copie o ISBN **do próprio livro**
   (verso da folha de rosto ou contracapa), não de sites. Assim, a edição testada é a
   edição real, e o registro do catálogo dessa biblioteca serve de referência no
   teste 3.
2. **A lista abaixo indica obras e o motivo de cada escolha**, não ISBNs. Não pus ISBNs
   porque não teria como conferir cada um, e um ISBN errado estragaria o teste. Se a
   biblioteca não tiver a obra sugerida, troque por outra **do mesmo estrato e com a
   mesma característica** (coluna "Por que entra").
3. **Congele a versão da ferramenta.** Rode tudo na mesma versão publicada e anote a
   data e a hora dos testes. As fontes mudam com o tempo; a data é parte do resultado.
4. **Anote se a chave do Google Books estava configurada.** Sem ela, a fonte não é
   consultada, e o resultado precisa dizer isso.
5. **Use o modo "Automático"** na fonte dos dados, com o padrão RDA. O AACR2 entra só
   no teste 2.

---

## 1. Amostra de obras (50 + 2 de controle)

A amostra é **intencional**, não aleatória: cada obra está ali para exercitar uma
situação. Escreva isso na metodologia ("amostra intencional estratificada"). Não
apresente os percentuais como representativos de um acervo real.

### Estrato A — nacionais conhecidas (12)

| # | Obra | Autor | Por que entra |
|---|---|---|---|
| A01 | Dom Casmurro | Machado de Assis | Clássico com muitas edições; deve estar em todas as fontes |
| A02 | Grande sertão: veredas | João Guimarães Rosa | Título com subtítulo após dois-pontos |
| A03 | Vidas secas | Graciliano Ramos | Clássico, editora grande (Record) |
| A04 | A hora da estrela | Clarice Lispector | Título iniciado por artigo ("A") → 2.º indicador do 245 |
| A05 | Torto arado | Itamar Vieira Junior | Termo de parentesco ("Junior") na inversão do nome |
| A06 | Capitães da areia | Jorge Amado | Best-seller nacional de catálogo antigo |
| A07 | O cortiço | Aluísio Azevedo | Artigo "O"; mesma obra do exemplo do Cap. 4 |
| A08 | Casa-grande & senzala | Gilberto Freyre | Caractere especial (&) no título |
| A09 | Raízes do Brasil | Sérgio Buarque de Holanda | Partícula "de" e sobrenome composto |
| A10 | Pedagogia do oprimido | Paulo Freire | Muito presente em fontes estrangeiras também |
| A11 | Quarto de despejo | Carolina Maria de Jesus | Nome com partícula; reedições recentes |
| A12 | O avesso da pele | Jeferson Tenório | Contemporâneo (2020), prêmio Jabuti |

### Estrato B — nacionais pouco conhecidas, técnicas ou de pequenas editoras (11)

| # | Obra | Autor | Por que entra |
|---|---|---|---|
| B01 | Introdução à catalogação | Eliane Serrão Mey | Editora pequena (Briquet de Lemos), anos 1990, provavelmente só ISBN-10 |
| B02 | Catalogação no plural | Eliane Serrão Mey e Naira Christofoletti Silveira | Dois autores; editora pequena; área do trabalho |
| B03 | Fundamentos de metodologia científica | Marina de Andrade Marconi e Eva Maria Lakatos | Dois autores; muitas edições numeradas (campo 250) |
| B04 | Metodologia do trabalho científico | Antônio Joaquim Severino | Edição numerada; editora Cortez |
| B05 | Código de Catalogação Anglo-Americano (AACR2), 2. ed. rev. | Joint Steering Committee (trad. FEBAB) | Autor corporativo, sem pessoa |
| B06 | O Menino Maluquinho | Ziraldo | Autor com nome único (não há o que inverter) |
| B07 | Turma da Mônica: Laços | Vitor Cafaggi e Lu Cafaggi | Quadrinho; editora Panini |
| B08 | (livro da editora universitária da sua instituição ou da EdUnB) | — | Editora universitária, pouca presença comercial |
| B09 | (livro de autor ou editora regional do DF ou do Centro-Oeste) | — | Pequena tiragem; testa obra "não encontrada" |
| B10 | (livro autopublicado: Clube de Autores, Amazon KDP etc.) | — | Metadados mínimos ou inexistentes |
| B11 | (publicação institucional: IBGE, Embrapa, IPEA etc.) | — | Autor corporativo; órgão público como editor |

### Estrato C — estrangeiras traduzidas e publicadas no Brasil (10)

| # | Obra | Autor | Por que entra |
|---|---|---|---|
| C01 | 1984 | George Orwell | Título numérico; várias editoras brasileiras |
| C02 | O Pequeno Príncipe | Antoine de Saint-Exupéry | Partícula "de" + sobrenome com hífen; artigo "O" |
| C03 | Cem anos de solidão | Gabriel García Márquez | Sobrenome composto espanhol (inversão difícil) |
| C04 | Sapiens: uma breve história da humanidade | Yuval Noah Harari | Subtítulo; best-seller recente |
| C05 | Harry Potter e a pedra filosofal | J. K. Rowling | Nome com iniciais; comparar com D04 |
| C06 | O Senhor dos Anéis: a Sociedade do Anel | J. R. R. Tolkien | Obra em partes; três iniciais |
| C07 | Admirável mundo novo | Aldous Huxley | Clássico traduzido |
| C08 | É assim que acaba | Colleen Hoover | Best-seller recente (Galera Record) |
| C09 | Código limpo | Robert C. Martin | Técnico traduzido (Alta Books); comparar com D02 |
| C10 | (qualquer tradução com tradutor indicado na folha de rosto) | — | Verifica se o tradutor aparece (a ferramenta não gera 700 de tradutor) |

### Estrato D — estrangeiras em edição original (11)

| # | Obra | Autor | Por que entra |
|---|---|---|---|
| D01 | The Great Gatsby | F. Scott Fitzgerald | Artigo inglês "The" → 2.º indicador 4 |
| D02 | Clean Code | Robert C. Martin | Técnico em inglês; comparar com C09 |
| D03 | Introduction to Cataloging and Classification | Joudrey, Taylor e Wisser | Três autores; área do trabalho |
| D04 | Harry Potter and the Philosopher's Stone | J. K. Rowling | Mesma obra de C05, outra manifestação (FRBR) |
| D05 | The Craft of Research | Wayne C. Booth et al. | Mais de três autores; edição numerada |
| D06 | El amor en los tiempos del cólera | Gabriel García Márquez | Artigo espanhol "El"; idioma espanhol |
| D07 | Don Quijote de la Mancha | Miguel de Cervantes | Espanhol; partícula "de" |
| D08 | Le Petit Prince | Antoine de Saint-Exupéry | Artigo francês "Le": **falha esperada** (a ferramenta só trata artigos em pt/en/es) |
| D09 | (livro técnico de editora universitária estrangeira) | — | Pouco conhecido, metadados acadêmicos |
| D10 | (livro de nicho da ALA Editions ou editora profissional similar) | — | Baixa circulação comercial |
| D11 | (lançamento estrangeiro de 2025 ou 2026) | — | Obra recente: pode ainda não estar nas bases |

### Estrato E — casos de borda (6)

| # | Situação | Sugestão | O que verifica |
|---|---|---|---|
| E01 | ISBN-10 terminado em X | Livro brasileiro anterior a 2007 cujo ISBN termine em X | Correção da fase 3 do Cap. 4 |
| E02 | Autor com "Neto" e partícula | Morte e vida severina, João Cabral de Melo Neto | Inversão: "Melo Neto, João Cabral de" |
| E03 | Obra em volumes | O tempo e o vento: O continente, v. 1, Erico Verissimo | Volume ou parte no título |
| E04 | Coletânea com organizador | Os cem melhores contos brasileiros do século, org. Italo Moriconi | Sem autor principal; organizador como "autor" |
| E05 | E-book | ISBN da edição digital de alguma obra acima (ex.: Torto arado) | Formato digital (008/23, 337/338, DGM no AACR2) |
| E06 | Livro sem local ou editora nas fontes | Escolha entre B08–B10 o que vier mais incompleto | [S.l.] / [s.n.] (AACR2) e [Local … não identificado] (RDA) |

### Controle (fora das 50)

| # | Situação | Como fazer | O que verifica |
|---|---|---|---|
| X01 | ISBN com dígito verificador errado | Troque o último dígito de A01 | Mensagem "ISBN inválido", sem consulta |
| X02 | ISBN válido inexistente | Escolha outro último dígito para B09 até que o dígito verificador feche e a obra não exista | Mensagem "não encontrado" |

---

## 2. Teste 1 — cobertura das fontes (as 50 obras)

**Pergunta que responde:** consultar várias fontes ao mesmo tempo melhora a recuperação
dos dados, em comparação com uma fonte só? (Justifica o RF04 e a decisão da fase 2 do
Cap. 4.)

**Procedimento**
1. Cole os 50 ISBNs na ferramenta, de uma vez ou por estrato, e cronometre do clique
   até o último documento ficar pronto.
2. Para cada documento, preencha uma linha de `planilha-cobertura.csv`:
   - a situação (encontrado, não encontrado ou fontes indisponíveis);
   - o conteúdo do campo **Provedor**, que diz quais fontes contribuíram;
   - 1 ou 0 para cada campo do formulário que veio preenchido.

**Indicadores (o que você precisa chegar a ter)**
- **Taxa de recuperação** = encontrados ÷ 50, no total e por estrato.
- **Recuperação por fonte**: em quantos ISBNs cada fonte aparece no campo Provedor.
- **Ganho da consolidação**: obras encontradas por uma única fonte (só ela aparece no
  Provedor). Se tirassem essa fonte, a obra ficaria sem dados.
- **Completude por campo** = registros com o campo preenchido ÷ encontrados. Faça uma
  linha por campo: título, subtítulo, autor, editora, local, edição, ano, páginas,
  altura, assuntos, sinopse e capa.
- **Completude média por registro** = média dos campos preenchidos (de 12).
- **Tempo**: tempo total do lote ÷ 50.

**Como apresentar no Cap. 5**
- Uma tabela de recuperação por estrato (A a E × encontrado, não encontrado ou
  indisponível).
- Um gráfico de barras ou uma tabela de completude por campo.
- Um parágrafo sobre o ganho da consolidação.
- Os casos de controle X01 e X02 em uma frase cada.

**O que discutir**
- Onde a cobertura cai: estratos B e D11, autopublicados e lançamentos. Explique por
  quê (as fontes dependem de cadastro editorial).
- Quais campos raramente vêm preenchidos (altura e local são suspeitos fortes) e o que
  isso significa para o bibliotecário: são campos a conferir sempre.
- Ligação com o Cap. 2, seção de fontes de metadados.

---

## 3. Teste 2 — conformidade e importação (RNF03 e RNF04)

**Pergunta que responde:** os arquivos gerados são MARC 21 válidos e são aceitos pelos
SIGBs?

**Procedimento**
1. Com os registros encontrados no teste 1, exporte **o lote em RDA** (um `.mrc`).
   Troque o padrão para AACR2 e exporte **o lote em AACR2** (outro `.mrc`).
2. **Validação:** abra os dois arquivos no MarcEdit (gratuito para Windows) e use o
   validador de registros MARC. Anote o total de registros lidos, os erros e os avisos.
   Copie o relatório: ele vira um quadro em texto, não uma imagem.
3. **Importação:**
   - Biblivre: importe o arquivo AACR2. O Biblivre não trata os campos RDA.
   - Koha: importe o arquivo RDA, pela ferramenta de importação de registros MARC
     ("Stage MARC records for import").
   - Use uma instância de teste: Biblivre instalado no seu computador e, para o Koha,
     uma instância de demonstração ou de testes da biblioteca. Não use o catálogo de
     produção.
4. Anote, por SIGB: registros importados, rejeitados e alertas. Abra 2 ou 3 registros
   importados e confira se o título, o autor e a editora caíram nos campos certos da
   tela do SIGB.

**Indicadores**
- Registros válidos ÷ registros exportados, para cada padrão.
- Registros importados ÷ exportados, para cada SIGB.
- Lista dos erros e avisos, agrupados por tipo.

**Capturas de tela: 2 no máximo**
- 1 do registro importado no Koha e 1 do mesmo registro importado no Biblivre. Use a
  mesma obra nas duas, de preferência A07 (*O cortiço*), que já é o exemplo do Cap. 4.
- Se houver espaço, coloque as duas lado a lado em uma única figura.
- O relatório do validador entra como quadro em texto (`verbatim`), não como print.
- Os totais entram em uma tabela pequena (padrão × SIGB × importados).

**O que discutir**
- Se algum aviso aparecer (por exemplo, o 653 sem vocabulário controlado, ou o 008
  com posições genéricas), explique se ele impede ou não o uso do registro.
- Ligação com a seção 2.5 (interoperabilidade) e com o RNF04, que no Cap. 4 ficou
  "a verificar".

---

## 4. Teste 3 — qualidade catalográfica (subamostra de 20)

**Pergunta que responde:** o registro gerado está correto, em comparação com o registro
feito por um catalogador?

**Por que não as 50:** comparar 50 registros campo a campo leva dias. Com 20, sendo
4 por estrato (A a E), escolhidos entre os encontrados, você tem variedade suficiente
e cabe no prazo.

**Registros de referência (de onde copiar)**
- Obras nacionais e traduzidas: o catálogo da biblioteca de onde veio o livro, ou o
  catálogo da Biblioteca Nacional (acervo.bn.gov.br, com visualização MARC).
- Obras estrangeiras: o catálogo da Library of Congress (catalog.loc.gov, visão
  "MARC Tags").
- Anote de onde veio cada referência: isso precisa constar no texto.

**Procedimento**
Para cada obra, compare **o registro exportado sem nenhuma edição sua** com a
referência. Classifique cada campo em uma linha de `planilha-qualidade.csv`, usando os
códigos abaixo.

| Código | Significado |
|---|---|
| C | Correto (igual à referência ou equivalente) |
| F | Diferença só de forma (pontuação, maiúsculas, abreviatura) |
| I | Incorreto (valor errado) |
| A | Ausente na ferramenta, presente na referência |
| N | Não se aplica (a obra não tem esse dado) |

Campos a comparar:
- 020 \$a (ISBN);
- 100 \$a (forma invertida do autor);
- 245 \$a, \$b e \$c, e o 2.º indicador do 245;
- 250 (edição);
- 264/260 \$a, \$b e \$c (local, editora e data);
- 300 \$a e \$c (páginas e altura);
- 008/15-17 (país) e 008/35-37 (idioma);
- 700 (demais autores).

**Fora da comparação:** campos que a ferramenta não se propõe a gerar, como 082/090
(classificação), 650 (assunto controlado) e 700 de tradutor. Declare isso como
limitação, não como erro.

**Indicadores**
- **Acurácia por campo** = C ÷ (total − N). Dá para usar também uma acurácia "branda",
  que considera C + F.
- **Acurácia geral** = soma dos C ÷ soma dos campos aplicáveis.
- **Registros prontos sem edição** = registros sem nenhum I ou A.
- **Tipologia dos erros**: quantos I e A de cada tipo (inversão de nome, artigo não
  reconhecido, local ausente, subtítulo dentro do título, data errada etc.).

**Como apresentar**
- Uma tabela de acurácia por campo.
- Um quadro com a tipologia dos erros, cada tipo com 1 exemplo.
- Um parágrafo com os casos esperados de falha (D08 em francês, C03 com sobrenome
  composto, E04 coletânea).

**O que discutir**
Este é o argumento central da "catalogação assistida": a ferramenta acerta a estrutura
e a pontuação, e os erros que sobram se concentram em dados que só o livro em mãos
confirma. É isso que justifica o aviso de revisão obrigatória.

---

## 5. Teste 4 — esforço de catalogação (as mesmas 20)

### Você pode cronometrar a catalogação?

A profissão de bibliotecário é regulamentada (Lei n.º 4.084/1962). Rodar um teste em
contexto de pesquisa não é exercer a profissão, então não há impedimento legal para
você usar a ferramenta. O problema é **metodológico**: o seu tempo de catalogação
manual não representa o tempo de um profissional. Comparar a ferramenta com um leigo
catalogando à mão fragiliza o resultado. Por isso, troque "tempo manual × ferramenta"
por medidas que não dependem de quem opera:

**Indicadores**
- **Tempo de máquina**: tempo médio da busca até "pronto", já medido no teste 1.
- **Campos preenchidos automaticamente** = campos com dado correto (C ou F) vindos da
  ferramenta, em média por registro, dos ~15 comparados no teste 3.
- **Campos que exigiriam intervenção** = I + A por registro. É o que o bibliotecário
  ainda teria de digitar ou corrigir.
- **Elementos aplicados automaticamente** sem digitação, por registro:
  - líder, 001, 005 e 008 completos;
  - pontuação ISBD;
  - indicadores;
  - 336 a 338.

  Liste-os no texto: em geral são mais de 40 posições fixas que, na catalogação
  manual, seriam preenchidas uma a uma.
- **Opcional, só se conseguir:** se um bibliotecário da comunidade aceitar catalogar
  3 livros à mão e os mesmos 3 com a ferramenta, cronometre. Apresente isso como
  observação ilustrativa (n = 3), não como medida.

**Como apresentar**
Uma tabela curta, com a média por registro de: campos automáticos corretos, campos a
corrigir e tempo de máquina. Mais um parágrafo que liga esses números ao problema
apresentado na Introdução, o custo e o tempo da catalogação.

---

## 6. Como fechar o Cap. 5 (estrutura sugerida)

1. **Introdução do capítulo:** a amostra (intencional e estratificada, n = 50 e
   subamostra n = 20), as datas, a versão da ferramenta e as fontes ativas.
2. **5.1 Cobertura e completude dos dados:** teste 1.
3. **5.2 Conformidade e interoperabilidade:** teste 2.
4. **5.3 Qualidade dos registros gerados:** teste 3.
5. **5.4 Esforço de catalogação:** teste 4.
6. **5.5 Percepção dos bibliotecários:** formulário de adesão, se as respostas
   chegarem a tempo.
7. **5.6 Discussão:** um quadro "objetivo específico → resultado que o atende"; as
   limitações (amostra intencional, fontes variam com o tempo, sem assunto controlado
   nem autoridades, avaliação de uso não realizada); e trabalhos futuros (avaliação
   com usuários usando o Apêndice D, histórico RF17, testes automatizados).

Custo estimado em páginas: 4 a 6 tabelas ou quadros pequenos, 1 figura (os dois SIGBs
lado a lado) e 1 quadro em texto (o relatório do validador). Dá entre 7 e 10 páginas.

---

## 7. Cronograma até sexta, 20/11

| Dia | Tarefa |
|---|---|
| sex 13 | Abrir o formulário de adesão para a comunidade. Montar a amostra (anotar os ISBNs dos livros) |
| sáb 14 – dom 15 | Teste 1 (as 50 obras, umas 3 h) e exportação dos lotes |
| seg 16 | Teste 2: MarcEdit, Biblivre e Koha |
| ter 17 | Teste 3 e teste 4 (as 20 obras, umas 4–5 h) |
| qua 18 | Fechar o formulário. Tabular tudo. Mandar as planilhas para a redação |
| qui 19 | Redigir o Cap. 5 e a Conclusão. Ajustar o resumo |
| sex 20 | Revisão final e entrega |
