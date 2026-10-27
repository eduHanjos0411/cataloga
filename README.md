# Cataloga+

Ferramenta web de apoio à catalogação de livros. A partir do ISBN, o Cataloga+ busca os dados bibliográficos da obra em fontes públicas, apresenta-os em um formulário para revisão do bibliotecário e gera o registro em **MARC 21** (arquivo `.mrc`, ISO 2709), pronto para ser importado no sistema de gestão da biblioteca (Koha, Biblivre, Pergamum, Sophia etc.).

O Cataloga+ **não substitui** o sistema da biblioteca: ele reduz a digitação manual na etapa de catalogação descritiva e entrega um registro padronizado para importação.

> Projeto desenvolvido como Trabalho de Conclusão de Curso do curso de Tecnologia em Sistemas para Internet do Instituto Federal de Brasília (IFB), Campus Brasília.

## Funcionalidades

- **Busca por ISBN** (ISBN-10 ou ISBN-13), digitado, colado em lista ou lido por leitor de código de barras; o dígito verificador é conferido antes da consulta.
- **Consulta a várias fontes em paralelo**, com agregação dos resultados:
  - CBL e Mercado Editorial (via [BrasilAPI](https://brasilapi.com.br/));
  - [Open Library](https://openlibrary.org/developers/api);
  - [Google Books](https://developers.google.com/books) (opcional, requer chave de API).

  A fonte prioritária (escolhida pelo usuário ou automática) prevalece; campos ausentes são completados pelas demais e os assuntos de todas as fontes são reunidos. Cada fonte tem tempo limite de 10 segundos.
- **Revisão e edição** de todos os campos antes da exportação.
- **Lote de trabalho** com navegação paginada: vários ISBNs por vez, com nova tentativa e remoção de itens. O lote fica salvo no navegador e não se perde ao recarregar a página.
- **Padrão de descrição RDA ou AACR2**, para atender tanto sistemas atualizados quanto os que ainda operam com o AACR2.
- **Regras de catalogação aplicadas automaticamente**: inversão de nomes de autores (incluindo termos como "Filho" e "Júnior"), caracteres desconsiderados na ordenação para artigos iniciais (245, 2º indicador), pontuação ISBD, país de publicação e idioma no campo 008 para ISBNs brasileiros.
- **Pré-visualização do registro MARC** antes de exportar.
- **Exportação** de cada registro em arquivo próprio ou de todo o lote em um único `.mrc`.

### Campos MARC 21 gerados

| Campo | Conteúdo |
|---|---|
| Líder, 001, 005, 008 | Controle do registro (008 com data, país e idioma) |
| 020 | ISBN e preço |
| 100 / 700 | Autor principal e demais autores (forma invertida) |
| 245 | Título, subtítulo e indicação de responsabilidade |
| 250 | Edição |
| 264 (RDA) / 260 (AACR2) | Local, editora e data de publicação |
| 300 | Descrição física (páginas e altura) |
| 336–338 (RDA) | Tipo de conteúdo, mídia e suporte |
| 520 | Resumo (sinopse) |
| 653 | Assuntos (termos não controlados) |
| 856 | Endereço da imagem da capa |

## Tecnologias

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/), com [Vite](https://vite.dev/)
- [marcjs](https://github.com/fredericd/marcjs) para a serialização ISO 2709
- CSS puro, com tema claro e escuro

A aplicação roda inteiramente no navegador: não há servidor próprio nem banco de dados. Apenas o ISBN é enviado às fontes bibliográficas.

## Como executar

Requer [Node.js](https://nodejs.org/) 20 ou superior.

```bash
npm install
npm run dev
```

Outros comandos:

| Comando | Descrição |
|---|---|
| `npm run build` | Verificação de tipos e build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Análise estática com ESLint |

### Google Books (opcional)

Sem chave, a Google Books API usa uma cota anônima compartilhada que se esgota com frequência; por isso o provedor só é habilitado quando a chave está configurada.

1. Crie uma chave em [Google Cloud Console → Credenciais](https://console.cloud.google.com/apis/credentials) e ative a **Books API**.
2. Restrinja a chave por **referenciador HTTP** aos domínios do site (por exemplo, `localhost:5173/*` e o domínio da Vercel). A chave fica visível no código do navegador; a restrição impede seu uso em outros sites.
3. Copie `.env.example` para `.env` e preencha `VITE_GOOGLE_BOOKS_API_KEY`. Na Vercel, cadastre a mesma variável em *Settings → Environment Variables* e faça um novo deploy.

## Estrutura

```
src/
├── api.ts               # Consulta às fontes e agregação dos resultados
├── providers/           # Um adaptador por fonte (BrasilAPI, Open Library, Google Books)
├── hooks/useBookSearch.ts  # Lote de trabalho, buscas e persistência no navegador
├── utils/
│   ├── bookUtils.ts     # Tipo central dos dados da obra, normalização e validação de ISBN
│   └── marcUtils.ts     # Geração do registro MARC 21 (RDA e AACR2)
└── components/          # Interface (busca, formulário de revisão, paginação, diálogos)
```

## Pendências

- [ ] **Histórico de registros exportados** (RF17): manter no navegador os registros exportados nos últimos 30 dias, com opção de reabri-los para edição ou nova exportação.
- [ ] **Testes automatizados**, começando pela geração dos registros MARC (`marcUtils`) e pela validação de ISBN.
- [ ] **Testes de importação documentados** no Koha e no Biblivre, nos padrões RDA e AACR2, com uma amostra fixa de ISBNs.
- [ ] **Teste com leitor de código de barras** real.
- [ ] **Avaliação de usabilidade** com bibliotecários.
- [ ] **Chave da Google Books API** configurada na Vercel, para habilitar a fonte em produção.
- [ ] **Link do site publicado** neste README.
