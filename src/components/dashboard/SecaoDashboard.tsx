import { useEffect, useRef, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import styles from "./SecaoDashboard.module.css";

interface SecaoDashboardProps {
  id: string;
  icone: IconDefinition;
  titulo: string;
  dica?: string;
  children: ReactNode;
}

/** Bloco do dashboard com título (ícone + texto) e uma dica curta de leitura. */
export function SecaoDashboard({ id, icone, titulo, dica, children }: SecaoDashboardProps) {
  const ref = useRef<HTMLElement>(null);
  const [visivel, setVisivel] = useState(
    () => typeof IntersectionObserver === "undefined"
  );

  // A seção só "entra" quando chega à tela — blocos mais abaixo animam ao rolar.
  useEffect(() => {
    const elemento = ref.current;
    if (!elemento || visivel) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -40px 0px" }
    );

    observador.observe(elemento);
    return () => observador.disconnect();
  }, [visivel]);

  return (
    <section
      ref={ref}
      className={`${styles.secao} ${visivel ? styles.visivel : ""}`}
      aria-labelledby={id}
    >
      <header className={styles.cabecalho}>
        <span className={styles.icone} aria-hidden="true">
          <FontAwesomeIcon icon={icone} />
        </span>
        <div>
          <h2 id={id} className={styles.titulo}>
            {titulo}
          </h2>
          {dica && <p className={styles.dica}>{dica}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
