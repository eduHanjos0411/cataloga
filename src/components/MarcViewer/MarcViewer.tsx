import { useEffect, useRef } from "react";
import type { BookFormState } from "../../utils/bookUtils";
import { buildMarcRecord } from "../../utils/marcUtils";
import "./MarcViewer.css";

// Pré-visualização do registro MARC 21 gerado a partir dos dados atuais do formulário.

/** Na notação MARC, posições em branco são exibidas como "#". */
function showBlanks(value: string): string {
  return value.replace(/ /g, "#");
}

type MarcViewerProps = {
  book: BookFormState;
  onClose: () => void;
};

export function MarcViewer({ book, onClose }: MarcViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const record = buildMarcRecord(book);

  useEffect(() => {
    // O StrictMode executa o efeito duas vezes; showModal falha se o diálogo já estiver aberto
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="marc-viewer"
      onClose={onClose}
      // Clique no fundo (fora da caixa) fecha o popup
      onClick={(event) => event.target === event.currentTarget && dialogRef.current?.close()}
    >
      <div className="marc-viewer-box">
        <header className="marc-viewer-header">
          <h2>Registro MARC 21</h2>
          <button type="button" className="marc-viewer-close" onClick={() => dialogRef.current?.close()}>
            ×
          </button>
        </header>

        <div className="marc-viewer-body">
          <table className="marc-table">
            <tbody>
              <tr>
                <td className="marc-tag">LDR</td>
                <td className="marc-ind" colSpan={2} />
                <td className="marc-value">{showBlanks(record.leader)}</td>
              </tr>
              {record.fields.map(([tag, ...rest], index) => {
                if (tag < "010") {
                  return (
                    <tr key={index}>
                      <td className="marc-tag">{tag}</td>
                      <td className="marc-ind" colSpan={2} />
                      <td className="marc-value">{showBlanks(rest[0] ?? "")}</td>
                    </tr>
                  );
                }

                const [indicators = "  ", ...subfields] = rest;
                const pairs: [string, string][] = [];
                for (let i = 0; i < subfields.length; i += 2) pairs.push([subfields[i], subfields[i + 1]]);

                return (
                  <tr key={index}>
                    <td className="marc-tag">{tag}</td>
                    <td className="marc-ind">{showBlanks(indicators[0] ?? " ")}</td>
                    <td className="marc-ind">{showBlanks(indicators[1] ?? " ")}</td>
                    <td className="marc-value">
                      {pairs.map(([code, value], pairIndex) => (
                        <span key={pairIndex} className="marc-subfield">
                          <span className="marc-code">${code}</span>
                          {value}
                        </span>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </dialog>
  );
}
