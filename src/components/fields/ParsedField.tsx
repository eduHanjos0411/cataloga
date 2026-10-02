import { useState, type InputHTMLAttributes } from "react";
import { Field, type FieldSpan } from "./Field";

type ParsedFieldProps<T> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  format: (value: T) => string;
  parse: (text: string) => T;
  span?: FieldSpan;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

/**
 * Campo para valores que não são texto (números, listas, preço). Mantém o texto
 * digitado como rascunho, para que entradas intermediárias como "59," não sejam
 * descartadas. O valor inicial é lido apenas na montagem.
 */
export function ParsedField<T>({ label, value, onChange, format, parse, span, ...inputProps }: ParsedFieldProps<T>) {
  const [draft, setDraft] = useState(() => format(value));

  return (
    <Field label={label} span={span}>
      <input
        {...inputProps}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(parse(event.target.value));
        }}
      />
    </Field>
  );
}
