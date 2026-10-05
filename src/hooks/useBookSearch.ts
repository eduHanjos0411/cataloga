import { useState } from "react";
import { fetchBookData, type BookSearchResult, type Provider } from "../api";
import { formatIsbn, type BookFormState } from "../utils/bookUtils";

export type ProviderOption = Provider | "auto";

const SEARCH_ERROR_MESSAGES: Record<Exclude<BookSearchResult["status"], "found">, string> = {
  "not-found": "Livro não encontrado.",
  "invalid-isbn": "ISBN inválido. Confira os dígitos digitados.",
  unavailable: "Não foi possível consultar todos os provedores. Tente novamente em instantes.",
};

export function useBookSearch() {
  const [isbn, setIsbn] = useState("");
  const [provider, setProvider] = useState<ProviderOption>("auto");
  const [bookData, setBookData] = useState<BookFormState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Incrementado a cada busca para reiniciar o formulário de revisão
  const [searchId, setSearchId] = useState(0);

  async function search() {
    const cleanIsbn = formatIsbn(isbn);

    if (!cleanIsbn) {
      alert("Digite um ISBN válido para consultar.");
      return;
    }

    setIsLoading(true);
    const result = await fetchBookData(cleanIsbn, provider === "auto" ? undefined : provider);
    setIsLoading(false);

    if (result.status !== "found") {
      setBookData(null);
      alert(SEARCH_ERROR_MESSAGES[result.status]);
      return;
    }

    setBookData(result.book);
    setSearchId((current) => current + 1);
  }

  function clear() {
    setIsbn("");
    setBookData(null);
  }

  function updateField<K extends keyof BookFormState>(field: K, value: BookFormState[K]) {
    setBookData((current) => (current ? { ...current, [field]: value } : current));
  }

  return {
    isbn,
    setIsbn,
    provider,
    setProvider,
    bookData,
    isLoading,
    searchId,
    search,
    clear,
    updateField,
  };
}
