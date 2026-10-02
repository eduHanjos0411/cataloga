import { Field, type FieldSpan } from "./Field";

type SelectFieldProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  span?: FieldSpan;
};

export function SelectField({ label, value, options, onChange, span }: SelectFieldProps) {
  return (
    <Field label={label} span={span}>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
