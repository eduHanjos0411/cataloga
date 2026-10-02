import { Field, type FieldSpan } from "./Field";

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  span?: FieldSpan;
  className?: string;
  placeholder?: string;
};

/** Texto longo em altura fixa, com rolagem interna. */
export function TextAreaField({ label, value, onChange, rows = 3, span, className, placeholder }: TextAreaFieldProps) {
  return (
    <Field label={label} span={span} className={className}>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
