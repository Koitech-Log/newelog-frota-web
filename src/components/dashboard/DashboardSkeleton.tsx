import styles from "./DashboardSkeleton.module.css";

/** Esqueleto exibido durante a primeira carga, no lugar do texto "Carregando…". */
export function DashboardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={styles.grid}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={styles.card}>
            <span className={`${styles.bloco} ${styles.linhaCurta}`} />
            <span className={`${styles.bloco} ${styles.valor}`} />
            <span className={`${styles.bloco} ${styles.linhaMedia}`} />
          </div>
        ))}
      </div>
      <span className={`${styles.bloco} ${styles.faixa}`} />
      <span className={`${styles.bloco} ${styles.tabela}`} />
    </div>
  );
}
