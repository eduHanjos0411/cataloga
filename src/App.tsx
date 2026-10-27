import { useCallback, useEffect, useState } from "react";
import "./App.css";
import "./styles/theme.css";
import { BatchPager } from "./components/BatchPager/BatchPager";
import { BookReviewPanel } from "./components/BookReviewPanel/BookReviewPanel";
import { ConfirmDialog, type ConfirmOptions } from "./components/ConfirmDialog/ConfirmDialog";
import { EmptyPanel } from "./components/EmptyPanel/EmptyPanel";
import { Header, type ThemeName } from "./components/Header/Header";
import { ItemStatusPanel } from "./components/ItemStatusPanel/ItemStatusPanel";
import { SearchPanel } from "./components/SearchPanel/SearchPanel";
import { Toast, type Notice } from "./components/Toast/Toast";
import { useBookSearch } from "./hooks/useBookSearch";
import { formatIsbn, type BookFormState } from "./utils/bookUtils";
import { downloadFile } from "./utils/fileUtils";
import { exportBatchToMarc, exportToMarc, RULES_LABELS, type CatalogingRules } from "./utils/marcUtils";

const RULES_STORAGE_KEY = "cataloga:regras";

function loadRules(): CatalogingRules {
  try {
    return localStorage.getItem(RULES_STORAGE_KEY) === "aacr2" ? "aacr2" : "rda";
  } catch {
    return "rda";
  }
}

function App() {
  const [theme, setTheme] = useState<ThemeName>("light");
  const [rules, setRules] = useState<CatalogingRules>(loadRules);
  const [confirmation, setConfirmation] = useState<ConfirmOptions>();
  const [notice, setNotice] = useState<Notice>();
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

  useEffect(() => {
    try {
      localStorage.setItem(RULES_STORAGE_KEY, rules);
    } catch {
      // Sem armazenamento disponível a escolha vale apenas para a sessão atual
    }
  }, [rules]);

  function notify(kind: Notice["kind"], message: string) {
    setNotice((current) => ({ id: (current?.id ?? 0) + 1, kind, message }));
  }

  const dismissNotice = useCallback(() => setNotice(undefined), []);

  function handleSearch() {
    if (!search()) notify("error", "Digite ao menos um ISBN para consultar.");
  }

  function handleExport(book: BookFormState) {
    const fileName = `${formatIsbn(book.isbn) || "registro"}.mrc`;
    downloadFile(exportToMarc(book, rules), fileName, "application/marc");
    notify("success", `Registro exportado em ${RULES_LABELS[rules]}: ${fileName}`);
  }

  function exportBatch(books: BookFormState[]) {
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `lote-${date}-${books.length}-registros.mrc`;
    downloadFile(exportBatchToMarc(books, rules), fileName, "application/marc");
    notify("success", `Lote exportado em ${RULES_LABELS[rules]} com ${books.length} registro(s): ${fileName}`);
  }

  function handleExportBatch() {
    const books = items.flatMap((item) => (item.status === "found" && item.book ? [item.book] : []));
    const skipped = items.length - books.length;

    if (skipped === 0) {
      exportBatch(books);
      return;
    }

    setConfirmation({
      title: "Exportar lote incompleto?",
      message: `${skipped} documento(s) ainda em busca ou com erro não serão incluídos. Exportar os ${books.length} restantes?`,
      confirmLabel: "Exportar",
      onConfirm: () => exportBatch(books),
    });
  }

  function handleClearBatch() {
    setConfirmation({
      title: "Limpar o lote?",
      message: "Todos os documentos do lote serão removidos e as alterações feitas serão perdidas.",
      confirmLabel: "Limpar lote",
      danger: true,
      onConfirm: clearBatch,
    });
  }

  function renderCurrentPage() {
    if (!currentItem) return <EmptyPanel />;

    if (currentItem.status === "found" && currentBook) {
      return (
        // A chave por documento remonta o formulário ao trocar de página (ParsedField lê o valor só na montagem)
        <BookReviewPanel
          key={currentItem.id}
          book={currentBook}
          rules={rules}
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
          rules={rules}
          onRulesChange={setRules}
          isLoading={isLoading}
          onSearch={handleSearch}
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

      {confirmation && <ConfirmDialog {...confirmation} onClose={() => setConfirmation(undefined)} />}
      {notice && <Toast notice={notice} onDismiss={dismissNotice} />}
    </div>
  );
}

export default App;
