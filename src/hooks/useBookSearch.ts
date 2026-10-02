import { useState } from "react";
import { fetchBookData, type Provider } from "../api";
import { formatIsbn, type BookFormState } from "../utils/bookUtils";

export type ProviderOption = Provider | "auto";

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

    if (!result) {
      setBookData(null);
      alert("Livro não encontrado.");
      return;
    }

    setBookData(result);
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
