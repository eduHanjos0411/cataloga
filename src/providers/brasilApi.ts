// CBL e Mercado Editorial não têm API pública própria; são consultados pela BrasilAPI,
// que já devolve os dados no formato esperado por normalizeBookData.

const BASE_URL = "https://brasilapi.com.br/api/isbn/v1";

export async function fetchFromBrasilApi(
  isbn: string,
  provider: "cbl" | "mercado-editorial",
  signal: AbortSignal,
): Promise<Record<string, unknown> | null> {
  const response = await fetch(`${BASE_URL}/${isbn}?providers=${provider}`, { signal });

  // 404: obra não encontrada. 400: a BrasilAPI recusa alguns ISBNs válidos, então
  // também é tratado como "não encontrado" (o dígito verificador já foi conferido antes)
  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) throw new Error(`BrasilAPI respondeu ${response.status}`);

  return (await response.json()) as Record<string, unknown>;
}
