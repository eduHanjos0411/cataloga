import "./EmptyPanel.css";

export function EmptyPanel() {
  return (
    <section className="panel empty-panel">
      <h2>Sem dados consultados</h2>
      <p className="panel-description">
        Os dados da obra aparecerão aqui após a busca por ISBN para que possam ser revisados e ajustados
        manualmente.
      </p>
      <div className="placeholder-card">
        <span className="placeholder-icon">📚</span>
        <p>Acervo em espera</p>
      </div>
    </section>
  );
}
