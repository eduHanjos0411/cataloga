import type { FormEvent } from "react";
import type { ProviderOption } from "../../hooks/useBookSearch";
import { CoverPreview } from "../CoverPreview/CoverPreview";
import { ProviderPicker } from "../ProviderPicker/ProviderPicker";
import "./SearchPanel.css";

type SearchPanelProps = {
  isbn: string;
  onIsbnChange: (isbn: string) => void;
  provider: ProviderOption;
  onProviderChange: (provider: ProviderOption) => void;
  isLoading: boolean;
  onSearch: () => void;
  onClear: () => void;
  coverUrl?: string;
  title?: string;
};

export function SearchPanel({
  isbn,
  onIsbnChange,
  provider,
  onProviderChange,
  isLoading,
  onSearch,
  onClear,
  coverUrl,
  title,
}: SearchPanelProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch();
  }

  return (
    <section className="panel search-panel">
      <div>
        <h2>Catalogação de obra</h2>
        <p className="panel-description">
          Insira o ISBN para buscar os dados da obra em fontes públicas e gerar o registro MARC (.mrc).
        </p>
      </div>

      <p className="review-notice" role="note">
        Os dados encontrados servem como ponto de partida e podem estar incompletos ou incorretos.
        Revise todos os campos com o livro em mãos antes de exportar.
      </p>

      <form className="isbn-input" onSubmit={handleSubmit}>
        <label htmlFor="isbn" className="field-label">
          ISBN
        </label>
        <input
          id="isbn"
          type="text"
          placeholder="Digite o ISBN"
          value={isbn}
          onChange={(event) => onIsbnChange(event.target.value)}
        />
        <div className="button-row">
          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? "Buscando..." : "Buscar"}
          </button>
          <button type="button" className="secondary-button" onClick={onClear}>
            Limpar
          </button>
        </div>
      </form>

      <ProviderPicker value={provider} onChange={onProviderChange} />

      <CoverPreview url={coverUrl} title={title} />
    </section>
  );
}
