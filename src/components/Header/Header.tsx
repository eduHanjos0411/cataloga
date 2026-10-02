import "./Header.css";

export type ThemeName = "light" | "dark";

type HeaderProps = {
  theme: ThemeName;
  onToggleTheme: () => void;
};

export function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="library-header panel">
      <h1>Cataloga+</h1>

      <button
        type="button"
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label="Alternar entre tema claro e escuro"
      >
        {theme === "light" ? "Tema escuro" : "Tema claro"}
      </button>
    </header>
  );
}
