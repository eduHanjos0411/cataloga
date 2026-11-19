import type { BatchItem, BatchRun } from "../../hooks/useBookSearch";
import "./BatchPager.css";

// Páginas vizinhas exibidas de cada lado da página atual
const SIBLINGS = 2;

/** Números das páginas a exibir (base 0), com "gap" onde há páginas ocultas. */
function visiblePages(total: number, current: number): (number | "gap")[] {
  const pages = new Set([0, total - 1]);
  for (let page = current - SIBLINGS; page <= current + SIBLINGS; page += 1) {
    if (page >= 0 && page < total) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1];
    if (previous === undefined || page - previous === 1) return [page];
    // Uma única página oculta é exibida no lugar das reticências
    return page - previous === 2 ? [page - 1, page] : ["gap" as const, page];
  });
}

function pageTitle(item: BatchItem): string {
  if (item.status === "loading") return `ISBN ${item.isbn} (buscando)`;
  if (item.status === "error") return `ISBN ${item.isbn}: ${item.error}`;
  const title = item.book?.title || `ISBN ${item.isbn}`;
  return item.failedProviders ? `${title} (sem resposta de: ${item.failedProviders.join(", ")})` : title;
}

/** Tempo da última rodada de buscas, usado para medir o processamento do lote. */
function runSummary(run: BatchRun, failedCount: number): string {
  const isbns = `${run.count} ${run.count === 1 ? "ISBN" : "ISBNs"}`;
  if (run.finishedAt === undefined) return `Buscando ${isbns}…`;

  const seconds = ((run.finishedAt - run.startedAt) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  const failures = failedCount > 0 ? ` · ${failedCount} com fonte sem resposta` : "";
  return `Última busca: ${isbns} em ${seconds} s${failures}`;
}

type BatchPagerProps = {
  items: BatchItem[];
  lastRun?: BatchRun;
  currentIndex: number;
  onPageChange: (index: number) => void;
  onExportBatch: () => void;
  onClearBatch: () => void;
};

export function BatchPager({
  items,
  lastRun,
  currentIndex,
  onPageChange,
  onExportBatch,
  onClearBatch,
}: BatchPagerProps) {
  const foundCount = items.filter((item) => item.status === "found").length;
  const failedCount = items.filter((item) => item.failedProviders).length;

  return (
    <nav className="panel batch-pager" aria-label="Documentos do lote">
      <div className="pager-pages">
        <button
          type="button"
          className="pager-step"
          disabled={currentIndex === 0}
          onClick={() => onPageChange(currentIndex - 1)}
        >
          ‹ Anterior
        </button>

        {visiblePages(items.length, currentIndex).map((page, index) =>
          page === "gap" ? (
            <span key={`gap-${index}`} className="pager-gap">
              …
            </span>
          ) : (
            <button
              key={items[page].id}
              type="button"
              className={`pager-page ${items[page].status}${page === currentIndex ? " active" : ""}`}
              aria-current={page === currentIndex ? "page" : undefined}
              title={pageTitle(items[page])}
              onClick={() => onPageChange(page)}
            >
              {page + 1}
            </button>
          ),
        )}

        <button
          type="button"
          className="pager-step"
          disabled={currentIndex === items.length - 1}
          onClick={() => onPageChange(currentIndex + 1)}
        >
          Próxima ›
        </button>
      </div>

      <div className="pager-actions">
        <span className="pager-summary">
          {foundCount} de {items.length} {items.length === 1 ? "documento pronto" : "documentos prontos"}
        </span>
        {lastRun && (
          <span className="pager-summary pager-timing" aria-live="polite">
            {runSummary(lastRun, failedCount)}
          </span>
        )}
        <button type="button" className="secondary-button" onClick={onClearBatch}>
          Limpar lote
        </button>
        <button type="button" className="primary-button" onClick={onExportBatch} disabled={foundCount === 0}>
          Exportar lote
        </button>
      </div>
    </nav>
  );
}
