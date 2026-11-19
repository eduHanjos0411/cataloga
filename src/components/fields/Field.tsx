import type { ReactNode } from "react";
import "./Fields.css";

export type FieldSpan = 1 | 2 | 3 | 4;

export type FieldProps = {
  label: string;
  // Quantidade de colunas ocupadas no grid do formulário
  span?: FieldSpan;
  className?: string;
  // Aviso exibido abaixo do campo (ex.: dado obrigatório pelo padrão de catalogação)
  hint?: string;
  children: ReactNode;
};

export function Field({ label, span = 1, className = "", hint, children }: FieldProps) {
  return (
    <label className={`field span-${span} ${className}`.trim()}>
      <span>{label}</span>
      {children}
      {hint && (
        <small className="field-hint" role="status">
          {hint}
        </small>
      )}
    </label>
  );
}
