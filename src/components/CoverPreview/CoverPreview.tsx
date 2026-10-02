import { useState } from "react";
import "./CoverPreview.css";

type CoverPreviewProps = {
  url?: string;
  title?: string;
};

export function CoverPreview({ url, title }: CoverPreviewProps) {
  const [failedUrl, setFailedUrl] = useState<string>();
  const showImage = Boolean(url) && failedUrl !== url;

  return (
    <div className="cover-preview">
      {showImage ? (
        <img src={url} alt={title ? `Capa de ${title}` : "Capa da obra"} onError={() => setFailedUrl(url)} />
      ) : (
        <div className="cover-placeholder">
          <span className="placeholder-icon">📚</span>
          <p>{url ? "Capa indisponível" : "Sem capa"}</p>
        </div>
      )}
    </div>
  );
}
