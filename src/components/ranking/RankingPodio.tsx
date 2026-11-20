import { useMemo, type CSSProperties } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { RankingItem, TipoRanking } from "../../api/ranking";
import { useContagemAnimada } from "../../hooks/useContagemAnimada";
import { decimal2, iniciais, inteiro, moeda } from "../../utils/formatadores";
import { icons } from "../icons";
import styles from "./RankingPodio.module.css";

interface RankingPodioProps {
  tipo: TipoRanking;
  /** Ranking completo do mês: o pódio usa as posições 1 a 3 informadas pela API. */
  itens: RankingItem[];
  legenda: string;
}

const MEDALHAS: Record<number, { classe: string; rotulo: string }> = {
  1: { classe: styles.ouro, rotulo: "1º lugar" },
  2: { classe: styles.prata, rotulo: "2º lugar" },
  3: { classe: styles.bronze, rotulo: "3º lugar" },
};

/** Entrada escalonada: o 3º sobe primeiro e o campeão por último. */
const ATRASO_MS: Record<number, number> = { 1: 260, 2: 130, 3: 0 };

function PodioCard({ item, tipo }: { item: RankingItem; tipo: TipoRanking }) {
  const medalha = MEDALHAS[item.posicao];
  const pontos = useContagemAnimada(item.pontuacao);
  const porMotorista = tipo === "motoristas";
  const titulo = porMotorista ? (item.motorista ?? "—") : (item.veiculo ?? "—");

  return (
    <li
      className={`${styles.item} ${styles[`pos${item.posicao}`]} ${medalha.classe}`}
      style={{ "--atraso": `${ATRASO_MS[item.posicao]}ms` } as CSSProperties}
    >
      <article className={styles.card}>
        <span className={styles.medalha} aria-hidden="true">
          <FontAwesomeIcon icon={item.posicao === 1 ? icons.crown : icons.medal} />
        </span>
        <p className={styles.lugar}>{medalha.rotulo}</p>

        <span className={styles.avatar} aria-hidden="true">
          {porMotorista ? iniciais(item.motorista) : <FontAwesomeIcon icon={icons.truck} />}
        </span>

        <h3 className={styles.nome} title={titulo}>
          {titulo}
        </h3>
        {porMotorista && <p className={styles.placa}>{item.veiculo ?? "Sem placa"}</p>}

        <p className={styles.pontos}>
          <span className={styles.somenteLeitor}>{decimal2.format(item.pontuacao)} pontos</span>
          <span aria-hidden="true">{decimal2.format(pontos)}</span>
          <small aria-hidden="true">pts</small>
        </p>

        <dl className={styles.detalhes}>
          <div>
            <dt>Viagens</dt>
            <dd>{inteiro.format(item.quantidadeViagens)}</dd>
          </div>
          <div>
            <dt>Resultado</dt>
            <dd className={item.resultado < 0 ? styles.negativo : undefined}>
              {moeda.format(item.resultado)}
            </dd>
          </div>
        </dl>
      </article>
      <div className={styles.pedestal} aria-hidden="true">
        {item.posicao}
      </div>
    </li>
  );
}

/** Destaque dos três primeiros colocados, na ordem 2º · 1º · 3º como num pódio. */
export function RankingPodio({ tipo, itens, legenda }: RankingPodioProps) {
  const top3 = useMemo(
    () =>
      itens
        .filter((item) => item.posicao >= 1 && item.posicao <= 3)
        .sort((a, b) => a.posicao - b.posicao),
    [itens],
  );

  if (top3.length === 0) return null;

  return (
    <section className={styles.podio} aria-label={legenda}>
      <ol className={styles.lista}>
        {top3.map((item) => (
          <PodioCard key={`${item.posicao}-${item.motoristaId ?? item.veiculo ?? ""}`} item={item} tipo={tipo} />
        ))}
      </ol>
    </section>
  );
}
