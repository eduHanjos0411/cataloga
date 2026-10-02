import { PROVIDER_LABELS, PROVIDERS } from "../../api";
import type { ProviderOption } from "../../hooks/useBookSearch";
import "./ProviderPicker.css";

const OPTIONS: ProviderOption[] = ["auto", ...PROVIDERS];

type ProviderPickerProps = {
  value: ProviderOption;
  onChange: (provider: ProviderOption) => void;
};

export function ProviderPicker({ value, onChange }: ProviderPickerProps) {
  return (
    <div className="provider-picker">
      <span className="field-label">Fonte dos dados</span>
      <div className="provider-options" role="radiogroup" aria-label="Provedor de dados">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            className={`provider-option${value === option ? " active" : ""}`}
            onClick={() => onChange(option)}
          >
            {option === "auto" ? "Automático" : PROVIDER_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
