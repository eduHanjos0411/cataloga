import { useEffect, useRef } from "react";
import "./ConfirmDialog.css";

// Caixa de confirmação do app, no lugar do confirm() do navegador

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  // Ação destrutiva (ex.: limpar o lote): botão de confirmação em vermelho
  danger?: boolean;
  onConfirm: () => void;
};

type ConfirmDialogProps = ConfirmOptions & {
  onClose: () => void;
};

export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onClose }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // O StrictMode executa o efeito duas vezes; showModal falha se o diálogo já estiver aberto
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, []);

  function confirm() {
    onConfirm();
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-dialog-title"
      onClose={onClose}
      // Clique no fundo (fora da caixa) cancela
      onClick={(event) => event.target === event.currentTarget && dialogRef.current?.close()}
    >
      <div className="confirm-dialog-box">
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="secondary-button" onClick={() => dialogRef.current?.close()}>
            Cancelar
          </button>
          <button
            type="button"
            className={`primary-button${danger ? " danger-button" : ""}`}
            onClick={confirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
