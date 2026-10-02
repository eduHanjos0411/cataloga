import { useState } from "react";
import "./App.css";
import "./styles/theme.css";
import { BookReviewPanel } from "./components/BookReviewPanel/BookReviewPanel";
import { EmptyPanel } from "./components/EmptyPanel/EmptyPanel";
import { Header, type ThemeName } from "./components/Header/Header";
import { SearchPanel } from "./components/SearchPanel/SearchPanel";
import { useBookSearch } from "./hooks/useBookSearch";
import { formatIsbn } from "./utils/bookUtils";
import { downloadFile } from "./utils/fileUtils";
import { exportToMarc } from "./utils/marcUtils";

function App() {
  const [theme, setTheme] = useState<ThemeName>("light");
  const { isbn, setIsbn, provider, setProvider, bookData, isLoading, searchId, search, clear, updateField } =
    useBookSearch();

  function handleExport() {
    if (!bookData) return;

    const fileName = `${formatIsbn(bookData.isbn) || "registro"}.mrc`;
    downloadFile(exportToMarc(bookData), fileName, "application/marc");
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
          onClear={clear}
          coverUrl={bookData?.coverUrl}
          title={bookData?.title}
        />

        {bookData ? (
          <BookReviewPanel
            key={searchId}
            book={bookData}
            onFieldChange={updateField}
            onExport={handleExport}
            isExportDisabled={isLoading}
          />
        ) : (
          <EmptyPanel />
        )}
      </main>
    </div>
  );
}

export default App;
