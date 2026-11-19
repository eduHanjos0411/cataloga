import type { InputHTMLAttributes } from "react";
import { Field, type FieldSpan } from "./Field";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  span?: FieldSpan;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

export function TextField({ label, value, onChange, span, hint, ...inputProps }: TextFieldProps) {
  return (
    <Field label={label} span={span} hint={hint}>
      <input {...inputProps} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
