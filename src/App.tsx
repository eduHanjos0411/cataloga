import { type ChangeEvent, useState } from "react";
import "./App.css";
import "./styles/theme.css";
import { fetchBookData } from "./api";
import { formatIsbn, normalizeBookData, type BookFormState } from "./utils/bookUtils";

type ThemeName = "light" | "dark";

function App() {
  const [isbn, setIsbn] = useState("");
  const [theme, setTheme] = useState<ThemeName>("light");
  const [bookData, setBookData] = useState<BookFormState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFieldChange =
    (field: keyof BookFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      setBookData((current) => {
        if (!current) {
          return current;
        }

        return { ...current, [field]: value };
      });
    };

  async function handleIsbnSubmit() {
    const cleanIsbn = formatIsbn(isbn);

    if (!cleanIsbn) {
      alert("Digite um ISBN válido para consultar.");
      return;
    }

    setIsLoading(true);
    const result = await fetchBookData(cleanIsbn);
    setIsLoading(false);

    if (!result) {
      setBookData(null);
      alert("Livro não encontrado.");
      return;
    }

    setBookData(normalizeBookData(result, cleanIsbn));
  }

  function handleClear() {
    setIsbn("");
    setBookData(null);
  }

  return (
    <div className={`app-shell ${theme}`}>
      <div className="app-container">
        <header className="library-header panel">
          <div>
            <h1>Cataloga+</h1>
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            aria-label="Alternar entre tema claro e escuro"
          >
            {theme === "light" ? "Tema escuro" : "Tema claro"}
          </button>
        </header>

        <main className="content-grid">
          <section className="panel intro-panel">
            <h2>Catalogação de obra</h2>
            <p>
              Insira o ISBN da obra e o sistema consultará as informações disponíveis para revisão,
              edição e posterior registro no acervo da biblioteca.
            </p>

            <div className="isbn-input">
              <label htmlFor="isbn" className="field-label">
                ISBN
              </label>
              <div className="input-row">
                <input
                  id="isbn"
                  type="text"
                  placeholder="Digite o ISBN"
                  value={isbn}
                  onChange={(event) => setIsbn(event.target.value)}
                />
                <button type="button" className="primary-button" onClick={handleIsbnSubmit}>
                  {isLoading ? "Buscando..." : "Buscar"}
                </button>
                <button type="button" className="secondary-button" onClick={handleClear}>
                  Limpar
                </button>
              </div>
            </div>
          </section>

          {bookData ? (
            <section className="panel review-panel">
              <div className="review-header">
                <h2>Revisão dos dados</h2>
                <span className="status-tag">Pronto para editar</span>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Título</span>
                  <input value={bookData.title} onChange={handleFieldChange("title")} />
                </label>

                <label className="field">
                  <span>Autor(es)</span>
                  <input value={bookData.authors} onChange={handleFieldChange("authors")} />
                </label>

                <label className="field">
                  <span>Editora</span>
                  <input value={bookData.publisher} onChange={handleFieldChange("publisher")} />
                </label>

                <label className="field">
                  <span>Ano</span>
                  <input value={bookData.year} onChange={handleFieldChange("year")} />
                </label>

                <label className="field">
                  <span>Provedor</span>
                  <input value={bookData.provider} onChange={handleFieldChange("provider")} />
                </label>

                <label className="field">
                  <span>ISBN</span>
                  <input value={bookData.isbn} onChange={handleFieldChange("isbn")} />
                </label>
              </div>
            </section>
          ) : (
            <section className="panel empty-panel">
              <h2>Sem dados consultados</h2>
              <p>
                Os dados da obra aparecerão aqui após a busca por ISBN para que possam ser revisados e
                ajustados manualmente.
              </p>
              <div className="placeholder-card">
                <span className="placeholder-icon">📚</span>
                <p>Acervo em espera</p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
