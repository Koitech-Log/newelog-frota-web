import type { RentabilidadeMediaResponse } from "../api/dashboard";
import styles from "./RentabilidadeMedia.module.css";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const inteiro = new Intl.NumberFormat("pt-BR");

export function RentabilidadeMedia({ dados }: { dados: RentabilidadeMediaResponse }) {
  const itens = [...dados.porMotorista].sort(
    (a, b) => b.rentabilidadeMedia - a.rentabilidadeMedia || a.nome.localeCompare(b.nome, "pt-BR")
  );
  const semViagens = dados.geral.quantidadeViagens === 0;
  const media = semViagens ? 0 : dados.geral.rentabilidadeMedia;

  return (
    <section className={styles.section} aria-labelledby="rentabilidade-titulo">
      <article className={styles.card}>
        <h2 id="rentabilidade-titulo">Rentabilidade média por viagem</h2>
        <p className={`${styles.value} ${media < 0 ? styles.negative : media > 0 ? styles.positive : ""}`}>
          {moeda.format(media)}
        </p>
        <p className={styles.description}>
          {semViagens ? "Nenhuma viagem no período selecionado." :
            `Rentabilidade total ÷ ${inteiro.format(dados.geral.quantidadeViagens)} viagem(ns) no período.`}
        </p>
      </article>

      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h2>Comparativo de rentabilidade média</h2>
            <p className={styles.description}>Da maior para a menor média por viagem.</p>
          </div>
        </div>
        {semViagens || itens.length === 0 ? (
          <p className={styles.description}>Sem dados para comparar no período selecionado.</p>
        ) : (
          <div className={styles.tableScroll} role="region" aria-label="Comparativo de rentabilidade" tabIndex={0}>
            <table className={styles.table}>
              <caption className={styles.caption}>Rentabilidade por motorista no período selecionado</caption>
              <thead><tr>
                <th scope="col">Motorista</th>
                <th scope="col">Viagens</th>
                <th scope="col">Rentabilidade total</th>
                <th scope="col" aria-sort="descending">Média por viagem ↓</th>
              </tr></thead>
              <tbody>{itens.map((item) => (
                <tr key={item.id ?? "sem-cadastro"}>
                  <th scope="row">{item.nome}</th>
                  <td>{inteiro.format(item.quantidadeViagens)}</td>
                  <td>{moeda.format(item.rentabilidadeTotal)}</td>
                  <td className={item.rentabilidadeMedia < 0 ? styles.negative : item.rentabilidadeMedia > 0 ? styles.positive : undefined}>
                    {moeda.format(item.rentabilidadeMedia)}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}


