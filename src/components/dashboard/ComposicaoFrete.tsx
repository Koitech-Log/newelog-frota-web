import { useEffect, useState } from "react";
import { decimal1, moeda } from "../../utils/formatadores";
import styles from "./ComposicaoFrete.module.css";

interface ComposicaoFreteProps {
  frete: number;
  custo: number;
}

/** Barra empilhada mostrando quanto do frete vira custo e quanto sobra como resultado. */
export function ComposicaoFrete({ frete, custo }: ComposicaoFreteProps) {
  const [montado, setMontado] = useState(false);

  // Começa com a barra vazia e cresce até o valor real logo após montar.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const temFrete = frete > 0;
  const custoPct = temFrete ? Math.min(100, (Math.max(custo, 0) / frete) * 100) : 0;
  const resultadoPct = temFrete ? Math.max(0, 100 - custoPct) : 0;
  const custosSuperam = temFrete && custo > frete;

  return (
    <div className={styles.card}>
      {!temFrete ? (
        <p className={styles.vazio}>Sem fretes no período selecionado.</p>
      ) : (
        <>
          <div
            className={styles.barra}
            role="img"
            aria-label={`Custos: ${decimal1.format(custoPct)}% do frete. Resultado: ${decimal1.format(resultadoPct)}% do frete.`}
          >
            <span
              className={`${styles.trecho} ${styles.custos}`}
              style={{ width: montado ? `${custoPct}%` : "0%" }}
            />
            <span
              className={`${styles.trecho} ${styles.resultado}`}
              style={{ width: montado ? `${resultadoPct}%` : "0%" }}
            />
          </div>

          <ul className={styles.legenda}>
            <li>
              <span className={`${styles.ponto} ${styles.custos}`} aria-hidden="true" />
              Custos <strong>{decimal1.format(custoPct)}%</strong>
              <span className={styles.valor}>{moeda.format(custo)}</span>
            </li>
            <li>
              <span className={`${styles.ponto} ${styles.resultado}`} aria-hidden="true" />
              Resultado <strong>{decimal1.format(resultadoPct)}%</strong>
              <span className={styles.valor}>{moeda.format(Math.max(frete - custo, 0))}</span>
            </li>
          </ul>

          {custosSuperam && (
            <p className={styles.alerta} role="status">
              Os custos superam os fretes do período.
            </p>
          )}
        </>
      )}
    </div>
  );
}
