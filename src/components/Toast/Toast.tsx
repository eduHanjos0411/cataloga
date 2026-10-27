import { useEffect } from "react";
import "./Toast.css";

// Aviso breve no canto da tela (exportação concluída, ISBN não digitado...), no lugar do alert()

export type Notice = {
  id: number;
  kind: "success" | "error";
  message: string;
};

const DISMISS_AFTER_MS = 4000;

type ToastProps = {
  notice: Notice;
  onDismiss: () => void;
};

export function Toast({ notice, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
    // Um novo aviso (id diferente) reinicia a contagem
  }, [notice.id, onDismiss]);

  return (
    <div className={`toast ${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>
      <span>{notice.message}</span>
      <button type="button" className="toast-close" aria-label="Fechar aviso" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}
