import type { ReactNode } from "react";
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
  return (
    <section className={styles.secao} aria-labelledby={id}>
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
