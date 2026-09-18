export async function fetchBookData(isbn: string, provider?: [string]) {
  try {
    let url = `https://brasilapi.com.br/api/isbn/v1/${isbn}`
    if (provider) url+= `?providers=${provider.at(0)}`

    const response = await fetch(url);

    if(!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`)
    }

    const data = await response.json()
    return data

  } catch(error) {
    console.error("Falha na busca da obra: ", error)
    return null
  }
}