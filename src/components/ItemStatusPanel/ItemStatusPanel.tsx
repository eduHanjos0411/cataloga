import type { BatchItem } from "../../hooks/useBookSearch";
import "../EmptyPanel/EmptyPanel.css";
import "./ItemStatusPanel.css";

// Página de um documento do lote cuja busca ainda não terminou ou falhou

type ItemStatusPanelProps = {
  item: BatchItem;
  onRetry: () => void;
  onRemove: () => void;
};

export function ItemStatusPanel({ item, onRetry, onRemove }: ItemStatusPanelProps) {
  const isLoading = item.status === "loading";

  return (
    <section className="panel empty-panel item-status-panel">
      <h2>ISBN {item.isbn}</h2>
      <p className="panel-description">
        {isLoading ? "Consultando os provedores de dados..." : "Não foi possível obter os dados desta obra."}
      </p>

      <div className={`placeholder-card${isLoading ? "" : " error"}`}>
        <span className="placeholder-icon">{isLoading ? "⏳" : "⚠️"}</span>
        <p>{isLoading ? "Buscando" : item.error}</p>
      </div>

      <div className="review-footer">
        <button type="button" className="secondary-button" onClick={onRemove}>
          Remover do lote
        </button>
        <button type="button" className="primary-button" onClick={onRetry} disabled={isLoading}>
          Tentar novamente
        </button>
      </div>
    </section>
  );
}
