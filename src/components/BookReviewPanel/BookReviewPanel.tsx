import { useState } from "react";
import type { BookFormState } from "../../utils/bookUtils";
import { needsProbableDate, type CatalogingRules } from "../../utils/marcUtils";
import { MarcViewer } from "../MarcViewer/MarcViewer";
import { ParsedField } from "../fields/ParsedField";
import { SelectField } from "../fields/SelectField";
import { TextAreaField } from "../fields/TextAreaField";
import { TextField } from "../fields/TextField";
import "./BookReviewPanel.css";

const FORMAT_OPTIONS = [
  { value: "", label: "Não informado" },
  { value: "PHYSICAL", label: "Físico" },
  { value: "DIGITAL", label: "Digital" },
];

function parsePositiveNumber(text: string): number | undefined {
  const value = Number(text.replace(",", ".").replace(/[^\d.]/g, ""));
  return value > 0 ? value : undefined;
}

function formatDecimal(value?: number): string {
  return value === undefined ? "" : String(value).replace(".", ",");
}

function parseSubjects(text: string): string[] | undefined {
  const subjects = text
    .split(";")
    .map((subject) => subject.trim())
    .filter(Boolean);
  return subjects.length > 0 ? subjects : undefined;
}

type BookReviewPanelProps = {
  book: BookFormState;
  rules: CatalogingRules;
  onFieldChange: <K extends keyof BookFormState>(field: K, value: BookFormState[K]) => void;
  onExport: () => void;
  onRemove: () => void;
};

export function BookReviewPanel({ book, rules, onFieldChange, onExport, onRemove }: BookReviewPanelProps) {
  const [isMarcViewerOpen, setIsMarcViewerOpen] = useState(false);

  return (
    <section className="panel review-panel">
      <div className="review-header">
        <h2>Revisão dos dados</h2>
        <span className="status-tag">Pronto para editar</span>
      </div>

      <div className="review-body">
        <div className="field-grid">
          <TextField label="Título" span={2} value={book.title} onChange={(value) => onFieldChange("title", value)} />
          <TextField
            label="Subtítulo"
            span={2}
            value={book.subtitle ?? ""}
            onChange={(value) => onFieldChange("subtitle", value)}
          />

          <TextField
            label="Autor(es) (separados por ;)"
            span={2}
            value={book.authors}
            onChange={(value) => onFieldChange("authors", value)}
          />
          <TextField label="Editora" value={book.publisher} onChange={(value) => onFieldChange("publisher", value)} />
          <TextField
            label="Local de publicação"
            value={book.location ?? ""}
            onChange={(value) => onFieldChange("location", value)}
          />

          <TextField
            label="Edição"
            placeholder="Ex.: 2. ed."
            value={book.edition ?? ""}
            onChange={(value) => onFieldChange("edition", value || undefined)}
          />
          <TextField
            label="Ano"
            placeholder="Ex.: 2019 ou [199-?]"
            hint={needsProbableDate(book, rules) ? "AACR2: informe uma data provável, como [199-?]" : undefined}
            value={book.year}
            onChange={(value) => onFieldChange("year", value)}
          />
          <ParsedField
            label="Número de páginas"
            inputMode="numeric"
            value={book.pageCount}
            format={(value) => (value ? String(value) : "")}
            parse={(text) => parsePositiveNumber(text.replace(/\D/g, ""))}
            onChange={(value) => onFieldChange("pageCount", value)}
          />
          <ParsedField
            label="Altura (cm)"
            inputMode="decimal"
            value={book.height}
            format={(value) => formatDecimal(value)}
            parse={parsePositiveNumber}
            onChange={(value) => onFieldChange("height", value)}
          />
          <SelectField
            label="Formato"
            value={book.format ?? ""}
            options={FORMAT_OPTIONS}
            onChange={(value) => onFieldChange("format", value || undefined)}
          />

          <TextField label="ISBN" value={book.isbn} onChange={(value) => onFieldChange("isbn", value)} />
          <TextField
            label="Idioma (código MARC)"
            placeholder="Ex.: por"
            maxLength={3}
            value={book.language ?? ""}
            onChange={(value) => onFieldChange("language", value.trim().toLowerCase() || undefined)}
          />
          {/* Apenas informativo: indica as fontes que contribuíram e não é exportado */}
          <TextField label="Provedor" readOnly value={book.provider} onChange={() => undefined} />
          <TextField
            label="URL da capa"
            span={4}
            type="url"
            value={book.coverUrl ?? ""}
            onChange={(value) => onFieldChange("coverUrl", value || undefined)}
          />

          <ParsedField
            label="Assuntos (separados por ;)"
            span={4}
            value={book.subjects}
            format={(value) => value?.join("; ") ?? ""}
            parse={parseSubjects}
            onChange={(value) => onFieldChange("subjects", value)}
          />
          </div>

        {/* Fora do grid para ocupar a altura restante do painel */}
        <TextAreaField
          label="Sinopse"
          className="synopsis-field"
          rows={2}
          value={book.synopsis ?? ""}
          placeholder="Sem sinopse disponível"
          onChange={(value) => onFieldChange("synopsis", value || undefined)}
        />
      </div>

      <div className="review-footer">
        <button type="button" className="secondary-button review-remove" onClick={onRemove}>
          Remover do lote
        </button>
        <button type="button" className="secondary-button" onClick={() => setIsMarcViewerOpen(true)}>
          Visualizar MARC
        </button>
        <button type="button" className="primary-button" onClick={onExport}>
          Exportar registro
        </button>
      </div>

      {isMarcViewerOpen && <MarcViewer book={book} rules={rules} onClose={() => setIsMarcViewerOpen(false)} />}
    </section>
  );
}
