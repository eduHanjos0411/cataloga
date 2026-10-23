import { useState } from "react";
import "./App.css";
import "./styles/theme.css";
import { BatchPager } from "./components/BatchPager/BatchPager";
import { BookReviewPanel } from "./components/BookReviewPanel/BookReviewPanel";
import { EmptyPanel } from "./components/EmptyPanel/EmptyPanel";
import { Header, type ThemeName } from "./components/Header/Header";
import { ItemStatusPanel } from "./components/ItemStatusPanel/ItemStatusPanel";
import { SearchPanel } from "./components/SearchPanel/SearchPanel";
import { useBookSearch } from "./hooks/useBookSearch";
import { formatIsbn, type BookFormState } from "./utils/bookUtils";
import { downloadFile } from "./utils/fileUtils";
import { exportBatchToMarc, exportToMarc } from "./utils/marcUtils";

function App() {
  const [theme, setTheme] = useState<ThemeName>("light");
  const {
    isbn,
    setIsbn,
    provider,
    setProvider,
    items,
    currentItem,
    currentIndex,
    isLoading,
    search,
    retry,
    remove,
    clearBatch,
    goToPage,
    updateField,
  } = useBookSearch();
  const currentBook = currentItem?.book;

  function handleExport(book: BookFormState) {
    const fileName = `${formatIsbn(book.isbn) || "registro"}.mrc`;
    downloadFile(exportToMarc(book), fileName, "application/marc");
  }

  function handleExportBatch() {
    const books = items.flatMap((item) => (item.status === "found" && item.book ? [item.book] : []));
    const skipped = items.length - books.length;

    if (
      skipped > 0 &&
      !confirm(
        `${skipped} documento(s) ainda em busca ou com erro não serão incluídos. Exportar os ${books.length} restantes?`,
      )
    ) {
      return;
    }

    const date = new Date().toISOString().slice(0, 10);
    downloadFile(exportBatchToMarc(books), `lote-${date}-${books.length}-registros.mrc`, "application/marc");
  }

  function handleClearBatch() {
    if (confirm("Remover todos os documentos do lote? As alterações feitas serão perdidas.")) clearBatch();
  }

  function renderCurrentPage() {
    if (!currentItem) return <EmptyPanel />;

    if (currentItem.status === "found" && currentBook) {
      return (
        // A chave por documento remonta o formulário ao trocar de página (ParsedField lê o valor só na montagem)
        <BookReviewPanel
          key={currentItem.id}
          book={currentBook}
          onFieldChange={updateField}
          onExport={() => handleExport(currentBook)}
          onRemove={() => remove(currentItem.id)}
        />
      );
    }

    return (
      <ItemStatusPanel item={currentItem} onRetry={() => retry(currentItem.id)} onRemove={() => remove(currentItem.id)} />
    );
  }

  return (
    <div className={`app-shell ${theme}`}>
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
      />

      <main className="content-grid">
        <SearchPanel
          isbn={isbn}
          onIsbnChange={setIsbn}
          provider={provider}
          onProviderChange={setProvider}
          isLoading={isLoading}
          onSearch={search}
          onClear={() => setIsbn("")}
          coverUrl={currentBook?.coverUrl}
          title={currentBook?.title}
        />

        <div className="workspace">
          {items.length > 0 && (
            <BatchPager
              items={items}
              currentIndex={currentIndex}
              onPageChange={goToPage}
              onExportBatch={handleExportBatch}
              onClearBatch={handleClearBatch}
            />
          )}
          {renderCurrentPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
