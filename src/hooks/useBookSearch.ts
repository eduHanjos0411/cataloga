import { useEffect, useState } from "react";
import { fetchBookData, type BookSearchResult, type Provider } from "../api";
import { formatIsbn, type BookFormState } from "../utils/bookUtils";

export type ProviderOption = Provider | "auto";

export type BatchItem = {
  id: string;
  isbn: string;
  status: "loading" | "found" | "error";
  book?: BookFormState;
  error?: string;
};

const SEARCH_ERROR_MESSAGES: Record<Exclude<BookSearchResult["status"], "found">, string> = {
  "not-found": "Livro não encontrado.",
  "invalid-isbn": "ISBN inválido. Confira os dígitos digitados.",
  unavailable: "Não foi possível consultar todos os provedores. Tente novamente em instantes.",
};

// Cada ISBN gera uma requisição por provedor; limita os ISBNs consultados ao mesmo tempo
const MAX_CONCURRENT_SEARCHES = 3;

const STORAGE_KEY = "cataloga:lote";

type StoredBatch = { items: BatchItem[]; currentId?: string };

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Separa os ISBNs digitados (um por linha, ou separados por vírgula, ponto e vírgula ou espaço). */
function parseIsbnList(text: string): string[] {
  const isbns = text
    .split(/[\s,;]+/)
    .map(formatIsbn)
    .filter(Boolean);
  return [...new Set(isbns)];
}

function loadBatch(): StoredBatch {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { items: [] };

    const batch = JSON.parse(stored) as StoredBatch;
    // Buscas em andamento quando a página foi fechada não serão concluídas
    const items = batch.items.map((item): BatchItem =>
      item.status === "loading" ? { ...item, status: "error", error: "Busca interrompida." } : item,
    );
    return { items, currentId: batch.currentId };
  } catch {
    return { items: [] };
  }
}

async function runWithLimit<T>(values: T[], limit: number, task: (value: T) => Promise<void>) {
  const queue = [...values];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    for (let value = queue.shift(); value !== undefined; value = queue.shift()) await task(value);
  });
  await Promise.all(workers);
}

export function useBookSearch() {
  const [isbn, setIsbn] = useState("");
  const [provider, setProvider] = useState<ProviderOption>("auto");
  const [initialBatch] = useState(loadBatch);
  const [items, setItems] = useState<BatchItem[]>(initialBatch.items);
  const [currentId, setCurrentId] = useState<string | undefined>(initialBatch.currentId ?? initialBatch.items[0]?.id);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, currentId } satisfies StoredBatch));
    } catch {
      // Sem armazenamento disponível o lote vale apenas para a sessão atual
    }
  }, [items, currentId]);

  const currentIndex = Math.max(
    items.findIndex((item) => item.id === currentId),
    0,
  );
  const currentItem = items[currentIndex];
  const isLoading = items.some((item) => item.status === "loading");

  function updateItem(id: string, changes: Partial<BatchItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  }

  async function searchItems(targets: BatchItem[]) {
    const chosenProvider = provider === "auto" ? undefined : provider;

    await runWithLimit(targets, MAX_CONCURRENT_SEARCHES, async (item) => {
      const result = await fetchBookData(item.isbn, chosenProvider);
      updateItem(
        item.id,
        result.status === "found"
          ? { status: "found", book: result.book, error: undefined }
          : { status: "error", error: SEARCH_ERROR_MESSAGES[result.status] },
      );
    });
  }

  /** Adiciona ao lote os ISBNs digitados e busca os dados de cada um. */
  async function search() {
    const isbns = parseIsbnList(isbn);

    if (isbns.length === 0) {
      alert("Digite um ISBN válido para consultar.");
      return;
    }

    const existing = new Map(items.map((item) => [formatIsbn(item.book?.isbn ?? item.isbn), item]));
    const newItems = isbns
      .filter((value) => !existing.has(value))
      .map((value): BatchItem => ({ id: createId(), isbn: value, status: "loading" }));

    // ISBNs já presentes no lote não são buscados de novo; a página do primeiro é exibida
    setCurrentId(newItems[0]?.id ?? existing.get(isbns[0])?.id);
    setIsbn("");
    if (newItems.length === 0) return;

    setItems((current) => [...current, ...newItems]);
    await searchItems(newItems);
  }

  async function retry(id: string) {
    const item = items.find((candidate) => candidate.id === id);
    if (!item) return;

    updateItem(id, { status: "loading", error: undefined });
    await searchItems([item]);
  }

  function remove(id: string) {
    const index = items.findIndex((item) => item.id === id);
    const remaining = items.filter((item) => item.id !== id);

    if (id === currentItem?.id) setCurrentId(remaining[Math.min(index, remaining.length - 1)]?.id);
    setItems(remaining);
  }

  function clearBatch() {
    setItems([]);
    setCurrentId(undefined);
  }

  function goToPage(index: number) {
    setCurrentId(items[index]?.id);
  }

  function updateField<K extends keyof BookFormState>(field: K, value: BookFormState[K]) {
    if (!currentItem?.book) return;
    const { id } = currentItem;
    setItems((current) =>
      current.map((item) => (item.id === id && item.book ? { ...item, book: { ...item.book, [field]: value } } : item)),
    );
  }

  return {
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
  };
}
