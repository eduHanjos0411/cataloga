/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Chave da Google Books API; sem ela o provedor Google Books fica desabilitado
  readonly VITE_GOOGLE_BOOKS_API_KEY?: string;
}
