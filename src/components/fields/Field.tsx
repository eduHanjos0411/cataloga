import type { ReactNode } from "react";
import "./Fields.css";

export type FieldSpan = 1 | 2 | 3 | 4;

export type FieldProps = {
  label: string;
  // Quantidade de colunas ocupadas no grid do formulário
  span?: FieldSpan;
  className?: string;
  children: ReactNode;
};

export function Field({ label, span = 1, className = "", children }: FieldProps) {
  return (
    <label className={`field span-${span} ${className}`.trim()}>
      <span>{label}</span>
      {children}
    </label>
  );
}
