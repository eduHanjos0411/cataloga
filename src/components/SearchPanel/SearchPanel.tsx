import type { FormEvent, KeyboardEvent } from "react";
import type { ProviderOption } from "../../hooks/useBookSearch";
import type { CatalogingRules } from "../../utils/marcUtils";
import { CoverPreview } from "../CoverPreview/CoverPreview";
import { ProviderPicker } from "../ProviderPicker/ProviderPicker";
import { RulesPicker } from "../RulesPicker/RulesPicker";
import "./SearchPanel.css";

type SearchPanelProps = {
  isbn: string;
  onIsbnChange: (isbn: string) => void;
  provider: ProviderOption;
  onProviderChange: (provider: ProviderOption) => void;
  rules: CatalogingRules;
  onRulesChange: (rules: CatalogingRules) => void;
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
  rules,
  onRulesChange,
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

  // Enter busca; Shift+Enter quebra a linha para digitar outro ISBN
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSearch();
    }
  }

  return (
    <section className="panel search-panel">
      <div>
        <h2>Catalogação de obra</h2>
        <p className="panel-description">
          Insira um ou mais ISBNs para buscar os dados das obras em fontes públicas e gerar os registros MARC
          (.mrc).
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
        {/* Foco inicial no campo: o leitor de código de barras "digita" o ISBN e envia Enter */}
        <textarea
          id="isbn"
          rows={2}
          autoFocus
          placeholder="Digite o ISBN ou cole uma lista (um por linha)"
          value={isbn}
          onChange={(event) => onIsbnChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="button-row">
          <button type="submit" className="primary-button">
            {isLoading ? "Buscando..." : "Buscar"}
          </button>
          <button type="button" className="secondary-button" onClick={onClear}>
            Limpar
          </button>
        </div>
      </form>

      <ProviderPicker value={provider} onChange={onProviderChange} />
      <RulesPicker value={rules} onChange={onRulesChange} />

      <CoverPreview url={coverUrl} title={title} />
    </section>
  );
}
