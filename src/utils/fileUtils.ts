export function downloadFile(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  // Revogar no mesmo instante pode cancelar o download em alguns navegadores (Firefox, Safari)
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
