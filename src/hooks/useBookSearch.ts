import { useEffect, useRef, useState } from "react";
import { fetchBookData, type BookSearchResult, type Provider } from "../api";
import { formatIsbn, isValidIsbn, type BookFormState } from "../utils/bookUtils";

export type ProviderOption = Provider | "auto";

export type BatchItem = {
  id: string;
  isbn: string;
  status: "loading" | "found" | "error";
  book?: BookFormState;
  error?: string;
  // Fontes que falharam ou excederam o tempo limite, mesmo com a obra encontrada
  failedProviders?: Provider[];
};

/** Medição de uma rodada de buscas: do primeiro ISBN enviado até o último concluído. */
export type BatchRun = {
  count: number;
  startedAt: number;
  finishedAt?: number;
};

type QueuedSearch = { id: string; isbn: string; provider?: Provider };

const SEARCH_ERROR_MESSAGES: Record<Exclude<BookSearchResult["status"], "found">, string> = {
  "not-found": "Livro não encontrado.",
  "invalid-isbn": "ISBN inválido: o dígito verificador não confere. Confira os dígitos digitados.",
  unavailable: "Não foi possível consultar todos os provedores. Tente novamente em instantes.",
};

// Cada ISBN gera uma requisição por provedor; limita os ISBNs consultados ao mesmo tempo
const MAX_CONCURRENT_SEARCHES = 3;

const STORAGE_KEY = "cataloga:lote";

// Versão 2: autores sempre separados por ";" (antes, nomes na forma direta vinham separados por ",")
const STORAGE_VERSION = 2;

type StoredBatch = { version?: number; items: BatchItem[]; currentId?: string };

/**
 * Converte os autores de lotes salvos antes da versão 2. Sem ";", a vírgula separava autores,
 * exceto quando havia um único autor já invertido ("SILVA, José": uma palavra antes da vírgula).
 */
function migrateAuthors(authors: string): string {
  if (authors.includes(";") || !authors.includes(",")) return authors;

  const parts = authors.split(",").map((part) => part.trim());
  const singleInverted = parts.length === 2 && !/\s/.test(parts[0]);
  return singleInverted ? authors : parts.filter(Boolean).join("; ");
}

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Separa os ISBNs digitados: um por linha, ou separados por vírgula ou ponto e vírgula.
 * Dentro de cada parte, espaços e hifens são ignorados quando o resultado é um ISBN válido
 * ("978 0 14 143951 8"). O espaço só separa ISBNs quando todos os pedaços têm o tamanho de
 * um ISBN ("9780141439518 9788508040094"); senão a parte inteira é um único número, que a
 * busca acusa como inválido em vez de gerar um documento para cada fragmento.
 */
export function parseIsbnList(text: string): string[] {
  const isbns = text.split(/[\r\n,;]+/).flatMap((part) => {
    const joined = formatIsbn(part);
    if (isValidIsbn(joined)) return [joined];

    const pieces = part.split(/\s+/).map(formatIsbn).filter(Boolean);
    const allIsbnSized = pieces.length > 1 && pieces.every((piece) => piece.length === 10 || piece.length === 13);
    return allIsbnSized ? pieces : [joined];
  });
  return [...new Set(isbns.filter(Boolean))];
}

function loadBatch(): StoredBatch {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { items: [] };

    const batch = JSON.parse(stored) as StoredBatch;
    const outdated = (batch.version ?? 1) < STORAGE_VERSION;
    const items = batch.items.map((item): BatchItem => {
      const migrated =
        outdated && item.book ? { ...item, book: { ...item.book, authors: migrateAuthors(item.book.authors) } } : item;
      // Buscas em andamento quando a página foi fechada não serão concluídas
      return migrated.status === "loading" ? { ...migrated, status: "error", error: "Busca interrompida." } : migrated;
    });
    return { items, currentId: batch.currentId };
  } catch {
    return { items: [] };
  }
}

export function useBookSearch() {
  const [isbn, setIsbn] = useState("");
  const [provider, setProvider] = useState<ProviderOption>("auto");
  const [initialBatch] = useState(loadBatch);
  const [items, setItems] = useState<BatchItem[]>(initialBatch.items);
  const [currentId, setCurrentId] = useState<string | undefined>(initialBatch.currentId ?? initialBatch.items[0]?.id);
  const [lastRun, setLastRun] = useState<BatchRun>();

  // Fila única para todas as buscas: o limite de consultas simultâneas vale para o lote
  // inteiro, mesmo que várias listas sejam enviadas em seguida
  const queueRef = useRef<QueuedSearch[]>([]);
  const activeRef = useRef(0);
  const runRef = useRef<BatchRun | undefined>(undefined);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, items, currentId } satisfies StoredBatch));
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

  async function runSearch({ id, isbn: value, provider: chosenProvider }: QueuedSearch) {
    const result = await fetchBookData(value, chosenProvider);
    updateItem(
      id,
      result.status === "found"
        ? {
            status: "found",
            book: result.book,
            error: undefined,
            failedProviders: result.failedProviders.length > 0 ? result.failedProviders : undefined,
          }
        : { status: "error", error: SEARCH_ERROR_MESSAGES[result.status], failedProviders: undefined },
    );
  }

  function pumpQueue() {
    while (activeRef.current < MAX_CONCURRENT_SEARCHES && queueRef.current.length > 0) {
      const next = queueRef.current.shift()!;
      activeRef.current += 1;
      void runSearch(next).finally(() => {
        activeRef.current -= 1;
        if (activeRef.current === 0 && queueRef.current.length === 0 && runRef.current) {
          const finished = { ...runRef.current, finishedAt: Date.now() };
          runRef.current = undefined;
          setLastRun(finished);
        }
        pumpQueue();
      });
    }
  }

  function enqueue(targets: BatchItem[]) {
    const chosenProvider = provider === "auto" ? undefined : provider;
    // Uma nova rodada começa quando não há buscas em andamento
    runRef.current ??= { count: 0, startedAt: Date.now() };
    runRef.current.count += targets.length;
    setLastRun({ ...runRef.current });

    queueRef.current.push(...targets.map((item) => ({ id: item.id, isbn: item.isbn, provider: chosenProvider })));
    pumpQueue();
  }

  /** Adiciona ao lote os ISBNs digitados e busca os dados de cada um. Retorna false se nenhum ISBN foi digitado. */
  function search(): boolean {
    const isbns = parseIsbnList(isbn);
    if (isbns.length === 0) return false;

    const existing = new Map(items.map((item) => [formatIsbn(item.book?.isbn ?? item.isbn), item]));
    const newItems = isbns
      .filter((value) => !existing.has(value))
      .map((value): BatchItem => ({ id: createId(), isbn: value, status: "loading" }));

    // ISBNs já presentes no lote não são buscados de novo; a página do primeiro é exibida
    setCurrentId(newItems[0]?.id ?? existing.get(isbns[0])?.id);
    setIsbn("");
    if (newItems.length === 0) return true;

    setItems((current) => [...current, ...newItems]);
    enqueue(newItems);
    return true;
  }

  function retry(id: string) {
    const item = items.find((candidate) => candidate.id === id);
    if (!item) return;

    updateItem(id, { status: "loading", error: undefined });
    enqueue([item]);
  }

  function remove(id: string) {
    const index = items.findIndex((item) => item.id === id);
    const remaining = items.filter((item) => item.id !== id);

    if (id === currentItem?.id) setCurrentId(remaining[Math.min(index, remaining.length - 1)]?.id);
    setItems(remaining);
  }

  function clearBatch() {
    // Buscas ainda na fila não precisam mais ser feitas
    queueRef.current = [];
    setItems([]);
    setCurrentId(undefined);
    setLastRun(undefined);
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
    lastRun,
    search,
    retry,
    remove,
    clearBatch,
    goToPage,
    updateField,
  };
}
