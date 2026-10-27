import { RULES_LABELS, type CatalogingRules } from "../../utils/marcUtils";
import "../ProviderPicker/ProviderPicker.css";

// Padrão de descrição usado na geração dos registros MARC (pré-visualização e exportação)

const OPTIONS = Object.keys(RULES_LABELS) as CatalogingRules[];

type RulesPickerProps = {
  value: CatalogingRules;
  onChange: (rules: CatalogingRules) => void;
};

export function RulesPicker({ value, onChange }: RulesPickerProps) {
  return (
    <div className="provider-picker">
      <span className="field-label">Padrão de descrição</span>
      <div className="provider-options" role="radiogroup" aria-label="Padrão de descrição">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            className={`provider-option${value === option ? " active" : ""}`}
            onClick={() => onChange(option)}
          >
            {RULES_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
