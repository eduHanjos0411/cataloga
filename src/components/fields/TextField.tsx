import type { InputHTMLAttributes } from "react";
import { Field, type FieldSpan } from "./Field";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  span?: FieldSpan;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

export function TextField({ label, value, onChange, span, ...inputProps }: TextFieldProps) {
  return (
    <Field label={label} span={span}>
      <input {...inputProps} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
