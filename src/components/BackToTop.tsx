import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "./icons";
import styles from "./BackToTop.module.css";

const LIMITE_PX = 480;

/** Botão flutuante que aparece ao rolar a página e leva de volta ao topo. */
export function BackToTop() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let pendente = false;
    function aoRolar() {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(() => {
        setVisivel(window.scrollY > LIMITE_PX);
        pendente = false;
      });
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  function subir() {
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduzido ? "instant" : "smooth" });
  }

  return (
    <button
      type="button"
      className={`${styles.botao} ${visivel ? styles.visivel : ""}`}
      onClick={subir}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      tabIndex={visivel ? 0 : -1}
      aria-hidden={!visivel}
    >
      <FontAwesomeIcon icon={icons.arrowUp} />
    </button>
  );
}
